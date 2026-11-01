/** Original Navbar highlights the selected main-menu route.
 * This labels only local navigation in the PUBLIC guest shell; it is never
 * an authorization or session check. */
const publicMenuPaths:Record<string,string>={
 '首頁':'/',
 '排行榜':'/stats',
 '通知中心':'/notifications',
 '我的收藏（本裝置）':'/favorites',
 '個人資料／登入':'/profile'
};
export function isSelectedPublicMenu(label:string,pathname:string):boolean{
 const route=publicMenuPaths[label];
 return typeof route==='string'&&route===pathname;
}
