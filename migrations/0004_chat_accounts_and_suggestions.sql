CREATE TABLE IF NOT EXISTS chat_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  registration_ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_users_registration_ip ON chat_users(registration_ip_hash, created_at);
ALTER TABLE chat_messages ADD COLUMN user_id INTEGER REFERENCES chat_users(id);
CREATE INDEX IF NOT EXISTS idx_chat_user_created ON chat_messages(user_id, created_at);
CREATE TABLE IF NOT EXISTS chat_auth_attempts (
  ip_hash TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL DEFAULT (datetime('now')),
  blocked_until TEXT
);
CREATE TABLE IF NOT EXISTS game_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_suggestions_status_created ON game_suggestions(status, created_at);
