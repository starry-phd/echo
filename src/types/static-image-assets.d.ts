/** PNG modules are bundled as static assets by Expo/Metro on native and Web.
 * Keep the source typed as a React Native Image source rather than disabling
 * the project's no-require-imports lint guard.
 */
declare module '*.png' {
 const source: import('react-native').ImageSourcePropType;
 export default source;
}
