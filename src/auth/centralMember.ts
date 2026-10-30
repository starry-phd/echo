/**
 * Echo consumer adapter for the ONE Starry central profile authority.
 * The official central API is DRAFT / health-only, so authenticated member
 * access must fail closed until actual signed/verified integration is ready.
 * Do not populate a fake profile from legacy Echo users, Echo D1 or local state.
 */
import type {CentralMemberMe} from './centralMemberContract';
export {parseCentralMemberMe} from './centralMemberContract';

export type CentralMemberProfile=CentralMemberMe;
export type CentralMemberApiState='not-configured'|'contract-pending';

export function centralMemberApiState():CentralMemberApiState{
 return process.env.EXPO_PUBLIC_STARRY_ID_API_BASE_URL?.trim()
  ?'contract-pending':'not-configured';
}

export async function getCentralMemberProfile():Promise<CentralMemberProfile>{
 throw new Error('繁星中央會員尚未正式發布可信登入與本人資料 API；不可由舊會員資料或本地狀態假冒登入成功。');
}
