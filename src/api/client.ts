import type { CatalogResult, EchoTrack } from '../types';

const configuredUrl = process.env.EXPO_PUBLIC_ECHO_API_BASE_URL?.trim();

export function getApiBaseUrl(): string | null {
  if (!configuredUrl) return null;
  try {
    const parsed = new URL(configuredUrl);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return null;
    return parsed.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

export async function getPublicTracks(signal?: AbortSignal): Promise<EchoTrack[]> {
  const origin = getApiBaseUrl();
  if (!origin) throw new Error('新 API 網址尚未設定，音檔清單暫不開放。');
  const res = await fetch(origin + '/api/catalog', { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('新系統正在移轉資料，請稍後再查看。');
  const body = (await res.json()) as CatalogResult;
  if (!Array.isArray(body.tracks)) throw new Error('伺服器回傳格式不正確。');
  return body.tracks;
}

export function getPublicStreamUrl(id: string): string | null {
  const base = getApiBaseUrl();
  return base ? base + '/api/tracks/' + encodeURIComponent(id) + '/stream' : null;
}
