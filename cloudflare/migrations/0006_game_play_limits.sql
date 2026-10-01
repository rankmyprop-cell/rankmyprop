CREATE TABLE IF NOT EXISTS game_play_sessions (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('quiz', 'snake', 'chess', 'ludo')),
  played_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_game_play_sessions_limit ON game_play_sessions(uid, game, played_at DESC);
