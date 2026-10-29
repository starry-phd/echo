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
 const fields=[track.title,track.speaker,track.speakerRank??'',...track.categories,track.uploadDate??''].map(x=>x.toLowerCase());
 return query.trim().toLowerCase().split(/\s+/u).filter(Boolean).every(token=>fields.some(field=>field.includes(token)));
}
