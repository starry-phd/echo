import {useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useViewportDimensions} from '../useViewportDimensions';
import {useLegacyTheme} from './legacyTheme';
import {viewportLayout} from '../responsive';
import {isAscendingOrder,legacySortLabels,nextLegacySortOrder,sortFieldForOrder,visibleLegacySortFields} from './legacySortFields';
import type {LegacySortField} from './legacySortFields';
import type {SortOrder} from './cardSorting';
export type {SortOrder} from './cardSorting';

/**
 * Current original (yukidu/Echo-Starry src/App.tsx) has seven controls on
 * desktop/landscape, five on portrait phones. Never replace those with the
 * superseded v145 four-button toolbar.
 * Rights / stickers are intentionally read-only until authorized APIs exist.
 */
export function LegacyFilterToolbar({categories,category,onCategory,order,onOrder,onNotice,onInteract}:{
 categories:string[];category:string|null;onCategory:(c:string|null)=>void;
 order:SortOrder;onOrder:(value:SortOrder)=>void;onNotice:(s:string)=>void;
 /** Called by every handled toolbar gesture: RN may keep TextInput focused. */
 onInteract?:()=>void;
}){
 const {width}=useViewportDimensions(),t=useLegacyTheme();
 const [categoryOpen,setCategoryOpen]=useState(false);
 const layout=viewportLayout(width);
 const fields=visibleLegacySortFields(width);
 const active=sortFieldForOrder(order);
 const onField=(field:LegacySortField)=>{
  onInteract?.();
  if(field==='category'){setCategoryOpen(value=>!value);return;}
  setCategoryOpen(false);
  const next=nextLegacySortOrder(order,field);
  if(next){onOrder(next);return;}
  onNotice(field==='permission'
   ?'權限排序尚待中央會員與逐曲存取權限 API 正式驗證，暫不提供猜測結果。'
   :'貼紙排序尚待正式貼紙／電池與每曲成本資料，暫不提供猜測結果。');
 };
 return <View style={styles.root}>
  <View style={[styles.row,{backgroundColor:t.card,borderColor:t.border}]}>
   {fields.map(field=>{
    const selected=field===active||field==='category'&&Boolean(category);
    const unavailable=field==='permission'||field==='stickers';
    const label=legacySortLabels[field];
    return <Pressable key={field} accessibilityRole="button"
      accessibilityLabel={label+(unavailable?'（待權限資料）':'')}
      accessibilityHint={unavailable?'目前無可信授權資料，點擊會顯示說明':undefined}
      accessibilityState={{selected,expanded:field==='category'?categoryOpen:undefined}}
      onPress={()=>onField(field)}
      style={[styles.button,{backgroundColor:t.palette.primary,borderColor:selected?'#fff':t.palette.primaryHover,
       opacity:unavailable ? 0.72 : 1,paddingHorizontal:layout.phone?0:4}]}>
       <Text numberOfLines={1} adjustsFontSizeToFit
         style={[styles.buttonText,{fontSize:layout.phone?10:12}]}>{label}</Text>
       {selected&&field!=='category'&&
         <View style={styles.direction}><Text style={[styles.arrow,{color:t.palette.primary}]}>
          {isAscendingOrder(order)?'↑':'↓'}
         </Text></View>}
       {field==='category'&&<Text style={styles.categoryArrow}>⌄</Text>}
    </Pressable>;
   })}
  </View>
  {Boolean(category)&&<Pressable accessibilityRole="button" accessibilityLabel={'目前分類：'+category+'；點擊清除'}
    onPress={()=>{onInteract?.();onCategory(null);}} style={[styles.selectedCategory,{borderColor:t.border,backgroundColor:t.lightPill}]}>
     <Text numberOfLines={1} style={{color:t.palette.primary,fontSize:12,fontWeight:'800'}}>分類：{category}　✕</Text>
   </Pressable>}
  {categoryOpen&&<View style={[styles.menu,{backgroundColor:t.palette.primary,borderColor:t.border,
    width:Math.min(layout.usable,180)}]}>
   <ScrollView nestedScrollEnabled style={{maxHeight:265}} contentContainerStyle={styles.options}>
    {[null,...categories].map(value=><Pressable key={value??'all'}
     accessibilityRole="button" accessibilityLabel={'選擇分類：'+(value??'全部')}
     accessibilityState={{selected:category===value}}
     onPress={()=>{onInteract?.();onCategory(value);setCategoryOpen(false);}} style={styles.option}>
      <Text style={styles.optionText} numberOfLines={2}>{value??'全部分類'}</Text>
      {category===value&&<Text style={styles.optionText}>✓</Text>}
    </Pressable>)}
   </ScrollView>
   <Pressable accessibilityRole="button" accessibilityLabel="關閉分類選單" onPress={()=>{onInteract?.();setCategoryOpen(false);}}
     style={styles.menuClose}><Text style={styles.optionText}>✕　關閉</Text></Pressable>
  </View>}
 </View>;
}
const styles=StyleSheet.create({
 root:{zIndex:20,marginTop:8,marginBottom:5},
 row:{flexDirection:'row',gap:3,padding:2,borderRadius:14,borderWidth:1},
 button:{flex:1,minWidth:0,minHeight:46,borderRadius:11,borderWidth:1,
  flexDirection:'row',justifyContent:'center',alignItems:'center',gap:1,
  shadowColor:'#c13f6f',shadowOpacity:.12,shadowRadius:4,elevation:1},
 buttonText:{color:'#fff',fontWeight:'900',textAlign:'center',flexShrink:1},
 direction:{width:17,height:17,borderRadius:9,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},
 arrow:{fontSize:15,fontWeight:'900',lineHeight:17},
 categoryArrow:{color:'#fff',fontSize:13,fontWeight:'900'},
 selectedCategory:{alignSelf:'flex-end',marginTop:5,borderWidth:1,borderRadius:12,paddingHorizontal:10,minHeight:35,justifyContent:'center'},
 menu:{position:'absolute',top:53,right:0,maxWidth:'100%',borderRadius:13,borderWidth:1,
  overflow:'hidden',shadowColor:'#111827',shadowOpacity:.2,shadowRadius:16,elevation:12,zIndex:100},
 options:{paddingVertical:4},
 option:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',minHeight:42,paddingHorizontal:12,paddingVertical:7},
 optionText:{color:'#fff',fontSize:12,fontWeight:'800',flexShrink:1},
 menuClose:{borderTopWidth:1,borderTopColor:'#ffffff55',minHeight:44,alignItems:'center',justifyContent:'center'}
});
