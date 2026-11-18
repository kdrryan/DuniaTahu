import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCitationText,
  normalizeCitationBlocks,
  markdownFromContentBlocks,
} from '../lib/article-citations.js';

test('replaces all numeric in-text markers with one registered source citation', () => {
  const input = 'The review covered several studies [0]. Heat-related risks were also reported [3]. [1]';
  assert.equal(
    normalizeCitationText(input),
    'The review covered several studies. Heat-related risks were also reported. [1]'
  );
});

test('normalization is idempotent and leaves non-paragraph blocks unchanged', () => {
  const blocks = [
    { type: 'heading', level: 2, content: 'Evidence' },
    { type: 'paragraph', content: 'A supported statement [9] [1]' },
  ];
  const normalized = normalizeCitationBlocks(blocks);
  assert.deepEqual(normalized, [
    { type: 'heading', level: 2, content: 'Evidence' },
    { type: 'paragraph', content: 'A supported statement [1]' },
  ]);
  assert.deepEqual(normalizeCitationBlocks(normalized), normalized);
});

test('rebuilds markdown from canonical content blocks', () => {
  const markdown = markdownFromContentBlocks([
    { type: 'heading', level: 2, content: 'Evidence' },
    { type: 'paragraph', content: 'A supported statement [0] [1]' },
  ]);
  assert.equal(markdown, '## Evidence\n\nA supported statement [1]');
});
