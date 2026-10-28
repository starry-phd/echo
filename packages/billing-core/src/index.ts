/**
 * v1.3 product constraints: only permanent non-consumables and monthly/yearly
 * auto-renew subscriptions. This is a contract ONLY, not a purchase provider.
 * DEV-B/RevenueCat is responsible for transaction and entitlement truth.
 */
export type ProductKind='non-consumable'|'auto-renewable-monthly'|'auto-renewable-yearly';
export type PurchaseOutcome=
  | {kind:'blocked-login-required'}
  | {kind:'blocked-provider-not-ready'}
  | {kind:'allowed-to-start-provider-flow'};

export interface StarryPurchaseIdentity {
  appId: string;
  starryIdVerified: boolean;
}
export interface ProductDefinition {
  productKey: string;
  kind: ProductKind;
  entitlementKey: string;
}
export interface BillingClientContract {
  identifyUser(starryUserId:string):Promise<void>;
  getOfferings():Promise<ReadonlyArray<ProductDefinition>>;
  getEntitlements():Promise<Readonly<Record<string,boolean>>>;
  restorePurchases():Promise<void>;
  logout():Promise<void>;
}

export function evaluatePurchaseGate(
  identity:StarryPurchaseIdentity | null,
  product:ProductDefinition,
  configuredAppId:string,
  providerReady:boolean,
):PurchaseOutcome {
  if(!identity?.starryIdVerified||identity.appId!==configuredAppId) return {kind:'blocked-login-required'};
  if(!providerReady||!product.productKey||!product.entitlementKey) return {kind:'blocked-provider-not-ready'};
  return {kind:'allowed-to-start-provider-flow'};
}
export function removeAdsEntitled(permanent:boolean,subscriptionActive:boolean):boolean {
  // Expiring a subscription must not revoke a permanent no-ads purchase.
  return permanent||subscriptionActive;
}
