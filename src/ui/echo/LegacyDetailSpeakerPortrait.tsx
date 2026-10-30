import {useEffect,useState} from 'react';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {getApiBaseUrl} from '../../api/client';
import {useLegacyTheme} from './legacyTheme';
import {useViewportDimensions} from '../useViewportDimensions';
import {legacyDetailHeroSizing} from './legacyDetailHeroSizing';

/** Faithful round portrait on the original DetailView second-level page.
 * Guest metadata is strictly noninteractive: a portrait is not an audio grant.
 * Verified public playback callers may explicitly provide onPress. */
export function LegacyDetailSpeakerPortrait({track,onPress}:{track:EchoTrack;onPress?:()=>void}){
 const t=useLegacyTheme();
 const viewport=useViewportDimensions();
 const size=legacyDetailHeroSizing(viewport.width).portrait;
 const origin=getApiBaseUrl();
 const path=track.coverUrl;
 const uri=typeof path==='string'&&path.startsWith('/')&&!path.startsWith('//')&&origin
  ?origin+path:null;
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[uri,track.id]);
 const portrait=<View style={[styles.portrait,{width:size,height:size,borderColor:t.palette.primary,
  backgroundColor:t.dark?'#263244':t.lightPill}]}>
  {uri&&!failed?<Image source={{uri}} resizeMode="cover"
   accessibilityLabel={'封面：'+track.speaker} onError={()=>setFailed(true)} style={styles.photo}/>
   :<Text style={[styles.fallback,{color:t.palette.primary}]}>🎙</Text>}
 </View>;
 if(track.playable&&onPress)return <Pressable accessibilityRole="button"
  accessibilityLabel="點擊講者照片切換播放" onPress={onPress}
  style={styles.wrapper}>{portrait}</Pressable>;
 return <View accessibilityLabel={'講者照片：'+track.speaker+'；音檔尚未開放播放'}
  style={styles.wrapper}>{portrait}</View>;
}
const styles=StyleSheet.create({
 wrapper:{alignSelf:'center',marginTop:3,marginBottom:12},
 portrait:{borderWidth:4,borderRadius:999,overflow:'hidden',alignItems:'center',
  justifyContent:'center',shadowColor:'#0f172a',shadowOpacity:.16,shadowRadius:12,elevation:3},
 photo:{width:'100%',height:'100%'},fallback:{fontSize:48}
});
