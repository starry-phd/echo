import {Starry,StarryError} from './vendor/starry-sdk';
import {verifyEchoAccessToken,STARRY_ID_BASE} from './starryIdentity';

interface Statement{
 bind(...values:(string|number)[]):Statement;
 all<T>():Promise<{results?:T[]}>;
 first<T>():Promise<T|null>;
 run():Promise<unknown>;
}
export interface EchoBatteryDb{prepare(sql:string):Statement}
export type EchoBatteryEnv={
 DB:EchoBatteryDb;
 STARRY_BATTERY_KEY?:string;
 STARRY_ID_SERVICE?:{fetch(request:Request):Promise<Response>};
};
export type EchoTaskPrice={task_type:string;task_label:string;units:number};
export type EchoTaskPriceRow=EchoTaskPrice&{updated_at:number;updated_by_user_id:string};
const taskTypePattern=/^echo\.[a-z0-9._-]{1,59}$/;
const okPrice=(row:EchoTaskPrice):boolean=>
 taskTypePattern.test(row.task_type)&&typeof row.task_label==='string'&&
 row.task_label.trim().length>0&&row.task_label.length<=40&&
 Number.isSafeInteger(row.units)&&row.units>=1&&row.units<=100;

export function makeBackendStarry(env:EchoBatteryEnv):Starry{
 const safeFetch:typeof fetch=async(input,init)=>{
  const url=typeof input==='string'?input:input instanceof URL?String(input):input.url;
  if(!url.startsWith(STARRY_ID_BASE+'/v1/'))throw new Error('Unexpected Starry ID SDK path');
  const req=new Request(url,{...init,redirect:'manual'});
  const response=await(env.STARRY_ID_SERVICE?env.STARRY_ID_SERVICE.fetch(req):fetch(req));
  if(response.status>=300&&response.status<400)throw new Error('Unexpected Starry ID redirect');
  return response;
 };
 return new Starry({baseUrl:STARRY_ID_BASE,serviceKey:env.STARRY_BATTERY_KEY,fetch:safeFetch});
}

export function echoBatteryError(error:unknown):{status:number;code:string;message:string}{
 if(error instanceof StarryError){
  if(error.status===409&&error.code==='BATTERY_APP_CAP')
   return {status:409,code:'BATTERY_APP_CAP',message:'繁星回聲本月用量達上限，請稍後再試。'};
  if(error.status===503||error.code==='SERVICE_UNAVAILABLE')
   return {status:503,code:'SERVICE_UNAVAILABLE',message:'繁星電池艙維護中，請稍後再試。'};
  if(error.code==='BATTERY_INSUFFICIENT')
   return {status:409,code:error.code,message:'免費額度與本 App 量子電池不足。'};
  return {status:error.status,code:error.code,message:'繁星電池艙暫時無法使用，請稍後再試。'};
 }
 return {status:503,code:'SERVICE_UNAVAILABLE',message:'無法連接繁星電池艙，請稍後再試。'};
}

type VerifiedMember={user_id?:unknown;staff_role?:unknown;status?:unknown;
 consent?:{required?:unknown}};
export type BackendDependencies={
 verifyToken:(request:Request,env:EchoBatteryEnv)=>Promise<string|null>;
 starry:(env:EchoBatteryEnv)=>Pick<Starry,'me'|'withBattery'>;
};
const defaultDependencies:BackendDependencies={
 verifyToken:verifyEchoAccessToken,
 starry:makeBackendStarry
};
async function verifiedMember(request:Request,env:EchoBatteryEnv,deps:BackendDependencies){
 const token=await deps.verifyToken(request,env);
 if(!token)return null;
 const me=await deps.starry(env).me(token) as VerifiedMember;
 if(typeof me?.user_id!=='string'||!me.user_id||me.status!=='active'||me.consent?.required!==false)
  return null;
 return {token,me};
}
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store'} as const;
function respond(status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers});}

/** Member-facing task prices live only in Echo D1; only Owner can change them.
 * Verified JWT and a fresh GET /v1/me staff_role check are both required.
 */
export async function echoBatterySettings(request:Request,env:EchoBatteryEnv,deps=defaultDependencies):Promise<Response>{
 if(request.method!=='GET'&&request.method!=='PATCH')return respond(405,{error:'METHOD_NOT_ALLOWED'});
 let who:Awaited<ReturnType<typeof verifiedMember>>;
 try{who=await verifiedMember(request,env,deps);}
 catch{return respond(503,{error:'SERVICE_UNAVAILABLE',message:'無法核對中央會員權限，請稍後再試。'});}
 if(!who)return respond(401,{error:'UNAUTHORIZED'});
 if(who.me.staff_role!=='owner')return respond(403,{error:'OWNER_REQUIRED'});
 if(request.method==='GET'){
  try{
   const r=await env.DB.prepare(
    'SELECT task_type,task_label,units,updated_at,updated_by_user_id FROM echo_battery_task_prices ORDER BY task_type LIMIT 50'
   ).all<EchoTaskPriceRow>();
   return respond(200,{tasks:r.results||[]});
  }catch{return respond(503,{error:'ECHO_TASK_SETTINGS_UNAVAILABLE'});}
 }
 let p:unknown;
 try{p=await request.json();}catch{return respond(400,{error:'INVALID_JSON'});}
 const body=p&&typeof p==='object'&&!Array.isArray(p)?p as Record<string,unknown>:null;
 const price:EchoTaskPrice={task_type:body?.task_type as string,task_label:body?.task_label as string,units:body?.units as number};
 if(!okPrice(price))return respond(400,{error:'INVALID_TASK_PRICE'});
 try{
  await env.DB.prepare(
   'INSERT INTO echo_battery_task_prices (task_type,task_label,units,updated_at,updated_by_user_id) VALUES (?,?,?,?,?) ON CONFLICT(task_type) DO UPDATE SET task_label=excluded.task_label,units=excluded.units,updated_at=excluded.updated_at,updated_by_user_id=excluded.updated_by_user_id'
  ).bind(price.task_type,price.task_label.trim(),price.units,Date.now(),who.me.user_id as string).run();
  return respond(200,{task:{task_type:price.task_type,task_label:price.task_label.trim(),units:price.units}});
 }catch{return respond(503,{error:'ECHO_TASK_SETTINGS_UNAVAILABLE'});}
}

/** Protected server-only AI executor: D1 decides the units, not the client.
 * If Starry cannot reserve (409 app cap / 503 maintenance / outage) work is NEVER invoked.
 * The official SDK handles reserve -> work -> commit or release on failure.
 */
export async function executePricedEchoTask<T>(
 request:Request,env:EchoBatteryEnv,taskType:string,work:()=>Promise<T>,deps=defaultDependencies
):Promise<T>{
 if(!env.STARRY_BATTERY_KEY)throw new Error('Battery backend service key is missing');
 if(!taskTypePattern.test(taskType))throw new Error('Invalid Echo task');
 const verified=await verifiedMember(request,env,deps);
 if(!verified)throw new Error('Starry Echo member is not active or consent is required');
 const price=await env.DB.prepare(
  'SELECT task_type,task_label,units FROM echo_battery_task_prices WHERE task_type=?'
 ).bind(taskType).first<EchoTaskPrice>();
 if(!price||!okPrice(price))throw new Error('Task price not configured');
 return deps.starry(env).withBattery(verified.token,{
  taskType:price.task_type,taskLabel:price.task_label,units:price.units
 },async()=>work());
}
