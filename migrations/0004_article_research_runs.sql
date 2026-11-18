-- Research runs are separate from article drafts and never publish automatically.
-- Apply to the isolated Ratio Preview D1 database only.
CREATE TABLE IF NOT EXISTS article_research_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openalex_id TEXT NOT NULL REFERENCES openalex_candidates(openalex_id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('id', 'en')),
  research_status TEXT NOT NULL DEFAULT 'completed'
    CHECK (research_status IN ('completed', 'needs_review', 'failed')),
  model TEXT NOT NULL,
  source_snapshot_json TEXT NOT NULL CHECK (json_valid(source_snapshot_json)),
  research_json TEXT NOT NULL CHECK (json_valid(research_json)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_article_research_runs_candidate
  ON article_research_runs(openalex_id, created_at DESC);
