import type {StarryIdSession} from './session';

export type EchoTaskPrice={task_type:string;task_label:string;units:number};
const BACKENDS=new Set([
 'https://echo.starry.phd','https://echo-api-staging.starry-phd.workers.dev'
]);
const PATH='/api/v1/battery/task-settings';

export function echoBackendUrl(value:string|undefined):string|null{
 if(!value)return null;
 const url=value.trim().replace(/\/$/,'');
 return BACKENDS.has(url)?url:null;
}

/** Access token goes only to Echo's own allow-listed backend, not to media or a third party. */
export async function ownerTaskPriceRequest(
 session:StarryIdSession,base:string,method:'GET'|'PATCH',price?:EchoTaskPrice,
 fetcher:typeof fetch=fetch
):Promise<EchoTaskPrice[]>{
 const root=echoBackendUrl(base);
 if(!root)throw new Error('Echo backend is not configured');
 const send=async()=>{
  const token=await session.getAccessToken();
  if(!token)throw new Error('Please sign in again');
  return fetcher(root+PATH,{
   method,headers:{accept:'application/json',authorization:'Bearer '+token,
    ...(price?{'content-type':'application/json'}:{})},
   credentials:'omit',cache:'no-store',
   ...(price?{body:JSON.stringify(price)}:{})
  });
 };
 let response=await send();
 if(response.status===401&&await session.refresh())response=await send();
 const data=await response.json().catch(()=>({})) as {
  tasks?:EchoTaskPrice[];task?:EchoTaskPrice;error?:string
 };
 if(!response.ok)throw new Error(data.error||'Echo task settings are unavailable');
 if(method==='PATCH')return data.task?[data.task]:[];
 if(!Array.isArray(data.tasks))throw new Error('Invalid task configuration');
 return data.tasks.filter(t=>t&&typeof t.task_type==='string'&&typeof t.task_label==='string'&&
  Number.isSafeInteger(t.units)&&t.units>=1&&t.units<=100);
}
