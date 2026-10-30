import type {CatalogDisplayState} from './catalogDisplayState';

/**
 * API results are requested using a debounced query while the input reflects
 * every keystroke. Do not display / randomly draw from the PREVIOUS query's
 * approved results while a new search is waiting for debounce or API data.
 *
 * This is UI freshness only, never a server authorization check. Source
 * loading/failed states still come from the two authorized catalog APIs.
 */
export function currentCatalogDisplayState(
 deviceReady:boolean,
 typedQuery:string,
 requestedQuery:string,
 apiDisplay:CatalogDisplayState
):CatalogDisplayState{
 if(!deviceReady||typedQuery!==requestedQuery)return 'loading';
 return apiDisplay;
}

export function canDrawFromCurrentCatalog(
 display:CatalogDisplayState,
 spinning:boolean
):boolean{
 // On genuinely empty catalog the existing UI may explain that there are no
 // eligible candidates; the drawer itself selects only safe approved cards.
 return display!=='loading'&&display!=='failed'&&!spinning;
}
