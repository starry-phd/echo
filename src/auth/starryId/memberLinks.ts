/** Public Starry member numbers are changeable. Never use them as identity keys. */
const MEMBER_NO=/^[A-Z]{2}[0-9]{7,10}$/;
export function memberPublicUrl(memberNo:string):string|null{
 return MEMBER_NO.test(memberNo)?'https://id.starry.phd/'+encodeURIComponent(memberNo):null;
}
export function memberInviteUrl(memberNo:string):string|null{
 return MEMBER_NO.test(memberNo)?'https://id.starry.phd/Invite/'+encodeURIComponent(memberNo):null;
}
