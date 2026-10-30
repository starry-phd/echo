import {createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import type {PropsWithChildren} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createQuickActionStore} from './quickActionStore';
type Store=ReturnType<typeof createQuickActionStore>;
const Context=createContext<Store|null>(null);
export function QuickActionProvider({children}:PropsWithChildren){
 const [store]=useState(()=>createQuickActionStore(AsyncStorage));
 useEffect(()=>{void store.hydrate();},[store]);
 return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useQuickActions(){
 const store=useContext(Context);
 if(!store)throw new Error('QuickActionProvider missing');
 const state=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
 return {...state,togglePinned:store.togglePinned,movePinned:store.movePinned};
}
