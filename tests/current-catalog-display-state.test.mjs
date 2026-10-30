import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {currentCatalogDisplayState,canDrawFromCurrentCatalog} from '../src/ui/echo/currentCatalogDisplayState.ts';

test('a new typed query makes stale results loading until debounce has caught up',()=>{
 assert.equal(currentCatalogDisplayState(true,'new search','old search','ready'),'loading');
 assert.equal(currentCatalogDisplayState(true,'','old search','ready'),'loading');
 assert.equal(currentCatalogDisplayState(true,'new search','new search','loading'),'loading');
 assert.equal(currentCatalogDisplayState(true,'new search','new search','ready'),'ready');
 assert.equal(currentCatalogDisplayState(true,'new search','new search','empty'),'empty');
});

test('device preferences hydration blocks any results even if old API data is cached',()=>{
 assert.equal(currentCatalogDisplayState(false,'','', 'ready'),'loading');
 assert.equal(currentCatalogDisplayState(false,'a','b','failed'),'loading');
});

test('API failure is not hidden by a ready search or treated as an empty catalog',()=>{
 assert.equal(currentCatalogDisplayState(true,'a','a','failed'),'failed');
 assert.equal(canDrawFromCurrentCatalog('failed',false),false);
 assert.equal(canDrawFromCurrentCatalog('loading',false),false);
 assert.equal(canDrawFromCurrentCatalog('ready',false),true);
 assert.equal(canDrawFromCurrentCatalog('ready',true),false);
 assert.equal(canDrawFromCurrentCatalog('empty',false),true);
});

test('home gates all stale card, count and winner displays and the draw button',()=>{
 const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
 assert.match(home,/currentCatalogDisplayState\(ready,query,debouncedQuery,catalogDisplay\)/);
 assert.match(home,/if\(!canDrawFromCurrentCatalog\(currentDisplay,luckyPhase==='spin'\)\)return/);
 assert.match(home,/disabled=\{!canDrawFromCurrentCatalog\(currentDisplay,luckyPhase==='spin'\)\}/);
 assert.match(home,/currentDisplay==='loading'\?<View style=\{styles\.loading\}/);
 assert.match(home,/currentDisplay==='failed'\?<View/);
 assert.match(home,/currentDisplay==='empty'\?<View/);
 assert.match(home,/currentDisplay==='ready'\|\|currentDisplay==='empty'\?visibleTracks\.length:'—'/);
 assert.match(home,/luckyPhase==='win'&&currentDisplay==='ready'&&<View/);
 assert.match(home,/\[query,category,speakerRank,order,visibleFingerprint\]/);
});
