// Pure validation of the static Web shell security headers (public/_headers).
// Switch to 'enforce' together with public/_headers once the visual check reports zero CSP violations.
export const WEB_CSP_MODE='report-only';
export const CSP_DIRECTIVES={
 'default-src':["'self'"],
 'script-src':["'self'"],
 'style-src':["'self'","'unsafe-inline'"],
 'img-src':["'self'",'data:','blob:'],
 'font-src':["'self'",'data:'],
 'connect-src':["'self'"],
 'media-src':["'self'"],
 'manifest-src':["'self'"],
 'worker-src':["'none'"],
 'frame-src':["'none'"],
 'object-src':["'none'"],
 'base-uri':["'self'"],
 'form-action':["'self'"],
 'frame-ancestors':["'none'"]
};
export const FIXED_HEADERS={
 'x-content-type-options':'nosniff',
 'x-frame-options':'DENY',
 'referrer-policy':'strict-origin-when-cross-origin',
 'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
 'cross-origin-opener-policy':'same-origin-allow-popups'
};

export function parseCsp(value){
 const out=new Map();
 for(const part of String(value??'').split(';')){
  const [name,...sources]=part.trim().split(/\s+/).filter(Boolean);
  if(!name)continue;
  if(out.has(name))throw Error('Duplicate CSP directive '+name);
  out.set(name.toLowerCase(),sources);
 }
 return out;
}

/** `get(name)` returns a header value or null; mode is 'report-only' or 'enforce'. */
export function validateSecurityHeaders(get,mode){
 const cspName=mode==='enforce'?'content-security-policy':'content-security-policy-report-only';
 const other=mode==='enforce'?'content-security-policy-report-only':'content-security-policy';
 const csp=get(cspName);
 if(!csp)throw Error('Missing '+cspName);
 if(get(other))throw Error('Unexpected '+other+' while in '+mode+' mode');
 const parsed=parseCsp(csp);
 for(const [name,sources] of Object.entries(CSP_DIRECTIVES)){
  const actual=parsed.get(name);
  if(!actual||actual.join(' ')!==sources.join(' '))throw Error('CSP '+name+' must be '+sources.join(' ')+', got '+(actual?.join(' ')??'missing'));
 }
 for(const name of parsed.keys())if(!(name in CSP_DIRECTIVES))throw Error('Unexpected CSP directive '+name);
 for(const [name,value] of Object.entries(FIXED_HEADERS))
  if(get(name)!==value)throw Error(name+' must be "'+value+'", got "'+get(name)+'"');
 return {mode,directives:parsed.size};
}

/** Parse the Cloudflare `_headers` file block for `/*` into lower-case header pairs. */
export function headersFileRules(text){
 const lines=String(text).split(/\r?\n/).filter(line=>line.trim()&&!line.trim().startsWith('#'));
 const rules=new Map();let current=null;
 for(const line of lines){
  if(!/^\s/.test(line)){current=line.trim();rules.set(current,new Map());continue;}
  if(!current)throw Error('Header outside a path block');
  const i=line.indexOf(':');
  rules.get(current).set(line.slice(0,i).trim().toLowerCase(),line.slice(i+1).trim());
 }
 return rules;
}
