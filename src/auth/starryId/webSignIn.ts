/**
 * Web-only Google Identity Services and Sign in with Apple JS (integration guide §11.2a).
 * Scripts are injected ONLY when the member panel is shown with Starry ID enabled;
 * the public site never loads third-party login scripts otherwise.
 */
export const STARRY_GOOGLE_WEB_CLIENT_ID='529568041037-j9gd4baq8k239qv7an2f53rh3srbgtnm.apps.googleusercontent.com';
export const STARRY_APPLE_WEB_SERVICES_ID='phd.starry.id.web';
/** Must match Starry ID `web_origins` and the Apple Services ID return URL exactly. */
export const APP_WEB_ORIGIN='https://echo-starry.starry-phd.workers.dev';
export const APPLE_WEB_REDIRECT_URI=APP_WEB_ORIGIN+'/';
export const GOOGLE_GIS_SRC='https://accounts.google.com/gsi/client';
export const APPLE_JS_SRC='https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

type GoogleCredentialResponse={credential?:string};
type GoogleIdApi={
 initialize(options:{client_id:string;nonce:string;callback:(r:GoogleCredentialResponse)=>void;auto_select?:boolean;
  cancel_on_tap_outside?:boolean;use_fedcm_for_button?:boolean}):void;
 renderButton(parent:HTMLElement,options:Record<string,string|number>):void;
 cancel():void;
};
type AppleAuthApi={
 init(options:{clientId:string;scope:string;redirectURI:string;nonce:string;usePopup:boolean;state?:string}):void;
 signIn():Promise<{authorization?:{id_token?:string;code?:string}}>;
};
type BrowserGlobals={google?:{accounts?:{id?:GoogleIdApi}};AppleID?:{auth?:AppleAuthApi}};

const scriptLoads=new Map<string,Promise<void>>();

function browser():{doc:Document;win:Window&BrowserGlobals}|null{
 if(typeof window==='undefined'||typeof document==='undefined')return null;
 return {doc:document,win:window as Window&BrowserGlobals};
}

/** Apple web sign-in only works on the registered origin (not localhost previews). */
export function appleWebSignInSupported(origin:string|null|undefined):boolean{
 return origin===APP_WEB_ORIGIN;
}

export function loadScriptOnce(src:string):Promise<void>{
 if(src!==GOOGLE_GIS_SRC&&src!==APPLE_JS_SRC)return Promise.reject(new Error('Script not allow-listed'));
 const env=browser();
 if(!env)return Promise.reject(new Error('Not in a browser'));
 const existing=scriptLoads.get(src);
 if(existing)return existing;
 const promise=new Promise<void>((resolve,reject)=>{
  const script=env.doc.createElement('script');
  script.src=src;script.async=true;script.defer=true;script.crossOrigin='anonymous';
  script.referrerPolicy='strict-origin-when-cross-origin';
  script.onload=()=>resolve();
  script.onerror=()=>{scriptLoads.delete(src);reject(new Error('Failed to load '+src));};
  env.doc.head.appendChild(script);
 });
 scriptLoads.set(src,promise);
 return promise;
}

/** Renders Google's own button into `container`; resolves each credential through `onIdToken`. */
export async function renderGoogleButton(container:HTMLElement,nonce:string,onIdToken:(idToken:string)=>void):Promise<void>{
 await loadScriptOnce(GOOGLE_GIS_SRC);
 const api=browser()?.win.google?.accounts?.id;
 if(!api)throw new Error('Google Identity Services unavailable');
 api.initialize({client_id:STARRY_GOOGLE_WEB_CLIENT_ID,nonce,auto_select:false,cancel_on_tap_outside:true,
  callback:response=>{if(typeof response.credential==='string'&&response.credential)onIdToken(response.credential);}});
 container.innerHTML='';
 api.renderButton(container,{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'pill',
  locale:'zh-TW',width:Math.min(320,Math.max(200,container.clientWidth||280))});
}

export function cancelGooglePrompt():void{
 try{browser()?.win.google?.accounts?.id?.cancel();}catch{/* not loaded */}
}

/** Opens Apple's popup; returns the ID token, code and the exact redirect_uri Starry needs. */
export async function signInWithAppleWeb(nonce:string):Promise<{idToken:string;code:string|null;redirectUri:string}>{
 await loadScriptOnce(APPLE_JS_SRC);
 const api=browser()?.win.AppleID?.auth;
 if(!api)throw new Error('Sign in with Apple JS unavailable');
 api.init({clientId:STARRY_APPLE_WEB_SERVICES_ID,scope:'email',redirectURI:APPLE_WEB_REDIRECT_URI,nonce,usePopup:true});
 const result=await api.signIn();
 const idToken=result.authorization?.id_token;
 if(typeof idToken!=='string'||!idToken)throw new Error('Apple returned no ID token');
 const code=result.authorization?.code;
 return {idToken,code:typeof code==='string'&&code?code:null,redirectUri:APPLE_WEB_REDIRECT_URI};
}
