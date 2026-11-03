// Pure helpers for scripts/a11y-audit-production.mjs (unit-tested without a browser).
export const IMPACTS=['minor','moderate','serious','critical'];

export function summarizeViolations(violations){
 return violations.map(v=>({id:v.id,impact:v.impact??'minor',help:v.help,nodes:v.nodes.length,
  targets:v.nodes.slice(0,3).map(n=>String(n.target?.[0]??'').slice(0,90))}))
  .sort((a,b)=>IMPACTS.indexOf(b.impact)-IMPACTS.indexOf(a.impact)||a.id.localeCompare(b.id));
}
export function failsThreshold(summary,failOn){
 if(failOn==='none')return false;
 const min=IMPACTS.indexOf(failOn);
 if(min<0)throw Error('ECHO_A11Y_FAIL_ON must be none|'+IMPACTS.join('|'));
 return summary.some(v=>IMPACTS.indexOf(v.impact)>=min);
}
