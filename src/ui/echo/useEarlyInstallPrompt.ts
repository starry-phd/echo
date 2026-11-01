import {useEffect,useState} from 'react';
import {Platform} from 'react-native';
import type {InstallPromptEvent} from './InstallAppButton';

/**
 * The original Web app caches beforeinstallprompt before the hamburger opens.
 * This hook must run in the always-mounted Header, NOT inside its closed Modal.
 * It listens only for browser PWA install lifecycle events; other Header
 * interaction/dismissal remains DOM-free and works on native.
 */
export function useEarlyInstallPrompt(){
 const [earlyInstallPrompt,setEarlyInstallPrompt]=useState<InstallPromptEvent|null>(null);
 const [installedInThisTab,setInstalledInThisTab]=useState(false);
 useEffect(()=>{
  if(Platform.OS!=='web'||typeof window==='undefined')return;
  const capture=(event:Event)=>{
   event.preventDefault();
   // A new install offer is evidence that a previous installation was removed.
   setInstalledInThisTab(false);
   setEarlyInstallPrompt(event as InstallPromptEvent);
  };
  const markInstalled=()=>{
   setEarlyInstallPrompt(null);
   setInstalledInThisTab(true);
  };
  window.addEventListener('beforeinstallprompt',capture);
  window.addEventListener('appinstalled',markInstalled);
  return ()=>{
   window.removeEventListener('beforeinstallprompt',capture);
   window.removeEventListener('appinstalled',markInstalled);
  };
 },[]);
 return {earlyInstallPrompt,installedInThisTab,consumeEarlyPrompt:()=>setEarlyInstallPrompt(null)};
}
