// Writes <dist>/_headers for THIS build: guest CSP by default, or the sign-in CSP when
// EXPO_PUBLIC_STARRY_ID_API_BASE_URL is an allow-listed Starry ID origin (else the build fails).
// Usage (part of `npm run build:web`): node scripts/write-web-headers.mjs dist
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {headersFileFor,resolveStarryOrigin} from './web-security-headers.mjs';

const dir=process.argv[2]||'dist';
const origin=resolveStarryOrigin(process.env.EXPO_PUBLIC_STARRY_ID_API_BASE_URL);
writeFileSync(join(dir,'_headers'),headersFileFor(origin));
console.log('Wrote '+join(dir,'_headers')+' ('+(origin?'Starry ID sign-in CSP for '+origin:'guest CSP, no third-party sources')+')');
