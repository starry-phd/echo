/**
 * Starry ID environments this app may talk to (starry-phd/id integration guide §11.4).
 * Exact-match allow-list only: any other value fails closed, so a mistyped or
 * malicious build variable can never receive member tokens.
 */
export const STARRY_ID_APP_ID='echo';

export const STARRY_ID_ENVIRONMENTS={
 production:{baseUrl:'https://id.starry.phd',issuer:'starry-id:production'},
 staging:{baseUrl:'https://starry-id-staging.starry-phd.workers.dev',issuer:'starry-id:staging'}
} as const;

export type StarryIdEnvironmentName=keyof typeof STARRY_ID_ENVIRONMENTS;
export type StarryIdEnvironment={name:StarryIdEnvironmentName;baseUrl:string;issuer:string};

export function resolveStarryIdEnvironment(raw:string|null|undefined):StarryIdEnvironment|null{
 if(typeof raw!=='string')return null;
 const value=raw.trim().replace(/\/+$/,'');
 for(const name of Object.keys(STARRY_ID_ENVIRONMENTS) as StarryIdEnvironmentName[]){
  const env=STARRY_ID_ENVIRONMENTS[name];
  if(value===env.baseUrl)return {name,baseUrl:env.baseUrl,issuer:env.issuer};
 }
 return null;
}

/** Only relative `/v1/...` API paths may carry a bearer token. */
export function starryIdApiUrl(env:StarryIdEnvironment,path:string):string{
 if(typeof path!=='string'||!/^\/v1\/[A-Za-z0-9/_.~%-]*(\?[A-Za-z0-9=&_.~%-]*)?$/.test(path)||path.includes('..'))
  throw new Error('Starry ID path must be a relative /v1/ path');
 return env.baseUrl+path;
}
