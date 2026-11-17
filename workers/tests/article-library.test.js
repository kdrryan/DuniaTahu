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
