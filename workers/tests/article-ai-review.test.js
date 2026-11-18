import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAutomatedReview } from '../article-ai-review.js';

const source = 'The present review describes several pathways linking climate change and mental health. The authors state that this is a systematic descriptive review and not a meta-analysis.';

function passingReview(paragraphCount = 2) {
  return {
    decision: 'pass',
    overallScore: 94,
    checks: {
      factualAccuracy: 'pass',
      sourceFaithfulness: 'pass',
      citationIntegrity: 'pass',
      scientificNuance: 'pass',
      originality: 'pass',
      languageQuality: 'pass',
      structure: 'pass',
    },
    paragraphAudits: Array.from({ length: paragraphCount }, (_, index) => ({
      paragraphIndex: index,
      result: 'pass',
      claims: [{
        claim: 'The review describes pathways related to climate change and mental health.',
        supported: true,
        evidenceExcerpt: 'The present review describes several pathways linking climate change and mental health.',
      }],
      note: 'The paragraph is supported by the cited source.',
    })),
    findings: [],
    summary: 'All factual and editorial checks passed.',
  };
}

test('allows publication only when every check and paragraph passes with exact evidence', () => {
  const result = validateAutomatedReview(passingReview(), 2, source);
  assert.equal(result.valid, true);
  assert.equal(result.canPublish, true);
});

test('rejects a claimed pass when a paragraph was not audited', () => {
  const review = passingReview();
  review.paragraphAudits.pop();
  const result = validateAutomatedReview(review, 2, source);
  assert.equal(result.valid, false);
  assert.equal(result.canPublish, false);
});

test('rejects a claimed pass with an unsupported factual claim', () => {
  const review = passingReview();
  review.paragraphAudits[0].claims[0].supported = false;
  const result = validateAutomatedReview(review, 2, source);
  assert.equal(result.valid, true);
  assert.equal(result.canPublish, false);
  assert.equal(result.allClaimsSupported, false);
});

test('rejects invented evidence excerpts even when the model marks them supported', () => {
  const review = passingReview();
  review.paragraphAudits[0].claims[0].evidenceExcerpt = 'A fabricated quotation that never appears in the source.';
  const result = validateAutomatedReview(review, 2, source);
  assert.equal(result.valid, false);
  assert.equal(result.canPublish, false);
});

test('does not publish low-scoring or serious-findings reviews', () => {
  const lowScore = passingReview();
  lowScore.overallScore = 89;
  assert.equal(validateAutomatedReview(lowScore, 2, source).canPublish, false);

  const major = passingReview();
  major.findings = [{
    severity: 'major', paragraphIndex: 0,
    issue: 'A causal claim is not supported.',
    suggestedFix: 'Rewrite as an association.',
  }];
  assert.equal(validateAutomatedReview(major, 2, source).canPublish, false);
});

test('allows minor editorial notes while requiring all core checks to pass', () => {
  const review = passingReview();
  review.findings = [{
    severity: 'minor', paragraphIndex: 1,
    issue: 'A sentence could be shorter.',
    suggestedFix: 'Tighten the sentence.',
  }];
  assert.equal(validateAutomatedReview(review, 2, source).canPublish, true);
});

test('requires valid reviewer decisions and check statuses', () => {
  const review = passingReview();
  review.decision = 'approved';
  review.checks.factualAccuracy = 'unknown';
  const result = validateAutomatedReview(review, 2, source);
  assert.equal(result.valid, false);
});
