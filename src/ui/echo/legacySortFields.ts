import type {SortOrder} from './cardSorting';

/**
 * Source of truth: yukidu/Echo-Starry/src/App.tsx current main, v3.7.
 * Portrait phone: the original hides 評價/按讚 but keeps the other five.
 * Permission and sticker ranking require approved entitlement/cost data,
 * which is NOT available in the public-only Expo catalog; never fabricate it.
 */
export const legacySortFields=['permission','rating','comments','likes','stickers','time','category'] as const;
export type LegacySortField=(typeof legacySortFields)[number];
export const legacySortLabels:Record<LegacySortField,string>={
 permission:'權限',rating:'評價',comments:'心得',likes:'按讚',
 stickers:'貼紙',time:'時間',category:'分類'
};
export function visibleLegacySortFields(viewportWidth:number):readonly LegacySortField[]{
 return viewportWidth<600?legacySortFields.filter(field=>field!=='rating'&&field!=='likes'):legacySortFields;
}
export function sortFieldForOrder(order:SortOrder):LegacySortField{
 if(order.startsWith('rating'))return 'rating';
 if(order.startsWith('likes'))return 'likes';
 if(order.startsWith('comments'))return 'comments';
 return 'time';
}
export function isAscendingOrder(order:SortOrder):boolean{
 return order==='oldest'||order.endsWith('-asc');
}
export function nextLegacySortOrder(order:SortOrder,field:LegacySortField):SortOrder|null{
 const base:Partial<Record<LegacySortField,SortOrder>>={
  time:'newest',rating:'rating',likes:'likes',comments:'comments'
 };
 const initial=base[field];
 if(!initial)return null;
 if(sortFieldForOrder(order)!==field)return initial;
 if(field==='time')return order==='newest'?'oldest':'newest';
 const asc=(initial+'-asc') as SortOrder;
 return order===initial?asc:initial;
}
