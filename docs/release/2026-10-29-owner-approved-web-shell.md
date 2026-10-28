# Echo v1.3 Web Release Attempt\n\n- Owner authorized a production deploy in the 2026-10-28 conversation.\n- Release candidate base: c365c26a139fc7b13fc290abf9d61340e3a03fff\n- This branch authorizes **only** a guarded deploy of the public read-only Web shell + API via Workers Static Assets.\n- No media files may become public until the source R2 598 objects are migrated and the 112 DB records are reviewed.\n- Starry central Auth, StoreKit/Google Billing, EAS native builds and AdMob Ads ON remain blocked.\n- A successful deployment does not imply whole legacy App migration or App Store submission.\n- No DNS changes and no legacy data deletion.\n

## Legacy mobile UI release 2026-10-29

- Owner approved automated production Web UI deployment in conversation.
- UI PR #5 merged: https://github.com/starry-phd/echo/pull/5
- New main commit: `e5825a1270f677c1681fc0d6dfcf41a5e76ce5b6`
- Mobile-first design and Starry v1.3 D-08 CI verified.
- Scope strictly limited to Web shell and public read-only API. Ads OFF and unverified audio still unavailable.
