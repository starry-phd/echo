/** Move an existing session to the official Starry Client without reusing a rotated token. */
import {Platform} from 'react-native';
import {memoryStorage,sessionStorageAdapter} from './vendor/starry-client';
import type {StarryStorage} from './vendor/starry-client';
import {nativeSdkStorage} from './nativeSignIn';
import {STARRY_REFRESH_TOKEN_KEY} from './storage';

export const SDK_REFRESH_KEY='starry.refresh.echo';
export function createEchoSdkStorage():StarryStorage{
 const memory=memoryStorage();
 const root:StarryStorage=Platform.OS==='web'&&typeof window!=='undefined'?
  sessionStorageAdapter():nativeSdkStorage()??memory;
 return {
  async get(key){
   try{
    const value=await root.get(key);
    return value===null&&key===SDK_REFRESH_KEY?await root.get(STARRY_REFRESH_TOKEN_KEY):value;
   }catch{return memory.get(key);}
  },
  async set(key,value){
   try{
    await root.set(key,value);
    if(key===SDK_REFRESH_KEY)await root.remove(STARRY_REFRESH_TOKEN_KEY);
   }catch{await memory.set(key,value);}
  },
  async remove(key){
   try{
    await root.remove(key);
    if(key===SDK_REFRESH_KEY)await root.remove(STARRY_REFRESH_TOKEN_KEY);
   }catch{/* unavailable storage is already unusable */}
   await memory.remove(key);
  }
 };
}
