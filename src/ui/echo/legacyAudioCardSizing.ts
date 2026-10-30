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
  titleLineHeight:desktop?19:17,
  // AudioCard.tsx: text-sm sm:text-base, text-[9px] sm:text-[10px],
  // gap-3 sm:gap-4, py-2.5 sm:py-3, pr-7 sm:pr-8.
  speakerFont:desktop?16:14,
  durationFont:desktop?10:9,
  tagFont:desktop?10:9,
  bodyGap:desktop?16:12,
  bodyPadding:desktop?12:10,
  detailsRightPadding:desktop?32:28
 };
}
