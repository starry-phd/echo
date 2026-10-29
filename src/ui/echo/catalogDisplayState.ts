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
 // A failed source cannot be treated as an empty result when the other has no data.
 if((publicSource.failed&&previewSource.count===0)||
    (previewSource.failed&&publicSource.count===0))return 'failed';
 return visibleCount>0?'ready':'empty';
}

export function hasPartialCatalogFailure(
 publicSource:CatalogSourceState,previewSource:CatalogSourceState
):boolean{
 return (publicSource.failed||previewSource.failed)&&
    publicSource.count+previewSource.count>0;
}
