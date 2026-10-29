-- Curated legacy guest metadata scope: 28 previously guest-visible and free-to-list tracks.
-- Source: yukidu D1 echoes_db, t.guestVisible=1 AND no private VIP, rank, sticker or authorized-only flags.
-- Destination records verified 28/28 exist as private+copied. No audio is authorized.
-- Revoke any preview immediately using DELETE FROM echo_guest_previews WHERE track_id=...
CREATE TABLE IF NOT EXISTS echo_guest_previews (
 track_id TEXT PRIMARY KEY REFERENCES echo_tracks(id),
 source_scope TEXT NOT NULL CHECK (source_scope='legacy-guest-free-2026-10-29'),
 approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO echo_guest_previews(track_id,source_scope)
 SELECT id,'legacy-guest-free-2026-10-29'
 FROM echo_tracks
 WHERE visibility='private' AND migration_status='copied'
 AND id IN (
 't-00069f42-2cf1-465f-959f-a12b2ae1bf67',
 't-083c57e7-cbfc-41f1-9524-bd55b57a6032',
 't-0ea4a519-2cf6-4215-a701-80d749f6510f',
 't-1791178513783',
 't-1791178641182',
 't-1791178745440',
 't-223064a9-3eed-4d71-b7e8-3c9696bb0d7e',
 't-31a78e3b-4334-49b0-bb74-23aef4113817',
 't-47a1e461-9f4b-427f-9a86-f2df56d1c489',
 't-4dcbb360-f4fd-40ea-bc52-38f2bd082228',
 't-675c1469-1820-4ea7-99a7-6025b728e9eb',
 't-6a24b04e-670f-40fa-8b1d-2406480a431a',
 't-741d9a7e-f066-4e2f-a5d9-20246d014517',
 't-7f537dd2-38f2-4d47-8f0b-ff15f3f22d95',
 't-8465a416-0985-4e47-ade8-d1ba8f2f8661',
 't-9297dd1c-2bb1-4b05-8240-a04cf18f9d61',
 't-94603233-8744-450c-abb1-5e1d98361e48',
 't-a8db1b4f-6dfa-4c0b-9f3e-e3a49c15af6a',
 't-aaca6f2a-cb05-493e-ab19-b915773812c4',
 't-b192bc54-06ca-44b8-aa8e-b86c755c56d2',
 't-c31ea90c-e18b-431e-8d20-c74004c15065',
 't-c9e3b324-1fcf-479a-bd09-55b0d08d4b15',
 't-d10a3c5b-1313-4355-a1c1-7d08ee06034b',
 't-e7ef3395-b2fe-4b26-8f1c-d1f8936ec3d3',
 't-e8aaa2c3-3dd0-494e-861c-52d01ff165e5',
 't-ec707137-744e-492b-a8c3-283ef9d8e37c',
 't-ecc22090-f665-400d-bc47-50ce8648a718',
 't-ff2d497c-b02a-46e7-aea0-82d59633a063'
 );
