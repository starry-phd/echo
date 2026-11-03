/**
 * Consumer adapter for the ONE member authority: Starry ID (starry-phd/id).
 * The v1.0 five-field DTO is superseded by `GET /v1/me` (integration guide §8);
 * see src/auth/starryId/. Never populate a member from legacy users, the app's
 * D1 or local state. Sign-in UI is not released yet, so member access stays closed.
 */
import {resolveStarryIdEnvironment} from './starryId/env';
import type {StarryMember} from './starryId/member';
export {parseStarryMe} from './starryId/member';

export type CentralMemberProfile=StarryMember;
export type CentralMemberApiState='not-configured'|'contract-pending';

/** Only an allow-listed Starry ID origin counts as configured (fail closed otherwise). */
export function centralMemberApiState():CentralMemberApiState{
 return resolveStarryIdEnvironment(process.env.EXPO_PUBLIC_STARRY_ID_API_BASE_URL)
  ?'contract-pending':'not-configured';
}

export async function getCentralMemberProfile():Promise<CentralMemberProfile>{
 throw new Error('本 App 的會員登入尚未開放（繁星中央會員 Starry ID 已上線，App 登入畫面尚未發布）；不可由舊會員資料或本地狀態假冒登入成功。');
}
