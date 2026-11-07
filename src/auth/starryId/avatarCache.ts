/** Cache identity follows avatar path (before ?), never user_id or temporary URL signature. */
export function starryAvatarCacheKey(url:string|null):string|null{
 if(!url)return null;
 try{
  const parsed=new URL(url,'https://id.starry.phd');
  if(parsed.origin!=='https://id.starry.phd'||!parsed.pathname.startsWith('/')||
     parsed.username||parsed.password||parsed.hash)return null;
  return parsed.pathname;
 }catch{return null;}
}
