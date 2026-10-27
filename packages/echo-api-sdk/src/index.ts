/** Starry Echo API SDK v0.1.0: public, read-only. No central member personal data. */
export const ECHO_API_VERSION='v1' as const;
export interface EchoTrack {
 id:string;title:string;speaker:string;description:string|null;
 durationSeconds:number;categories:string[];playable:boolean;
}
export type CatalogResult={tracks:EchoTrack[]};
export type CatalogFilters={query?:string;category?:string};
export type ApiProblem={code:string;message?:string};
export interface EchoHealth {
 service:string;stage:string;apiVersion:string;database:boolean;storage:boolean;
 centralMemberApi:string;legacyMediaMigration:string;
}
export function createEchoPublicClient(baseUrl:string,clientFetch:typeof fetch=fetch){
 const parsed=new URL(baseUrl);
 if(parsed.protocol!=='https:'&&parsed.hostname!=='localhost')throw new Error('HTTPS required');
 const route=(name:string)=>parsed.origin+'/api/'+ECHO_API_VERSION+'/'+name;
 async function read<T>(url:string,signal?:AbortSignal):Promise<T>{
  const response=await clientFetch(url,{signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('Echo API unavailable: '+response.status);
  return await response.json() as T;
 }
 return {
  async listTracks(signal?:AbortSignal,filters:CatalogFilters={}):Promise<EchoTrack[]>{
   const params=new URLSearchParams();
   if(filters.query?.trim())params.set('q',filters.query.trim().slice(0,100));
   if(filters.category?.trim())params.set('category',filters.category.trim().slice(0,80));
   const url=route('catalog')+(params.size?'?'+params.toString():'');
   const body=await read<CatalogResult>(url,signal);
   if(!Array.isArray(body.tracks))throw new Error('Invalid catalog response');
   return body.tracks;
  },
  async listCategories(signal?:AbortSignal):Promise<string[]>{
   const body=await read<{categories:unknown}>(route('categories'),signal);
   return Array.isArray(body.categories)?body.categories.filter((x):x is string=>typeof x==='string'):[];
  },
  health(signal?:AbortSignal):Promise<EchoHealth>{return read<EchoHealth>(route('health'),signal);},
  streamUrl(id:string):string{return route('tracks/'+encodeURIComponent(id)+'/stream');}
 };
}
