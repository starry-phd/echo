/** Public-only first-run guide. Legacy browser opt-out remains authoritative. */
export const GUEST_TUTORIAL_KEY='echostars_guest_safe_tutorial_never_remind_v1';
export const LEGACY_TUTORIAL_KEYS=[
 'echostars_home_tutorial_group_never_remind_v2',
 'echostars_home_tutorial_never_remind_v1',
 'echostars_photo_play_tutorial_never_remind_v1',
] as const;

export function isLegacyTutorialOptedOut(read:(key:string)=>string|null):boolean{
 return LEGACY_TUTORIAL_KEYS.some(key=>read(key)==='1');
}

export function shouldShowGuestTutorial({
 catalogReady,preferencesReady,visibleCount,storedOptOut,legacyOptOut,dismissedInRun,
}:{
 catalogReady:boolean;preferencesReady:boolean;visibleCount:number;
 storedOptOut:boolean;legacyOptOut:boolean;dismissedInRun:boolean;
}):boolean{
 return catalogReady&&preferencesReady&&visibleCount>0&&
  !storedOptOut&&!legacyOptOut&&!dismissedInRun;
}
