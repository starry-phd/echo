-- Starry Echo only. Central member profile data belongs to Starry central ID API.
-- Central D1 is planned as id-starry; it is NOT a binding of this Worker.
CREATE TABLE IF NOT EXISTS echo_tracks (
  id TEXT PRIMARY KEY, legacy_track_id TEXT UNIQUE, title TEXT NOT NULL,
  speaker TEXT NOT NULL DEFAULT '', description TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0, audio_key TEXT,
  category_labels_json TEXT NOT NULL DEFAULT '[]',
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','member','private')),
  migration_status TEXT NOT NULL DEFAULT 'pending' CHECK (migration_status IN ('pending','copied','verified')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_echo_tracks_access ON echo_tracks(visibility,migration_status);
CREATE TABLE IF NOT EXISTS echo_categories(name TEXT PRIMARY KEY,display_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS echo_playback_progress(central_user_id TEXT NOT NULL,track_id TEXT NOT NULL,position_seconds REAL NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(central_user_id,track_id));
CREATE TABLE IF NOT EXISTS echo_favorites(central_user_id TEXT NOT NULL,track_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(central_user_id,track_id));
CREATE TABLE IF NOT EXISTS echo_comments(id TEXT PRIMARY KEY,track_id TEXT NOT NULL,central_user_id TEXT NOT NULL,content TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS echo_migrations(key TEXT PRIMARY KEY,source_account_id TEXT,source_d1_name TEXT,source_r2_name TEXT,status TEXT NOT NULL DEFAULT 'pending',verified_at TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
