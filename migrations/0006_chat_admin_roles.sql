ALTER TABLE chat_users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_chat_users_admin ON chat_users(is_admin);
