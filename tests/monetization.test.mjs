import test from 'node:test';
import assert from 'node:assert/strict';
import { canShowAds, showInterstitialIfAllowed, ADS_PROVIDER, ADS_ENABLED } from '../packages/ads-core/src/index.ts';
import {evaluatePurchaseGate,removeAdsEntitled} from '../packages/billing-core/src/index.ts';

test('AdMob selected but Ads disabled with zero requests even for anonymous visitor',()=>{
 assert.equal(ADS_PROVIDER,'google-admob-mediation');
 assert.equal(ADS_ENABLED,false);
 assert.equal(canShowAds({kind:'unknown'}),false);
 assert.equal(canShowAds({kind:'verified',permanentRemoveAds:false,activeSubscriptionRemovesAds:false}),false);
 assert.equal(showInterstitialIfAllowed(),false);
});
test('purchase gate requires an authenticated Starry ID in the same app',()=>{
 const product={productKey:'PERMANENT',entitlementKey:'remove-ads',kind:'non-consumable'};
 assert.deepEqual(evaluatePurchaseGate(null,product,'echo-starry',true),{kind:'blocked-login-required'});
 assert.deepEqual(evaluatePurchaseGate({appId:'another-app',starryIdVerified:true},product,'echo-starry',true),{kind:'blocked-login-required'});
 assert.deepEqual(evaluatePurchaseGate({appId:'echo-starry',starryIdVerified:false},product,'echo-starry',true),{kind:'blocked-login-required'});
 assert.deepEqual(evaluatePurchaseGate({appId:'echo-starry',starryIdVerified:true},product,'echo-starry',false),{kind:'blocked-provider-not-ready'});
});
test('permanent no-ads entitlement remains after subscription expires',()=>{
 assert.equal(removeAdsEntitled(true,false),true);
 assert.equal(removeAdsEntitled(false,true),true);
 assert.equal(removeAdsEntitled(false,false),false);
});
