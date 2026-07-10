-- The worker is now the timer, and there is exactly one schedule. The old table
-- keyed rows by push endpoint, so a PWA reinstall left an orphan row pinging.
-- Schedules are disposable, so recreate rather than migrate.

DROP TABLE IF EXISTS schedules;

CREATE TABLE schedule (
  id          INTEGER PRIMARY KEY CHECK (id = 1),  -- exactly one row, enforced
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  fire_at     INTEGER NOT NULL,   -- epoch ms of the next ping
  interval_ms INTEGER NOT NULL,
  until       INTEGER NOT NULL,   -- epoch ms the run stops
  attempts    INTEGER NOT NULL DEFAULT 0
);
