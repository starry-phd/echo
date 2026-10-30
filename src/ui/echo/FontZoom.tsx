import {createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import type {PropsWithChildren} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createFontZoomPreferenceStore,scaledFontSize} from './fontZoomPreferenceStore';
type Store=ReturnType<typeof createFontZoomPreferenceStore>;
const Context=createContext<Store|null>(null);
export function FontZoomProvider({children}:PropsWithChildren){
 const [store]=useState(()=>createFontZoomPreferenceStore(AsyncStorage));
 useEffect(()=>{void store.hydrate();},[store]);
 return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useFontZoom(){
 const store=useContext(Context);
 if(!store)throw new Error('FontZoomProvider missing');
 const state=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
 return {...state,increase:store.increase,decrease:store.decrease,
  fontSize:(size:number)=>scaledFontSize(size,state.zoom)};
}
