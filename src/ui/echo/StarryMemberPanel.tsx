import {useEffect,useState} from 'react';
import {ActivityIndicator,Image,Linking,Platform,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {useStarryId} from '../../auth/starryId/StarryIdProvider';
import {passkeyErrorMessage} from '../../auth/starryId/passkeyErrors';
import type {PasskeyEntry} from '../../auth/starryId/passkeyContract';
import {prepareWebRelay,webRelaySupported} from '../../auth/starryId/webRelay';
import type {RelayProvider} from '../../auth/starryId/starryRelay';
import {nativeRelaySignIn} from '../../auth/starryId/nativeSignIn';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';

/**
 * Starry ID member panel (integration guide §2–4). Rendered only when Starry ID is enabled.
 * Web sign-in is a full-page redirect to the Starry relay (§11.2): this site loads no
 * Google or Apple scripts.
 */
export function StarryMemberPanel(){
 const starry=useStarryId();
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const [error,setError]=useState('');
 const [passkeys,setPasskeys]=useState<PasskeyEntry[]|null>(null);
 const [passkeyName,setPasskeyName]=useState('');
 const [passkeyNotice,setPasskeyNotice]=useState('');
 const [confirmRemove,setConfirmRemove]=useState<string|null>(null);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [deleteConfirmation,setDeleteConfirmation]=useState('');
 const [batterySummary,setBatterySummary]=useState('');
 const [taskType,setTaskType]=useState('echo.ai');
 const [taskLabel,setTaskLabel]=useState('AI 任務');
 const [taskUnits,setTaskUnits]=useState('1');
 const [taskSettingsNotice,setTaskSettingsNotice]=useState('');
 const {state,env}=starry;

 useEffect(()=>{starry.ensureLoaded();},[starry]);

 const nativeRelay=async(provider:RelayProvider)=>{
  if(!env)return;
  try{
   setError('');
   const nonce=await starry.getNonce();
   const result=await nativeRelaySignIn(env,provider,nonce);
   await starry.signIn({provider:result.provider,idToken:result.idToken,nonce,authorizationCode:result.code,redirectUri:result.redirectUri});
  }catch{setError('繁星會員登入未完成，請再試一次。');}
 };

 const webRelay=async(provider:RelayProvider)=>{
  if(!env||typeof window==='undefined')return;
  try{
   setError('');
   const nonce=await starry.getNonce();
   const url=await prepareWebRelay(env,provider,nonce,{storage:window.sessionStorage,subtle:window.crypto.subtle,
    randomBytes:n=>window.crypto.getRandomValues(new Uint8Array(n)),now:()=>Date.now()});
   window.location.assign(url);
  }catch{setError('暫時無法前往繁星會員登入，請稍後再試。');}
 };

 const passkeyAction=async(work:()=>Promise<void>,success?:string)=>{
  try{
   setError('');setPasskeyNotice('');
   await work();
   if(success)setPasskeyNotice(success);
  }catch(err){
   const message=passkeyErrorMessage(err);
   if(message)setError(message);
  }
 };
 const loadPasskeys=async()=>{
  const list=await starry.listPasskeys();
  setPasskeys(list);
 };
 const text=(value:string,muted=false)=><Text style={[styles.text,{color:muted?t.muted:t.ink,fontSize:fontSize(14)}]}>{value}</Text>;
 const button=(label:string,onPress:()=>void,kind:'primary'|'plain'|'danger'='plain')=><Pressable
  key={label} accessibilityRole="button" accessibilityLabel={label} disabled={starry.busy} onPress={onPress}
  style={[styles.button,kind==='primary'&&{backgroundColor:t.accentFill,borderColor:t.palette.primary},
   kind!=='primary'&&{borderColor:kind==='danger'?'#b8324e':t.border},starry.busy&&styles.disabled]}>
  <Text style={[styles.buttonLabel,{fontSize:fontSize(14),color:kind==='primary'?'#fff':kind==='danger'?'#b8324e':t.ink}]}>{label}</Text>
 </Pressable>;
 const link=(label:string,path:string)=>env&&<Text key={path} accessibilityRole="link" onPress={()=>{void Linking.openURL(env.baseUrl+path);}}
  style={[styles.link,{color:t.accentText,fontSize:fontSize(14)}]}>{label}</Text>;

 let body;
 switch(state.kind){
  case 'disabled':return null;
  case 'checking':body=<View style={styles.row}><ActivityIndicator color={t.palette.primary}/>{text('正在確認繁星會員狀態…',true)}</View>;break;
  case 'signed-out':
   body=<>
    {state.notice&&text(state.notice)}
    {text('可使用 Passkey、Google 或 Apple 登入繁星會員（Starry ID），三者都使用同一個中央會員帳號。',true)}
    {Platform.OS==='web'?<>
     {typeof window!=='undefined'&&webRelaySupported(window.location.origin)?<View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="使用 Google 帳號登入" disabled={starry.busy}
       onPress={()=>{void webRelay('google');}} style={[styles.google,{borderColor:t.border},starry.busy&&styles.disabled]}>
       <Text style={[styles.googleLabel,{fontSize:fontSize(15)}]}>使用 Google 帳號登入</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="使用 Apple 帳號登入" disabled={starry.busy}
       onPress={()=>{void webRelay('apple');}} style={[styles.apple,starry.busy&&styles.disabled]}>
       <Text style={[styles.appleLabel,{fontSize:fontSize(15)}]}>使用 Apple 帳號登入</Text>
      </Pressable>
     </View>:text('此網址不支援繁星會員登入，請改用正式網站。',true)}
    </>:<View style={styles.row}>
     <Pressable accessibilityRole="button" accessibilityLabel="透過繁星使用 Google 登入" disabled={starry.busy}
      onPress={()=>{void nativeRelay('google');}} style={[styles.google,{borderColor:t.border},starry.busy&&styles.disabled]}>
      <Text style={[styles.googleLabel,{fontSize:fontSize(15)}]}>使用 Google 帳號登入</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="透過繁星使用 Apple 登入" disabled={starry.busy}
      onPress={()=>{void nativeRelay('apple');}} style={[styles.apple,starry.busy&&styles.disabled]}>
      <Text style={[styles.appleLabel,{fontSize:fontSize(15)}]}>使用 Apple 帳號登入</Text>
     </Pressable>
    </View>}
    {starry.passkeyAvailable&&<View style={styles.row}>
     {button('使用 Passkey 登入',()=>{
      void passkeyAction(()=>starry.signInPasskey());
     },'primary')}
    </View>}
    <View style={styles.row}>{link('服務條款','/terms')}{link('隱私權政策','/privacy')}</View>
   </>;break;
  case 'consent-required':
   body=<>
    {text('繁星會員的服務條款或隱私權政策已更新，請閱讀後同意才能繼續使用會員功能。')}
    <View style={styles.row}>{link('服務條款','/terms')}{link('隱私權政策','/privacy')}</View>
    <View style={styles.row}>{button('同意並繼續',()=>{void starry.acceptConsent();},'primary')}{button('登出',()=>{void starry.signOut();})}</View>
   </>;break;
  case 'signed-in':{
   const member=state.member;
   body=<>
    <View style={styles.row}>
     {member.avatarPath&&env
      ?<Image source={{uri:env.baseUrl+member.avatarPath}} accessibilityLabel={'頭像：'+member.displayName} style={styles.avatar}/>
      :<View style={[styles.avatar,styles.initial,{backgroundColor:t.lightPill}]}>
        <Text style={{color:t.accentText,fontSize:fontSize(22),fontWeight:'900'}}>{Array.from(member.displayName)[0]}</Text></View>}
     <Text style={[styles.name,{color:t.ink,fontSize:fontSize(18)}]}>{member.displayName}</Text>
    </View>
    {text('已登入繁星會員。個人資料、頭像與登入方式請到繁星帳號中心管理。',true)}
    <View style={styles.row}>{link('前往繁星帳號中心','/account')}</View>
    <View style={[styles.confirm,{borderColor:t.border}]}>
     {text('我的 Passkey')}
     {text('Passkey 是繁星會員的額外登入方式，不影響你原本的 Apple／Google 登入。',true)}
     <View style={styles.row}>
      {button('我的 Passkey',()=>{void passkeyAction(loadPasskeys);})}
      {starry.passkeyAvailable&&button('新增 Passkey',()=>{
       void passkeyAction(async()=>{
        await starry.addPasskey(passkeyName.trim()||undefined);
        await loadPasskeys();
       },'Passkey 已新增至繁星會員。');
      },'primary')}
     </View>
     {starry.passkeyAvailable&&<TextInput
      accessibilityLabel="Passkey 名稱（選填）" value={passkeyName} onChangeText={setPasskeyName}
      placeholder="Passkey 名稱（選填）" placeholderTextColor={t.muted}
      style={[styles.deleteInput,{borderColor:t.border,color:t.ink}]}/>}
     {passkeys?.length===0&&text('尚未建立任何 Passkey。',true)}
     {passkeys?.map(entry=><View key={entry.id} style={styles.row}>
      {text(entry.name)}
      {confirmRemove===entry.id?<>
       {button('確定移除這把 Passkey',()=>{
        void passkeyAction(async()=>{
         await starry.removePasskey(entry.id);setConfirmRemove(null);await loadPasskeys();
        },'Passkey 已移除。');
       },'danger')}
       {button('取消',()=>setConfirmRemove(null))}
      </>:button('移除',()=>setConfirmRemove(entry.id))}
     </View>)}
     {passkeyNotice?text(passkeyNotice,true):null}
     {!starry.passkeyAvailable&&text('此裝置不支援 Passkey；可以在繁星網頁帳號中心管理。',true)}
    </View>
    <View style={styles.row}>{button('檢查繁星電池艙餘額',()=>{
      setBatterySummary('正在取得本月餘額…');
      void starry.getBatteryBalance().then(({balance:b,quantum:q})=>setBatterySummary(
       b.period+' 免費月額度 '+b.allowance+'、已用 '+b.used+'、預留中 '+b.reserved+'、剩餘 '+b.remaining+'；本 App 量子電池可用 '+q.available+' 顆（已預留 '+q.reserved+' 顆）。任務優先使用免費月額度，不足才使用量子電池。'
      )).catch(()=>setBatterySummary('電池艙暫時無法查詢，不會扣除額度。'));
     })}</View>
    {batterySummary?text(batterySummary,true):null}
    {member.staffRole==='owner'&&<View style={[styles.confirm,{borderColor:t.border}]}>
     {text('繁星回聲專屬 Battery 任務設定（超級管理員）')}
     {text('每次任務要消耗幾顆，由本 App 決定（1–100 顆）。後端會再次核對 Owner 身分。',true)}
     <TextInput accessibilityLabel="任務代碼" value={taskType} onChangeText={setTaskType}
      autoCapitalize="none" autoCorrect={false} style={[styles.deleteInput,{borderColor:t.border,color:t.ink}]}/>
     <TextInput accessibilityLabel="顯示給會員的任務名稱" value={taskLabel} onChangeText={setTaskLabel}
      style={[styles.deleteInput,{borderColor:t.border,color:t.ink}]}/>
     <TextInput accessibilityLabel="每個任務消耗幾顆電池" value={taskUnits}
      onChangeText={setTaskUnits} keyboardType="number-pad"
      style={[styles.deleteInput,{borderColor:t.border,color:t.ink}]}/>
     <View style={styles.row}>
      {button('讀取目前任務設定',()=>{
       void starry.getTaskPrices().then(rows=>{
        const current=rows.find(row=>row.task_type===taskType)||rows[0];
        if(current){setTaskType(current.task_type);setTaskLabel(current.task_label);setTaskUnits(String(current.units));}
        setTaskSettingsNotice('已取得 '+rows.length+' 項任務設定。');
       }).catch(()=>setTaskSettingsNotice('Echo 任務設定後端尚未啟用，無法讀取。'));
      })}
      {button('儲存任務價格',()=>{
       const units=Number(taskUnits);
       if(!/^echo\\.[a-z0-9._-]{1,59}$/.test(taskType)||!Number.isSafeInteger(units)||units<1||units>100||
          taskLabel.trim().length<1||taskLabel.length>40){
        setTaskSettingsNotice('任務代碼需以 echo. 開頭，顆數需為 1～100，名稱最多 40 字。');return;
       }
       void starry.saveTaskPrice({task_type:taskType,task_label:taskLabel.trim(),units})
        .then(()=>setTaskSettingsNotice('Echo 任務價格已儲存。'))
        .catch(()=>setTaskSettingsNotice('未能儲存：請確認 Echo 後端已部署且具備管理員權限。'));
      },'primary')}
     </View>
     {taskSettingsNotice?text(taskSettingsNotice,true):null}
    </View>}
    <View style={styles.row}>{button('登出',()=>{void starry.signOut();})}{button('登出所有裝置',()=>{void starry.signOut(true);})}</View>
    {!confirmDelete?button('刪除帳號',()=>setConfirmDelete(true),'danger'):<View style={[styles.confirm,{borderColor:'#b8324e'}]}>
     {text('確定刪除後將立即永久刪除整個繁星會員帳號，無法復原、沒有撤回期。刪除不會自動取消 App Store／Google Play 訂閱，請自行前往商店取消。')}
     {text('如確定刪除，請輸入 DELETE',true)}
     <TextInput accessibilityLabel="輸入 DELETE 確認永久刪除" autoCapitalize="characters" autoCorrect={false}
      value={deleteConfirmation} onChangeText={setDeleteConfirmation}
      style={[styles.deleteInput,{borderColor:t.border,color:t.ink}]} placeholder="DELETE" placeholderTextColor={t.muted}/>
     <View style={styles.row}>
      {button('確認永久刪除',()=>{
       if(deleteConfirmation!=='DELETE'){setError('必須輸入 DELETE 才能永久刪除。');return;}
       setConfirmDelete(false);setDeleteConfirmation('');void starry.requestDeletion();
      },'danger')}
      {button('取消',()=>{setConfirmDelete(false);setDeleteConfirmation('');})}
     </View>
    </View>}
   </>;break;
  }
  case 'pending-deletion':body=text('繁星會員帳號狀態無法使用，請至帳號中心確認。');break;
  case 'suspended':body=text('這個帳號已被停權，已為你登出。如有疑問請聯絡繁星客服。');break;
  case 'maintenance':body=text('繁星會員服務維護中，會員功能暫停；其他頁面可正常瀏覽。',true);break;
  case 'update-required':body=text('請更新 App 至 '+state.minVersion+' 以上版本後再使用會員功能。');break;
  default:body=text('暫時無法連線到繁星會員服務，會員功能已暫停；其他頁面可正常瀏覽。',true);
 }
 return <View accessibilityLabel="繁星會員" style={[styles.panel,{borderColor:t.border}]}>
  <Text style={[styles.title,{color:t.accentText,fontSize:fontSize(16)}]}>繁星會員（Starry ID）{env?.name==='staging'?'｜測試環境':''}</Text>
  {body}
  {error?<Text style={[styles.text,{color:'#b8324e',fontSize:fontSize(13)}]}>{error}</Text>:null}
 </View>;
}

const styles=StyleSheet.create({
 panel:{alignSelf:'stretch',borderWidth:1,borderRadius:16,padding:14,gap:10,marginBottom:12},
 title:{fontWeight:'900'},
 text:{lineHeight:22},
 row:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:10},
 button:{minHeight:44,paddingHorizontal:16,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center'},
 buttonLabel:{fontWeight:'800'},
 disabled:{opacity:.5},
 link:{fontWeight:'800',textDecorationLine:'underline',paddingVertical:8},
 google:{minHeight:44,borderRadius:22,borderWidth:1,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',paddingHorizontal:18},
 googleLabel:{color:'#1f1f1f',fontWeight:'800'},
 apple:{minHeight:44,borderRadius:22,backgroundColor:'#000',alignItems:'center',justifyContent:'center',paddingHorizontal:18,alignSelf:'flex-start'},
 appleLabel:{color:'#fff',fontWeight:'800'},
 avatar:{width:56,height:56,borderRadius:28},
 initial:{alignItems:'center',justifyContent:'center'},
 name:{fontWeight:'900'},
 confirm:{borderWidth:1,borderRadius:12,padding:12,gap:10},
 deleteInput:{borderWidth:1,borderRadius:10,minHeight:44,paddingHorizontal:12,alignSelf:'stretch'}
});
