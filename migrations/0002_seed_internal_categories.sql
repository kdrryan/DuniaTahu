-- Approved internal Article Library taxonomy.
-- These categories are for editorial organization and Article IDs only.
-- They are not exposed as a user-facing category selector.

INSERT OR IGNORE INTO categories
  (code, name, slug, description, is_active, next_article_number)
VALUES
  ('S', 'Sains', 'sains', 'Fisika, kimia, matematika, dan fenomena sehari-hari.', 1, 1),
  ('N', 'Alam', 'alam', 'Hewan, tumbuhan, ekosistem, dan lingkungan.', 1, 1),
  ('H', 'Sejarah', 'sejarah', 'Peradaban, tokoh, peristiwa, dan sejarah dunia.', 1, 1),
  ('T', 'Teknologi', 'teknologi', 'Teknologi, komputer, mesin, dan inovasi.', 1, 1),
  ('B', 'Tubuh', 'tubuh', 'Anatomi, biologi manusia, dan kesehatan.', 1, 1),
  ('A', 'Angkasa', 'angkasa', 'Astronomi, planet, bintang, dan eksplorasi luar angkasa.', 1, 1);
