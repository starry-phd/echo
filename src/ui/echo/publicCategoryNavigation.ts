/** Only a safe, short category filter may be accepted from a public detail link.
 * This does not authorize any catalog entry: the existing public APIs still
 * determine everything the visitor can see. */
export function categoryFromRoute(value:unknown):string|null{
 if(typeof value!=='string')return null;
 const clean=value.trim().normalize('NFKC');
 if(!clean||clean.length>80||/[\x00-\x1f\x7f<>]/u.test(clean))return null;
 return clean;
}
