/**
 * Tolerant reader for `GET /v1/me` (starry-phd/id integration guide §8, §11.7).
 * Replaces the superseded v1.0 five-field DTO. Extra response fields are
 * ignored (the /v1 contract only grows), and this app keeps ONLY what it
 * displays: no e-mail, phone, birthday, location or identity details are
 * copied out (data minimisation; the member record lives in Starry ID).
 */
export const STARRY_MEMBER_FALLBACK_NAME='繁星會員';

export type StarryMemberStatus='active'|'pending_deletion'|'suspended'|'unknown';
export type StarryMember=Readonly<{
 userId:string;
 status:StarryMemberStatus;
 displayName:string;
 hasDisplayName:boolean;
 avatarPath:string|null;
 profileVersion:number;
 staffRole:'owner'|'admin'|'support'|null;
 deletionPurgeAt:number|null;
 consent:Readonly<{termsVersion:string;privacyVersion:string;required:boolean}>;
}>;

const isRecord=(value:unknown):value is Record<string,unknown> =>
 typeof value==='object'&&value!==null&&!Array.isArray(value);

/** Opaque Starry user ID; an e-mail is never accepted as the identity. */
export function isStarryUserId(value:unknown):value is string{
 return typeof value==='string'&&value.length>=1&&value.length<=128&&/^[A-Za-z0-9_.:-]+$/.test(value);
}
function memberStatus(value:unknown):StarryMemberStatus{
 return value==='active'||value==='pending_deletion'||value==='suspended'?value:'unknown';
}
function optionalTimestamp(value:unknown,field:string):number|null{
 if(value===null||value===undefined)return null;
 if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw new Error('Invalid '+field);
 return value;
}

export function parseStarryMe(value:unknown):StarryMember{
 if(!isRecord(value))throw new Error('Starry /v1/me must be a JSON object');
 if(!isStarryUserId(value.user_id))throw new Error('Invalid opaque Starry user_id');
 const profile=value.profile;
 if(!isRecord(profile))throw new Error('Starry /v1/me profile missing');
 const version=profile.version;
 if(typeof version!=='number'||!Number.isSafeInteger(version)||version<1)throw new Error('Invalid Starry profile version');
 const rawName=profile.display_name;
 if(rawName!==null&&rawName!==undefined&&typeof rawName!=='string')throw new Error('Invalid Starry display_name');
 const name=typeof rawName==='string'?rawName.trim().slice(0,120):'';
 const avatar=profile.avatar_url;
 const avatarPath=typeof avatar==='string'&&avatar.startsWith('/')&&!avatar.startsWith('//')?avatar:null;
 const consent=value.consent;
 if(!isRecord(consent)||typeof consent.terms_version!=='string'||typeof consent.privacy_version!=='string'
   ||typeof consent.required!=='boolean')throw new Error('Invalid Starry consent');
 return Object.freeze({
  userId:value.user_id,
  status:memberStatus(value.status),
  displayName:name||STARRY_MEMBER_FALLBACK_NAME,
  hasDisplayName:Boolean(name),
  avatarPath,
  profileVersion:version,
  staffRole:value.staff_role==='owner'||value.staff_role==='admin'||value.staff_role==='support'?value.staff_role:null,
  deletionPurgeAt:optionalTimestamp(value.deletion_purge_at,'deletion_purge_at'),
  consent:Object.freeze({termsVersion:consent.terms_version,privacyVersion:consent.privacy_version,required:consent.required})
 });
}

/** Member-only features run only for an active member who has accepted the current terms. */
export function memberMayUseFeatures(member:StarryMember):boolean{
 return member.status==='active'&&!member.consent.required;
}
