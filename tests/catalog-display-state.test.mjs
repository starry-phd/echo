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
