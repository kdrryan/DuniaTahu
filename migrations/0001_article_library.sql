-- Ratio Article Library foundation.
-- This migration only adds new tables; it does not alter daily_facts.
-- Apply to a dedicated preview D1 database first. Never apply to production
-- until the migration has been reviewed and explicitly approved.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  code TEXT PRIMARY KEY CHECK (length(code) = 1 AND code GLOB '[A-Z]'),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  next_article_number INTEGER NOT NULL DEFAULT 1 CHECK (next_article_number >= 1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
  source_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  homepage_url TEXT NOT NULL,
  api_base_url TEXT,
  api_docs_url TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('institutional', 'research_index', 'encyclopedia', 'other')),
  license_policy TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'disabled')),
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  article_id TEXT PRIMARY KEY,
  category_code TEXT NOT NULL REFERENCES categories(code),
  category_sequence INTEGER NOT NULL CHECK (category_sequence >= 1),
  special_number INTEGER NOT NULL DEFAULT 0 CHECK (special_number >= 0),
  slug TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL CHECK (language IN ('id', 'en')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  content_blocks_json TEXT NOT NULL CHECK (json_valid(content_blocks_json)),
  cover_image_url TEXT,
  cover_image_alt TEXT,
  cover_image_creator TEXT,
  cover_image_source_url TEXT,
  cover_image_license TEXT,
  cover_image_license_url TEXT,
  cover_image_attribution TEXT,
  cover_image_verified_at TEXT,
  reading_time_minutes INTEGER NOT NULL DEFAULT 1 CHECK (reading_time_minutes >= 1),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'quality_check', 'published', 'needs_review', 'rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  UNIQUE(category_code, category_sequence, special_number),
  CHECK (
    cover_image_url IS NULL OR (
      cover_image_alt IS NOT NULL AND length(trim(cover_image_alt)) > 0
      AND cover_image_creator IS NOT NULL AND length(trim(cover_image_creator)) > 0
      AND cover_image_source_url IS NOT NULL
      AND cover_image_license IS NOT NULL AND length(trim(cover_image_license)) > 0
      AND cover_image_license_url IS NOT NULL
      AND cover_image_attribution IS NOT NULL AND length(trim(cover_image_attribution)) > 0
      AND cover_image_verified_at IS NOT NULL
    )
  ),
  CHECK (status != 'published' OR published_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS article_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
  source_key TEXT NOT NULL REFERENCES sources(source_key),
  source_url TEXT NOT NULL,
  source_title TEXT NOT NULL,
  citation_note TEXT,
  accessed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  UNIQUE(article_id, source_url)
);

CREATE TABLE IF NOT EXISTS article_versions (
  version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json)),
  change_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_articles_published
  ON articles(status, published_at DESC, article_id);

CREATE INDEX IF NOT EXISTS idx_articles_category
  ON articles(category_code, category_sequence);

CREATE INDEX IF NOT EXISTS idx_article_sources_article
  ON article_sources(article_id);

CREATE INDEX IF NOT EXISTS idx_article_versions_article
  ON article_versions(article_id, version_number DESC);

INSERT OR IGNORE INTO sources
  (source_key, display_name, homepage_url, api_base_url, api_docs_url, source_type, license_policy, status, is_active)
VALUES
  ('nasa', 'NASA', 'https://www.nasa.gov/', 'https://api.nasa.gov/', 'https://api.nasa.gov/', 'institutional', 'Review each asset and dataset terms; NASA material may include third-party exceptions and trademark restrictions.', 'proposed', 0),
  ('smithsonian', 'Smithsonian Open Access', 'https://www.si.edu/', 'https://api.si.edu/openaccess/api/v1.0/', 'https://www.si.edu/openaccess', 'institutional', 'Use only items explicitly marked CC0 or otherwise clearly licensed for the intended use; preserve required attribution.', 'proposed', 0),
  ('openalex', 'OpenAlex', 'https://openalex.org/', 'https://api.openalex.org/', 'https://docs.openalex.org/', 'research_index', 'Use metadata and open-access links according to their own licenses; OpenAlex metadata does not grant rights to full-text articles.', 'proposed', 0);
