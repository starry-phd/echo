import {visualMetrics} from '../../../packages/ui/src/tokens';

/**
 * Native safe-area offsets for the original Echo header and floating controls.
 *
 * The legacy app was a browser page without `viewport-fit=cover`, so the
 * browser itself kept content below the status bar / notch. iOS (notch,
 * Dynamic Island) and Android edge-to-edge draw the app under the status bar,
 * so the native shell must add those insets itself. On Expo Web without
 * `viewport-fit=cover` every inset is 0, so Web layout stays identical.
 */
export function safeInset(value:number|undefined|null):number{
 return typeof value==='number'&&Number.isFinite(value)&&value>0?value:0;
}
/** Extra top padding for the header so its background fills the status bar area. */
export function legacyHeaderPaddingTop(insetTop:number|undefined|null):number{
 return safeInset(insetTop);
}
/** The header menu lives in a full-screen Modal, so it must also clear the inset. */
export function legacyHeaderMenuTop(insetTop:number|undefined|null):number{
 return visualMetrics.headerHeight+visualMetrics.headerActionsHeight+safeInset(insetTop);
}
/** Original 24px floating offset, kept above the iOS home indicator / Android nav bar. */
export const LEGACY_BACK_TO_TOP_BOTTOM=24;
export function legacyBackToTopBottom(insetBottom:number|undefined|null):number{
 return LEGACY_BACK_TO_TOP_BOTTOM+safeInset(insetBottom);
}
