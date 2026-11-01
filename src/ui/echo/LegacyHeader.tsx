import {useEffect,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {router,usePathname} from 'expo-router';
import {Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useViewportDimensions} from '../useViewportDimensions';
import {legacyPalettes,useLegacyTheme} from './legacyTheme';
import type {LegacyPalette} from './legacyTheme';
import {visualMetrics} from '../../../packages/ui/src/tokens';
import {viewportLayout} from '../responsive';
import {useFontZoom} from './FontZoom';
import {InstallAppButton} from './InstallAppButton';
import {isSelectedPublicMenu} from './mainMenuSelection';
import {useEarlyInstallPrompt} from './useEarlyInstallPrompt';
import {useQuickActions} from './QuickActions';
import {useHomeResetSignal} from './HomeResetSignal';
import {QuickDragHandle} from './QuickDragHandle';
import {headerMenuMaxHeight} from './headerMenuPlacement';
import {allowedQuickActions,isActiveQuickAction,quickDeviceForWidth,quickLimits} from './quickActionStore';
import type {QuickActionId} from './quickActionStore';

export function LegacyHeader(){
 const colors=useLegacyTheme();
 const {zoom,ready:fontReady,increase,decrease,fontSize}=useFontZoom();
 const quick=useQuickActions();
 const queryClient=useQueryClient();
 const {requestReset,requestDismissSearch}=useHomeResetSignal();
 const {width,height}=useViewportDimensions();
 const layout=viewportLayout(width);
 const menuTop=visualMetrics.headerHeight+visualMetrics.headerActionsHeight;
 const quickDevice=quickDeviceForWidth(width);
 const chosenQuickActions=quick.choices[quickDevice];
 const pathname=usePathname();
 const [open,setOpen]=useState(false);
 const [showColors,setShowColors]=useState(false);
 const [quickNotice,setQuickNotice]=useState('');
 const {earlyInstallPrompt,installedInThisTab,consumeEarlyPrompt}=useEarlyInstallPrompt();
 const [draggingQuickId,setDraggingQuickId]=useState<QuickActionId|null>(null);
 const quickEditorOrder=[...chosenQuickActions,
  ...allowedQuickActions.filter(id=>!chosenQuickActions.includes(id))];
 const closeMenu=()=>{setOpen(false);setDraggingQuickId(null);};
 // Window coordinates and the menu's scroll bounds change on resize/rotation.
 useEffect(()=>{setOpen(false);setDraggingQuickId(null);},[width,height]);
 const go=(path:'/'|'/profile'|'/favorites'|'/stats'|'/notifications')=>{
  requestDismissSearch();
  closeMenu();
  if(path==='/'){
   requestReset();
   router.replace('/'); // Clear stale category/rank deep-link parameters.
   return;
  }
  router.push(path);
 };
 // The original Navbar has a distinct "回首頁" shortcut that reloads the
 // catalog, unlike the logo's local filter reset. Revalidate ONLY approved
 // guest/public queries; do not reload the WebView or touch member/private data.
 const refreshApprovedHome=()=>{
  go('/');
  for(const name of ['public-tracks','guest-previews','categories','public-health'] as const){
   void queryClient.invalidateQueries({queryKey:['echo',name],refetchType:'active'});
  }
 };
 const activeColor=colors.palette.primary;
 const buttons:[string,()=>void][]=[
  ['首頁',()=>go('/')],['排行榜',()=>go('/stats')],['通知中心',()=>go('/notifications')],['我的收藏（本裝置）',()=>go('/favorites')],['個人資料／登入',()=>go('/profile')]
 ];
 const quickActions:Record<QuickActionId,{label:string;glyph:string;run:()=>void}>={
  home:{label:'首頁',glyph:'⌂',run:()=>go('/')},
  palette:{label:'好心情',glyph:'✦',run:colors.cyclePalette},
  stats:{label:'排行榜',glyph:'▥',run:()=>go('/stats')},
  favorites:{label:'我的收藏',glyph:'♡',run:()=>go('/favorites')},
  profile:{label:'會員',glyph:'♙',run:()=>go('/profile')},
  theme:{label:colors.dark?'淺色模式':'深色模式',glyph:'◐',run:colors.toggleDark},
  font:{label:'字體',glyph:'A±',run:()=>setOpen(true)}
 };
 const togglePin=(id:QuickActionId)=>{
  const ok=quick.togglePinned(quickDevice,id);
  setQuickNotice(ok?'已更新本裝置快捷列。':('目前最多可放 '+quickLimits[quickDevice]+' 個快捷功能，請先取消一個釘選。'));
 };
 return <View style={[styles.outer,{backgroundColor:colors.card,borderBottomColor:colors.border}]}>
   <View style={styles.main}>
     <Pressable accessibilityRole="button" accessibilityLabel="繁星回聲－返回首頁"
       onPress={()=>go('/')} style={styles.brand}>
       <View style={[styles.brandIcon,{backgroundColor:activeColor,shadowColor:activeColor}]}>
         <Text style={styles.mic}>🎙</Text>
       </View>
       <Text numberOfLines={1} style={[styles.brandName,{color:activeColor,fontSize:fontSize(21)}]}>繁星回聲</Text>
       {width>=550&&<View style={styles.wave}>
         {[8,13,20,11].map((value,i)=><View key={i}
          style={{height:value,width:3,borderRadius:4,backgroundColor:activeColor,opacity:0.55+i*0.13}}/>)}
       </View>}
     </Pressable>
     {!chosenQuickActions.includes('font')&&<View style={styles.fontActions} accessibilityLabel="調整字體大小">
       <Pressable accessibilityRole="button" accessibilityLabel="縮小字體" accessibilityHint="最低100%，每次調整10%"
        accessibilityState={{disabled:!fontReady||zoom<=1}} disabled={!fontReady||zoom<=1}
        onPress={()=>{requestDismissSearch();decrease();}} style={[styles.fontButton,{backgroundColor:colors.lightPill}]}>
        <Text style={[styles.fontButtonText,{color:activeColor}]}>A−</Text>
       </Pressable>
       <Pressable accessibilityRole="button" accessibilityLabel="放大字體" accessibilityHint="最高140%，每次調整10%"
        accessibilityState={{disabled:!fontReady||zoom>=1.4}} disabled={!fontReady||zoom>=1.4}
        onPress={()=>{requestDismissSearch();increase();}} style={[styles.fontButton,{backgroundColor:colors.lightPill}]}>
        <Text style={[styles.fontButtonText,{color:activeColor}]}>A＋</Text>
       </Pressable>
     </View>}
     <Pressable accessibilityRole="button" accessibilityLabel={open?'關閉主選單':'開啟主選單'}
       accessibilityState={{expanded:open}} onPress={()=>{requestDismissSearch();setOpen(x=>!x);}}
       style={[styles.menuButton,{backgroundColor:colors.dark?'#253145':'#f1f5f9'}]}>
       <Text style={[styles.menuGlyph,{color:colors.ink}]}>{open?'✕':'☰'}</Text>
     </Pressable>
   </View>
   <View style={[styles.quickRow,{borderTopColor:colors.border}]}>
    {chosenQuickActions.map(id=>id==='font'?
     <View key={id} style={styles.pinnedFontQuick} accessibilityLabel="置頂字體調整">
      <Pressable accessibilityRole="button" accessibilityLabel="縮小字體" accessibilityHint="最低100%，每次調整10%"
       accessibilityState={{disabled:!fontReady||zoom<=1}} disabled={!fontReady||zoom<=1}
       onPress={()=>{requestDismissSearch();decrease();}} style={[styles.pinnedFontButton,{backgroundColor:colors.lightPill}]}>
       <Text style={[styles.fontButtonText,{color:activeColor}]}>A−</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="放大字體" accessibilityHint="最高140%，每次調整10%"
       accessibilityState={{disabled:!fontReady||zoom>=1.4}} disabled={!fontReady||zoom>=1.4}
       onPress={()=>{requestDismissSearch();increase();}} style={[styles.pinnedFontButton,{backgroundColor:colors.lightPill}]}>
       <Text style={[styles.fontButtonText,{color:activeColor}]}>A＋</Text>
      </Pressable>
     </View>:
     <Pressable key={id} accessibilityRole="button"
     accessibilityLabel={'快捷功能：'+quickActions[id].label}
     accessibilityState={{selected:isActiveQuickAction(id,pathname)}}
     onPress={()=>{requestDismissSearch();quickActions[id].run();}}
      style={[styles.quick,isActiveQuickAction(id,pathname)&&{backgroundColor:colors.lightPill,borderRadius:10}]}>
     <Text numberOfLines={1} adjustsFontSizeToFit
      style={[styles.quickText,{color:activeColor,fontSize:fontSize(12)}]}>
      {quickActions[id].glyph} {quickActions[id].label}
     </Text>
    </Pressable>)}
    {chosenQuickActions.length===0&&<Pressable accessibilityRole="button" accessibilityLabel="設定置頂快捷功能"
      onPress={()=>{requestDismissSearch();setOpen(true);}} style={styles.quick}>
      <Text style={[styles.quickText,{color:activeColor,fontSize:fontSize(12)}]}>＋ 設定快捷功能</Text>
    </Pressable>}
   </View>
   <Modal visible={open} transparent animationType="none" onRequestClose={closeMenu}>
    <View style={styles.menuModalRoot} accessibilityViewIsModal onAccessibilityEscape={closeMenu}>
     {/* A full-screen native/web surface closes on outside touch without
         stealing presses or long-press drag from the later sibling panel. */}
     <Pressable accessibilityRole="button" accessibilityLabel="點選主選單外側關閉"
       onPress={closeMenu} style={styles.menuBackdrop}/>
     <View style={[
       styles.menuPanel,
       {backgroundColor:colors.card,borderColor:colors.border,
        maxHeight:headerMenuMaxHeight(height,menuTop),right:10,width:layout.menuWidth}
     ]}>
     <ScrollView scrollEnabled={draggingQuickId===null} contentContainerStyle={styles.menuContents}>
       <Pressable accessibilityRole="button" accessibilityLabel="關閉主選單"
        onPress={closeMenu} style={styles.menuItem}>
        <Text style={[styles.itemLabel,{color:colors.muted}]}>✕　關閉主選單</Text>
       </Pressable>
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
         <Pressable accessibilityRole="button" accessibilityLabel="回首頁並重新整理公開清單"
           style={[styles.menuMini,{backgroundColor:colors.lightPill}]} onPress={refreshApprovedHome}>
           <Text style={[styles.menuMiniText,{color:activeColor}]}>⌂ 回首頁</Text>
         </Pressable>
       </View>
       <InstallAppButton earlyPrompt={earlyInstallPrompt} onPromptConsumed={consumeEarlyPrompt} installedInThisTab={installedInThisTab}/>
       <Pressable accessibilityRole="button" accessibilityState={{expanded:showColors}} style={styles.menuItem} onPress={()=>setShowColors(!showColors)}>
         <Text style={[styles.itemLabel,{color:colors.ink,fontSize:fontSize(14)}]}>◐　主題顏色　{colors.palette.name}</Text>
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
       <Pressable accessibilityRole="button" style={styles.menuItem}
         onPress={()=>{colors.toggleDark();closeMenu();}}>
         <Text style={[styles.itemLabel,{color:colors.ink}]}>☾　{colors.dark?'切換淺色模式':'切換深色模式'}</Text>
         <Text style={[styles.itemArrow,{color:colors.muted}]}>›</Text>
       </Pressable>
       <View style={[styles.fontMenuRow,{backgroundColor:colors.lightPill}]}>
        <Text style={[styles.itemLabel,{color:colors.ink,fontSize:fontSize(14)}]}>字體大小　{Math.round(zoom*100)}%</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="縮小字體" onPress={decrease}
         disabled={!fontReady||zoom<=1} accessibilityState={{disabled:!fontReady||zoom<=1}} style={styles.fontMenuButton}>
         <Text style={[styles.fontButtonText,{color:activeColor}]}>A−</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="放大字體" onPress={increase}
         disabled={!fontReady||zoom>=1.4} accessibilityState={{disabled:!fontReady||zoom>=1.4}} style={styles.fontMenuButton}>
         <Text style={[styles.fontButtonText,{color:activeColor}]}>A＋</Text>
        </Pressable>
       </View>
       <View style={[styles.quickEditor,{borderColor:colors.border,backgroundColor:colors.lightPill}]}>
        <Text style={[styles.itemLabel,{color:colors.ink,fontSize:fontSize(14)}]}>置頂快捷功能（{chosenQuickActions.length}/{quickLimits[quickDevice]}）</Text>
        <Text style={[styles.quickHint,{color:colors.muted}]}>點選釘選或取消；已釘選項目可長按 ☰ 約0.26秒後上下拖曳，或用 ↑↓ 調整順序。本機保存，不需會員登入。</Text>
        {quick.storageError&&<Text style={[styles.quickHint,{color:colors.muted}]}>本裝置快捷設定讀取或儲存失敗，變更可能不會保留。</Text>}
        {quickNotice.length>0&&<Text accessibilityLiveRegion="polite" style={[styles.quickHint,{color:activeColor}]}>{quickNotice}</Text>}
        {quickEditorOrder.map(id=><View key={id} style={[
         styles.quickChoiceRow,draggingQuickId===id&&{backgroundColor:colors.card,borderRadius:8}
        ]}>
         <Pressable accessibilityRole="checkbox" accessibilityLabel={'置頂'+quickActions[id].label}
          accessibilityState={{checked:chosenQuickActions.includes(id),disabled:!quick.ready}}
          disabled={!quick.ready} onPress={()=>togglePin(id)}
          style={styles.quickChoice}>
          <Text style={[styles.itemLabel,{color:colors.ink,fontSize:fontSize(13)}]}>
           {chosenQuickActions.includes(id)?'☑':'☐'}　{quickActions[id].label}
          </Text>
         </Pressable>
         {chosenQuickActions.includes(id)&&<>
          <QuickDragHandle id={id} index={chosenQuickActions.indexOf(id)}
           count={chosenQuickActions.length} enabled={quick.ready}
           color={activeColor}
           onMove={(dragId,target)=>{quick.reorderPinned(quickDevice,dragId,target);setQuickNotice('已調整順序。');}}
           onDragging={setDraggingQuickId}/>
          <Pressable accessibilityRole="button" accessibilityLabel={'上移'+quickActions[id].label}
           accessibilityState={{disabled:!quick.ready||chosenQuickActions[0]===id}}
           disabled={!quick.ready||chosenQuickActions[0]===id}
           onPress={()=>{quick.movePinned(quickDevice,id,-1);setQuickNotice('已調整順序。');}}
           style={styles.quickMove}><Text style={[styles.quickMoveText,{color:activeColor}]}>↑</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'下移'+quickActions[id].label}
           accessibilityState={{disabled:!quick.ready||chosenQuickActions.at(-1)===id}}
           disabled={!quick.ready||chosenQuickActions.at(-1)===id}
           onPress={()=>{quick.movePinned(quickDevice,id,1);setQuickNotice('已調整順序。');}}
           style={styles.quickMove}><Text style={[styles.quickMoveText,{color:activeColor}]}>↓</Text></Pressable>
         </>}
        </View>)}
       </View>
       {buttons.map(([label,fn])=><Pressable key={label} accessibilityRole="button"
        accessibilityState={{selected:isSelectedPublicMenu(label,pathname)}}
        style={[styles.menuItem,isSelectedPublicMenu(label,pathname)&&{backgroundColor:colors.lightPill,borderRadius:11}]}
        onPress={fn}>
         <Text style={[styles.itemLabel,{color:isSelectedPublicMenu(label,pathname)?activeColor:colors.ink}]}>◈　{label}</Text>
         <Text style={[styles.itemArrow,{color:colors.muted}]}>›</Text>
       </Pressable>)}
       {['我的貼紙','音檔管理'].map(label=><View key={label} style={styles.menuItem}>
         <Text style={[styles.itemLabel,{color:colors.muted}]}>◇　{label}</Text>
         <Text style={[styles.comingSoon,{color:colors.muted}]}>待移植</Text>
       </View>)}
       <Text style={[styles.note,{color:colors.muted}]}>會員與管理功能待中央 API 驗收，不沿用舊帳號權限。</Text>
     </ScrollView>
     </View>
    </View>
   </Modal>
 </View>;
}
const styles=StyleSheet.create({
 menuModalRoot:{flex:1},
 menuBackdrop:{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:'rgba(15,23,42,.12)'},
 outer:{zIndex:100,borderBottomWidth:1,shadowColor:'#c13f6f',shadowOffset:{width:0,height:4},shadowOpacity:.08,shadowRadius:18,elevation:3},
 main:{height:visualMetrics.headerHeight,maxWidth:832,width:'100%',alignSelf:'center',paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 brand:{flexDirection:'row',alignItems:'center',gap:9,flex:1},
 brandIcon:{width:38,height:38,borderRadius:14,justifyContent:'center',alignItems:'center',shadowOpacity:.20,shadowRadius:12},
 mic:{fontSize:23,color:'#fff',lineHeight:27},
 brandName:{fontSize:21,fontWeight:'900',letterSpacing:1},
 wave:{flexDirection:'row',alignItems:'center',gap:3,height:22,marginLeft:3},
 fontActions:{flexDirection:'row',alignItems:'center',gap:4,marginRight:5},
 pinnedFontQuick:{flexDirection:'row',alignItems:'center',gap:3,minHeight:44,flexShrink:0},
 pinnedFontButton:{minHeight:44,minWidth:42,borderRadius:11,alignItems:'center',justifyContent:'center'},
 fontButton:{minHeight:42,minWidth:37,borderRadius:11,alignItems:'center',justifyContent:'center'},
 fontButtonText:{fontSize:12,fontWeight:'900'},
 fontMenuRow:{flexDirection:'row',minHeight:45,alignItems:'center',paddingHorizontal:9,gap:7,borderRadius:11},
 fontMenuButton:{minWidth:42,minHeight:44,alignItems:'center',justifyContent:'center'},
 menuButton:{height:42,width:44,borderRadius:13,justifyContent:'center',alignItems:'center'},
 menuGlyph:{fontSize:23,fontWeight:'700'},
 quickRow:{height:visualMetrics.headerActionsHeight,width:'100%',maxWidth:832,alignSelf:'center',borderTopWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:5},
 quick:{flexShrink:1,minWidth:0,minHeight:44,justifyContent:'center',paddingHorizontal:6},quickText:{fontSize:12,fontWeight:'800',textAlign:'center'},
 quickEditor:{borderWidth:1,borderRadius:12,padding:10,gap:5},
 quickHint:{fontSize:11,lineHeight:17},quickChoiceRow:{flexDirection:'row',alignItems:'center',minHeight:44,gap:4},
 quickChoice:{flex:1,minWidth:0,minHeight:44,justifyContent:'center'},
 quickMove:{minWidth:43,minHeight:44,alignItems:'center',justifyContent:'center'},
 quickMoveText:{fontSize:19,fontWeight:'900'},
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
