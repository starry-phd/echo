export type InstallPlatform='ios'|'android'|'desktop';
export function detectInstallPlatform(userAgent:string,platform:string,maxTouchPoints:number):InstallPlatform{
 const ios=/iPad|iPhone|iPod/i.test(userAgent)||(platform==='MacIntel'&&maxTouchPoints>1);
 if(ios)return 'ios';
 if(/Android/i.test(userAgent))return 'android';
 return 'desktop';
}
/** Browser-specific, non-promissory instructions when install events are unavailable. */
export const manualInstallHelp:Record<InstallPlatform,string>={
 ios:'iPhone／iPad 安裝步驟：\n1. 使用 Safari 開啟繁星回聲網站；若目前在通訊軟體內，先選擇「以 Safari 開啟」。\n2. 點 Safari 的「分享」按鈕。\n3. 在分享選單向下捲動，選擇「加入主畫面」。\n4. 確認名稱後點選「加入」，就能從主畫面的圖示開啟。若找不到選項，請複製網址並用 Safari 開啟。',
 android:'Android：在 Chrome 點右上角「⋮」→「安裝應用程式」或「加到主畫面」（選項會依裝置而不同）。',
 desktop:'電腦：在 Chrome／Edge 的網址列使用安裝圖示，或從瀏覽器選單選「安裝繁星回聲」。如果沒有安裝選項，可以先建立桌面捷徑。'
};
