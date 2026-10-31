import {createContext,useCallback,useContext,useMemo,useState} from 'react';
import type {PropsWithChildren} from 'react';

type HomeResetSignal={revision:number;requestReset:()=>void;dismissSearchRevision:number;requestDismissSearch:()=>void};
const HomeResetContext=createContext<HomeResetSignal|null>(null);

/** Do not assume navigating to the current '/' route remounts CatalogScreen. */
export function HomeResetProvider({children}:PropsWithChildren){
 const [revision,setRevision]=useState(0);
 const [dismissSearchRevision,setDismissSearchRevision]=useState(0);
 const requestReset=useCallback(()=>setRevision(value=>value+1),[]);
 // A header press is outside the CatalogScreen search container, even though
 // header and catalog live in sibling branches of the Expo Router layout.
 const requestDismissSearch=useCallback(()=>setDismissSearchRevision(value=>value+1),[]);
 const signal=useMemo(()=>({revision,requestReset,dismissSearchRevision,requestDismissSearch}),
  [revision,requestReset,dismissSearchRevision,requestDismissSearch]);
 return <HomeResetContext.Provider value={signal}>{children}</HomeResetContext.Provider>;
}
export function useHomeResetSignal():HomeResetSignal{
 const value=useContext(HomeResetContext);
 if(!value)throw new Error('HomeResetProvider is required');
 return value;
}
