import {useEffect,useState} from 'react';
import {Platform,useWindowDimensions} from 'react-native';

const initialWebViewport={width:390,height:844,scale:1,fontScale:1};
/** The static HTML and first Web render must use identical responsive markup. */
export function useViewportDimensions(){
 const dimensions=useWindowDimensions();
 const [mounted,setMounted]=useState(Platform.OS!=='web');
 useEffect(()=>setMounted(true),[]);
 return mounted?dimensions:initialWebViewport;
}
