/**
 * 1:1 public card visual sizing, sourced from the original
 * yukidu/Echo-Starry/src/components/AudioCard.tsx Tailwind classes:
 * w-28 sm:w-32 and text-base sm:text-lg truncate (sm = 640px).
 * Presentation only; never changes audio permissions or track metadata.
 */
export function legacyAudioCardSizing(width:number){
 const desktop=Number.isFinite(width)&&width>=640;
 return {
  cover:desktop?128:112,
  titleFont:desktop?18:16,
  titleLineHeight:desktop?19:17
 };
}
