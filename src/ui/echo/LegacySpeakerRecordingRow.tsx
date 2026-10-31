import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';
import {formatSpeakerRecordingDate} from './speakerRecordingDate';

/**
 * Exact source shape: old SpeakerProfilePage.tsx "所有錄音" uses a compact
 * title and speaker-rank/date row, NOT a full AudioCard.
 * The extra local-only actions preserve existing card preferences.
 * All track objects must have passed authorizedSpeakerProfileTracks.
 */
export function LegacySpeakerRecordingRow({track,favorite,onSelect,onFavorite,onHide}:{
 track:EchoTrack;favorite:boolean;
 onSelect:()=>void;onFavorite:()=>void;onHide:()=>void;
}){
 const theme=useLegacyTheme();
 const {fontSize}=useFontZoom();
 return <View style={[styles.row,{backgroundColor:theme.card,borderColor:theme.border}]}>
  <Pressable accessibilityRole="button"
   accessibilityLabel={'查看講師錄音：'+track.title}
   onPress={onSelect} style={styles.recording}>
   <Text style={[styles.title,{color:theme.ink,fontSize:fontSize(14)}]}>{track.title}</Text>
   <Text style={[styles.secondary,{color:theme.muted,fontSize:fontSize(12)}]}>
    {track.speakerRank||'公開'} · {formatSpeakerRecordingDate(track.uploadDate)}
   </Text>
  </Pressable>
  <View style={styles.actions}>
   <Pressable accessibilityRole="button" accessibilityLabel={favorite?'取消本裝置收藏':'加入本裝置收藏'}
    onPress={onFavorite} style={styles.action}>
    <Text style={[styles.actionText,{color:theme.palette.primary,fontSize:fontSize(12)}]}>
     {favorite?'取消收藏':'收藏'}
    </Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={'在本裝置隱藏錄音：'+track.title}
    onPress={onHide} style={styles.action}>
    <Text style={[styles.actionText,{color:theme.muted,fontSize:fontSize(12)}]}>隱藏</Text>
   </Pressable>
  </View>
 </View>;
}
const styles=StyleSheet.create({
 row:{width:'100%',borderWidth:1,borderRadius:12,marginBottom:9,paddingVertical:8},
 recording:{minHeight:48,paddingVertical:4,paddingHorizontal:13,justifyContent:'center'},
 title:{fontWeight:'800',lineHeight:22},
 secondary:{marginTop:4,lineHeight:19},
 actions:{flexDirection:'row',justifyContent:'flex-end',gap:8,paddingRight:9},
 action:{minHeight:36,justifyContent:'center',paddingHorizontal:10},
 actionText:{fontWeight:'700'}
});
