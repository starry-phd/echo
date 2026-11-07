/** Web-only Passkey adapter. Never loads the native module in the website bundle. */
import {isBase64Url,validateCreationOptions,validateLoginOptions,verifyAssertion,verifyAttestation} from './passkeyContract';
import type {CredentialAssertion,CredentialAttestation,LoginOptions} from './passkeyContract';

function decode(value:string):ArrayBuffer{
 if(!isBase64Url(value))throw new Error('Invalid base64url');
 const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
 const out=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
 return out.buffer;
}
function encode(value:ArrayBuffer):string{
 const view=new Uint8Array(value);
 let binary='';
 for(const n of view)binary+=String.fromCharCode(n);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function passkeySupported():boolean{
 return typeof window!=='undefined'&&typeof window.PublicKeyCredential!=='undefined'&&
  typeof navigator!=='undefined'&&!!navigator.credentials?.get;
}
export async function getPlatformPasskey(options:LoginOptions):Promise<CredentialAssertion>{
 const v=validateLoginOptions(options);
 if(!passkeySupported())throw new Error('Passkey not supported');
 const credential=await navigator.credentials.get({publicKey:{
  challenge:decode(v.challenge),rpId:v.rpId,userVerification:'required',timeout:v.timeout,
  allowCredentials:v.allowCredentials.map(c=>({type:'public-key' as const,id:decode(c.id)}))
 }}) as PublicKeyCredential|null;
 if(!credential)throw new DOMException('No Passkey selected','NotAllowedError');
 const response=credential.response as AuthenticatorAssertionResponse;
 return verifyAssertion({id:credential.id,clientDataJSON:encode(response.clientDataJSON),
  authenticatorData:encode(response.authenticatorData),signature:encode(response.signature)});
}
export async function createPlatformPasskey(raw:Record<string,unknown>):Promise<CredentialAttestation>{
 const o=validateCreationOptions(raw);
 if(!passkeySupported()||!navigator.credentials?.create)throw new Error('Passkey not supported');
 const rp=o.rp as {id:string;name:string};
 const user=o.user as {id:string;name:string;displayName:string};
 const params=o.pubKeyCredParams as {type:'public-key';alg:number}[];
 const exclude=(o.excludeCredentials??[]) as {type:'public-key';id:string}[];
 const auth=o.authenticatorSelection as PublicKeyCredentialCreationOptions['authenticatorSelection'];
 const credential=await navigator.credentials.create({publicKey:{
  challenge:decode(o.challenge as string),rp:{id:rp.id,name:rp.name},
  user:{id:decode(user.id),name:user.name,displayName:user.displayName},
  pubKeyCredParams:params,timeout:typeof o.timeout==='number'?o.timeout:120000,
  excludeCredentials:exclude.map(c=>({type:'public-key',id:decode(c.id)})),
  authenticatorSelection:auth,attestation:'none'
 }}) as PublicKeyCredential|null;
 if(!credential)throw new DOMException('No Passkey created','NotAllowedError');
 const response=credential.response as AuthenticatorAttestationResponse;
 return verifyAttestation({clientDataJSON:encode(response.clientDataJSON),
  attestationObject:encode(response.attestationObject)});
}
