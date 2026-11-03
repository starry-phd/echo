/**
 * Starry ID error envelope `{"error":{"code","message","request_id"}}` and the
 * action the app must take for each code (starry-phd/id docs/fixtures/README.md).
 * `message` is for developers only; UI text is chosen from `code`.
 */
export type StarryIdErrorAction=
 |'refresh'|'sign-in'|'retry-sign-in'|'suspended'|'pending-deletion'|'maintenance'
 |'reauth'|'reload-profile'|'merge-prompt'|'conflict'|'retry-later'|'bad-request'|'fail-closed';

const ACTIONS:Record<string,StarryIdErrorAction>={
 BAD_REQUEST:'bad-request',APP_NOT_FOUND:'fail-closed',CONSENT_VERSION_MISMATCH:'reload-profile',
 UNAUTHORIZED:'refresh',INVALID_TOKEN:'retry-sign-in',INVALID_NONCE:'retry-sign-in',
 INVALID_REFRESH:'sign-in',REFRESH_REUSED:'sign-in',
 ACCOUNT_SUSPENDED:'suspended',ACCOUNT_PENDING_DELETION:'pending-deletion',
 APP_UNAVAILABLE:'maintenance',REAUTH_REQUIRED:'reauth',
 VERSION_CONFLICT:'reload-profile',IDENTITY_IN_USE:'merge-prompt',
 PROVIDER_ALREADY_LINKED:'conflict',CONFLICT:'conflict',PRECONDITION_REQUIRED:'reload-profile',
 RATE_LIMITED:'retry-later',
 AUTH_NOT_CONFIGURED:'fail-closed',PROVIDER_NOT_CONFIGURED:'fail-closed',SERVICE_UNAVAILABLE:'fail-closed'
};

export class StarryIdError extends Error{
 readonly status:number;
 readonly code:string;
 readonly requestId:string|null;
 readonly retryAfterSeconds:number|null;
 readonly action:StarryIdErrorAction;
 readonly body:unknown;
 constructor(status:number,code:string,message:string,requestId:string|null,retryAfterSeconds:number|null,body:unknown){
  super('Starry ID '+status+' '+code+': '+message);
  this.name='StarryIdError';
  this.status=status;this.code=code;this.requestId=requestId;
  this.retryAfterSeconds=retryAfterSeconds;this.body=body;
  this.action=ACTIONS[code]??(status>=500?'fail-closed':'bad-request');
 }
}

function retryAfter(value:string|null|undefined):number|null{
 if(typeof value!=='string'||!/^\d{1,6}$/.test(value.trim()))return null;
 return Number(value.trim());
}

/** Never throws: an unparseable body becomes SERVICE_UNAVAILABLE (fail closed). */
export function parseStarryIdError(status:number,body:unknown,retryAfterHeader?:string|null):StarryIdError{
 const envelope=typeof body==='object'&&body!==null&&!Array.isArray(body)?(body as {error?:unknown}).error:undefined;
 const e=typeof envelope==='object'&&envelope!==null?envelope as Record<string,unknown>:{};
 const code=typeof e.code==='string'&&/^[A-Z][A-Z0-9_]{1,63}$/.test(e.code)?e.code:'SERVICE_UNAVAILABLE';
 const message=typeof e.message==='string'?e.message.slice(0,300):'Unexpected Starry ID response';
 const requestId=typeof e.request_id==='string'?e.request_id.slice(0,80):null;
 return new StarryIdError(Number.isInteger(status)?status:0,code,message,requestId,retryAfter(retryAfterHeader),body);
}
