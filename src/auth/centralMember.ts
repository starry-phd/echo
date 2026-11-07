/**
 * Consumer adapter for the ONE member authority: Starry ID (starry-phd/id).
 * The v1.0 five-field DTO is superseded by `GET /v1/me` (integration guide §8);
 * see src/auth/starryId/. Never populate a member from legacy users, the app's
 * D1 or local state. Only the gated StarryIdProvider can activate login for
 * an explicitly approved staging build; the public production guest shell is disabled.
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
 throw new Error('請透過 Starry ID 的受保護登入流程取得會員資料；不能由舊會員資料、本地狀態或未授權的 API 直接取得身分。');
}
