-- Only the 28 original guest-visible, no-rank/no-VIP/no-payment/no-authorized-only items.
-- Each approved legacy /api/r2/file/cover%2F... reference was decoded, checked
-- against actual destination echo-starry R2 cover/ object with nonzero size.
-- Metadata is a historical UI snapshot, not authorization for audio playback.
-- Independent echo_guest_previews whitelist must remain in place.
CREATE TABLE IF NOT EXISTS echo_guest_card_media(
 track_id TEXT PRIMARY KEY REFERENCES echo_guest_previews(track_id) ON DELETE CASCADE,
 cover_key TEXT NOT NULL CHECK (cover_key LIKE 'cover/%'),
 speaker_rank TEXT NOT NULL DEFAULT '',
 rating REAL NOT NULL DEFAULT 0,
 rating_count INTEGER NOT NULL DEFAULT 0,
 comments_count INTEGER NOT NULL DEFAULT 0,
 likes INTEGER NOT NULL DEFAULT 0,
 upload_date TEXT NOT NULL DEFAULT '',
 added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO echo_guest_card_media(track_id,cover_key,speaker_rank,rating,rating_count,comments_count,likes,upload_date) VALUES
 ('t-00069f42-2cf1-465f-959f-a12b2ae1bf67','cover/黃麗容李承謙.jpg','鑽石',5,1,1,2,'2026-10-10T14:12:17.484Z'),
 ('t-083c57e7-cbfc-41f1-9524-bd55b57a6032','cover/趙暢劉韋廷.jpg','鑽石',1,1,0,1,'2026-10-08T17:19:54.490Z'),
 ('t-0ea4a519-2cf6-4215-a701-80d749f6510f','cover/蔡奉龍陳心玲.jpg','鑽石',1,1,0,3,'2026-10-08T17:18:06.816Z'),
 ('t-1791178513783','cover/彭建屏洪美香2.jpg','皇冠',5,3,1,5,'2026-10-05T05:35:13.783Z'),
 ('t-1791178641182','cover/楊朝旭蔡文雀.jpg','皇冠',5,1,0,4,'2026-10-05T05:37:21.182Z'),
 ('t-1791178745440','cover/鍾易宏何靜2.jpg','皇冠大使',5,2,0,5,'2026-10-05T05:39:05.623Z'),
 ('t-223064a9-3eed-4d71-b7e8-3c9696bb0d7e','cover/劉定宇趙君璞鑽石.jpg','鑽石',5,2,0,2,'2026-10-08T17:19:24.144Z'),
 ('t-31a78e3b-4334-49b0-bb74-23aef4113817','cover/黃品超尤秋燕2.jpg','鑽石',0,0,0,0,'2026-10-10T15:42:15.905Z'),
 ('t-47a1e461-9f4b-427f-9a86-f2df56d1c489','cover/劉劍鳴劉秋鴻.jpg','皇冠',0,0,0,0,'2026-10-08T17:18:37.646Z'),
 ('t-4dcbb360-f4fd-40ea-bc52-38f2bd082228','cover/彭建屏洪美香2.jpg','參鑽石',5,1,1,1,'2026-10-08T17:21:46.870Z'),
 ('t-675c1469-1820-4ea7-99a7-6025b728e9eb','cover/許明哲.jpg','皇冠大使',0,0,1,1,'2026-10-10T17:44:35.681Z'),
 ('t-6a24b04e-670f-40fa-8b1d-2406480a431a','cover/吳姝諭康誌栩.jpg','執行專才鑽石',0,0,0,2,'2026-10-10T15:01:17.011Z'),
 ('t-741d9a7e-f066-4e2f-a5d9-20246d014517','cover/謝建宗游麗珠.jpg','皇冠大使',0,0,0,1,'2026-10-08T17:17:30.038Z'),
 ('t-7f537dd2-38f2-4d47-8f0b-ff15f3f22d95','cover/曾玉玲呂森林.jpg','皇冠大使',0,0,1,3,'2026-10-10T17:28:33.751Z'),
 ('t-8465a416-0985-4e47-ade8-d1ba8f2f8661','cover/陳維德呂素如.png','執行專才鑽石',0,0,0,3,'2026-10-11T08:04:19.667Z'),
 ('t-9297dd1c-2bb1-4b05-8240-a04cf18f9d61','cover/康君.jpg','創辦人皇冠大使',0,0,6,2,'2026-10-10T18:13:00.598Z'),
 ('t-94603233-8744-450c-abb1-5e1d98361e48','cover/泰國Rathee-Mangcararangsi2.jpg','參鑽石',0,0,3,2,'2026-10-10T14:53:25.828Z'),
 ('t-a8db1b4f-6dfa-4c0b-9f3e-e3a49c15af6a','cover/李國豐戴麗珊.jpg','GAR創辦人執行專才鑽石',0,0,0,0,'2026-10-10T16:44:39.396Z'),
 ('t-aaca6f2a-cb05-493e-ab19-b915773812c4','cover/澳門何勁龍張芷華2.jpg','雙鑽石',5,1,1,3,'2026-10-10T18:26:33.784Z'),
 ('t-b192bc54-06ca-44b8-aa8e-b86c755c56d2','cover/陳婉芬嵇龍生.jpg','GAR創辦人皇冠大使',5,1,7,2,'2026-10-10T15:23:00.681Z'),
 ('t-c31ea90c-e18b-431e-8d20-c74004c15065','cover/袁依雙陳治銘.jpg','鑽石',5,1,0,1,'2026-10-10T13:36:06.689Z'),
 ('t-c9e3b324-1fcf-479a-bd09-55b0d08d4b15','cover/呂志鋒.jpg','鑽石',5,1,0,0,'2026-10-11T07:59:05.066Z'),
 ('t-d10a3c5b-1313-4355-a1c1-7d08ee06034b','cover/陳怡傑黃雯佳.jpg','GAR執行專才鑽石',0,0,6,1,'2026-10-10T14:29:54.093Z'),
 ('t-e7ef3395-b2fe-4b26-8f1c-d1f8936ec3d3','cover/楊貫一鄭家華.jpg','皇冠',0,0,0,1,'2026-10-08T17:21:07.112Z'),
 ('t-e8aaa2c3-3dd0-494e-861c-52d01ff165e5','cover/張振輝.jpg','鑽石',0,0,1,1,'2026-10-08T17:23:20.679Z'),
 ('t-ec707137-744e-492b-a8c3-283ef9d8e37c','cover/南德NanthaKumar.jpg','鑽石',0,0,1,1,'2026-10-08T17:24:10.967Z'),
 ('t-ecc22090-f665-400d-bc47-50ce8648a718','cover/施素珍康家賓.png','皇冠',0,0,0,1,'2026-10-10T13:43:47.724Z'),
 ('t-ff2d497c-b02a-46e7-aea0-82d59633a063','cover/曾采婕陳泰榮.jpg','執行專才鑽石',5,1,0,2,'2026-10-08T17:11:38.428Z');
