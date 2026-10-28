/**
 * Read-only audit of legacy Echo access flags. This cannot grant access.
 *
 * Authority: yukidu/Echo-Starry/src/visitorTrackPolicy.ts and src/types.ts.
 * guestVisible only affects legacy guest-home listing; it NEVER gives
 * playback authorization.
 *
 * NOTE: 'guest-free-candidate' is an audit queue, not permission to update
 * echo_tracks.visibility or migration_status='verified'. Review provenance,
 * actual audio decoding, licensing and owner publication approval first.
 */
export type LegacyTrackAccessRecord = {
  requiredRank?: string | null;
  isPrivateVip?: boolean | number | null;
  authorizedOnlyVisible?: boolean | number | null;
  settingsAuthorizedOnlyVisible?: boolean | number | null;
  stickerUnlockCost?: number | string | null;
  guestVisible?: boolean | number | null;
};

export type LegacyAuditGroup =
  | 'private-vip'
  | 'authorized-only'
  | 'rank-gated'
  | 'sticker-gated'
  | 'guest-free-candidate';

export function classifyLegacyTrackAccess(track:LegacyTrackAccessRecord):LegacyAuditGroup {
  if(Boolean(track.isPrivateVip))return 'private-vip';
  if(Boolean(track.authorizedOnlyVisible)||Boolean(track.settingsAuthorizedOnlyVisible))
    return 'authorized-only';
  const rank=String(track.requiredRank??'無').trim();
  if(rank!=='無'&&rank!=='公開'&&rank!=='')return 'rank-gated';
  const stickers=Number(track.stickerUnlockCost??0);
  if(!Number.isFinite(stickers)||stickers<0||stickers>0)return 'sticker-gated';
  return 'guest-free-candidate';
}

/** Candidate flag is not an authorization decision; backend must fail closed. */
export function isLegacyGuestFreeCandidate(track:LegacyTrackAccessRecord):boolean {
  return classifyLegacyTrackAccess(track)==='guest-free-candidate';
}
