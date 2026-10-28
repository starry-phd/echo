/**
 * Expo SDK 58 requires TypeScript 6, while openapi-typescript 7 requires TS5.
 * Run OpenAPI codegen in an independently installed tool directory. No
 * --legacy-peer-deps, npm force, or expo-doctor exclusion is permitted.
 */
import {existsSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const project=resolve(import.meta.dirname,'..');
const toolDir=join(project,'tools','openapi-codegen');
const packagePath=join(toolDir,'node_modules','openapi-typescript','package.json');
function run(binary,args,cwd=project){
 const result=spawnSync(binary,args,{cwd,stdio:'inherit',shell:false});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
if(!existsSync(packagePath)){
 run(process.platform==='win32'?'npm.cmd':'npm',
  ['install','--prefix',toolDir,'--no-audit','--no-fund','--ignore-scripts']);
}
const manifest=JSON.parse(readFileSync(packagePath,'utf8'));
const command=typeof manifest.bin==='string'?manifest.bin:manifest.bin['openapi-typescript'];
if(!command)throw new Error('OpenAPI tool CLI not found');
const cli=join(toolDir,'node_modules','openapi-typescript',command);
run(process.execPath,[cli,'openapi/echo-public.v1.json','-o','packages/echo-api-sdk/src/generated.ts']);
