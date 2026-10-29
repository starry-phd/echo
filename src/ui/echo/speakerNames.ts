/** Direct parity with old Echo shared/speakers.ts: only & or ＆ separates names. */
export function splitSpeakerNames(input:unknown):string[]{
 const source=String(input??'').trim();
 if(!source)return [];
 const seen=new Set<string>();
 const out:string[]=[];
 for(const raw of source.split(/\s*[&＆]\s*/g)){
  const name=raw.normalize('NFKC').replace(/\s+/g,' ').trim();
  const key=name.replace(/\s+/g,'').toLocaleLowerCase('zh-Hant');
  if(name&&!seen.has(key)){seen.add(key);out.push(name);}
 }
 return out;
}
