CREATE TABLE IF NOT EXISTS source_settings (
  id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1))
);
CREATE TABLE IF NOT EXISTS source_cache (
  id TEXT PRIMARY KEY,
  etag TEXT,
  modified TEXT
);
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title_key TEXT NOT NULL UNIQUE,
  source_id TEXT NOT NULL,
  category TEXT NOT NULL,
  published TEXT,
  score INTEGER NOT NULL,
  created TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data))
);
CREATE INDEX IF NOT EXISTS entries_recent ON entries (published DESC, score DESC);
CREATE INDEX IF NOT EXISTS entries_source ON entries (source_id);
CREATE TABLE IF NOT EXISTS analyses (
  entry_id TEXT PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  created TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data))
);
CREATE TABLE IF NOT EXISTS update_runs (
  id TEXT PRIMARY KEY,
  started TEXT NOT NULL,
  completed TEXT,
  status TEXT NOT NULL CHECK (json_valid(status))
);
CREATE INDEX IF NOT EXISTS update_recent ON update_runs (started DESC);
CREATE TABLE IF NOT EXISTS refresh_lease (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  holder TEXT NOT NULL,
  until_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  bucket TEXT NOT NULL,
  count INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  draft TEXT NOT NULL CHECK (json_valid(draft)),
  public_data TEXT CHECK (public_data IS NULL OR json_valid(public_data)),
  updated TEXT NOT NULL,
  published TEXT
);
CREATE TABLE IF NOT EXISTS ideas (
  entry_id TEXT PRIMARY KEY,
  data TEXT NOT NULL CHECK (json_valid(data)),
  updated TEXT NOT NULL
);
