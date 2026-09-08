CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('helper', 'primary')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('as_needed', 'daily')),
  unit TEXT NOT NULL DEFAULT 'pills',
  max_amount REAL,
  window_hours INTEGER,
  target_dose REAL,
  previous_dose REAL,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable') OR trend IS NULL),
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doses (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  logged_by TEXT NOT NULL REFERENCES people(id),
  amount REAL NOT NULL,
  taken_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doses_med_taken ON doses(medication_id, taken_at);
CREATE INDEX IF NOT EXISTS idx_doses_taken ON doses(taken_at);

INSERT OR IGNORE INTO people (id, name, role, created_at) VALUES
  ('person-samuel', 'Samuel', 'helper', datetime('now')),
  ('person-partner', 'Partner', 'primary', datetime('now'));
