
/**
 * Echo public Worker API (v1.3): TypeScript + Hono + Zod.
 * No Starry ID basic profiles or Billing truth are stored here.
 */
import {Hono} from 'hono';
import {z} from 'zod';

type TrackRow={
 id:string;title:string;speaker:string;description:string|null;
 duration_seconds:number;category_labels_json:string;
};
interface Statement{
 bind(...values:(string|number)[]):Statement;
 all<T>():Promise<{results?:T[]}>;
 first<T>():Promise<T|null>;
}
interface Database{prepare(sql:string):Statement}
interface AudioObject{
 body:ReadableStream<Uint8Array<ArrayBuffer>>;
 size:number;
 range?:{offset?:number;length?:number};
 httpMetadata?:{contentType?:string};
}
interface Media{get(key:string,opts?:{range:Headers}):Promise<AudioObject|null>}
export interface Env{DB:Database;MEDIA:Media;ASSETS?:{fetch(req:Request):Promise<Response>}}
const app=new Hono<{Bindings:Env}>();
const origins=new Set(['https://echo-starry.starry-phd.workers.dev','https://echo.starry.phd']);
const allowed=(origin:string)=>origins.has(origin)||/^http:\/\/localhost:\d+$/.test(origin);
function json(data:unknown,status:number,req:Request){
 const origin=req.headers.get('Origin')||'';
 const headers=new Headers({'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin'});
 if(allowed(origin))headers.set('access-control-allow-origin',origin);
 return new Response(JSON.stringify(data),{status,headers});
}
function publicTrack(row:TrackRow){
 let categories:string[]=[];
 try{
  const v:unknown=JSON.parse(row.category_labels_json||'[]');
  if(Array.isArray(v))categories=v.filter((x):x is string=>typeof x==='string');
 }catch{/* Invalid legacy JSON should not leak storage. */}
 return {id:row.id,title:row.title,speaker:row.speaker,description:row.description,durationSeconds:row.duration_seconds,categories,playable:true};
}
const filterSchema=z.object({q:z.string().max(100).optional(),category:z.string().max(80).optional(),speaker:z.string().max(80).optional()});
app.options('*',c=>{
 const origin=c.req.header('Origin')||'';
 if(!allowed(origin))return new Response(null,{status:403});
 return new Response(null,{status:204,headers:{
  'access-control-allow-origin':origin,'access-control-allow-methods':'GET, OPTIONS',
  'access-control-allow-headers':'Content-Type, Accept, Range','access-control-max-age':'600','vary':'Origin'
 }});
});
const health=async(c:{req:{raw:Request};env:Env})=>{
 let legacyMediaMigration:'pending'|'copied'|'verified'='pending';
 try{
  const row=await c.env.DB.prepare(
   "SELECT status FROM echo_migrations WHERE key='legacy-echo-2026-10'"
  ).first<{status:string}>();
  if(row&&['pending','copied','verified'].includes(row.status))
   legacyMediaMigration=row.status as typeof legacyMediaMigration;
 }catch{/* Keep /health available even when migration table is temporarily unreachable. */}
 return json({
  service:'echo-starry',stage:'bootstrap',apiVersion:'v1',database:Boolean(c.env.DB),
  storage:Boolean(c.env.MEDIA),centralMemberApi:'pending',legacyMediaMigration
 },200,c.req.raw);
};
for(const route of ['/health','/api/health','/api/v1/health'])app.get(route,health);

const categories=async(c:{req:{raw:Request};env:Env})=>{
 const data=await c.env.DB.prepare("SELECT DISTINCT c.name AS name FROM echo_categories c WHERE EXISTS (SELECT 1 FROM echo_tracks t, json_each(CASE WHEN json_valid(t.category_labels_json) THEN t.category_labels_json ELSE '[]' END) je WHERE t.visibility = 'public' AND t.migration_status = 'verified' AND je.value = c.name) ORDER BY c.display_order, c.name").all<{name:string}>();
 return json({categories:(data.results||[]).map(x=>x.name).filter(x=>typeof x==='string')},200,c.req.raw);
};
app.get('/api/categories',categories);
app.get('/api/v1/categories',categories);

/** Only speaker names associated with verified public recordings are discoverable. */
const speakers=async(c:{req:{raw:Request};env:Env})=>{
 const rows=await c.env.DB.prepare(
  "SELECT speaker AS name, COUNT(*) AS trackCount FROM echo_tracks WHERE visibility = 'public' AND migration_status = 'verified' AND trim(speaker) <> '' GROUP BY speaker ORDER BY trackCount DESC, name LIMIT 100"
 ).all<{name:string;trackCount:number}>();
 return json({speakers:(rows.results||[]).map(x=>({name:x.name,trackCount:x.trackCount}))},200,c.req.raw);
};
app.get('/api/speakers',speakers);
app.get('/api/v1/speakers',speakers);


