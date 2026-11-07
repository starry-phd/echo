/** Public Starry support link. Never include a member ID, token, email or location. */
export function starrySupportUrl(appVersion:string,deviceModel:string):string{
 const version=appVersion.trim().slice(0,100)||'unknown';
 const device=deviceModel.trim().slice(0,100)||'unknown';
 return 'https://id.starry.phd/support?app_id=echo&app_version='+encodeURIComponent(version)+
  '&device='+encodeURIComponent(device);
}
