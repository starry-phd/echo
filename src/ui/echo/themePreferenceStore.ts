type Storage={getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<unknown>};
export const THEME_PALETTE_KEY='sq_light_palette_v1';
export const THEME_DARK_KEY='echo-ui-dark';
const LEGACY_DARK_KEY='sq_theme_dark';
type ThemePreference={id:string;dark:boolean;ready:boolean;storageError:boolean};

/** Appearance only. No member, audio, authorization or billing data. */
export function createThemePreferenceStore(storage:Storage,paletteIds:readonly string[],random= Math.random){
 const initial:ThemePreference={id:paletteIds[0]??'rose',dark:false,ready:false,storageError:false};
 let state=initial;
 let hydration:Promise<void>|undefined;
 let writes=Promise.resolve();
 let writable=false;
 let selectedPalette=false;
 let selectedDark=false;
 const listeners=new Set<()=>void>();
 const publish=(next:ThemePreference)=>{state=next;listeners.forEach(fn=>fn());};
 const persist=(key:string,value:string)=>{
  if(!writable)return;
  writes=writes.then(async()=>{try{await storage.setItem(key,value);}
   catch{publish({...state,storageError:true});}});
 };
 const setPalette=(id:string)=>{
  if(!paletteIds.includes(id))return;
  selectedPalette=true;publish({...state,id});persist(THEME_PALETTE_KEY,id);
 };
 return {
  getSnapshot:()=>state,
  getServerSnapshot:()=>initial,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  hydrate:()=>hydration??=Promise.all([
   storage.getItem(THEME_PALETTE_KEY),storage.getItem(THEME_DARK_KEY),storage.getItem(LEGACY_DARK_KEY)
  ]).then(([id,dark,legacyDark])=>{
   writable=true;
   publish({...state,id:selectedPalette?state.id:(id&&paletteIds.includes(id)?id:initial.id),
    dark:selectedDark?state.dark:(dark===null?legacyDark==='true':dark==='1'),ready:true});
   // A user choice made during asynchronous native hydration wins over disk.
   if(selectedPalette)persist(THEME_PALETTE_KEY,state.id);
   if(selectedDark)persist(THEME_DARK_KEY,state.dark?'1':'0');
  }).catch(()=>{
   // Keep session choices usable without overwriting unknown stored settings.
   publish({...state,ready:true,storageError:true});
  }),
  setPalette,
  cyclePalette:()=>{
   const other=paletteIds.filter(id=>id!==state.id);
   if(other.length)setPalette(other[Math.min(other.length-1,Math.max(0,Math.floor(random()*other.length)))]);
  },
  toggleDark:()=>{
   selectedDark=true;publish({...state,dark:!state.dark});persist(THEME_DARK_KEY,state.dark?'1':'0');
  },
  flush:()=>writes,
 };
}
