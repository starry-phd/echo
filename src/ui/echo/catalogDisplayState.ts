/**
 * Keep API transport failures distinct from an actually empty catalog.
 * The currently verified public catalog may legitimately contain 0 recordings;
 * the curated 28 guest previews are an independent source.
 */
export type CatalogSourceState={pending:boolean;failed:boolean;count:number};
export type CatalogDisplayState='loading'|'failed'|'empty'|'ready';

export function getCatalogDisplayState(
 publicSource:CatalogSourceState,previewSource:CatalogSourceState,visibleCount:number
):CatalogDisplayState{
 if(publicSource.pending||previewSource.pending)return 'loading';
 // Authorized visible cards can still be shown if the OTHER source failed;
 // the UI must separately label this as partial data via hasPartialCatalogFailure.
 if(visibleCount>0)return 'ready';
 // A successful source may contain cards, but ALL of them can be filtered or
 // hidden on this device. If the other source failed, absence cannot be
 // established: never claim the whole catalog / favorites / speaker list is empty.
 if(publicSource.failed||previewSource.failed)return 'failed';
 return 'empty';
}

export function hasPartialCatalogFailure(
 publicSource:CatalogSourceState,previewSource:CatalogSourceState
):boolean{
 return (publicSource.failed||previewSource.failed)&&
    publicSource.count+previewSource.count>0;
}
