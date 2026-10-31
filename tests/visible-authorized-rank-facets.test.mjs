import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visibleAuthorizedRankFacets} from '../src/ui/echo/visibleAuthorizedRankFacets.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

const publicCards=[
 {id:'verified-1',speaker:'張老師',playable:true,legacySnapshot:false,speakerRank:'GAR 創辦人鑽石'},
 {id:'verified-2',speaker:'陳老師',playable:true,legacySnapshot:false,speakerRank:'雙鑽石'},
 {id:'invalid-rank',speaker:'假講師',playable:true,legacySnapshot:false,speakerRank:'a/b'},
];
const guestCards=[
 {id:'guest-1',speaker:'王老師 & 林老師',playable:false,legacySnapshot:true,speakerRank:'創辦人白金'},
 {id:'guest-2',speaker:'小美',playable:false,legacySnapshot:true,speakerRank:'GAR鑽石'},
 {id:'not-allowlisted',speaker:'未知',playable:false,legacySnapshot:false,speakerRank:'皇冠'},
];

test('home rank filters include only approved verified-public and curated guest ranks',()=>{
 const ranks=visibleAuthorizedRankFacets(publicCards,guestCards,[],[]);
 assert.deepEqual(ranks,['雙鑽石','白金','鑽石'].sort((a,b)=>a.localeCompare(b,'zh-Hant')));
 assert.equal(ranks.includes('皇冠'),false);
 assert.equal(ranks.includes('a/b'),false);
});

test('device-hidden speakers and disliked tracks cannot contribute extra rank choices',()=>{
 const ranks=visibleAuthorizedRankFacets(publicCards,guestCards,['verified-2','guest-2'],['林老師']);
 assert.deepEqual(ranks,['鑽石']);
 assert.deepEqual(visibleAuthorizedRankFacets(publicCards,guestCards,
  ['verified-1','verified-2','invalid-rank','guest-1','guest-2'],[]),[]);
 assert.deepEqual(visibleAuthorizedRankFacets([],guestCards,[],['王老師']),
  ['鑽石']);
});

test('same approved ID uses verified-public source before guest and never combines fields',()=>{
 const sameGuest={...guestCards[0],id:'verified-1',speakerRank:'皇冠'};
 const result=visibleAuthorizedRankFacets(publicCards,[sameGuest],[],[]);
 assert.deepEqual(result,['雙鑽石','鑽石'].sort((a,b)=>a.localeCompare(b,'zh-Hant')));
 assert.equal(result.includes('皇冠'),false);
});

test('misclassified sources and malicious rank labels fail closed',()=>{
 const forgedGuest={id:'forged',speaker:'X',playable:true,legacySnapshot:true,speakerRank:'皇冠'};
 const forgedPublic={id:'unverified',speaker:'X',playable:false,legacySnapshot:false,speakerRank:'皇冠'};
 assert.deepEqual(visibleAuthorizedRankFacets([forgedPublic],[forgedGuest],[],[]),[]);
 assert.deepEqual(visibleAuthorizedRankFacets([{...publicCards[0],speakerRank:'\n鑽石'}],[],[],[]),[]);
 assert.deepEqual(visibleAuthorizedRankFacets([],[],[],[]),[]);
});

test('homepage ranks follow authorized API sources and preference hydration, not private saved IDs',()=>{
 const home=read('app/index.tsx');
 assert.match(home,/visibleAuthorizedRankFacets\(\s*verifiedPublicTracks,previewsQuery\.data\?\?\[\],dislikedIds,hiddenSpeakers/);
 assert.match(home,/const ranks=ready\?approvedRanks:\[\]/);
 assert.match(home,/getPublicTracks\(signal,/);
 assert.match(home,/getGuestPreviewTracks\(signal\)/);
 assert.match(home,/<AdvancedCardFilters ranks=\{ranks\}/);
 assert.doesNotMatch(home,/const ranks=ready\?guestFacets\.ranks:\[\]/);
 const facets=read('src/ui/echo/visibleAuthorizedRankFacets.ts');
 assert.match(facets,/approvedVerifiedSpeakerRank\(card\)/);
 assert.match(facets,/approvedGuestSpeakerRank\(card\)/);
 assert.match(facets,/isLocallyHiddenCard\(card,dislikedIds,hiddenSpeakers\)/);
 assert.doesNotMatch(facets,/R2\.get|localStorage|SELECT |privateTrack|memberProfile/);
});
