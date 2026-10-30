/**
 * Restricted Echo lucky draw. The original app draws only recordings for
 * which the current user can actually play audio. Echo migration has 112
 * private/copied tracks and no verified-public audio, so fall back to a
 * distinctly labelled metadata-only guest *discovery*, NEVER a player.
 *
 * Callers must supply only the currently visible, authorized API response
 * (after search/category/rank and device dislikes). This pure function does
 * not query R2, storage, legacy D1 or permission bypass endpoints.
 */
export type LuckyCandidate={
 id:string;
 playable:boolean;
 legacySnapshot?:boolean;
 coverUrl?:string|null;
 description?:string|null;
};
export type LuckySelection<T>=
 |{kind:'playable';track:T}
 |{kind:'preview';track:T}
 |{kind:'empty';track:null};

const isApprovedPreview=(item:LuckyCandidate)=>item.playable===false&&
 item.legacySnapshot===true&&item.description===null&&
 typeof item.coverUrl==='string'&&
 /^\/api\/v1\/previews\/[^/?#]+\/cover\?policy=2$/.test(item.coverUrl);

export function chooseSafeLuckyCard<T extends LuckyCandidate>(
 visible:readonly T[],lastPreviewId:string|null=null,random:()=>number=Math.random
):LuckySelection<T>{
 // Only the Worker-verified public catalog should mark an audio track playable.
 const playable=visible.filter(item=>item.playable===true);
 const previews=visible.filter(isApprovedPreview);
 const kind=playable.length?'playable':previews.length?'preview':'empty';
 if(kind==='empty')return {kind:'empty',track:null};
 const all=kind==='playable'?playable:previews;
 // Don't show the exact same guest discovery twice in a row when avoidable.
 const candidates=kind==='preview'&&all.length>1
  ?all.filter(item=>item.id!==lastPreviewId):all;
 const safePool=candidates.length?candidates:all;
 const value=random();
 const index=Math.floor((Number.isFinite(value)?Math.max(0,Math.min(value,0.9999999999999999)):0)*safePool.length);
 return {kind,track:safePool[index]};
}
