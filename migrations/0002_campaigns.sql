-- Per-user campaign snapshots for Sete Anéis (Fase 3 persistência).
CREATE TABLE IF NOT EXISTS hella_campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Campanha',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hella_campaigns_user_id_idx ON hella_campaigns (user_id);
CREATE INDEX IF NOT EXISTS hella_campaigns_user_updated_idx ON hella_campaigns (user_id, updated_at DESC);
