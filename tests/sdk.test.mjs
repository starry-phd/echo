import test from 'node:test';
import assert from 'node:assert/strict';
import {createEchoPublicClient} from '../packages/echo-api-sdk/src/index.ts';

test('SDK emits versioned paths and safely encodes query filters',async()=>{
 const calls=[];
 const fakeFetch=async input=>{calls.push(input instanceof Request ? input.url : String(input));return new Response(JSON.stringify({tracks:[]}),{status:200})};
 const sdk=createEchoPublicClient('https://echo.example.org',fakeFetch);
 assert.deepEqual(await sdk.listTracks(undefined,{query:"喵 & me",category:"勵志"}),[]);
 const u=new URL(calls[0]);
 assert.equal(u.pathname,'/api/v1/catalog');
 assert.equal(u.searchParams.get('q'),'喵 & me');
 assert.equal(u.searchParams.get('category'),'勵志');
 assert.match(sdk.streamUrl('abc/123'),/abc%2F123\/stream$/);
});
test('SDK rejects insecure origin',()=>assert.throws(()=>createEchoPublicClient('http://echo.example.org')));
