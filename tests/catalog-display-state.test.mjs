import test from 'node:test';
import assert from 'node:assert/strict';
import {getCatalogDisplayState,hasPartialCatalogFailure} from '../src/ui/echo/catalogDisplayState.ts';

const state=(count=0,failed=false,pending=false)=>({count,failed,pending});

test('the curated metadata endpoint failing is NOT an empty public catalog',()=>{
 assert.equal(getCatalogDisplayState(state(0),state(0,true),0),'failed');
 assert.equal(getCatalogDisplayState(state(0,true),state(0),0),'failed');
 assert.equal(getCatalogDisplayState(state(0,true),state(0,true),0),'failed');
});
test('loading and genuinely empty results have separate screen states',()=>{
 assert.equal(getCatalogDisplayState(state(0,false,true),state(0),0),'loading');
 assert.equal(getCatalogDisplayState(state(0),state(0),0),'empty');
 assert.equal(getCatalogDisplayState(state(0),state(28),0),'empty'); // user filters/hides all
});
test('available metadata can still be used if the public catalog API fails',()=>{
 assert.equal(getCatalogDisplayState(state(0,true),state(28),28),'ready');
 assert.equal(hasPartialCatalogFailure(state(0,true),state(28)),true);
 assert.equal(getCatalogDisplayState(state(1),state(0,true),1),'ready');
 assert.equal(hasPartialCatalogFailure(state(1),state(0,true)),true);
});
test('a fully healthy catalog never signals a partial failure',()=>{
 assert.equal(getCatalogDisplayState(state(0),state(28),28),'ready');
 assert.equal(hasPartialCatalogFailure(state(0),state(28)),false);
});

test('speaker list/profile and device favorites never describe failed API as true absence',()=>{
 const healthyEmpty={pending:false,failed:false,count:0};
 const publicFailed={pending:false,failed:true,count:0};
 const guestFailed={pending:false,failed:true,count:0};
 const approvedSpeakerCards={pending:false,failed:false,count:28};
 assert.equal(getCatalogDisplayState(healthyEmpty,guestFailed,0),'failed');
 assert.equal(getCatalogDisplayState(publicFailed,healthyEmpty,0),'failed');
 assert.equal(getCatalogDisplayState(healthyEmpty,healthyEmpty,0),'empty');
 assert.equal(getCatalogDisplayState(publicFailed,approvedSpeakerCards,3),'ready');
 assert.equal(hasPartialCatalogFailure(publicFailed,approvedSpeakerCards),true);
 assert.equal(getCatalogDisplayState(healthyEmpty,guestFailed,0),'failed');
 assert.equal(getCatalogDisplayState(healthyEmpty,{...approvedSpeakerCards,pending:true},3),'loading');
});
