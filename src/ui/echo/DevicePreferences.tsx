import {createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import type {PropsWithChildren} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createDevicePreferenceStore} from './devicePreferenceStore';

type Store=ReturnType<typeof createDevicePreferenceStore>;
const Context=createContext<Store|null>(null);
export function DevicePreferencesProvider({children}:PropsWithChildren){
 const [store]=useState(()=>createDevicePreferenceStore(AsyncStorage));
 useEffect(()=>{void store.hydrate();},[store]);
 return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useDevicePreferences(){
 const store=useContext(Context);
 if(!store)throw new Error('Device preferences provider missing');
 const state=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
 return {...state,toggleFavorite:store.toggleFavorite,dislike:store.dislike,
  restoreHiddenTrack:store.restoreHiddenTrack,restoreHidden:store.restoreHidden};
}
