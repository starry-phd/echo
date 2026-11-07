/** Shared, validated WebAuthn contract. Binary values never travel through app state. */
import type {components as StarryComponents,paths as StarryPaths} from '../../../packages/starry-id-sdk/src/generated';

export type LoginOptions=StarryComponents['schemas']['PasskeyRequestOptions']['publicKey'];
export type PasskeyEntry=StarryPaths['/v1/me/passkeys']['get']['responses'][200]['content']['application/json']['passkeys'][number];
export type CredentialAssertion={id:string;clientDataJSON:string;authenticatorData:string;signature:string};
export type CredentialAttestation={clientDataJSON:string;attestationObject:string};
export const STARRY_PASSKEY_RP='id.starry.phd';

export function validateLoginOptions(options:unknown):LoginOptions{
 if(!options||typeof options!=='object')throw new Error('Passkey options unavailable');
 const o=options as Partial<LoginOptions>;
 if(o.rpId!==STARRY_PASSKEY_RP||o.userVerification!=='required'||!isBase64Url(o.challenge)||
  !Array.isArray(o.allowCredentials)||typeof o.timeout!=='number'||o.timeout<=0)
  throw new Error('Invalid Starry Passkey relying party or challenge');
 for(const v of o.allowCredentials){
  if(v?.type!=='public-key'||!isBase64Url(v.id))throw new Error('Invalid allowed Passkey credential');
 }
 return o as LoginOptions;
}
export function validateCreationOptions(options:unknown):Record<string,unknown>{
 if(!options||typeof options!=='object'||Array.isArray(options))throw new Error('Invalid Passkey creation options');
 const o=options as Record<string,unknown>;
 const rp=o.rp as {id?:unknown;name?:unknown}|undefined;
 const user=o.user as {id?:unknown;name?:unknown;displayName?:unknown}|undefined;
 if(rp?.id!==STARRY_PASSKEY_RP||typeof rp.name!=='string'||!isBase64Url(o.challenge)||
   !isBase64Url(user?.id)||typeof user?.name!=='string'||typeof user?.displayName!=='string'||
   !Array.isArray(o.pubKeyCredParams))throw new Error('Invalid Passkey creation RP or challenge');
 return o;
}
export function isBase64Url(value:unknown):value is string{
 return typeof value==='string'&&value.length>0&&/^[A-Za-z0-9_-]+$/.test(value);
}
export function verifyAssertion(value:unknown):CredentialAssertion{
 if(!value||typeof value!=='object')throw new Error('Passkey assertion missing');
 const v=value as Record<string,unknown>;
 if(![v.id,v.clientDataJSON,v.authenticatorData,v.signature].every(isBase64Url))
  throw new Error('Invalid Passkey assertion fields');
 return v as CredentialAssertion;
}
export function verifyAttestation(value:unknown):CredentialAttestation{
 if(!value||typeof value!=='object')throw new Error('Passkey attestation missing');
 const v=value as Record<string,unknown>;
 if(!isBase64Url(v.clientDataJSON)||!isBase64Url(v.attestationObject))
  throw new Error('Invalid Passkey attestation fields');
 return v as CredentialAttestation;
}
