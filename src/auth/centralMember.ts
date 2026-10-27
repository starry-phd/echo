/**
 * 繁星生態系中央會員 API adapter (待串接)
 *
 * 中央 D1 預定名稱：id-starry；注意資料庫名稱不是 URL。
 * 此 App 不自行存放或修改會員姓名、手機、生日、email 等基本資料。
 * Echo 不直接呼叫 H-Global Auth；跨系實名綁定、同意、雙向資料同步
 * 必須由中央會員服務驗證並執行，不能以 email/電話相同就自動合併。
 */
export type CentralMemberProfile = {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  version: string;
};
export type CentralMemberApiState = 'not-configured' | 'contract-pending';

export function centralMemberApiState(): CentralMemberApiState {
  return process.env.EXPO_PUBLIC_STARRY_ID_API_BASE_URL?.trim()
    ? 'contract-pending'
    : 'not-configured';
}

export async function getCentralMemberProfile(): Promise<CentralMemberProfile> {
  throw new Error('中央會員 API 契約尚未完成，不得使用舊會員資料冒充登入成功。');
}
