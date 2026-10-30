import type {PropsWithChildren} from 'react';
import {ScrollViewStyleReset,useServerDocumentContext} from 'expo-router/html';

/**
 * Expo 58 static Web HTML. A same-origin PWA manifest and original legacy
 * icons are public assets, independent of the protected private media API.
 * Never register the old offline service worker: it could cache restricted
 * payloads and make revocation or deployment rollouts unsafe.
 */
export default function RootHtml({children}:PropsWithChildren){
 const {headNodes,bodyNodes,htmlAttributes,bodyAttributes}=useServerDocumentContext();
 return <html lang="zh-Hant-TW" {...htmlAttributes}>
  <head>
   <meta charSet="utf-8"/>
   <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"/>
   <meta name="theme-color" content="#c06c84"/>
   <meta name="apple-mobile-web-app-capable" content="yes"/>
   <meta name="apple-mobile-web-app-title" content="繁星回聲"/>
   <link rel="manifest" href="/manifest.webmanifest"/>
   <link rel="icon" href="/icon.svg" type="image/svg+xml"/>
   <link rel="apple-touch-icon" href="/icon-192.png"/>
   <ScrollViewStyleReset/>
   {headNodes}
  </head>
  <body {...bodyAttributes}>{children}{bodyNodes}</body>
 </html>;
}
