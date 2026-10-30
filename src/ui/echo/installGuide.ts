export type InstallPlatform='ios'|'android'|'desktop';
export function detectInstallPlatform(userAgent:string,platform:string,maxTouchPoints:number):InstallPlatform{
 const ios=/iPad|iPhone|iPod/i.test(userAgent)||(platform==='MacIntel'&&maxTouchPoints>1);
 if(ios)return 'ios';
 if(/Android/i.test(userAgent))return 'android';
 return 'desktop';
}
/** Browser-specific, non-promissory instructions when install events are unavailable. */
export const manualInstallHelp:Record<InstallPlatform,string>={
 ios:'iPhone／iPad：在 Safari 點「分享」→「加入主畫面」→「加入」。若瀏覽器沒有這個項目，請複製網址後用 Safari 開啟。',
 android:'Android：在 Chrome 點右上角「⋮」→「安裝應用程式」或「加到主畫面」（選項會依裝置而不同）。',
 desktop:'電腦：在 Chrome／Edge 的網址列使用安裝圖示，或從瀏覽器選單選「安裝繁星回聲」。如果沒有安裝選項，可以先建立桌面捷徑。'
};
