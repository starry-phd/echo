/**
 * Where the rotating refresh token lives. The access token is never persisted.
 * - Native: expo-secure-store (added with the sign-in UI; never AsyncStorage).
 * - Web: sessionStorage, as Starry ID recommends (§11.2c) — never localStorage.
 * Every adapter swallows storage failures and degrades to "signed out".
 */
export type RefreshTokenStore={
 get():Promise<string|null>;
 set(token:string):Promise<void>;
 clear():Promise<void>;
};

export const STARRY_REFRESH_TOKEN_KEY='starry-id-refresh-token-v1';

export function createMemoryRefreshTokenStore(initial:string|null=null):RefreshTokenStore{
 let value=initial;
 return {
  async get(){return value;},
  async set(token){value=token;},
  async clear(){value=null;}
 };
}

type SessionStorageLike={getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void};

export function createSessionStorageRefreshTokenStore(storage:SessionStorageLike|null|undefined):RefreshTokenStore{
 const memory=createMemoryRefreshTokenStore();
 if(!storage)return memory;
 return {
  async get(){try{return storage.getItem(STARRY_REFRESH_TOKEN_KEY);}catch{return memory.get();}},
  async set(token){try{storage.setItem(STARRY_REFRESH_TOKEN_KEY,token);}catch{await memory.set(token);}},
  async clear(){try{storage.removeItem(STARRY_REFRESH_TOKEN_KEY);}catch{/* already unavailable */}await memory.clear();}
 };
}
