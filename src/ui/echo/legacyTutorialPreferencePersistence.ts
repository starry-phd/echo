import {GUEST_TUTORIAL_KEY,LEGACY_TUTORIAL_KEYS} from './legacyGuestTutorialPolicy';

/**
 * Old Echo App.tsx persists opt-out at checkbox change, not at dismissal.
 * The current app's AsyncStorage is authoritative. The original browser
 * localStorage keys are a compatibility mirror, not a reason to claim the
 * primary preference failed after it was already committed.
 */
export type TutorialPreferenceStorage={
 setItem:(key:string,value:string)=>Promise<void>;
 removeItem:(key:string)=>Promise<void>;
};
export type LegacyTutorialPreferenceMirror={
 setItem:(key:string,value:string)=>void;
 removeItem:(key:string)=>void;
};

export async function persistGuestTutorialOptOut(
 optOut:boolean,primary:TutorialPreferenceStorage,mirror?:LegacyTutorialPreferenceMirror
):Promise<{legacySynced:boolean}>{
 if(optOut)await primary.setItem(GUEST_TUTORIAL_KEY,'1');
 else await primary.removeItem(GUEST_TUTORIAL_KEY);
 if(!mirror)return {legacySynced:true};
 try{
  for(const key of LEGACY_TUTORIAL_KEYS){
   if(optOut)mirror.setItem(key,'1');
   else mirror.removeItem(key);
  }
  return {legacySynced:true};
 }catch{
  // Be truthful: primary succeeded, old-browser compatibility may not.
  return {legacySynced:false};
 }
}
