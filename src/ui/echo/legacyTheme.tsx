import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import type {ReactNode} from 'react';
import {Platform} from 'react-native';
export type LegacyPalette={id:string;name:string;primary:string;primaryHover:string};
const base:LegacyPalette[]=[
 ['rose','經典玫瑰','#c13f6f','#a8325e'],
 ['crimson','緋紅','#b82f3f','#982532'],
 ['vermilion','朱砂紅','#c94b2a','#aa3d21'],
 ['tangerine','橘焰','#d06a16','#ad5610'],
 ['amber','琥珀金','#b47a08','#956506'],
 ['mustard','芥末黃','#9b8616','#7e6d12'],
 ['olive','橄欖綠','#718126','#5d6b1f'],
 ['lime','萊姆綠','#4f922b','#407923'],
 ['forest','森林綠','#2e7d45','#256739'],
 ['emerald','翡翠綠','#16805f','#12694f'],
 ['teal','孔雀青','#0b7e78','#086864'],
 ['cyan','湖水青','#0b8199','#096a7e'],
 ['sky','晴空藍','#2b7bb8','#24669a'],
 ['cobalt','鈷藍','#3a63bd','#30529f'],
 ['indigo','靛青','#5552b5','#454293'],
 ['violet','紫羅蘭','#7048b5','#5c3a96'],
 ['purple','皇家紫','#8b3fa4','#713386'],
 ['magenta','洋紅','#aa367f','#8e2b69'],
 ['fuchsia','桃紫','#bd3ca7','#9e318b'],
 ['hot-pink','亮粉紅','#c7457f','#a63869'],
 ['cocoa','可可棕','#8b5b3f','#744b34'],
 ['copper','赤銅','#a85c32','#8d4b29'],
 ['slate','岩灰藍','#526b82','#43586b'],
 ['charcoal','石墨灰','#5d6570','#4c535c']
].map(([id,name,primary,primaryHover])=>({id,name,primary,primaryHover}));
export const legacyPalettes:readonly LegacyPalette[]=base;
const key='sq_light_palette_v1';
type ThemeState={
  palette:LegacyPalette;dark:boolean;
  bg:string;card:string;ink:string;muted:string;border:string;lightPill:string;
  setPalette:(id:string)=>void;cyclePalette:()=>void;toggleDark:()=>void;
};
const defaultPalette=base[0];
const LegacyContext=createContext<ThemeState|null>(null);
export function LegacyThemeProvider({children}:{children:ReactNode}){
 const [id,setId]=useState('rose');
 const [dark,setDark]=useState(false);
 useEffect(()=>{
   if(Platform.OS!=='web'||typeof window==='undefined')return;
   try{
     const stored=window.localStorage.getItem(key);
     if(stored&&base.some(x=>x.id===stored))setId(stored);
     setDark(window.localStorage.getItem('echo-ui-dark')==='1');
   }catch{/* Browser private mode can deny storage. */}
 },[]);
 const setPalette=(next:string)=>{
   if(!base.some(p=>p.id===next))return;
   setId(next);
   if(Platform.OS==='web'&&typeof window!=='undefined'){
     try{window.localStorage.setItem(key,next);}catch{/* Optional local preference */}
   }
 };
 const toggleDark=()=>{
   setDark(value=>{
     const next=!value;
     if(Platform.OS==='web'&&typeof window!=='undefined'){
       try{window.localStorage.setItem('echo-ui-dark',next?'1':'0');}catch{/* Optional preference */}
     }
     return next;
   });
 };
 const cyclePalette=()=>{
   const index=base.findIndex(p=>p.id===id);
   setPalette(base[(index+1)%base.length].id);
 };
 const value=useMemo<ThemeState>(()=>{
   const current=base.find(p=>p.id===id)||defaultPalette;
   return{
     palette:current,dark,setPalette,cyclePalette,toggleDark,
     bg:dark?'#0d0f17':'#fdf8f9',
     card:dark?'#181c28':'#fff',
     ink:dark?'#f8fafc':'#0f172a',
     muted:dark?'#94a3b8':'#64748b',
     border:dark?'#23293b':'#f1e7ea',
     lightPill:dark?'#2a1b28':'#fae8ed'
   };
 },[id,dark]);
 return <LegacyContext.Provider value={value}>{children}</LegacyContext.Provider>;
}
export function useLegacyTheme():ThemeState{
 const v=useContext(LegacyContext);
 if(!v)throw new Error('LegacyThemeProvider missing');
 return v;
}
