/** Web is per-tab; this must never pretend localStorage or AsyncStorage is cross-App SSO. */
import type {StarryStorage} from './vendor/starry-client';
export function createStarryDeviceSharedStorage():StarryStorage|null{return null;}
