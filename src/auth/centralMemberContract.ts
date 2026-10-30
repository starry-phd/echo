/**
 * Starry central ID canonical public profile contract (offline-only).
 *
 * The ONLY authority is the Starry central member API, not Echo D1, local
 * storage, legacy users/auth_sessions or the H-Global central service.
 * Parsed data is not proof of authentication; that must be verified by
 * the central API's actual authenticated Session / issuer / audience gates.
 *
 * Source: 最新開發技術規範 v1.0 / UP-13 / §6.1, 2026-10-30.
 * The source central OpenAPI is still DRAFT and health-only. Until a
 * versioned, actually deployed contract exists, never use this parser as
 * evidence that login, sync or member privileges are working.
 */
export type CentralMemberMe={
 s_user_id:string;
 display_name:string;
 directory_opt_in:boolean;
 display_name_public:boolean;
 profile_revision:number;
};
const fieldNames=['s_user_id','display_name','directory_opt_in','display_name_public','profile_revision'];
const isRecord=(value:unknown):value is Record<string,unknown> =>
 typeof value==='object'&&value!==null&&!Array.isArray(value)&&
 (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);

export function parseCentralMemberMe(value:unknown):CentralMemberMe{
 if(!isRecord(value))throw new Error('Starry central profile must be a JSON object');
 const actual=Object.keys(value);
 if(actual.length!==fieldNames.length||actual.some(key=>!fieldNames.includes(key)))
  throw new Error('Starry central profile must contain only the canonical five fields');
 const id=value.s_user_id;
 if(typeof id!=='string'||id.length<1||id.length>128||id.trim()!==id||
    /[\s@]/.test(id))
  throw new Error('Invalid opaque Starry user ID (never use email as the authority)');
 const display=value.display_name;
 if(typeof display!=='string'||display.length<1||display.length>120||display.trim()!==display)
  throw new Error('Invalid Starry display name');
 if(typeof value.directory_opt_in!=='boolean'||typeof value.display_name_public!=='boolean')
  throw new Error('Starry directory/privacy settings must be booleans');
 if(!Number.isSafeInteger(value.profile_revision)||typeof value.profile_revision!=='number'||
    value.profile_revision<1||value.profile_revision>Number.MAX_SAFE_INTEGER-1)
  throw new Error('Invalid Starry profile revision');
 return Object.freeze({
  s_user_id:id,display_name:display,
  directory_opt_in:value.directory_opt_in,
  display_name_public:value.display_name_public,
  profile_revision:value.profile_revision
 });
}
