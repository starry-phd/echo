/**
 * v1.3 D-04/Q4=A: Google AdMob Mediation is selected, but live Ads are OFF.
 * This code intentionally imports NO advertising SDK and has no network side effects.
 * Separate per-App owner approval and native/consent tests are mandatory before activation.
 */
export const ADS_PROVIDER = 'google-admob-mediation' as const;
export const ADS_ENABLED = false as const;
export const ADS_SDK_INITIALIZED = false as const;
export const AD_REQUESTS_ENABLED = false as const;

export type AdEntitlementState =
  | {kind: 'verified'; permanentRemoveAds: boolean; activeSubscriptionRemovesAds: boolean}
  | {kind: 'unknown'};

export function canShowAds(entitlements: AdEntitlementState): boolean {
  void entitlements;
  // Explicitly fail closed while this app is not permitted to serve advertisements.
  return false;
}
export function showInterstitialIfAllowed(): false {
  // Never imports or initializes AdMob; guaranteed zero ad requests.
  return false;
}
