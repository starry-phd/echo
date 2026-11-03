/** URL-safe base64 without padding, for OAuth `state` values (no Buffer in React Native). */
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export function base64UrlEncode(bytes:Uint8Array):string{
 let out='';
 for(let i=0;i<bytes.length;i+=3){
  const n=(bytes[i]<<16)|((bytes[i+1]??0)<<8)|(bytes[i+2]??0);
  out+=ALPHABET[(n>>18)&63]+ALPHABET[(n>>12)&63];
  if(i+1<bytes.length)out+=ALPHABET[(n>>6)&63];
  if(i+2<bytes.length)out+=ALPHABET[n&63];
 }
 return out;
}
