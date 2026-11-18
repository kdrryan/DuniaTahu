import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOpenAlexWorkId,
  validateOpenAlexSelection,
} from '../openalex-candidates.js';

test('accepts canonical OpenAlex work IDs', () => {
  assert.equal(isOpenAlexWorkId('https://openalex.org/W4246438352'), true);
  assert.equal(isOpenAlexWorkId('https://example.org/W4246438352'), false);
  assert.equal(isOpenAlexWorkId('https://openalex.org/authors/A123'), false);
});

test('validates and deduplicates a selected OpenAlex work list', () => {
  const id = 'https://openalex.org/W4246438352';
  assert.deepEqual(validateOpenAlexSelection({ openAlexIds: [id, id] }), {
    valid: true,
    ids: [id],
    error: null,
  });
});

test('rejects empty, oversized, and untrusted OpenAlex selections', () => {
  assert.equal(validateOpenAlexSelection({ openAlexIds: [] }).valid, false);
  assert.equal(validateOpenAlexSelection({
    openAlexIds: Array.from({ length: 11 }, (_, index) => `https://openalex.org/W${index + 1}`),
  }).valid, false);
  assert.equal(validateOpenAlexSelection({
    openAlexIds: ['https://attacker.example/W123'],
  }).valid, false);
  assert.equal(validateOpenAlexSelection(null).valid, false);
});
