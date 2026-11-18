-- Editorial drafts are generated only from a passing, non-truncated, evidence-verified full-text review.
-- Publisher source remains proposed/inactive; this does not approve it for general ingestion or publication.
INSERT OR IGNORE INTO sources
  (source_key, display_name, homepage_url, source_type, license_policy, status, is_active)
VALUES
  ('frontiers', 'Frontiers', 'https://www.frontiersin.org/', 'other',
   'The reviewed source article is CC BY 4.0. Verify the license and third-party material per article; this registry entry remains proposed and inactive.',
   'proposed', 0);

CREATE TABLE IF NOT EXISTS article_editorial_generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
  research_run_id INTEGER NOT NULL REFERENCES article_research_runs(id),
  fulltext_review_id INTEGER NOT NULL REFERENCES article_fulltext_reviews(id),
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  evidence_map_json TEXT NOT NULL CHECK (json_valid(evidence_map_json)),
  editorial_note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id)
);
CREATE INDEX IF NOT EXISTS idx_article_editorial_generations_research
  ON article_editorial_generations(research_run_id, created_at DESC);
