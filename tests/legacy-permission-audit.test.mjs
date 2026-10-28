import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyLegacyTrackAccess,isLegacyGuestFreeCandidate} from '../src/media/legacyPermissionAudit.ts';

test('old guestVisible flag alone does NOT grant playback or publication',()=>{
  for(const blocked of [
    {requiredRank:'15%',guestVisible:1},
    {requiredRank:'無',guestVisible:1,isPrivateVip:1},
    {requiredRank:'無',guestVisible:1,authorizedOnlyVisible:1},
    {requiredRank:'無',guestVisible:1,settingsAuthorizedOnlyVisible:1},
    {requiredRank:'無',guestVisible:1,stickerUnlockCost:5}
  ])assert.equal(isLegacyGuestFreeCandidate(blocked),false);
});
test('free public-rank legacy media remain review candidates, not verified access',()=>{
  assert.equal(classifyLegacyTrackAccess({requiredRank:'無',stickerUnlockCost:0,guestVisible:0}), 'guest-free-candidate');
  assert.equal(classifyLegacyTrackAccess({requiredRank:'公開',guestVisible:0}), 'guest-free-candidate');
  assert.equal(classifyLegacyTrackAccess({requiredRank:'白金'}),'rank-gated');
  assert.equal(classifyLegacyTrackAccess({isPrivateVip:1,requiredRank:'無'}),'private-vip');
  assert.equal(classifyLegacyTrackAccess({authorizedOnlyVisible:1}),'authorized-only');
  assert.equal(classifyLegacyTrackAccess({stickerUnlockCost:3}),'sticker-gated');
});
test('invalid sticker values cannot accidentally become public candidates',()=>{
  for(const cost of ['not-a-number','Infinity',-2,5])
    assert.equal(isLegacyGuestFreeCandidate({requiredRank:'無',stickerUnlockCost:cost}),false);
});
