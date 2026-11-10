CREATE TABLE IF NOT EXISTS chat_word_blocklist (
  word TEXT PRIMARY KEY COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
