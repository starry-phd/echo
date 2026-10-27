import { Platform } from 'react-native';
import type { CatalogResult, EchoTrack } from '../types';

const configuredUrl = process.env.EXPO_PUBLIC_ECHO_API_BASE_URL?.trim();

export function getApiBaseUrl(): string | null {
  if (!configuredUrl) {
    // Expo Web SPA shares the same origin with Cloudflare Workers API.
    if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
    return null;
  }
  try {
    const parsed = new URL(configuredUrl);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return null;
    return parsed.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

export type CatalogFilters = { query?: string; category?: string };

export async function getPublicTracks(signal?: AbortSignal, filters: CatalogFilters = {}): Promise<EchoTrack[]> {
  const origin = getApiBaseUrl();
  if (!origin) throw new Error('新 API 網址尚未設定，音檔清單暫不開放。');
  const params = new URLSearchParams();
  if (filters.query?.trim()) params.set('q', filters.query.trim().slice(0, 100));
  if (filters.category?.trim()) params.set('category', filters.category.trim().slice(0, 80));
  const url = origin + '/api/catalog' + (params.size ? '?' + params.toString() : '');
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('新系統正在移轉資料，請稍後再查看。');
  const body = (await res.json()) as CatalogResult;
  if (!Array.isArray(body.tracks)) throw new Error('伺服器回傳格式不正確。');
  return body.tracks;
}

export async function getCategories(signal?: AbortSignal): Promise<string[]> {
  const base = getApiBaseUrl();
  if (!base) return [];
  const response = await fetch(base + '/api/categories', { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) return [];
  const body = (await response.json()) as {categories?:unknown};
  return Array.isArray(body.categories) ? body.categories.filter((x): x is string => typeof x === 'string') : [];
}

export function getPublicStreamUrl(id: string): string | null {
  const base = getApiBaseUrl();
  return base ? base + '/api/tracks/' + encodeURIComponent(id) + '/stream' : null;
}
