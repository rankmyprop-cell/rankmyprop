CREATE TABLE IF NOT EXISTS game_hint_uses (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  match_id TEXT NOT NULL,
  hint_number INTEGER NOT NULL CHECK (hint_number BETWEEN 1 AND 5),
  hint_kind TEXT NOT NULL CHECK (hint_kind IN ('move', 'threat')),
  coins_charged INTEGER NOT NULL DEFAULT 0 CHECK (coins_charged IN (0, 5)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(uid, match_id, hint_number)
);
CREATE INDEX IF NOT EXISTS idx_game_hint_uses_player ON game_hint_uses(uid, match_id, created_at DESC);
