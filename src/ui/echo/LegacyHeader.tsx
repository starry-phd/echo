import {useState} from 'react';
import {router,usePathname} from 'expo-router';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useViewportDimensions} from '../useViewportDimensions';
import {legacyPalettes,useLegacyTheme} from './legacyTheme';
import type {LegacyPalette} from './legacyTheme';
import {visualMetrics} from '../../../packages/ui/src/tokens';
import {viewportLayout} from '../responsive';

export function LegacyHeader(){
 const colors=useLegacyTheme();
 const {width,height}=useViewportDimensions();
 const layout=viewportLayout(width);
 const pathname=usePathname();
 const [open,setOpen]=useState(false);
 const [showColors,setShowColors]=useState(false);
 const go=(path:'/'|'/speaker'|'/profile'|'/favorites'|'/stats')=>{setOpen(false);router.push(path);};
 const activeColor=colors.palette.primary;
 const isHome=pathname==='/';
 const buttons:[string,()=>void][]=[
  ['首頁',()=>go('/')],['排行榜',()=>go('/stats')],['講師作品',()=>go('/speaker')],['我的收藏（本裝置）',()=>go('/favorites')],['個人資料／登入',()=>go('/profile')]
 ];
 return <View style={[styles.outer,{backgroundColor:colors.card,borderBottomColor:colors.border}]}>
   <View style={styles.main}>
     <Pressable accessibilityRole="button" accessibilityLabel="繁星回聲－返回首頁"
       onPress={()=>go('/')} style={styles.brand}>
       <View style={[styles.brandIcon,{backgroundColor:activeColor,shadowColor:activeColor}]}>
         <Text style={styles.mic}>🎙</Text>
       </View>
       <Text numberOfLines={1} style={[styles.brandName,{color:activeColor}]}>繁星回聲</Text>
       {width>=550&&<View style={styles.wave}>
         {[8,13,20,11].map((value,i)=><View key={i}
          style={{height:value,width:3,borderRadius:4,backgroundColor:activeColor,opacity:0.55+i*0.13}}/>)}
       </View>}
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="開啟主選單"
       accessibilityState={{expanded:open}} onPress={()=>setOpen(x=>!x)}
       style={[styles.menuButton,{backgroundColor:colors.dark?'#253145':'#f1f5f9'}]}>
       <Text style={[styles.menuGlyph,{color:colors.ink}]}>{open?'✕':'☰'}</Text>
     </Pressable>
   </View>
   <View style={[styles.quickRow,{borderTopColor:colors.border}]}>
     <Pressable onPress={()=>go('/')} style={styles.quick} accessibilityRole="button">
       <Text style={[styles.quickText,{color:activeColor}]}>{isHome?'⌂ 首頁':'⌂ 返回首頁'}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" onPress={colors.cyclePalette} style={styles.quick}>
       <Text style={[styles.quickText,{color:activeColor}]}>✦ 好心情</Text>
     </Pressable>
     <Pressable accessibilityRole="button" onPress={()=>go('/speaker')} style={styles.quick}>
       <Text style={[styles.quickText,{color:activeColor}]}>♫ 講師作品</Text>
     </Pressable>
     <Pressable accessibilityRole="button" onPress={()=>go('/profile')} style={styles.quick}>
       <Text style={[styles.quickText,{color:activeColor}]}>♙ 會員</Text>
     </Pressable>
   </View>
   {open&&<View style={[
      styles.menuPanel,
      {backgroundColor:colors.card,borderColor:colors.border,maxHeight:Math.max(300,height-160),
       right:10,width:layout.menuWidth}
    ]}>
     <ScrollView contentContainerStyle={styles.menuContents}>
       <Pressable accessibilityRole="button" onPress={()=>go('/profile')} style={[styles.identity,{backgroundColor:colors.lightPill}]}>
         <View style={[styles.avatar,{backgroundColor:activeColor}]}><Text style={styles.avatarText}>♙</Text></View>
         <View style={styles.identityBody}>
           <Text style={[styles.identityName,{color:colors.ink}]}>訪客</Text>
           <Text style={[styles.identitySub,{color:colors.muted}]}>登入繁星中央會員（待串接）</Text>
         </View>
       </Pressable>
       <View style={styles.menuGrid}>
         <Pressable accessibilityRole="button" style={[styles.menuMini,{backgroundColor:colors.lightPill}]} onPress={colors.cyclePalette}>
           <Text style={[styles.menuMiniText,{color:activeColor}]}>✦ 好心情</Text>
         </Pressable>
         <Pressable accessibilityRole="button" style={[styles.menuMini,{backgroundColor:colors.lightPill}]} onPress={()=>go('/')}>
           <Text style={[styles.menuMiniText,{color:activeColor}]}>⌂ 回首頁</Text>
         </Pressable>
       </View>
       <Pressable accessibilityRole="button" accessibilityState={{expanded:showColors}} style={styles.menuItem} onPress={()=>setShowColors(!showColors)}>
         <Text style={[styles.itemLabel,{color:colors.ink}]}>◐　主題顏色　{colors.palette.name}</Text>
         <Text style={[styles.itemArrow,{color:colors.muted}]}>{showColors?'⌃':'⌄'}</Text>
       </Pressable>
       {showColors&&<View style={styles.colorGrid}>
        {legacyPalettes.map((p:LegacyPalette)=><Pressable key={p.id}
          accessibilityLabel={'主題：'+p.name} accessibilityRole="button"
          onPress={()=>colors.setPalette(p.id)} style={styles.colorChoice}>
          <View style={[styles.swatch,{backgroundColor:p.primary,
           borderWidth:p.id===colors.palette.id?3:0,borderColor:colors.dark?'white':'#111'}]}/>
          <Text numberOfLines={1} style={[styles.swatchLabel,{color:colors.muted}]}>{p.name}</Text>
        </Pressable>)}
       </View>}
       <Pressable accessibilityRole="button" style={styles.menuItem} onPress={colors.toggleDark}>
         <Text style={[styles.itemLabel,{color:colors.ink}]}>☾　{colors.dark?'切換淺色模式':'切換深色模式'}</Text>
         <Text style={[styles.itemArrow,{color:colors.muted}]}>›</Text>
       </Pressable>
       {buttons.map(([label,fn])=><Pressable key={label} accessibilityRole="button" style={styles.menuItem} onPress={fn}>
         <Text style={[styles.itemLabel,{color:colors.ink}]}>◈　{label}</Text>
         <Text style={[styles.itemArrow,{color:colors.muted}]}>›</Text>
       </Pressable>)}
       {['通知','我的貼紙','音檔管理'].map(label=><View key={label} style={styles.menuItem}>
         <Text style={[styles.itemLabel,{color:colors.muted}]}>◇　{label}</Text>
         <Text style={[styles.comingSoon,{color:colors.muted}]}>待移植</Text>
       </View>)}
       <Text style={[styles.note,{color:colors.muted}]}>會員與管理功能待中央 API 驗收，不沿用舊帳號權限。</Text>
     </ScrollView>
   </View>}
 </View>;
}
const styles=StyleSheet.create({
 outer:{zIndex:100,borderBottomWidth:1,shadowColor:'#c13f6f',shadowOffset:{width:0,height:4},shadowOpacity:.08,shadowRadius:18,elevation:3},
 main:{height:visualMetrics.headerHeight,maxWidth:832,width:'100%',alignSelf:'center',paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 brand:{flexDirection:'row',alignItems:'center',gap:9,flex:1},
 brandIcon:{width:38,height:38,borderRadius:14,justifyContent:'center',alignItems:'center',shadowOpacity:.20,shadowRadius:12},
 mic:{fontSize:23,color:'#fff',lineHeight:27},
 brandName:{fontSize:21,fontWeight:'900',letterSpacing:1},
 wave:{flexDirection:'row',alignItems:'center',gap:3,height:22,marginLeft:3},
 menuButton:{height:42,width:44,borderRadius:13,justifyContent:'center',alignItems:'center'},
 menuGlyph:{fontSize:23,fontWeight:'700'},
 quickRow:{height:visualMetrics.headerActionsHeight,width:'100%',maxWidth:832,alignSelf:'center',borderTopWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:5},
 quick:{paddingHorizontal:7,paddingVertical:6},quickText:{fontSize:12,fontWeight:'800'},
 menuPanel:{position:'absolute',top:visualMetrics.headerHeight+visualMetrics.headerActionsHeight,right:10,width:310,borderWidth:1,borderRadius:16,overflow:'hidden',shadowColor:'#111827',shadowOpacity:.18,shadowRadius:25,elevation:15},
 menuContents:{padding:12,gap:7},
 identity:{flexDirection:'row',alignItems:'center',borderRadius:13,padding:12,gap:10},
 avatar:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},
 avatarText:{fontSize:21,color:'#fff'},identityBody:{flex:1},identityName:{fontSize:17,fontWeight:'900'},identitySub:{fontSize:11,marginTop:3},
 menuGrid:{flexDirection:'row',gap:8},menuMini:{flex:1,padding:12,borderRadius:11,alignItems:'center'},menuMiniText:{fontSize:13,fontWeight:'900'},
 menuItem:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:43,paddingHorizontal:10,borderRadius:10},
 itemLabel:{fontWeight:'700',fontSize:14},itemArrow:{fontSize:22},comingSoon:{fontSize:11},
 colorGrid:{flexDirection:'row',flexWrap:'wrap',gap:5,justifyContent:'space-around'},
 colorChoice:{width:'22%',alignItems:'center',marginVertical:5},
 swatch:{width:27,height:27,borderRadius:14},swatchLabel:{fontSize:9,marginTop:3},
 note:{fontSize:11,lineHeight:17,marginTop:5}
});
