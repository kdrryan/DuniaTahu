-- Automated AI editorial reviews and evidence-based publication gate.
-- Apply only to the isolated Ratio Preview D1 database before deploying the reviewer Worker.
CREATE TABLE IF NOT EXISTS article_ai_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  reviewer_model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  review_status TEXT NOT NULL
    CHECK (review_status IN ('passed', 'revision_required', 'rejected', 'error')),
  overall_score INTEGER CHECK (overall_score IS NULL OR overall_score BETWEEN 0 AND 100),
  review_json TEXT NOT NULL CHECK (json_valid(review_json)),
  reviewed_content_sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, attempt_number)
);
CREATE INDEX IF NOT EXISTS idx_article_ai_reviews_article
  ON article_ai_reviews(article_id, created_at DESC);
