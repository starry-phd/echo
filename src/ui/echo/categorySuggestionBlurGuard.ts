/**
 * React Native TextInput can blur on mouse/touch-down BEFORE a suggestion
 * Pressable fires onPress. Immediately hiding the panel in onBlur would
 * unmount the chip and lose the selection (especially on long presses).
 *
 * The guard dismisses after a short blur grace window, but holds the panel
 * while a suggestion is being pressed. onPress accepts/dismisses explicitly;
 * a cancelled gesture is dismissed by pressEnd. It does not access DOM,
 * member data, track media or platform-specific APIs.
 */
export function createCategorySuggestionBlurGuard(
 onDismiss:()=>void,
 clock:{
  schedule:(callback:()=>void)=>ReturnType<typeof setTimeout>;
  cancel:(handle:ReturnType<typeof setTimeout>)=>void;
 }={
  schedule:callback=>setTimeout(callback,120),
  cancel:handle=>clearTimeout(handle)
 }
){
 let focused=false;
 let pressing=false;
 let disposed=false;
 let timer:ReturnType<typeof setTimeout>|null=null;
 const cancelPending=()=>{
  if(timer!==null){clock.cancel(timer);timer=null;}
 };
 const scheduleClose=()=>{
  cancelPending();
  timer=clock.schedule(()=>{
   timer=null;
   if(!disposed&&!focused&&!pressing)onDismiss();
  });
 };
 return {
  focus(){
   if(disposed)return;
   focused=true;
   cancelPending();
  },
  blur(){
   if(disposed)return;
   focused=false;
   scheduleClose();
  },
  pressStart(){
   if(disposed)return;
   pressing=true;
   cancelPending();
  },
  pressEnd(){
   if(disposed)return;
   pressing=false;
   // A cancelled gesture must not leave an unfocused panel stuck open.
   // Normal onPress will cancel this short close and accept the chip first.
   if(!focused)scheduleClose();
  },
  dismiss(){
   if(disposed)return;
   cancelPending();
   pressing=false;
   onDismiss();
  },
  dispose(){
   disposed=true;
   cancelPending();
  }
 };
}
