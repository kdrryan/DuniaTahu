import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractLicensedFullText,
  retainEvidenceBackedClaims,
  validateQualityOutput,
} from '../article-fulltext.js';

const xml = `<?xml version="1.0"?>
<article>
  <front><article-meta><permissions><license xlink:href="https://creativecommons.org/licenses/by/4.0/"><license-p>This is an open-access article distributed under the Creative Commons Attribution License (CC BY 4.0).</license-p></license></permissions></article-meta></front>
  <body><sec><title>Introduction</title><p>${'Climate change affects mental health in many different populations. '.repeat(20)}</p><p>Researchers describe several pathways and limitations.</p></sec><ref-list><ref>Excluded reference text</ref></ref-list></body>
</article>`;

test('extracts readable full text only when CC BY 4.0 is verified', () => {
  const result = extractLicensedFullText(xml);
  assert.equal(result.valid, true);
  assert.equal(result.license, 'CC BY 4.0');
  assert.ok(result.text.includes('Climate change affects mental health'));
  assert.equal(result.text.includes('Excluded reference text'), false);
});

test('rejects missing and non-approved licenses', () => {
  assert.equal(extractLicensedFullText('<article><body><p>Text</p></body></article>').valid, false);
  const restricted = xml.replace('creativecommons.org/licenses/by/4.0/', 'creativecommons.org/licenses/by-nc-nd/4.0/');
  assert.equal(extractLicensedFullText(restricted).valid, false);
});

test('rejects a short or missing article body', () => {
  const short = xml.replace('Climate change affects mental health in many different populations. '.repeat(20), 'Too short.');
  assert.equal(extractLicensedFullText(short).valid, false);
});

test('retains only claims with exact evidence excerpts in full text', () => {
  const text = 'Climate change affects mental health in many different populations, according to the review.';
  const result = retainEvidenceBackedClaims({
    keyClaims: [
      { claim: 'Supported', evidenceExcerpt: 'Climate change affects mental health in many different populations', assessment: 'Supported by the article.' },
      { claim: 'Invented', evidenceExcerpt: 'The article proves a 90 percent increase in disease', assessment: 'Unsupported.' },
    ],
  }, text);
  assert.equal(result.claims.length, 1);
  assert.equal(result.rejectedCount, 1);
});

test('validates a complete evidence-bound quality review', () => {
  const fullText = 'Climate change affects mental health in many different populations, according to the review.';
  const result = validateQualityOutput({
    overallAssessment: 'The review is useful but has limits.',
    researchQuestionAlignment: 'The article addresses the question.',
    methodologyAssessment: 'The abstract and body describe a systematic descriptive review.',
    evidenceAssessment: 'Claims are traceable to the supplied full text.',
    keyClaims: [{
      claim: 'The review identifies population-level impacts.',
      evidenceExcerpt: 'Climate change affects mental health in many different populations',
      assessment: 'This is explicitly stated in the source.',
    }],
    limitations: ['The review is limited by its search period.'],
    qualityFlags: ['The evidence base is heterogeneous.'],
    recommendations: ['Keep claims proportional to the review design.'],
    qualityDecision: 'needs_revision',
    editorialReadiness: false,
  }, fullText);
  assert.deepEqual(result, { valid: true, errors: [] });
});

test('does not allow editorial readiness for a non-passing review', () => {
  const result = validateQualityOutput({
    overallAssessment: 'Needs work.',
    researchQuestionAlignment: 'Partial.',
    methodologyAssessment: 'Insufficient detail.',
    evidenceAssessment: 'Some claims are unclear.',
    keyClaims: [{ claim: 'Claim', evidenceExcerpt: 'This excerpt is at least twenty four characters long.', assessment: 'Supported.' }],
    limitations: ['One limitation.'],
    qualityFlags: ['One flag.'],
    recommendations: ['One recommendation.'],
    qualityDecision: 'reject',
    editorialReadiness: true,
  }, 'This excerpt is at least twenty four characters long.');
  assert.equal(result.valid, false);
});
