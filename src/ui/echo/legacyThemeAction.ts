/** Original source of truth: yukidu/Echo-Starry@82cbf4f src/components/Navbar.tsx
 *  - line 223: `themeActionLabel = isDark ? '開燈' : '關燈'` (main menu row text)
 *  - line 431: pinned theme button shows Moon in light mode, Sun in dark mode,
 *    with aria-label/title `isDark ? '切換淺色模式' : '切換深色模式'`
 *  - lines 619-622: main menu row = Moon/Sun icon + themeActionLabel
 * The new app draws icons as text glyphs; U+FE0E keeps the sun in text
 * presentation so iOS/Android do not swap in a colour emoji.
 * Local theme preference only: no account, storage key or network change.
 */
export const LEGACY_THEME_MOON_GLYPH='☾';
export const LEGACY_THEME_SUN_GLYPH='☀︎';

export type LegacyThemeAction={
 glyph:string;
 menuLabel:'關燈'|'開燈';
 accessibilityLabel:'切換深色模式'|'切換淺色模式';
};

export function legacyThemeAction(dark:boolean):LegacyThemeAction{
 return dark
  ?{glyph:LEGACY_THEME_SUN_GLYPH,menuLabel:'開燈',accessibilityLabel:'切換淺色模式'}
  :{glyph:LEGACY_THEME_MOON_GLYPH,menuLabel:'關燈',accessibilityLabel:'切換深色模式'};
}
