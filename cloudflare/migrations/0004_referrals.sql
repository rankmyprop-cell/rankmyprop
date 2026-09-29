CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_claims (
  id TEXT PRIMARY KEY,
  referrer_uid TEXT NOT NULL,
  referred_uid TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  referred_email TEXT,
  referred_name TEXT,
  referred_photo_url TEXT,
  reward_coins INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'credited',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_referral_claims_referrer ON referral_claims(referrer_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS referral_wallets (
  uid TEXT PRIMARY KEY,
  balance_coins INTEGER NOT NULL DEFAULT 0 CHECK (balance_coins >= 0),
  earned_coins INTEGER NOT NULL DEFAULT 0,
  spent_coins INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_ledger (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  amount_coins INTEGER NOT NULL,
  type TEXT NOT NULL,
  related_uid TEXT,
  related_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, related_uid),
  UNIQUE(type, related_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_ledger_uid ON referral_ledger(uid, created_at DESC);

CREATE TABLE IF NOT EXISTS referral_withdrawals (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  coins INTEGER NOT NULL CHECK (coins >= 1000),
  amount_inr REAL NOT NULL,
  method TEXT NOT NULL,
  payout_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_status ON referral_withdrawals(status, created_at DESC);

CREATE TABLE IF NOT EXISTS referral_purchase_credits (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  coins INTEGER NOT NULL CHECK (coins > 0),
  amount_inr REAL NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Ready',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  redeemed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_referral_purchase_credits_uid ON referral_purchase_credits(uid, created_at DESC);
