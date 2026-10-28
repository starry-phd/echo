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


test('SDK opens a direct track URL and returns its public metadata',async()=>{
 const calls=[];
 const track={id:'id-101',title:'公開演講',speaker:'講師',description:null,durationSeconds:500,categories:[],playable:true};
 const transport=async request=>{calls.push(request.url);return new Response(JSON.stringify({track}),{status:200})};
 const sdk=createEchoPublicClient('https://echo.example.org',transport);
 const result=await sdk.getTrack('id-101');
 assert.deepEqual(result,track);
 assert.equal(new URL(calls[0]).pathname,'/api/v1/tracks/id-101');
});
test('SDK returns null for a deliberately unavailable track, not private metadata',async()=>{
 const sdk=createEchoPublicClient('https://echo.example.org',async()=>new Response(JSON.stringify({code:'NOT_FOUND'}),{status:404,headers:{'content-type':'application/json'}}));
 assert.equal(await sdk.getTrack('private-track'),null);
});


test('speaker search is URL encoded by generated OpenAPI client',async()=>{
 const requests=[];
 const transport=async input=>{requests.push(input.url);return new Response(JSON.stringify({tracks:[]}),{status:200})};
 const client=createEchoPublicClient('https://echo.example.org',transport);
 await client.listTracks(undefined,{speaker:'講師 & 朋友'});
 assert.equal(new URL(requests[0]).searchParams.get('speaker'),'講師 & 朋友');
});
test('speaker directory uses public versioned endpoint',async()=>{
 const requests=[];
 const transport=async input=>{requests.push(input.url);return new Response(JSON.stringify({speakers:[{name:'講師甲',trackCount:2}]}),{status:200})};
 const sdk=createEchoPublicClient('https://echo.example.org',transport);
 assert.deepEqual(await sdk.listSpeakers(),[{name:'講師甲',trackCount:2}]);
 assert.equal(new URL(requests[0]).pathname,'/api/v1/speakers');
});
