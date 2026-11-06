import {createRemoteJWKSet,customFetch,jwtVerify} from 'jose';

/**
 * Isolated Echo/Starry ID integration preview.
 * NEVER serves Echo private media, writes the Starry ID D1, or exposes a service key.
 * A web login cannot complete on this workers.dev hostname: Starry ID only
 * registered https://echo.starry.phd as its web callback origin.
 */
type Env={STARRY_BATTERY_KEY?:string;STARRY_ID_SERVICE?:{fetch(request:Request):Promise<Response>};
 ECHO_PUBLIC_SERVICE?:{fetch(request:Request):Promise<Response>};ASSETS?:{fetch(request:Request):Promise<Response>}};
const ID_BASE='https://id.starry.phd';
const JWKS=createRemoteJWKSet(new URL(ID_BASE+'/.well-known/jwks.json'),{timeoutDuration:6500});
const HEADERS={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'} as const;

function json(data:unknown,status=200):Response{
 return new Response(JSON.stringify(data),{status,headers:{...HEADERS,'content-type':'application/json; charset=utf-8'}});
}
function page():Response{
 const html=`<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>繁星回聲 Echo｜串接驗證</title><style>
:root{font-family:system-ui,-apple-system,sans-serif;color:#263149;background:#fcf7fb}
body{margin:0;padding:30px 15px}main{max-width:660px;margin:auto}h1{color:#a63468;font-size:1.75rem}
.card{background:#fff;border:1px solid #edd5e1;border-radius:15px;padding:20px;margin:16px 0;line-height:1.8}
strong{color:#9f285e}code{overflow-wrap:anywhere;font-size:.91rem}a{color:#075b90}
.small{font-size:.9rem;color:#5f6b79}button{padding:10px;border-radius:9px;background:#a63468;border:0;color:#fff;font-weight:600}
</style></head><body><main>
<h1>繁星回聲 Echo｜串接驗證</h1><p><a href="/">回到 Echo 完整預覽首頁</a></p>
<div class="card"><h2>中央會員系統</h2><p>此頁從 Echo 測試 Worker 查詢正式 Starry ID 的 <code>/v1/apps/echo/config</code>，不使用任何會員資料。</p>
<p><strong id="status">正在查詢…</strong></p><p class="small" id="detail"></p>
<button type="button" onclick="location.reload()">重新查詢</button></div>
<div class="card"><h2>Google／Apple 登入</h2>
<p>正式 Starry ID 目前只接受 <code>https://echo.starry.phd</code> 網頁回傳，這個獨立預覽網址不在白名單，因此<strong>不能直接在這裡進行網頁登入</strong>。</p>
<p>手機 App 版本使用已登記的 <code>echostarry://auth/apple</code> 深層連結，可在安裝內部測試版後驗證。此頁不會索取 Token 或密碼。</p></div>
<div class="card"><h2>繁星電池艙 Starry Battery</h2>
<p>已準備安全的會員餘額 API 與「預留 1 單位後釋放」測試端點。它們只接受經正式 Starry ID 驗證的 Echo Access Token。</p>
<p>測試服務金鑰必須由業主放入 Worker Secret <code>STARRY_BATTERY_KEY</code>；未設定時會拒絕任何預留。絕不在本頁貼上金鑰。</p>
<p class="small">這個頁面只測試串接狀態；正式會員登入與 Battery 扣抵仍需在授權的 App 實機驗證。</p></div>
<p class="small">預覽 Worker：echo-api-staging。可回到 <a href="/">完整 Echo 畫面</a>。原網域 302 轉址與 Starry ID 設定均未改動。</p></main>
<script>
fetch('/api/status',{cache:'no-store'}).then(async r=>{const d=await r.json();document.getElementById('status').textContent=d.app_status==='active'?'App 登記有效（active）':'目前無法確認 active';
document.getElementById('detail').textContent='Starry ID 健康檢查：'+(d.id_health?'正常':'尚未確認')+'；註冊狀態：'+(d.app_status||'未確認');})
.catch(()=>{document.getElementById('status').textContent='無法連接中央會員系統';});
</script></body></html>`;
 return new Response(html,{headers:{...HEADERS,'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"}});
}

async function upstream(path:string,env:Env,init?:RequestInit):Promise<Response>{
 const signal=AbortSignal.timeout(8500);
 // Cloudflare Workers supports manual redirect handling; the browser's
 // redirect:'error' value is intentionally unsupported in the edge runtime.
 const request=new Request(ID_BASE+path,{...init,redirect:'manual',signal,headers:{accept:'application/json',...(init?.headers||{})}});
 const response=await (env.STARRY_ID_SERVICE?env.STARRY_ID_SERVICE.fetch(request):fetch(request));
 if(response.status>=300&&response.status<400)throw new Error('Unexpected Starry ID redirect');
 return response;
}
async function status(env:Env):Promise<Response>{
 let appStatus:string|null=null,health=false;
 let appHttpStatus=0,healthHttpStatus=0;
 let appError='',healthError='';
 try{const r=await upstream('/v1/apps/echo/config',env);appHttpStatus=r.status;
  if(r.ok){const o=await r.json() as {status?:unknown};appStatus=typeof o?.status==='string'?o.status:null;}
 }catch(error){appError=error instanceof Error?(error.name+': '+error.message).slice(0,180):'unknown';}
 try{const r=await upstream('/v1/health',env);healthHttpStatus=r.status;
  if(r.ok){const o=await r.json() as {status?:unknown};health=o?.status==='ok';}
 }catch(error){healthError=error instanceof Error?(error.name+': '+error.message).slice(0,180):'unknown';}
 return json({environment:'echo-api-staging',app_id:'echo',app_status:appStatus,id_health:health,
  upstream_http:{app:appHttpStatus,health:healthHttpStatus},upstream_errors:{app:appError,health:healthError},
  callback_registered:'https://echo.starry.phd',can_login_from_preview:false});
}

async function memberToken(request:Request,env:Env):Promise<string|null>{
 const raw=request.headers.get('Authorization')||'';
 const match=/^Bearer ([A-Za-z0-9_.-]+)$/.exec(raw);
 if(!match||match[1].length>8192)return null;
 try{
  const keys=env.STARRY_ID_SERVICE?createRemoteJWKSet(new URL(ID_BASE+'/.well-known/jwks.json'),{
   timeoutDuration:6500,
   [customFetch]:(url,options)=>env.STARRY_ID_SERVICE!.fetch(new Request(url,options))
  }):JWKS;
  const {payload,protectedHeader}=await jwtVerify(match[1],keys,{
   issuer:'starry-id:production',audience:'starry',algorithms:['ES256'],clockTolerance:'5s'
  });
  if(protectedHeader.alg!=='ES256'||payload.app_id!=='echo'||typeof payload.sub!=='string'||!payload.sub)return null;
  return match[1];
 }catch{return null;}
}
async function batteryResponse(request:Request,env:Env,mode:'balance'|'smoke'):Promise<Response>{
 const token=await memberToken(request,env);
 if(!token)return json({error:'A valid Starry ID Echo access token is required'},401);
 if(mode==='balance'){
  try{
   const r=await upstream('/v1/me/battery',env,{headers:{Authorization:'Bearer '+token}});
   return json(await r.json(),r.status);
  }catch{return json({error:'Starry ID is not reachable'},503);}
 }
 // Diagnostic smoke: reserve then release. Never commit a fake AI task.
 if(!env.STARRY_BATTERY_KEY)return json({error:'STARRY_BATTERY_KEY is not configured'},503);
 const key=env.STARRY_BATTERY_KEY;
 const body={task_type:'echo.ai',units:1,idempotency_key:crypto.randomUUID()};
 let id='';
 try{
  const reserved=await upstream('/v1/battery/reservations',env,{
   method:'POST',headers:{Authorization:'Bearer '+token,'x-starry-app-key':key,'content-type':'application/json'},body:JSON.stringify(body)});
  const data=await reserved.json().catch(()=>({})) as {reservation_id?:unknown;error?:{code?:string}};
  if(!reserved.ok)return json({ok:false,step:'reserve',status:reserved.status,error:data?.error?.code||'RESERVATION_FAILED'},reserved.status);
  id=typeof data.reservation_id==='string'?data.reservation_id:'';
  if(!id||!/^[-A-Za-z0-9_]{8,128}$/.test(id))return json({ok:false,step:'reserve',error:'Invalid reservation response'},502);
  const released=await upstream('/v1/battery/reservations/'+encodeURIComponent(id)+'/release',env,{
   method:'POST',headers:{'x-starry-app-key':key,'content-type':'application/json'},body:'{}'});
  if(!released.ok)return json({ok:false,step:'release',status:released.status,error:'Release not confirmed; reservation expires automatically'},502);
  return json({ok:true,reserved_units:1,released:true,charged_units:0});
 }catch{return json({ok:false,step:id?'release':'reserve',error:'Network failure; outstanding reservations expire automatically'},503);}
}
/**
 * PUBLIC Echo endpoints only. The existing echo-starry Worker enforces
 * verified/public media gates; this preview has no D1, R2, or write access.
 * Never forward cookies, Authorization or service keys to this public API.
 */
export function isPreviewPublicRoute(pathname:string,method:string):boolean{
 if(method!=='GET'&&method!=='HEAD')return false;
 return pathname==='/api/v1/health'||pathname==='/api/health'||
  pathname==='/api/v1/catalog'||pathname==='/api/v1/categories'||
  pathname==='/api/v1/speakers'||pathname==='/api/v1/previews'||
  new RegExp('^/api/v1/previews/[^/]{1,200}/cover$').test(pathname)||
  new RegExp('^/api/v1/tracks/[^/]{1,200}$').test(pathname);
}

async function previewPublicApi(request:Request,env:Env):Promise<Response>{
 if(!env.ECHO_PUBLIC_SERVICE)return json({error:'Echo public preview source unavailable'},503);
 const incoming=new URL(request.url);
 const headers=new Headers();
 // Restrict the forwarded request to public GET/HEAD + Accept only.
 const accept=request.headers.get('Accept');
 if(accept)headers.set('Accept',accept.slice(0,200));
 const target=new Request('https://echo.starry.phd'+incoming.pathname+incoming.search,{
  method:request.method,headers,redirect:'manual'
 });
 try{
  const result=await env.ECHO_PUBLIC_SERVICE.fetch(target);
  if(result.status>=300&&result.status<400)return json({error:'Unexpected Echo public API redirect'},502);
  return result;
 }catch{return json({error:'Echo public API temporarily unavailable'},503);}
}

export async function handlePreviewRequest(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/integration')return page();
  if(request.method==='GET'&&url.pathname==='/api/status')return status(env);
  if(request.method==='GET'&&url.pathname==='/api/battery/balance')return batteryResponse(request,env,'balance');
  if(request.method==='POST'&&url.pathname==='/api/battery/smoke')return batteryResponse(request,env,'smoke');
  if(isPreviewPublicRoute(url.pathname,request.method))return previewPublicApi(request,env);
  if(!url.pathname.startsWith('/api/')&&request.method==='GET'&&env.ASSETS)return env.ASSETS.fetch(request);
  return json({error:'Not found'},404);
}

export default {fetch:handlePreviewRequest};
