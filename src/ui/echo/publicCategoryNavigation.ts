/** Only a safe, short category filter may be accepted from a public detail link.
 * This does not authorize any catalog entry: the existing public APIs still
 * determine everything the visitor can see. */
export function categoryFromRoute(value:unknown):string|null{
 // Reject dangerous raw bytes BEFORE trim, which would silently discard
 // leading/trailing tabs or newlines and turn a malformed route into a valid one.
 if(typeof value!=='string'||/[\x00-\x1f\x7f<>]/u.test(value))return null;
 const clean=value.trim();
 if(!clean||clean.length>80)return null;
 return clean;
}
