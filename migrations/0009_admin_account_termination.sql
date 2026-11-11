ALTER TABLE chat_users ADD COLUMN terminated_at TEXT;
ALTER TABLE chat_users ADD COLUMN terminated_by INTEGER REFERENCES chat_users(id);

