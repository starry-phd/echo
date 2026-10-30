import {useEffect,useState} from 'react';
import {Pressable,Share,StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {getApiBaseUrl} from '../../api/client';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';
import {approvedPublicTrackShareMessage} from './publicTrackSharing';

/** Original DetailView's 「分享錄音」 action. Only the already verified
 * public-by-ID detail endpoint may supply this track; previews never mount it.
 * Shares a public detail PAGE, never a private media stream or legacy ID. */
export function LegacyVerifiedTrackShare({track,routeId}:{
 track:EchoTrack;routeId:string|null;
}){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{setError('');setBusy(false);},[track.id]);
 const message=approvedPublicTrackShareMessage(track,routeId,getApiBaseUrl());
 const doShare=async()=>{
  if(!message||busy)return;
  setBusy(true);setError('');
  try{await Share.share({message,title:track.title});}
  catch{setError('此裝置目前無法開啟系統分享，請稍後再試。');}
  finally{setBusy(false);}
 };
 return <View style={styles.section}>
  <Pressable accessibilityRole="button" accessibilityLabel="分享已核准公開的演講錄音頁面"
   accessibilityState={{disabled:!message||busy}} disabled={!message||busy}
   onPress={()=>{void doShare();}}
   style={[styles.action,{borderColor:t.border,backgroundColor:t.card},(!message||busy)&&styles.disabled]}>
   <Text style={[styles.label,{color:t.palette.primary,fontSize:fontSize(14)}]}>
    {busy?'開啟分享中…':'↗ 分享錄音'}
   </Text>
  </Pressable>
  {!message&&<Text style={[styles.hint,{color:t.muted,fontSize:fontSize(12)}]}>
   尚無已核准的公開音檔連結，不能分享私人音訊或訪客預覽卡。
  </Text>}
  {!!error&&<Text accessibilityRole="alert" style={[styles.hint,{color:t.palette.primary,fontSize:fontSize(12)}]}>{error}</Text>}
 </View>;
}
const styles=StyleSheet.create({
 section:{alignItems:'center',paddingVertical:9,gap:8},
 action:{minHeight:48,paddingHorizontal:22,justifyContent:'center',alignItems:'center',borderRadius:13,borderWidth:1},
 label:{fontWeight:'900'},
 hint:{lineHeight:20,textAlign:'center'},
 disabled:{opacity:.5}
});
