import {splitSpeakerNames} from './speakerNames';

/** Device-only speaker hiding. No member identity, legacy API, or media access. */
export const HIDDEN_SPEAKERS_KEY='echo-device-hidden-speakers-v1';
const normalize=(name:string)=>name.normalize('NFKC').replace(/\s+/g,' ').trim();
const key=(name:string)=>normalize(name).replace(/\s+/g,'').toLocaleLowerCase('zh-Hant');
const valid=(name:string)=>name.length>0&&name.length<=80&&!/[\u0000-\u001f\u007f-\u009f]/.test(name);

export function sanitizeHiddenSpeakers(input:unknown):string[]{
 if(!Array.isArray(input))return [];
 const seen=new Set<string>();
 const result:string[]=[];
 for(const item of input){
  if(typeof item!=='string'||item.length>80||!valid(item))continue;
  const name=normalize(item);
  const k=key(name);
  if(!k||seen.has(k))continue;
  seen.add(k);result.push(name);
  if(result.length===100)break;
 }
 return result;
}

/** Match actual names (including both sides of & / ＆), not substrings:
 * hiding 「王小明」 must never hide 「王小明老師」 by accident.
 */
export function isSpeakerHidden(speaker:string,hidden:readonly string[]):boolean{
 const names=new Set(splitSpeakerNames(speaker).map(key));
 if(!names.size)return false;
 return hidden.some(entry=>splitSpeakerNames(entry).some(name=>names.has(key(name))));
}

/** Never redisplay a saved speaker name unless a current, authorized API card
 * has that exact speaker/group name. Stale/revoked names stay only as counts.
 */
export function restorableHiddenSpeakers<T extends {speaker:string}>(
 authorized:readonly T[],hidden:readonly string[]
):string[]{
 const approvedNames=new Set(authorized.map(t=>key(t.speaker)));
 return sanitizeHiddenSpeakers(hidden).filter(name=>approvedNames.has(key(name)));
}
