ALTER TABLE push_send_logs ADD COLUMN status TEXT NOT NULL DEFAULT 'queued';
ALTER TABLE push_send_logs ADD COLUMN error TEXT;
ALTER TABLE push_send_logs ADD COLUMN finished_at TEXT;
