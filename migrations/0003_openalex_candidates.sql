-- OpenAlex candidate staging for the Ratio Knowledge Library.
-- Stores selected bibliographic metadata only; it never copies article text or PDFs.
-- Apply to the isolated Preview D1 database first.

CREATE TABLE IF NOT EXISTS openalex_candidates (
  openalex_id TEXT PRIMARY KEY,
  source_key TEXT NOT NULL DEFAULT 'openalex' REFERENCES sources(source_key),
  title TEXT NOT NULL,
  publication_year INTEGER,
  work_type TEXT,
  doi TEXT,
  authors_json TEXT NOT NULL CHECK (json_valid(authors_json)),
  cited_by_count INTEGER NOT NULL DEFAULT 0 CHECK (cited_by_count >= 0),
  source_name TEXT,
  landing_page_url TEXT,
  pdf_url TEXT,
  is_open_access INTEGER NOT NULL DEFAULT 0 CHECK (is_open_access IN (0, 1)),
  open_access_status TEXT,
  open_access_license TEXT,
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  candidate_status TEXT NOT NULL DEFAULT 'selected'
    CHECK (candidate_status IN ('selected', 'researching', 'drafted', 'rejected')),
  selected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_openalex_candidates_status
  ON openalex_candidates(candidate_status, selected_at DESC);

CREATE INDEX IF NOT EXISTS idx_openalex_candidates_year
  ON openalex_candidates(publication_year DESC);
