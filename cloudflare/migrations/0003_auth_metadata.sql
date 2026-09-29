ALTER TABLE auth_users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE auth_users ADD COLUMN photo_url TEXT;
ALTER TABLE auth_users ADD COLUMN provider_data TEXT CHECK (provider_data IS NULL OR json_valid(provider_data));
ALTER TABLE auth_users ADD COLUMN last_signed_in_at TEXT;
