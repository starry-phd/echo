import {StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';
import {formatLegacyDetailChineseDate} from './legacyDetailDate';

/** Original DetailView's 「演講資訊與備註」, strictly from public API fields.
 * No uploader, external links, private membership, or old D1 lookup. */
export function LegacyLectureNotes({track}:{track:EchoTrack}){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const description=typeof track.description==='string'?track.description.trim():'';
 const uploadDate=formatLegacyDetailChineseDate(track.uploadDate);
 return <View style={[styles.card,{borderColor:t.border,backgroundColor:t.card}]}>
   <Text style={[styles.heading,{color:t.ink,fontSize:fontSize(17)}]}>演講資訊與備註</Text>
   <Text style={[styles.description,{color:t.ink,fontSize:fontSize(14)}]}>
    {description||'目前沒有經核准公開的演講介紹或備註。'}
   </Text>
   {uploadDate&&<View style={[styles.row,{borderTopColor:t.border}]}>
    <Text style={[styles.meta,{color:t.muted,fontSize:fontSize(12)}]}>上傳日期：</Text>
    <Text style={[styles.meta,{color:t.ink,fontSize:fontSize(12)}]}>{uploadDate}</Text>
   </View>}
   <Text style={[styles.disclaimer,{color:t.muted,fontSize:fontSize(11)}]}>
    上傳者、演講日期、系列及參考資料尚未有經核准公開的欄位，因此不會從舊會員或私人資料推測。
   </Text>
  </View>;
}
const styles=StyleSheet.create({
 card:{borderRadius:17,borderWidth:1,padding:15,gap:10},
 heading:{fontWeight:'900'},
 description:{lineHeight:23},
 row:{flexDirection:'row',flexWrap:'wrap',gap:4,borderTopWidth:1,paddingTop:10},
 meta:{lineHeight:19},
 disclaimer:{fontSize:11,lineHeight:18}
});
