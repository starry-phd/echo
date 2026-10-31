type CardMetadata={title:string;speaker:string;speakerRank?:string|null;categories:string[];uploadDate?:string|null};
export function baseSpeakerRank(rank:string):string{
 return rank.trim().replace(/^GAR\s*/i,'').replace(/創辦人/g,'').trim();
}
/** Search and rank filters only narrow already-authorized metadata; never grant access. */
export function matchesCardFilters(track:CardMetadata,{query='',category=null,speakerRank=null}:{
 query?:string;category?:string|null;speakerRank?:string|null;
}):boolean{
 if(category&&!track.categories.includes(category))return false;
 if(speakerRank&&baseSpeakerRank(track.speakerRank??'')!==speakerRank)return false;
 // Search suggestions already use NFKC. Normalize the same way when
 // searching CURRENT authorized card metadata; otherwise typing ASCII "AI"
 // finds a full-width "ＡＩ" category suggestion but not the matching card.
 // Keep category/rank chip filters above exact: text normalization does not
 // create a new category, entitlement, or source of results.
 const searchable=(value:string)=>value.normalize('NFKC').toLocaleLowerCase('zh-Hant');
 const fields=[track.title,track.speaker,track.speakerRank??'',...track.categories,track.uploadDate??''].map(searchable);
 return searchable(query).trim().split(/\s+/u).filter(Boolean).every(token=>fields.some(field=>field.includes(token)));
}
