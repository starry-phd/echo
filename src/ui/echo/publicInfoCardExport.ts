import type {EchoTrack} from '../../types';
import {approvedPublicTrackShareMessage} from './publicTrackSharing';

export type PublicInfoCard=Readonly<{
 title:string;speaker:string;description:string;categories:readonly string[];
 duration:string;uploadDate:string|null;publicPageUrl:string;
}>;

const clean=(value:unknown,max:number):string=>typeof value==='string'
 ?value.replace(/[\u0000-\u001f\u007f-\u009f]/gu,' ').replace(/\s+/gu,' ').trim().slice(0,max)
 :'';

/** This card contains only the current public-by-ID API's already-approved fields.
 * A legacy preview card, even if its metadata is visible, is never an export grant. */
export function buildApprovedPublicInfoCard(
 track:EchoTrack|null|undefined,routeId:string|null,origin:string|null
):PublicInfoCard|null{
 if(!track)return null;
 const share=approvedPublicTrackShareMessage(track,routeId,origin);
 if(!share)return null;
 const publicPageUrl=share.slice(share.lastIndexOf('\n')+1);
 const seconds=Number.isFinite(track.durationSeconds)&&track.durationSeconds>0
  ?Math.floor(track.durationSeconds):null;
 const uploadDate=typeof track.uploadDate==='string'
  &&/^\d{4}-\d{2}-\d{2}(?:T|$)/u.test(track.uploadDate)
  ?track.uploadDate.slice(0,10):null;
 const categories=Array.isArray(track.categories)
  ?track.categories.map(c=>clean(c,28)).filter(Boolean).slice(0,4):[];
 return {
  title:clean(track.title,160),
  speaker:clean(track.speaker,140),
  description:clean(track.description,1200),
  categories,
  duration:seconds===null?'未提供':Math.max(1,Math.ceil(seconds/60))+' 分鐘',
  uploadDate,
  publicPageUrl
 };
}

/** Browser-only PNG rendering; invoked solely after a user click.
 * No remote images, historical comments, private media, or member lookups. */
export function downloadPublicInfoCardPng(card:PublicInfoCard):void{
 if(typeof document==='undefined')throw new Error('Web export only');
 const canvas=document.createElement('canvas');
 canvas.width=960;canvas.height=1280;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('PNG canvas is unavailable');
 const W=960,H=1280;
 ctx.fillStyle='#fffafc';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#b74f75';ctx.fillRect(0,0,W,160);
 ctx.fillStyle='#ffffff';ctx.font='bold 52px sans-serif';ctx.fillText('繁星回聲',70,106);
 ctx.fillStyle='#b74f75';ctx.fillRect(70,198,10,90);
 ctx.fillStyle='#322b35';ctx.font='bold 46px sans-serif';

 const drawWrapped=(value:string,x:number,top:number,maxWidth:number,lineHeight:number,
  maxLines:number):{nextY:number;truncated:boolean}=>{
  const chars=Array.from(value);
  let line='',lineCount=0,offsetY=top,overflow=false;
  for(let i=0;i<chars.length;i++){
   const char=chars[i];
   if(ctx.measureText(line+char).width>maxWidth&&line){
    ctx.fillText(line,x,offsetY);offsetY+=lineHeight;lineCount++;line='';
    if(lineCount>=maxLines){overflow=true;break;}
   }
   line+=char;
  }
  if(!overflow&&line&&lineCount<maxLines){ctx.fillText(line,x,offsetY);offsetY+=lineHeight;lineCount++;}
  return {nextY:offsetY,truncated:overflow};
 };
 const heading=drawWrapped(card.title,105,248,775,66,3);
 let y=Math.max(310,heading.nextY)+22;
 ctx.font='32px sans-serif';ctx.fillStyle='#61465a';
 const sp=drawWrapped('講者：'+card.speaker,85,y,800,44,2);
 y=sp.nextY+35;
 ctx.fillStyle='#e6d2dc';ctx.fillRect(80,y,800,2);y+=63;
 ctx.fillStyle='#442c3d';ctx.font='bold 31px sans-serif';
 ctx.fillText('演講資訊',85,y);y+=53;
 ctx.fillStyle='#473d45';ctx.font='26px sans-serif';
 const desc=card.description||'目前沒有已核准公開的演講介紹或備註。';
 const detail=drawWrapped(desc,85,y,790,42,13);y=detail.nextY+20;
 if(detail.truncated){ctx.font='21px sans-serif';ctx.fillStyle='#846878';ctx.fillText('…完整介紹請見公開頁面',85,y);y+=37;}
 // Keep metadata and provenance fixed near the bottom and never overprint.
 ctx.fillStyle='#fffafc';ctx.fillRect(70,1020,840,260);
 ctx.fillStyle='#e6d2dc';ctx.fillRect(80,1018,800,2);
 ctx.fillStyle='#58374e';ctx.font='24px sans-serif';
 ctx.fillText('分類：'+(card.categories.join('、')||'未提供'),85,1070,790);
 ctx.fillText('長度：'+card.duration+(card.uploadDate?'　上架：'+card.uploadDate:''),85,1110,790);
 ctx.fillStyle='#715565';ctx.font='19px sans-serif';
 ctx.fillText('僅包含已核准的公開欄位；不含會員心得及私有媒體。',85,1164,800);
 ctx.fillText('公開頁面：'+card.publicPageUrl,85,1206,790);
 const url=canvas.toDataURL('image/png');
 if(!url.startsWith('data:image/png;base64,'))throw new Error('PNG export failed');
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download='繁星回聲_公開演講資訊圖卡.png';
 document.body.appendChild(anchor);anchor.click();anchor.remove();
}
