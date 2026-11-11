CREATE TABLE IF NOT EXISTS site_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO site_settings (setting_key, setting_value) VALUES ('banner_enabled', '0');
INSERT OR IGNORE INTO site_settings (setting_key, setting_value) VALUES ('banner_message', '');

CREATE TABLE IF NOT EXISTS featured_games (
  slug TEXT PRIMARY KEY,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

UPDATE games SET published = 0, updated_at = datetime('now')
WHERE slug IN ('angry-birds', 'happywheels', 'yohoho');
DELETE FROM featured_games WHERE slug IN ('angry-birds', 'happywheels', 'yohoho');
