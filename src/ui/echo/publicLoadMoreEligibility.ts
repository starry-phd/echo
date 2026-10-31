import type {CatalogDisplayState} from './catalogDisplayState';

/**
 * Empty currently visible cards is NOT an exhausted public catalog: local
 * hides and rank filters may exclude the first authorized page. Keep the
 * next verified-public page reachable without bypassing error/loading gates.
 */
export function canLoadMoreAuthorizedPublic(
 display:CatalogDisplayState,hasNextPage:boolean,deviceReady:boolean
):boolean{
 return deviceReady&&hasNextPage&&(display==='ready'||display==='empty');
}
