/**
 * From the original yukidu/Echo-Starry/src/components/DetailView.tsx
 * local formatChineseDate() implementation (around line 482).
 * This is the DETAIL date style, intentionally distinct from the
 * timezone-aware speaker recordings list format.
 */
export function formatLegacyDetailChineseDate(value?:string|null):string{
 const raw=String(value||'').trim();
 if(!raw)return '';
 const match=raw.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
 if(!match)return raw;
 return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}
