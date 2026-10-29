import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertNoLegacyStagingReference,reviewLegacyStaging} from './legacy-staging-reconciliation.mjs';
if(process.argv.length!==2)throw new Error('This preflight has no database connection or import arguments');
const root=fileURLToPath(new URL('../',import.meta.url));
const snapshot=JSON.parse(readFileSync(new URL('../database/legacy-staging-status.json',import.meta.url),'utf8'));
const review=reviewLegacyStaging(snapshot);
function scan(location){
 for(const entry of readdirSync(location,{withFileTypes:true})){
  const file=join(location,entry.name);
  if(entry.isDirectory())scan(file);
  else if(entry.isFile()&&/\.(?:ts|tsx|js|mjs)$/.test(entry.name))
   assertNoLegacyStagingReference(readFileSync(file,'utf8'),relative(root,file));
 }
}
scan(resolve(root,'worker'));
scan(resolve(root,'src/api'));
console.log(JSON.stringify(review,null,2));
console.log('Offline-only legacy staging guard passed; no database or R2 reads/writes performed.');
