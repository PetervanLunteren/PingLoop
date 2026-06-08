-- One row per device (id = sha256 of the push endpoint), so a device has at
-- most one pending schedule. The cron queries by fire_at.
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  fire_at INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  repeat INTEGER NOT NULL,
  interval_ms INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_fire_at ON schedules (fire_at);
