-- Repeat runs now stop at an absolute time so they cannot loop forever.
ALTER TABLE schedules ADD COLUMN repeat_until INTEGER;

-- Clear any existing repeat schedules from before this change, which had no end
-- and would otherwise keep pinging.
DELETE FROM schedules WHERE repeat = 1;
