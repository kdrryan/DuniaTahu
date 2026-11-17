import test from 'node:test';
import assert from 'node:assert/strict';
import { formatArticleId, parseArticleId } from '../lib/article-id.js';
import { validateArticleDraft } from '../lib/article-validation.js';

const validDraft = {
  categoryCode: 'S',
  language: 'en',
  title: 'Why the sky appears blue',
  summary: 'A concise explanation of how sunlight interacts with the atmosphere.',
  contentMarkdown: '## The short answer\n\nThe atmosphere scatters shorter wavelengths of visible light.',
  contentBlocks: [
    { type: 'heading', content: 'The short answer', level: 2 },
    { type: 'paragraph', content: 'The atmosphere scatters shorter wavelengths of visible light.' },
  ],
  sources: [
    {
      sourceKey: 'nasa',
      sourceUrl: 'https://science.nasa.gov/earth/',
      sourceTitle: 'Earth science',
      isPrimary: true,
    },
  ],
};

test('formats Article IDs with a three-digit sequence and two-digit special number', () => {
  assert.equal(formatArticleId('S', 1), 'S001-00');
  assert.equal(formatArticleId('H', 27, 4), 'H027-04');
  assert.equal(formatArticleId('A', 1000), 'A1000-00');
});

test('rejects invalid Article ID components', () => {
  assert.throws(() => formatArticleId('science', 1), TypeError);
  assert.throws(() => formatArticleId('S', 0), RangeError);
  assert.throws(() => formatArticleId('S', 1, 100), RangeError);
});

test('parses valid Article IDs and rejects malformed IDs', () => {
  assert.deepEqual(parseArticleId('S001-00'), {
    categoryCode: 'S',
    categorySequence: 1,
    specialNumber: 0,
  });
  assert.equal(parseArticleId('s001-00'), null);
  assert.equal(parseArticleId('S01-00'), null);
});

test('accepts a valid hybrid-content draft with a source reference', () => {
  assert.deepEqual(validateArticleDraft(validDraft), { valid: true, errors: [] });
});

test('rejects drafts without source references or valid category codes', () => {
  const result = validateArticleDraft({
    ...validDraft,
    categoryCode: 'science',
    sources: [],
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('categoryCode')));
  assert.ok(result.errors.some((error) => error.includes('source reference')));
});

test('rejects non-HTTPS image assets and missing license attribution', () => {
  const result = validateArticleDraft({
    ...validDraft,
    coverImage: {
      url: 'http://images.example.com/sky.jpg',
      alt: 'Blue sky',
      creator: 'Photographer',
      sourceUrl: 'https://images.example.com/source',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      attribution: 'Photo by Photographer, CC BY 4.0',
      verifiedAt: '2026-11-18T00:00:00.000Z',
    },
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('HTTPS')));
});

test('rejects Markdown image embeds and image blocks without license metadata', () => {
  const markdownImage = validateArticleDraft({
    ...validDraft,
    contentMarkdown: '![unverified](https://images.example.com/photo.jpg)',
  });
  assert.equal(markdownImage.valid, false);
  assert.ok(markdownImage.errors.some((error) => error.includes('Markdown images')));

  const unlicensedBlock = validateArticleDraft({
    ...validDraft,
    contentBlocks: [
      ...validDraft.contentBlocks,
      { type: 'image', image: { url: 'https://images.example.com/photo.jpg' } },
    ],
  });
  assert.equal(unlicensedBlock.valid, false);
  assert.ok(unlicensedBlock.errors.some((error) => error.includes('alt is required')));
});


test('normalizes OpenAlex work metadata without treating metadata as article text', async () => {
  const { normalizeOpenAlexWork } = await import('../lib/openalex.js');
  const normalized = normalizeOpenAlexWork({
    id: 'https://openalex.org/W123',
    title: 'A study of atmospheric scattering',
    publication_year: 2024,
    type: 'article',
    doi: 'https://doi.org/10.1234/example',
    authorships: [
      { author: { display_name: 'A. Researcher' } },
      { author: { display_name: 'B. Scientist' } },
    ],
    cited_by_count: 12,
    primary_location: {
      landing_page_url: 'https://example.org/paper',
      pdf_url: null,
      source: { display_name: 'Example Journal' },
    },
    open_access: { is_oa: true, oa_status: 'gold', license: 'cc-by' },
  });

  assert.equal(normalized.openAlexId, 'https://openalex.org/W123');
  assert.equal(normalized.title, 'A study of atmospheric scattering');
  assert.deepEqual(normalized.authors, ['A. Researcher', 'B. Scientist']);
  assert.equal(normalized.doi, 'https://doi.org/10.1234/example');
  assert.equal(normalized.isOpenAccess, true);
  assert.equal(normalized.openAccessLicense, 'cc-by');
  assert.equal('abstract' in normalized, false);
});

test('rejects OpenAlex search terms shorter than three characters', async () => {
  const { searchOpenAlexWorks } = await import('../lib/openalex.js');
  await assert.rejects(
    () => searchOpenAlexWorks('ab'),
    /at least 3 characters/
  );
});