const catalog=async(c:{req:{raw:Request;query(name:string):string|undefined};env:Env})=>{
 const checked=filterSchema.safeParse({q:c.req.query('q'),category:c.req.query('category'),speaker:c.req.query('speaker')});
 if(!checked.success)return json({code:'INVALID_QUERY'},400,c.req.raw);
 const query=(checked.data.q||'').trim(),category=(checked.data.category||'').trim();
 let sql="SELECT id,title,speaker,description,duration_seconds,category_labels_json FROM echo_tracks WHERE visibility = 'public' AND migration_status = 'verified'";
 const args:string[]=[];
 if(query){
  sql+=" AND (instr(lower(title),lower(?)) > 0 OR instr(lower(speaker),lower(?)) > 0)";
  args.push(query,query);
 }
 if(category){
  sql+=" AND EXISTS (SELECT 1 FROM json_each(CASE WHEN json_valid(category_labels_json) THEN category_labels_json ELSE '[]' END) WHERE value = ?)";
  args.push(category);
 }
 const speaker=(checked.data.speaker||'').trim();
 if(speaker){
  sql+=" AND speaker = ?";
  args.push(speaker);
 }
 sql+=' ORDER BY updated_at DESC LIMIT 100';
 const s=c.env.DB.prepare(sql);
 const r=await(args.length?s.bind(...args):s).all<TrackRow>();
 return json({tracks:(r.results||[]).map(publicTrack)},200,c.req.raw);
};
app.get('/api/catalog',catalog);
app.get('/api/v1/catalog',catalog);


/** Look up an individual public + migrated track without scanning the first 100 catalog results. */
const detail=async(c:{req:{raw:Request;param(name:string):string};env:Env})=>{
 const parsed=z.string().min(1).max(200).safeParse(c.req.param('id'));
 if(!parsed.success)return json({code:'INVALID_TRACK_ID'},400,c.req.raw);
 const record=await c.env.DB.prepare(
  "SELECT id,title,speaker,description,duration_seconds,category_labels_json FROM echo_tracks WHERE id = ? AND visibility = 'public' AND migration_status = 'verified'"
 ).bind(parsed.data).first<TrackRow>();
 if(!record)return json({code:'NOT_FOUND'},404,c.req.raw);
 return json({track:publicTrack(record)},200,c.req.raw);
};
app.get('/api/tracks/:id',detail);
app.get('/api/v1/tracks/:id',detail);

/**
 * R2 migration preserved the bytes but original audio objects do not carry
 * Content-Type metadata. MIME must match the verified legacy container.
 * Exactly one legacy *.aac object has an MP4 'ftyp' header, not ADTS.
 * Explicit audio/* metadata on future assets takes precedence.
 */
function audioMimeForKey(key:string,metadata?:string):string {
 const supplied=(metadata||'').trim().toLowerCase();
 if(/^audio\/[a-z0-9.+-]+$/.test(supplied))return supplied;
 const lower=key.toLowerCase();
 if(lower.endsWith('.m4a')||lower.endsWith('.mp4'))return 'audio/mp4';
 if(lower.endsWith('.aac'))return 'audio/mp4'; // legacy Echo *.aac has MP4 ftyp bytes
 if(lower.endsWith('.mp3'))return 'audio/mpeg';
 return 'application/octet-stream';
}

const stream=async(c:{req:{raw:Request;param(name:string):string};env:Env})=>{
 let id:string;
 try{id=decodeURIComponent(c.req.param('id'));}catch{return json({code:'INVALID_TRACK_ID'},400,c.req.raw);}
 const record=await c.env.DB.prepare(
  "SELECT audio_key FROM echo_tracks WHERE id = ? AND visibility = 'public' AND migration_status = 'verified'"
 ).bind(id).first<{audio_key:string|null}>();
 if(!record?.audio_key)return json({code:'NOT_FOUND'},404,c.req.raw);
 const range=c.req.raw.headers.get('Range');
 if(range&&!/^bytes=(?:[0-9]+)?-(?:[0-9]+)?$/.test(range))
  return json({code:'INVALID_RANGE'},416,c.req.raw);
 const media=await c.env.MEDIA.get(record.audio_key,range?{range:c.req.raw.headers}:undefined);
 if(!media)return json({code:'MEDIA_NOT_FOUND'},404,c.req.raw);
 const headers=new Headers({'content-type':audioMimeForKey(record.audio_key,media.httpMetadata?.contentType),
  'cache-control':'public, max-age=300','x-content-type-options':'nosniff',
  'vary':'Origin','accept-ranges':'bytes'});
 const origin=c.req.raw.headers.get('Origin')||'';
 if(allowed(origin))headers.set('access-control-allow-origin',origin);
 if(range&&media.range&&Number.isInteger(media.range.offset)&&Number.isInteger(media.range.length)){
  const start=media.range.offset!,end=start+media.range.length!-1;
  headers.set('content-range','bytes '+start+'-'+end+'/'+media.size);
  headers.set('content-length',String(media.range.length));
  return new Response(media.body,{status:206,headers});
 }
 if(media.size)headers.set('content-length',String(media.size));
 return new Response(media.body,{status:200,headers});
};
app.get('/api/tracks/:id/stream',stream);
app.get('/api/v1/tracks/:id/stream',stream);

app.get('*',c=>{
 if(c.req.path.startsWith('/api/'))return json({code:'NOT_FOUND'},404,c.req.raw);
 if(c.env.ASSETS)return c.env.ASSETS.fetch(c.req.raw);
 return json({code:'STATIC_ASSETS_NOT_DEPLOYED'},503,c.req.raw);
});
app.all('*',c=>json({code:'METHOD_NOT_ALLOWED'},405,c.req.raw));
app.onError((_err,c)=>json({code:'SERVICE_UNAVAILABLE'},503,c.req.raw));
export default app;
