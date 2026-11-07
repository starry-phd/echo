import {createRemoteJWKSet,customFetch,jwtVerify} from 'jose';

export const STARRY_ID_BASE='https://id.starry.phd';
type ServiceBinding={fetch(request:Request):Promise<Response>};
export type StarryServiceEnv={STARRY_ID_SERVICE?:ServiceBinding};
const publicJwks=createRemoteJWKSet(new URL(STARRY_ID_BASE+'/.well-known/jwks.json'),{
 timeoutDuration:6500,cacheMaxAge:600_000,cooldownDuration:0
});
const boundJwks=new WeakMap<ServiceBinding,ReturnType<typeof createRemoteJWKSet>>();

/** Keep JWKS between requests. On a new kid jose re-fetches the set; during
 * rotation both old/new keys remain acceptable while Starry publishes them.
 */
export function jwksFor(env:StarryServiceEnv):ReturnType<typeof createRemoteJWKSet>{
 if(!env.STARRY_ID_SERVICE)return publicJwks;
 const service=env.STARRY_ID_SERVICE;
 let resolver=boundJwks.get(service);
 if(!resolver){
  resolver=createRemoteJWKSet(new URL(STARRY_ID_BASE+'/.well-known/jwks.json'),{
   timeoutDuration:6500,cacheMaxAge:600_000,cooldownDuration:0,
   [customFetch]:(url,options)=>service.fetch(new Request(url,{...options,redirect:'manual'}))
  });
  boundJwks.set(service,resolver);
 }
 return resolver;
}

/** Only accept Starry's ES256 token for this exact Echo App, never email IDs. */
export async function verifyEchoAccessToken(request:Request,env:StarryServiceEnv):Promise<string|null>{
 const header=request.headers.get('authorization')||'';
 const match=/^Bearer ([A-Za-z0-9_.-]+)$/.exec(header);
 if(!match||match[1].length>8192)return null;
 try{
  const {payload,protectedHeader}=await jwtVerify(match[1],jwksFor(env),{
   issuer:'starry-id:production',audience:'starry',algorithms:['ES256'],clockTolerance:'5s'
  });
  if(protectedHeader.alg!=='ES256'||payload.app_id!=='echo'||typeof payload.sub!=='string'||!payload.sub)return null;
  return match[1];
 }catch{return null;}
}
