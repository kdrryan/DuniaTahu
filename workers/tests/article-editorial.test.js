import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEditorialContent, validateEditorialOutput } from '../article-editorial.js';

const evidence = [
  { claim: 'The review identifies climate-related mental health pathways.', evidenceExcerpt: 'The present review describes several pathways linking climate change and mental health.' },
  { claim: 'The review is descriptive.', evidenceExcerpt: 'This systematic descriptive review summarizes the available literature.' },
  { claim: 'The review did not conduct a meta-analysis.', evidenceExcerpt: 'A limitation of the present descriptive review is the lack of a meta-analysis as a methodological completion of the systematic review.' },
];

const validOutput = {
  title: 'How Climate Change Can Affect Mental Health',
  summary: 'A careful look at the pathways discussed in a systematic descriptive review, and what its findings can and cannot tell us.',
  sections: [
    { heading: 'Why this connection matters', paragraphs: ['Climate change can affect more than physical surroundings. The review discusses several possible pathways connecting environmental disruption with mental health outcomes. [1]'] },
    { heading: 'What the review examined', paragraphs: ['The paper is a systematic descriptive review that brings together findings from existing literature. It does not establish that every person exposed to climate-related events will experience the same outcome. [1]'] },
    { heading: 'What the evidence suggests', paragraphs: ['The authors describe multiple pathways rather than a single universal mechanism. The findings should be understood within the scope of the studies reviewed. [1]'] },
    { heading: 'Important limits', paragraphs: ['The authors identify the absence of a meta-analysis as a methodological limitation. This means the review does not provide a pooled quantitative estimate across studies. [1]'] },
  ],
  verifiedClaims: [
    { claim: 'The review discusses several pathways.', evidenceIndex: 0, sectionIndex: 0 },
    { claim: 'The paper is a descriptive review.', evidenceIndex: 1, sectionIndex: 1 },
    { claim: 'The authors note the lack of meta-analysis.', evidenceIndex: 2, sectionIndex: 3 },
  ],
  editorialNote: 'Human editor should verify the framing, add context from additional primary sources, and review every paragraph before publication.',
};

test('accepts an editorial draft with evidence links to the approved review', () => {
  assert.deepEqual(validateEditorialOutput(validOutput, evidence), { valid: true, errors: [] });
});

test('rejects fabricated evidence indexes and missing editorial structure', () => {
  const invalid = structuredClone(validOutput);
  invalid.verifiedClaims[0].evidenceIndex = 99;
  invalid.sections = invalid.sections.slice(0, 2);
  const result = validateEditorialOutput(invalid, evidence);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('evidenceIndex')));
  assert.ok(result.errors.some((error) => error.includes('sections')));
});

test('requires every editorial paragraph to carry the source citation marker', () => {
  const uncited = structuredClone(validOutput);
  uncited.sections[0].paragraphs[0] = uncited.sections[0].paragraphs[0].replace(' [1]', '');
  const result = validateEditorialOutput(uncited, evidence);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('paragraphs')));
});

test('converts generated sections into markdown and structured article blocks', () => {
  const result = buildEditorialContent(validOutput);
  assert.match(result.contentMarkdown, /^## Why this connection matters/);
  assert.equal(result.contentBlocks[0].type, 'heading');
  assert.equal(result.contentBlocks[1].type, 'paragraph');
  assert.equal(result.contentBlocks.filter((block) => block.type === 'heading').length, 4);
});
