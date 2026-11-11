CREATE TABLE IF NOT EXISTS direct_message_clears (
  user_id INTEGER NOT NULL REFERENCES chat_users(id),
  peer_id INTEGER NOT NULL REFERENCES chat_users(id),
  cleared_through_id INTEGER NOT NULL DEFAULT 0,
  cleared_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, peer_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_clears_user
  ON direct_message_clears(user_id, peer_id);