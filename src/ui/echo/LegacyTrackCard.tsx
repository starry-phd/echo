import {useState} from 'react';
import {router} from 'expo-router';
import {Pressable,Share,StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {getApiBaseUrl} from '../../api/client';
import {useLegacyTheme} from './legacyTheme';

export function LegacyTrackCard({track,onNotice}:{track:EchoTrack;onNotice:(message:string)=>void}){
 const t=useLegacyTheme(),[open,setOpen]=useState(false);
 const go=()=>{setOpen(false);router.push({pathname:'/track/[id]',params:{id:track.id}});};
 const share=async()=>{
  setOpen(false);
  const origin=getApiBaseUrl();
  if(!origin){onNotice('尚未設定公開分享網址。');return;}
  try{await Share.share({message:track.title+' · '+track.speaker+'\n'+origin+'/track/'+encodeURIComponent(track.id)});}
  catch{onNotice('目前裝置無法使用系統分享，可由瀏覽器複製本頁網址。');}
 };
 const duration=Math.max(0,Math.floor(track.durationSeconds));
 return <View style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
   <Pressable onPress={go} accessibilityRole="button"
    accessibilityLabel={'查看音檔：'+track.title}
    style={styles.body}>
     <View style={styles.mediaSide}>
       <View style={[styles.portrait,{backgroundColor:t.dark?'#344052':'#f8e6ed'}]}>
         <Text style={[styles.portraitIcon,{color:t.palette.primary}]}>🎙</Text>
         <View style={styles.rewardBar}><Text style={styles.rewardText}>音檔已核准公開</Text></View>
         <View style={styles.permissionBar}><Text style={styles.permissionText}>公開</Text></View>
       </View>
       <Text style={[styles.duration,{color:t.muted}]}>◷ {Math.floor(duration/60)}:{String(duration%60).padStart(2,'0')}</Text>
     </View>
     <View style={styles.details}>
       <Text numberOfLines={2} style={[styles.title,{color:t.ink}]}>{track.title}</Text>
       <Text numberOfLines={1} style={[styles.speaker,{color:t.ink}]}>{track.speaker}</Text>
       <View style={styles.tags}>
         {track.categories.slice(0,3).map((c,i)=><View key={i}
          style={[styles.tag,{backgroundColor:t.lightPill,borderColor:t.border}]}>
          <Text numberOfLines={1} style={[styles.tagText,{color:t.palette.primary}]}>{c}</Text>
         </View>)}
       </View>
       <View style={[styles.stats,{borderTopColor:t.border}]}>
         <Text style={styles.stars}>☆☆☆☆☆</Text>
         <Text style={[styles.pendingStats,{color:t.muted}]}>評價待同步</Text>
         <View style={styles.statRow}>
           <Text style={[styles.stat,{color:t.muted}]}>▤ 心得 —</Text>
           <Text style={[styles.stat,{color:t.muted}]}>♡ 按讚 —</Text>
         </View>
       </View>
     </View>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel="更多功能"
    accessibilityState={{expanded:open}} onPress={()=>setOpen(o=>!o)}
    style={[styles.more,{backgroundColor:t.card,borderColor:t.border}]}>
      <Text style={[styles.moreText,{color:t.muted}]}>⋮</Text>
   </Pressable>
   {open&&<View style={[styles.popup,{backgroundColor:t.card,borderColor:t.border}]}>
     <Pressable style={styles.popupRow} onPress={()=>void share()}>
       <Text style={[styles.popupText,{color:t.ink}]}>⇧　分享音檔</Text>
     </Pressable>
     <Pressable style={styles.popupRow} onPress={go}>
       <Text style={[styles.popupText,{color:t.ink}]}>ⓘ　詳細內容</Text>
     </Pressable>
     <Pressable style={styles.popupRow} onPress={()=>{
       setOpen(false);onNotice('我的收藏需先完成繁星中央會員認證，目前不會假裝收藏成功。');
     }}>
       <Text style={[styles.popupText,{color:t.ink}]}>♧　加入收藏</Text>
     </Pressable>
   </View>}
 </View>;
}
const styles=StyleSheet.create({
 card:{width:'100%',borderRadius:21,borderWidth:1,marginBottom:12,minHeight:162,
 shadowColor:'#0f172a',shadowOffset:{width:0,height:7},shadowRadius:16,shadowOpacity:.075,elevation:2},
 body:{flexDirection:'row',padding:11,gap:13,flex:1},
 mediaSide:{width:112,alignItems:'center',flexShrink:0},
 portrait:{height:112,width:112,borderRadius:16,overflow:'hidden',justifyContent:'center',alignItems:'center'},
 portraitIcon:{fontSize:47},
 rewardBar:{position:'absolute',left:0,right:0,top:0,backgroundColor:'rgba(15,23,42,.62)',alignItems:'center',paddingVertical:3},
 rewardText:{color:'#fff',fontWeight:'800',fontSize:9},
 permissionBar:{position:'absolute',left:0,right:0,bottom:0,backgroundColor:'rgba(15,23,42,.62)',alignItems:'center',paddingVertical:5},
 permissionText:{color:'#fff',fontWeight:'900',fontSize:10},
 duration:{fontSize:11,fontWeight:'600',marginTop:5},
 details:{flex:1,minWidth:0,paddingRight:23},
 title:{fontSize:17,fontWeight:'900',lineHeight:23},
 speaker:{fontSize:14,fontWeight:'700',marginTop:5},
 tags:{flexDirection:'row',gap:4,marginTop:8,flexWrap:'wrap'},
 tag:{paddingHorizontal:7,paddingVertical:3,borderRadius:20,borderWidth:1,maxWidth:'40%'},
 tagText:{fontSize:9,fontWeight:'700'},
 stats:{marginTop:'auto',paddingTop:7,borderTopWidth:1},
 stars:{color:'#fbbf24',fontSize:17,letterSpacing:1},
 pendingStats:{fontSize:10,marginTop:1},
 statRow:{flexDirection:'row',gap:13,marginTop:5,flexWrap:'wrap'},stat:{fontSize:11,fontWeight:'700'},
 more:{position:'absolute',right:10,top:10,width:32,height:32,borderWidth:1,borderRadius:17,alignItems:'center',justifyContent:'center'},
 moreText:{fontSize:23,lineHeight:26,fontWeight:'700'},
 popup:{position:'absolute',right:10,top:45,width:162,borderWidth:1,borderRadius:14,padding:5,
 shadowColor:'#111827',shadowOpacity:.17,shadowRadius:13,elevation:9,zIndex:20},
 popupRow:{paddingVertical:11,paddingHorizontal:9},popupText:{fontSize:13,fontWeight:'800'}
});
