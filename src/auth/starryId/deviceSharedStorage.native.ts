/**
 * Native device SSO storage for the official Starry Client.
 *
 * iOS: signed Apps belonging to the same Apple Team must ship the identical
 * keychain-access-groups entitlement; only the opaque starry.sso token is shared.
 * It is not a Refresh Token or service key, and is not copied to app preferences.
 *
 * Android: expo-secure-store is PER APP, not cross-App. A future signed
 * AccountManager/ContentProvider must be installed in all participating Apps.
 * Android device SSO is optional under 2026-11-07.14; it stays disabled until a secure native broker exists.
 */
import {Platform} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type {StarryStorage} from './vendor/starry-client';

// Public signing Team prefix is required by iOS Keychain access-group API. This is not a login key.
const APPLE_PUBLIC_SIGNING_TEAM='4W7QRTXN5Y';
const IOS_SSO_ACCESS_GROUP=APPLE_PUBLIC_SIGNING_TEAM+'.phd.starry.shared';
const IOS_OPTIONS={
 accessGroup:IOS_SSO_ACCESS_GROUP,
 keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
};
const KEY='starry.sso';
export function createStarryDeviceSharedStorage():StarryStorage|null{
 if(Platform.OS!=='ios')return null;
 return {
  get(key){if(key!==KEY)throw new Error('Invalid shared SSO key');return SecureStore.getItemAsync(key,IOS_OPTIONS);},
  set(key,value){if(key!==KEY)throw new Error('Invalid shared SSO key');return SecureStore.setItemAsync(key,value,IOS_OPTIONS);},
  remove(key){if(key!==KEY)throw new Error('Invalid shared SSO key');return SecureStore.deleteItemAsync(key,IOS_OPTIONS);}
 };
}
