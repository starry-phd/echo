import {useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {useLegacyTheme} from './legacyTheme';
import {viewportLayout} from '../responsive';
import type {SortOrder} from './cardSorting';
export type {SortOrder} from './cardSorting';
export function LegacyFilterToolbar({categories,category,onCategory,order,onOrder,onNotice,advanced,onAdvanced}:{
 categories:string[];category:string|null;onCategory:(c:string|null)=>void;
 order:SortOrder;onOrder:(value:SortOrder)=>void;onNotice:(s:string)=>void;
 advanced:boolean;onAdvanced:()=>void;
}){
 const {width}=useWindowDimensions(),t=useLegacyTheme();
 const [open,setOpen]=useState<'category'|'popular'|null>(null);
 const layout=viewportLayout(width);
 const fields=[
   {id:'category',label:category??'全部分類',press:()=>setOpen(open==='category'?null:'category')},
   {id:'time',label:order==='oldest'?'最早上架':'最新上架',press:()=>{onOrder(order==='newest'?'oldest':'newest');setOpen(null);}},
   {id:'popular',label:order==='rating'?'評價最高':order==='likes'?'按讚最多':order==='comments'?'心得最多':'熱門推薦',
    press:()=>setOpen(open==='popular'?null:'popular')},
   {id:'advanced',label:'進階篩選',press:()=>{setOpen(null);onAdvanced();}},
 ] as const;
 const options=open==='category'?[{label:'全部分類',action:()=>onCategory(null)},...categories.map(c=>({label:c,action:()=>onCategory(c)}))]:
  open==='popular'?[{label:'評價最高（舊版）',action:()=>onOrder('rating')},
    {label:'按讚最多（舊版）',action:()=>onOrder('likes')},
    {label:'心得最多（舊版）',action:()=>onOrder('comments')},
    {label:'收藏人數（待會員同步）',action:()=>onNotice('收藏人數排序尚未開放。')}]:[];
 return <View style={styles.root}>
   <View style={styles.row}>
     {fields.map((item,i)=><Pressable key={item.id}
       accessibilityRole="button" accessibilityLabel={item.label}
       accessibilityState={{expanded:item.id==='advanced'?advanced:item.id===open,
        selected:item.id==='category'?Boolean(category):item.id==='time'?(order==='newest'||order==='oldest'):item.id==='popular'?['rating','likes','comments'].includes(order):advanced}}
       onPress={item.press}
       style={[styles.button,{backgroundColor:t.palette.primary,borderColor:t.palette.primaryHover,
         paddingHorizontal:layout.phone?2:7},(item.id===open)&&styles.active]}>
       <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.buttonText,{fontSize:layout.filterFontSize}]}>
         {item.label}{(i===0||i===3)?' ⌄':''}
       </Text>
     </Pressable>)}
   </View>
   {open&&<View style={[styles.menu,{backgroundColor:t.card,borderColor:t.border}]}>
      <ScrollView nestedScrollEnabled style={{maxHeight:250}} contentContainerStyle={{padding:6}}>
       {options.map((item,i)=><Pressable key={item.label+i} accessibilityRole="button" onPress={()=>{
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
