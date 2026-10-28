/**
 * Versioned Starry Echo public API SDK, generated types from OpenAPI 3.1.
 * Only free, verified public media. No shared member profile or Billing truth.
 */
import createClient from 'openapi-fetch';
import type {paths,components} from './generated';

export const ECHO_API_VERSION='v1' as const;
export type EchoTrack=components['schemas']['Track'];
export type EchoHealth=components['schemas']['Health'];
export type ApiProblem=components['schemas']['Problem'];
export type CatalogResult={tracks:EchoTrack[]};
export type CatalogFilters={query?:string;category?:string};

export function createEchoPublicClient(baseUrl:string,clientFetch:typeof fetch=fetch){
 const base=new URL(baseUrl);
 if(base.protocol!=='https:'&&base.hostname!=='localhost')throw new Error('HTTPS required');
 const origin=base.origin;
 const api=createClient<paths>({baseUrl:origin,fetch:clientFetch});
 return {
  async listTracks(signal?:AbortSignal,filters:CatalogFilters={}):Promise<EchoTrack[]>{
   const result=await api.GET('/api/v1/catalog',{params:{query:{
    q:filters.query?.trim().slice(0,100),
    category:filters.category?.trim().slice(0,80)
   }},signal});
   if(result.error||!result.data||!Array.isArray(result.data.tracks))
    throw new Error('Echo catalog unavailable or schema mismatch');
   return result.data.tracks;
  },
  /** 404 = not public / not yet verified; do not infer private availability. */
  async getTrack(id:string,signal?:AbortSignal):Promise<EchoTrack|null>{
   const result=await api.GET('/api/v1/tracks/{id}',{
    params:{path:{id}},signal,
   });
   if(result.response.status===404)return null;
   if(result.error||!result.data)throw new Error('Echo track unavailable');
   return result.data.track;
  },
  async listCategories(signal?:AbortSignal):Promise<string[]>{
   const result=await api.GET('/api/v1/categories',{signal});
   if(result.error||!result.data||!Array.isArray(result.data.categories))
    throw new Error('Echo categories unavailable');
   return result.data.categories;
  },
  async health(signal?:AbortSignal):Promise<EchoHealth>{
   const result=await api.GET('/api/v1/health',{signal});
   if(result.error||!result.data)throw new Error('Echo health unavailable');
   return result.data;
  },
  streamUrl(id:string):string{
   return origin+'/api/v1/tracks/'+encodeURIComponent(id)+'/stream';
  },
 };
}
