import {useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {useLegacyTheme} from './legacyTheme';
export type SortOrder='newest'|'oldest';
export function LegacyFilterToolbar({categories,category,onCategory,order,onOrder,onNotice}:{
 categories:string[];category:string|null;onCategory:(c:string|null)=>void;
 order:SortOrder;onOrder:(value:SortOrder)=>void;onNotice:(s:string)=>void;
}){
 const {width}=useWindowDimensions(),t=useLegacyTheme();
 const [open,setOpen]=useState<'category'|'advanced'|null>(null);
 const small=width<375;
 const fields=[
   {id:'category',label:category??'全部分類',press:()=>setOpen(open==='category'?null:'category')},
   {id:'time',label:order==='newest'?'最新上架':'最早上架',press:()=>{onOrder(order==='newest'?'oldest':'newest');setOpen(null);}},
   {id:'popular',label:'熱門推薦',press:()=>{setOpen(null);onNotice('熱門推薦需要原版評價、收藏及心得統計資料，目前尚未完成安全移植。');}},
   {id:'advanced',label:'進階篩選',press:()=>setOpen(open==='advanced'?null:'advanced')},
 ] as const;
 const options=open==='category'?[{label:'全部分類',action:()=>onCategory(null)},...categories.map(c=>({label:c,action:()=>onCategory(c)}))]:
  [{label:'公開音檔',action:()=>onNotice('目前只顯示完成驗證並核准公開的音檔。')},
   {label:'獎銜篩選（待會員權限）',action:()=>onNotice('獎銜篩選須等繁星中央會員與音檔授權完成。')},
   {label:'貼紙排序（待電池服務）',action:()=>onNotice('貼紙資料須由 Starry Battery 正式 API 提供。')}];
 return <View style={styles.root}>
   <View style={styles.row}>
     {fields.map((item,i)=><Pressable key={item.id}
       accessibilityRole="button" accessibilityLabel={item.label}
       accessibilityState={{expanded:item.id===open}}
       onPress={item.press}
       style={[styles.button,{backgroundColor:t.palette.primary,borderColor:t.palette.primaryHover,
         paddingHorizontal:small?2:7},(item.id===open)&&styles.active]}>
       <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.buttonText,{fontSize:small?10:width<600?11:13}]}>
         {item.label}{(i===0||i===3)?' ⌄':''}
       </Text>
     </Pressable>)}
   </View>
   {open&&<View style={[styles.menu,{backgroundColor:t.card,borderColor:t.border}]}>
      <ScrollView nestedScrollEnabled style={{maxHeight:250}} contentContainerStyle={{padding:6}}>
       {options.map((item,i)=><Pressable key={item.label+i} onPress={()=>{
         item.action();setOpen(null);
       }} style={[styles.option,{borderBottomColor:t.border}]}>
         <Text style={[styles.optionText,{color:t.ink}]}>{item.label}</Text>
         {open==='category'&&(category??'全部分類')===item.label&&
         <Text style={{color:t.palette.primary,fontWeight:'900'}}>✓</Text>}
       </Pressable>)}
      </ScrollView>
   </View>}
 </View>;
}
const styles=StyleSheet.create({
 root:{zIndex:20,marginTop:10,marginBottom:5},
 row:{flexDirection:'row',gap:5,padding:4,borderRadius:19,backgroundColor:'#fff',borderWidth:1,borderColor:'#f1e7ea'},
 button:{flex:1,minWidth:0,height:47,borderRadius:14,borderWidth:1,justifyContent:'center',alignItems:'center',
 shadowColor:'#c13f6f',shadowOpacity:.17,shadowRadius:6,elevation:2},
 active:{borderColor:'#fff',borderWidth:2},buttonText:{color:'#fff',fontWeight:'900',textAlign:'center'},
 menu:{position:'absolute',top:57,left:0,right:0,maxWidth:340,borderRadius:14,borderWidth:1,overflow:'hidden',
 shadowColor:'#111',shadowOpacity:.15,shadowRadius:18,elevation:10,zIndex:100},
 option:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:13,borderBottomWidth:StyleSheet.hairlineWidth},
 optionText:{fontSize:13,fontWeight:'700'}
});
