-- Echo-owned task prices. Never writes Starry ID's tables or D1 database.
-- Apply using Echo's existing D1 migration procedure when the App backend is released.
CREATE TABLE IF NOT EXISTS echo_battery_task_prices (
 task_type TEXT PRIMARY KEY NOT NULL CHECK (substr(task_type,1,5)='echo.'),
 task_label TEXT NOT NULL CHECK (length(task_label) BETWEEN 1 AND 40),
 units INTEGER NOT NULL CHECK (units BETWEEN 1 AND 100),
 updated_at INTEGER NOT NULL,
 updated_by_user_id TEXT NOT NULL
);
INSERT OR IGNORE INTO echo_battery_task_prices
 (task_type,task_label,units,updated_at,updated_by_user_id)
 VALUES ('echo.ai','AI 任務',1,0,'system');
