/** DEV-I T04: TypeScript Cloudflare Worker, with explicit typed D1/R2 boundaries. */
type EchoTrackRow = {id:string;title:string;speaker:string;description:string|null;duration_seconds:number;category_labels_json:string};
interface D1Statement {all<T>():Promise<{results?:T[]}>;first<T>():Promise<T|null>;bind(...values:(string|number)[]):D1Statement}
interface D1Database {prepare(query:string):D1Statement}
interface EchoAudioObject {body:ReadableStream<Uint8Array<ArrayBuffer>>;size:number;range?:{offset?:number;length?:number};httpMetadata?:{contentType?:string}}
interface EchoR2 {get(key:string,options?:{range:Headers}):Promise<EchoAudioObject|null>}
export interface Env {DB:D1Database;MEDIA:EchoR2;ASSETS?:{fetch(request:Request):Promise<Response>}}

/**
 * Echo Starry read-only public API.
 * IMPORTANT: This service never stores member profile data and NEVER silently
 * treats legacy login/session as a verified Starry central member.
 */
const corsAllow = new Set(['https://echo-starry.starry-phd.workers.dev','https://echo.starry.phd']);
function json(data:unknown,status=200,request?:Request):Response {
  const origin=request?.headers.get('Origin')||'';
  const headers=new Headers({'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin'});
  if(corsAllow.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) headers.set('access-control-allow-origin',origin);
  return new Response(JSON.stringify(data),{status,headers});
}
function publicTrack(row:EchoTrackRow) {
  let categories:string[]=[];
  try { const raw:unknown=JSON.parse(row.category_labels_json||'[]'); if(Array.isArray(raw)) categories=raw.filter((x):x is string=>typeof x==='string'); } catch {}
  return {id:row.id,title:row.title,speaker:row.speaker,description:row.description,durationSeconds:row.duration_seconds,categories,playable:true};
}
export default {
  async fetch(request:Request,env:Env):Promise<Response> {
    const url=new URL(request.url);
    // Canonical versioned routes; temporary unversioned aliases remain for existing preview clients.
    const path=url.pathname.startsWith('/api/v1/') ? '/api/'+url.pathname.slice('/api/v1/'.length) : url.pathname;
    if(request.method==='OPTIONS') {
      const origin=request.headers.get('Origin')||'';
      if(!corsAllow.has(origin)&&!/^http:\/\/localhost:\d+$/.test(origin)) return new Response(null,{status:403});
      return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'Content-Type, Accept','access-control-max-age':'600','vary':'Origin'}});
    }
    if(request.method!=='GET') return json({code:'METHOD_NOT_ALLOWED'},405,request);
    if(path==='/health'||path==='/api/health')
      return json({service:'echo-starry',stage:'bootstrap',database:Boolean(env.DB),storage:Boolean(env.MEDIA),centralMemberApi:'pending',apiVersion:'v1',legacyMediaMigration:'pending'},200,request);
    if(path==='/api/categories') {
      // Category labels themselves contain no member-specific data.
      const result=await env.DB.prepare("SELECT name FROM echo_categories ORDER BY display_order, name").all<{name:string}>();
      return json({categories:(result.results||[]).map(x=>x.name).filter(x=>typeof x==='string')},200,request);
    }
    if(path==='/api/catalog'){
      const query=(url.searchParams.get('q')||'').trim().slice(0,100);
      const category=(url.searchParams.get('category')||'').trim().slice(0,80);
      let sql="SELECT id,title,speaker,description,duration_seconds,category_labels_json FROM echo_tracks WHERE visibility = 'public' AND migration_status = 'verified'";
      const bindings:string[]=[];
      if(query) {
        sql+=" AND (instr(lower(title),lower(?)) > 0 OR instr(lower(speaker),lower(?)) > 0)";
        bindings.push(query,query);
      }
      if(category) {
        sql+=" AND EXISTS (SELECT 1 FROM json_each(CASE WHEN json_valid(category_labels_json) THEN category_labels_json ELSE '[]' END) WHERE value = ?)";
        bindings.push(category);
      }
      sql+=" ORDER BY updated_at DESC LIMIT 100";
      const statement=env.DB.prepare(sql);
      const result=await (bindings.length ? statement.bind(...bindings) : statement).all<EchoTrackRow>();
      return json({tracks:(result.results||[]).map(publicTrack)},200,request);
    }
    const match=/^\/api\/tracks\/([^/]+)\/stream$/.exec(path);
    if(match){
      const id=decodeURIComponent(match[1]);
      const row=await env.DB.prepare("SELECT audio_key FROM echo_tracks WHERE id = ? AND visibility = 'public' AND migration_status = 'verified'").bind(id).first<{audio_key:string|null}>();
      if(!row?.audio_key) return json({code:'NOT_FOUND'},404,request);
      const rangeHeader=request.headers.get('Range');
      // Audio seek support: single HTTP byte range only, never a full multipart response.
      if(rangeHeader && !/^bytes=(?:[0-9]+)?-(?:[0-9]+)?$/.test(rangeHeader))
        return json({code:'INVALID_RANGE'},416,request);
      const object=await env.MEDIA.get(row.audio_key,rangeHeader?{range:request.headers}:undefined);
      if(!object) return json({code:'MEDIA_NOT_FOUND'},404,request);
      const headers=new Headers({'content-type':object.httpMetadata?.contentType||'audio/mpeg','cache-control':'public, max-age=300','x-content-type-options':'nosniff','vary':'Origin','accept-ranges':'bytes'});
      const origin=request.headers.get('Origin')||'';
      if(corsAllow.has(origin)||/^http:\/\/localhost:\d+$/.test(origin))headers.set('access-control-allow-origin',origin);
      if(rangeHeader && object.range && Number.isInteger(object.range.offset) && Number.isInteger(object.range.length)) {
        const start=object.range.offset!;
        const end=start+object.range.length!-1;
        headers.set('content-range',`bytes ${start}-${end}/${object.size}`);
        headers.set('content-length',String(object.range.length));
        return new Response(object.body,{status:206,headers});
      }
      if(object.size) headers.set('content-length',String(object.size));
      return new Response(object.body,{status:200,headers});
    }
    if (path.startsWith('/api/')) return json({code:'NOT_FOUND'},404,request);
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({code:'STATIC_ASSETS_NOT_DEPLOYED',message:'網頁尚未發佈；API 繼續可用。'},503,request);
  }
};
