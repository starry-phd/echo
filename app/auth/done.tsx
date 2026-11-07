import {useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {router} from 'expo-router';
import {useStarryId} from '../../src/auth/starryId/StarryIdProvider';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {useFontZoom} from '../../src/ui/echo/FontZoom';

/**
 * Return page of the Starry web sign-in relay (starry-phd/id guide §11.2). The result
 * arrives after `#` (never sent to a server); it is read once and wiped from the
 * address bar immediately, then exchanged with Starry ID and the member page opens.
 */
export default function StarryRelayDone(){
 const starry=useStarryId();
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const [message,setMessage]=useState('正在完成繁星會員登入…');
 const [done,setDone]=useState(false);
 const handled=useRef(false);

 useEffect(()=>{
  if(handled.current||Platform.OS!=='web'||typeof window==='undefined')return;
  handled.current=true;
  const href=window.location.href;
  try{window.history.replaceState(null,'',window.location.pathname);}catch{/* keep going */}
  if(!starry.enabled||!starry.env){setMessage('繁星會員登入尚未開放。');setDone(true);return;}
  // Official SDK validates the single-use state, clears pending data and exchanges tokens.
  void starry.completeWebRelay(href).then(()=>router.replace('/profile')).catch(err=>{
   setMessage((err as {cancelled?:boolean})?.cancelled?'已取消登入。':'登入驗證未完成，請再試一次。');
   setDone(true);
  });
 },[starry]);

 return <View style={[styles.root,{backgroundColor:t.bg}]}>
  <View style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
   {!done&&<ActivityIndicator color={t.palette.primary}/>}
   <Text accessibilityLiveRegion="polite" style={[styles.text,{color:t.ink,fontSize:fontSize(15)}]}>{message}</Text>
   {done&&<Pressable accessibilityRole="button" accessibilityLabel="回到會員頁" onPress={()=>router.replace('/profile')}
    style={[styles.button,{backgroundColor:t.accentFill}]}>
    <Text style={[styles.buttonText,{fontSize:fontSize(14)}]}>回到會員頁</Text>
   </Pressable>}
  </View>
 </View>;
}

const styles=StyleSheet.create({
 root:{flex:1,alignItems:'center',paddingTop:40,paddingHorizontal:16},
 card:{width:'100%',maxWidth:420,borderWidth:1,borderRadius:18,padding:20,gap:14,alignItems:'center'},
 text:{lineHeight:24,textAlign:'center'},
 button:{minHeight:44,borderRadius:12,paddingHorizontal:18,alignItems:'center',justifyContent:'center'},
 buttonText:{color:'#fff',fontWeight:'800'}
});
