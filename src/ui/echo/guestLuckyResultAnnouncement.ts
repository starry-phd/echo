import {isApprovedPreview} from './safeLuckyDraw';
import type {LuckyCandidate} from './safeLuckyDraw';

/** The legacy lucky winner has aria-live=polite. Do not announce a drawn card
 * unless its metadata is still authorized and currently displayed.
 * Speech is ONLY a public metadata title and speaker; never audio details. */
export function guestLuckyResultAnnouncement(
 phase:'idle'|'spin'|'win',
 display:'loading'|'failed'|'ready'|string,
 track:(LuckyCandidate&{title:string;speaker:string})|null|undefined
):string|null{
 if(phase!=='win'||display!=='ready'||!track||!isApprovedPreview(track))return null;
 const title=track.title.trim();
 const speaker=track.speaker.trim();
 if(!title||!speaker)return null;
 // Guard against unexpectedly long malformed display values being spoken.
 if(title.length>200||speaker.length>140)return null;
 return '好手氣！抽中訪客資訊卡：'+title+'，講者：'+speaker+'。這張卡片僅供瀏覽，錄音播放未開放。';
}
