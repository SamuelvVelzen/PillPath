ALTER TABLE medications ADD COLUMN cycle_on_days INTEGER NOT NULL DEFAULT 1;
ALTER TABLE medications ADD COLUMN cycle_off_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE medications ADD COLUMN cycle_start TEXT NOT NULL DEFAULT (date('now'));
