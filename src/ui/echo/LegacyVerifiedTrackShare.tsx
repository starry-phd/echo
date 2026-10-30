import {useEffect,useState} from 'react';
import {Platform,Pressable,Share,StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {getApiBaseUrl} from '../../api/client';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';
import {approvedPublicTrackShareMessage} from './publicTrackSharing';
import {buildApprovedPublicInfoCard,downloadPublicInfoCardPng} from './publicInfoCardExport';

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
 const [exportBusy,setExportBusy]=useState(false);
 useEffect(()=>{setError('');setBusy(false);setExportBusy(false);},[track.id]);
 const message=approvedPublicTrackShareMessage(track,routeId,getApiBaseUrl());
 const infoCard=Platform.OS==='web'?buildApprovedPublicInfoCard(track,routeId,getApiBaseUrl()):null;
 const doShare=async()=>{
  if(!message||busy)return;
  setBusy(true);setError('');
  try{await Share.share({message,title:track.title});}
  catch{setError('此裝置目前無法開啟系統分享，請稍後再試。');}
  finally{setBusy(false);}
 };
 const doExport=()=>{
  if(!infoCard||exportBusy)return;
  setExportBusy(true);setError('');
  try{downloadPublicInfoCardPng(infoCard);}
  catch{setError('此瀏覽器目前無法下載公開資訊圖卡，請改用支援 PNG 下載的 Web 瀏覽器。');}
  finally{setExportBusy(false);}
 };
 return <View style={styles.section}>
  <View style={styles.actions}>
  <Pressable accessibilityRole="button" accessibilityLabel="分享已核准公開的演講錄音頁面"
   accessibilityState={{disabled:!message||busy}} disabled={!message||busy}
   onPress={()=>{void doShare();}}
   style={[styles.action,{borderColor:t.border,backgroundColor:t.card},(!message||busy)&&styles.disabled]}>
   <Text style={[styles.label,{color:t.palette.primary,fontSize:fontSize(14)}]}>
    {busy?'開啟分享中…':'↗ 分享錄音'}
   </Text>
  </Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel="下載已核准公開的演講資訊 PNG 圖卡"
   accessibilityState={{disabled:!infoCard||exportBusy}} disabled={!infoCard||exportBusy}
   onPress={doExport}
   style={[styles.action,{borderColor:t.palette.primary,backgroundColor:t.lightPill},(!infoCard||exportBusy)&&styles.disabled]}>
   <Text style={[styles.label,{color:t.palette.primary,fontSize:fontSize(14)}]}>
    {exportBusy?'產生圖卡中…':'▤ 匯出公開資訊圖卡 PNG'}
   </Text>
  </Pressable>
  </View>
  <Text style={[styles.hint,{color:t.muted,fontSize:fontSize(12)}]}>
   公開資訊圖卡只含已核准的演講欄位，不是舊版含會員心得與知識整理的完整圖卡；目前只支援 Web/PWA 下載 PNG。
  </Text>
  {!message&&<Text style={[styles.hint,{color:t.muted,fontSize:fontSize(12)}]}>
   尚無已核准的公開音檔連結，不能分享私人音訊或訪客預覽卡。
  </Text>}
  {!!error&&<Text accessibilityRole="alert" style={[styles.hint,{color:t.palette.primary,fontSize:fontSize(12)}]}>{error}</Text>}
 </View>;
}
const styles=StyleSheet.create({
 section:{alignItems:'center',paddingVertical:9,gap:8},
 actions:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:9},
 action:{minHeight:48,paddingHorizontal:22,justifyContent:'center',alignItems:'center',borderRadius:13,borderWidth:1},
 label:{fontWeight:'900'},
 hint:{lineHeight:20,textAlign:'center'},
 disabled:{opacity:.5}
});
