CREATE TABLE IF NOT EXISTS direct_message_pins (
  user_id INTEGER NOT NULL REFERENCES chat_users(id),
  peer_id INTEGER NOT NULL REFERENCES chat_users(id),
  pinned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, peer_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_pins_user ON direct_message_pins(user_id, pinned_at);

CREATE TABLE IF NOT EXISTS chat_push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES chat_users(id),
  endpoint TEXT NOT NULL UNIQUE,
  subscription_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_push_user ON chat_push_subscriptions(user_id);
