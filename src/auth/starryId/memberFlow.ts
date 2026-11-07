import {StarryIdError} from './errors';
import type {StarryAppAvailability} from './appConfig';
import type {StarryMember} from './member';
import type {StarrySignIn} from './tokens';

/**
 * What the member panel shows. Pure: derived from Starry ID responses and errors
 * exactly as the integration guide prescribes (§1–4 and the fixtures error table).
 */
export type MemberViewState=
 |{kind:'disabled'}
 |{kind:'checking'}
 |{kind:'signed-out';notice?:string}
 |{kind:'consent-required';member:StarryMember}
 |{kind:'signed-in';member:StarryMember}
 |{kind:'pending-deletion';purgeAt:number|null}
 |{kind:'suspended'}
 |{kind:'maintenance'}
 |{kind:'update-required';minVersion:string}
 |{kind:'unavailable'};

export function stateFromAvailability(availability:StarryAppAvailability):MemberViewState|null{
 switch(availability.kind){
  case 'active':return null; // continue with the session
  case 'paused':case 'killed':return {kind:'maintenance'};
  case 'update-required':return {kind:'update-required',minVersion:availability.minVersion};
  default:return {kind:'unavailable'};
 }
}

/** After POST /v1/auth/{provider}: deletion pending wins; otherwise load /v1/me next. */
export function stateAfterSignIn(signIn:StarrySignIn):MemberViewState|null{
 if(signIn.user.status==='pending_deletion')return {kind:'pending-deletion',purgeAt:signIn.user.deletionPurgeAt};
 if(signIn.user.status==='suspended')return {kind:'suspended'};
 return null;
}

export function stateFromMember(member:StarryMember):MemberViewState{
 if(member.status==='pending_deletion')return {kind:'pending-deletion',purgeAt:member.deletionPurgeAt};
 if(member.status==='suspended')return {kind:'suspended'};
 if(member.status!=='active')return {kind:'unavailable'};
 if(member.consent.required)return {kind:'consent-required',member};
 return {kind:'signed-in',member};
}

export function stateFromError(error:unknown):MemberViewState{
 if(!(error instanceof StarryIdError))return {kind:'unavailable'};
 switch(error.action){
  case 'sign-in':case 'refresh':return {kind:'signed-out',notice:'登入已過期，請重新登入。'};
  case 'retry-sign-in':return {kind:'signed-out',notice:'登入驗證未完成，請再試一次。'};
  case 'suspended':return {kind:'suspended'};
  case 'pending-deletion':return {kind:'pending-deletion',purgeAt:null};
  case 'maintenance':return {kind:'maintenance'};
  case 'retry-later':return {kind:'signed-out',notice:'操作太頻繁，請稍後再試。'};
  default:return {kind:'unavailable'};
 }
}

