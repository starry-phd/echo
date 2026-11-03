import {isStarryUserId} from './member';

/**
 * Sign-in (`POST /v1/auth/{apple|google}`) and refresh (`POST /v1/auth/refresh`)
 * responses. Access token: 15 min, memory only. Refresh token: rotates on
 * every use and must REPLACE the stored one (integration guide §2–3).
 */
export type StarryTokenPair=Readonly<{accessToken:string;expiresInSeconds:number;refreshToken:string}>;
export type StarrySignIn=Readonly<{
 tokens:StarryTokenPair;
 user:Readonly<{userId:string;status:string;isNew:boolean;deletionPurgeAt:number|null}>;
 consentRequired:boolean;
}>;

const isRecord=(value:unknown):value is Record<string,unknown> =>
 typeof value==='object'&&value!==null&&!Array.isArray(value);
const token=(value:unknown,field:string):string=>{
 if(typeof value!=='string'||value.length<8||value.length>4096||/\s/.test(value))throw new Error('Invalid '+field);
 return value;
};

export function parseTokenPair(value:unknown):StarryTokenPair{
 if(!isRecord(value)||value.token_type!=='Bearer')throw new Error('Starry token response must be Bearer');
 const expires=value.expires_in;
 if(typeof expires!=='number'||!Number.isSafeInteger(expires)||expires<1)throw new Error('Invalid expires_in');
 return Object.freeze({accessToken:token(value.access_token,'access_token'),expiresInSeconds:expires,
  refreshToken:token(value.refresh_token,'refresh_token')});
}

export function parseSignInResponse(value:unknown):StarrySignIn{
 const tokens=parseTokenPair(value);
 const v=value as Record<string,unknown>;
 const user=v.user;
 if(!isRecord(user)||!isStarryUserId(user.user_id)||typeof user.status!=='string'||typeof user.is_new!=='boolean')
  throw new Error('Invalid Starry sign-in user');
 const purge=user.deletion_purge_at;
 if(purge!==null&&(typeof purge!=='number'||!Number.isSafeInteger(purge)))throw new Error('Invalid deletion_purge_at');
 if(typeof v.consent_required!=='boolean')throw new Error('Invalid consent_required');
 return Object.freeze({tokens,consentRequired:v.consent_required,
  user:Object.freeze({userId:user.user_id,status:user.status,isNew:user.is_new,deletionPurgeAt:purge})});
}
