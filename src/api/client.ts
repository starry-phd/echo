import {Platform} from 'react-native';
import {createEchoPublicClient} from '../../packages/echo-api-sdk/src';
import type {CatalogFilters,EchoTrack} from '../types';
const configuredUrl=process.env.EXPO_PUBLIC_ECHO_API_BASE_URL?.trim();
export function getApiBaseUrl():string|null{
 if(!configuredUrl){
  if(Platform.OS==='web'&&typeof window!=='undefined')return window.location.origin;
  return null;
 }
 try{
  const url=new URL(configuredUrl);
  if(url.protocol!=='https:'&&url.hostname!=='localhost')return null;
  return url.origin;
 }catch{return null;}
}
export async function getPublicTracks(signal?:AbortSignal,filters:CatalogFilters={}):Promise<EchoTrack[]>{
 const origin=getApiBaseUrl();
 if(!origin)throw new Error('新 API 網址尚未設定，音檔清單暫不開放。');
 return createEchoPublicClient(origin).listTracks(signal,filters);
}
export async function getCategories(signal?:AbortSignal):Promise<string[]>{
 const origin=getApiBaseUrl();
 return origin?createEchoPublicClient(origin).listCategories(signal):[];
}
export function getPublicStreamUrl(id:string):string|null{
 const origin=getApiBaseUrl();
 return origin?createEchoPublicClient(origin).streamUrl(id):null;
}

/** Fetch by ID; unlike catalog, this does not require the track to be in the first 100 results. */
export async function getPublicTrack(id:string,signal?:AbortSignal):Promise<EchoTrack|null>{
 const origin=getApiBaseUrl();
 if(!origin)throw new Error('新 API 網址尚未設定，音檔詳情暫不開放。');
 return createEchoPublicClient(origin).getTrack(id,signal);
}
