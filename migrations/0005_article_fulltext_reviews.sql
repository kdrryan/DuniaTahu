-- Full-text reviews are internal research artifacts, never publication approvals.
-- Only CC BY 4.0 full text retrieved through the approved Europe PMC API is stored.
-- Apply to the isolated Ratio Preview D1 database only.
CREATE TABLE IF NOT EXISTS article_fulltext_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  research_run_id INTEGER NOT NULL REFERENCES article_research_runs(id) ON DELETE CASCADE,
  openalex_id TEXT NOT NULL REFERENCES openalex_candidates(openalex_id) ON DELETE CASCADE,
  source_provider TEXT NOT NULL CHECK (source_provider = 'europe_pmc'),
  pmcid TEXT NOT NULL,
  source_url TEXT NOT NULL,
  license TEXT NOT NULL CHECK (license = 'CC BY 4.0'),
  license_url TEXT NOT NULL,
  fulltext_sha256 TEXT NOT NULL,
  fulltext_char_count INTEGER NOT NULL CHECK (fulltext_char_count >= 1000),
  fulltext_snapshot_json TEXT NOT NULL CHECK (json_valid(fulltext_snapshot_json)),
  quality_json TEXT NOT NULL CHECK (json_valid(quality_json)),
  review_status TEXT NOT NULL CHECK (review_status IN ('completed', 'needs_review', 'failed')),
  model TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_article_fulltext_reviews_candidate
  ON article_fulltext_reviews(openalex_id, created_at DESC);
