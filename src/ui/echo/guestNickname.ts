/** Public, decorative guest name parity with original Echo src/utils/visitor.ts.
 * Only the PREVIOUS DISPLAY NAME is stored. No device ID, member identity,
 * login session, entitlement, API request, audio history, or analytics.
 */
export const GUEST_NICKNAME_KEY='echo-ui-guest-nickname-v1';
export type GuestNickname={fullName:string;emoji:string};
type GuestNicknameStorage={
 getItem:(key:string)=>Promise<string|null>;
 setItem:(key:string,value:string)=>Promise<unknown>;
};

// Source: yukidu/Echo-Starry/src/utils/visitor.ts, positive-only guest names.
export const guestAnimals=[
 {name:'海豚',emoji:'🐬'},{name:'獵鷹',emoji:'🦅'},
 {name:'貓頭鷹',emoji:'🦉'},{name:'老虎',emoji:'🐯'},
 {name:'獅子',emoji:'🦁'},{name:'白兔',emoji:'🐰'},
 {name:'狐狸',emoji:'🦊'},{name:'熊貓',emoji:'🐼'},
 {name:'無尾熊',emoji:'🐨'},{name:'長頸鹿',emoji:'🦒'},
 {name:'大象',emoji:'🐘'},{name:'駿馬',emoji:'🐴'},
 {name:'刺蝟',emoji:'🦔'},{name:'企鵝',emoji:'🐧'},
 {name:'紅鶴',emoji:'🦩'},{name:'松鼠',emoji:'🐿️'},
 {name:'海豹',emoji:'🦭'},{name:'野狼',emoji:'🐺'},
 {name:'梅花鹿',emoji:'🦌'},{name:'綠頭鴨',emoji:'🦆'}
] as const;
export const guestAdjectives=[
 '爽朗的','熱情的','自信的','溫暖的','聰慧的','勇敢的','樂觀的',
 '踏實的','敏銳的','積極的','幽默的','堅毅的','沉著的','親切的',
 '謙遜的','睿智的','開朗的','真誠的','活力滿滿的','充滿好奇的'
] as const;

const choiceIndex=(length:number,random:()=>number)=>{
 const value=random();
 return Number.isFinite(value)?Math.min(length-1,Math.max(0,Math.floor(value*length))):0;
};

/** Each app load picks a positive adjective + animal, never repeating the
 * previous stored display name even when random returns the same indices.
 * Untrusted storage is NEVER reflected as screen text.
 */
export function chooseGuestNickname(previous:string|null,random:()=>number=Math.random):GuestNickname{
 const adjective=guestAdjectives[choiceIndex(guestAdjectives.length,random)];
 let animalIndex=choiceIndex(guestAnimals.length,random);
 let animal=guestAnimals[animalIndex];
 let fullName=adjective+animal.name;
 if(fullName===previous){
  animalIndex=(animalIndex+1)%guestAnimals.length;
  animal=guestAnimals[animalIndex];
  fullName=adjective+animal.name;
 }
 return {fullName,emoji:animal.emoji};
}

/** Offline/private-browsing storage failures must not prevent guest UI.
 * A failed read never overwrites an unknown previously stored preference.
 */
export async function loadGuestNickname(
 storage:GuestNicknameStorage,random:()=>number=Math.random
):Promise<GuestNickname>{
 let previous:string|null=null;
 try{previous=await storage.getItem(GUEST_NICKNAME_KEY);}
 catch{return chooseGuestNickname(null,random);}
 const nickname=chooseGuestNickname(previous,random);
 try{await storage.setItem(GUEST_NICKNAME_KEY,nickname.fullName);}catch{
  // Decorative name still works in memory; do not misrepresent persistence.
 }
 return nickname;
}
