import {STARRY_ID_APP_ID} from './env';

/**
 * Startup gate `GET /v1/apps/echo/config` (starry-phd/id integration guide §1).
 * - paused → maintenance notice; killed → stop and explain; below min_version → update.
 * - Starry ID unreachable → public screens keep working, member features fail closed.
 */
export type StarryAppConfig=Readonly<{appId:string;status:string;minVersion:string}>;
export type StarryAppAvailability=
 |{kind:'active'}
 |{kind:'paused'}
 |{kind:'killed'}
 |{kind:'update-required';minVersion:string}
 |{kind:'unavailable'};

const VERSION=/^(\d{1,6})\.(\d{1,6})\.(\d{1,6})$/;

export function parseStarryAppConfig(value:unknown):StarryAppConfig{
 if(typeof value!=='object'||value===null||Array.isArray(value))throw new Error('Starry app config must be an object');
 const v=value as Record<string,unknown>;
 if(v.app_id!==STARRY_ID_APP_ID)throw new Error('Starry app config is for another app');
 if(typeof v.status!=='string'||typeof v.min_version!=='string'||!VERSION.test(v.min_version))
  throw new Error('Invalid Starry app config');
 return Object.freeze({appId:v.app_id,status:v.status,minVersion:v.min_version});
}

/** -1 / 0 / 1 for numeric x.y.z versions; throws on anything else. */
export function compareAppVersions(a:string,b:string):number{
 const pa=VERSION.exec(a),pb=VERSION.exec(b);
 if(!pa||!pb)throw new Error('Versions must be x.y.z');
 for(let i=1;i<=3;i++){
  const d=Number(pa[i])-Number(pb[i]);
  if(d!==0)return d<0?-1:1;
 }
 return 0;
}

/** `config` is null when Starry ID could not be reached or answered invalid data. */
export function evaluateAppAvailability(config:StarryAppConfig|null,appVersion:string):StarryAppAvailability{
 if(!config)return {kind:'unavailable'};
 if(config.status==='killed')return {kind:'killed'};
 if(config.status!=='active')return {kind:'paused'}; // paused or any unknown future status
 let cmp:number;
 try{cmp=compareAppVersions(appVersion,config.minVersion);}catch{return {kind:'unavailable'};}
 return cmp<0?{kind:'update-required',minVersion:config.minVersion}:{kind:'active'};
}

export function memberFeaturesAvailable(availability:StarryAppAvailability):boolean{
 return availability.kind==='active';
}
