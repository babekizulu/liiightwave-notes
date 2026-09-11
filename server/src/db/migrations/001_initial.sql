CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL, content TEXT NOT NULL, subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','processing','ready','failed')),
  visual JSONB, error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY, note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','ready','failed')),
  claim_token UUID, started_at TIMESTAMPTZ, finished_at TIMESTAMPTZ, error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_job_per_note ON generation_jobs(note_id) WHERE status IN ('queued','processing');
CREATE INDEX IF NOT EXISTS jobs_queue ON generation_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS notes_updated ON notes(updated_at DESC);
