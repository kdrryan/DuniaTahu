import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractLicensedFullText,
  findMatchingPmcRecord,
  retainEvidenceBackedClaims,
  validateQualityOutput,
  downgradeUnverifiedPass,
  splitFullTextIntoChunks,
} from '../article-fulltext.js';

const xml = `<?xml version="1.0"?>
<article>
  <front><article-meta><permissions><license xlink:href="https://creativecommons.org/licenses/by/4.0/"><license-p>This is an open-access article distributed under the Creative Commons Attribution License (CC BY 4.0).</license-p></license></permissions></article-meta></front>
  <body><sec><title>Introduction</title><p>${'Climate change affects mental health in many different populations. '.repeat(20)}</p><p>Researchers describe several pathways and limitations.</p></sec><ref-list><ref>Excluded reference text</ref></ref-list></body>
</article>`;

test('matches a PMC converter record using top-level response status', () => {
  const record = findMatchingPmcRecord({
    status: 'ok',
    records: [{
      doi: '10.3389/fpsyt.2020.00074',
      pmcid: 'PMC7068211',
      pmid: 32210846,
      'requested-id': '10.3389/fpsyt.2020.00074',
    }],
  }, 'https://doi.org/10.3389/fpsyt.2020.00074');
  assert.equal(record?.pmcid, 'PMC7068211');
});

test('rejects PMC converter responses without top-level success or a matching PMCID', () => {
  assert.equal(findMatchingPmcRecord({
    records: [{ doi: '10.3389/fpsyt.2020.00074', pmcid: 'PMC7068211', status: 'ok' }],
  }, '10.3389/fpsyt.2020.00074'), null);
  assert.equal(findMatchingPmcRecord({
    status: 'error',
    records: [{ doi: '10.3389/fpsyt.2020.00074', pmcid: 'PMC7068211' }],
  }, '10.3389/fpsyt.2020.00074'), null);
  assert.equal(findMatchingPmcRecord({
    status: 'ok',
    records: [{ doi: '10.3389/fpsyt.2020.00074', pmcid: '32210846' }],
  }, '10.3389/fpsyt.2020.00074'), null);
  assert.equal(findMatchingPmcRecord({
    status: 'ok',
    records: [{ doi: '10.1000/not-the-same', pmcid: 'PMC7068211' }],
  }, '10.3389/fpsyt.2020.00074'), null);
});

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


test('accepts the canonical HTTP CC BY 4.0 license URI used by PMC records', () => {
  const httpLicense = xml.replace('https://creativecommons.org/licenses/by/4.0/', 'http://creativecommons.org/licenses/by/4.0/');
  const result = extractLicensedFullText(httpLicense);
  assert.equal(result.valid, true);
  assert.equal(result.license, 'CC BY 4.0');
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

test('allows empty quality flags when none were identified', () => {
  const fullText = 'Climate change affects mental health in many different populations, according to the review.';
  const result = validateQualityOutput({
    overallAssessment: 'The review is useful but has limitations.',
    researchQuestionAlignment: 'The article addresses the research question.',
    methodologyAssessment: 'The review methodology is described.',
    evidenceAssessment: 'The verified claim is supported by the supplied text.',
    keyClaims: [{
      claim: 'The review identifies mental health impacts.',
      evidenceExcerpt: 'Climate change affects mental health in many different populations',
      assessment: 'This statement appears directly in the article.',
    }],
    limitations: ['The review has a defined search period.'],
    qualityFlags: [],
    recommendations: ['Keep conclusions proportional to the review design.'],
    qualityDecision: 'pass',
    editorialReadiness: true,
  }, fullText);
  assert.deepEqual(result, { valid: true, errors: [] });
});

test('allows a non-passing review with no verified claims only when the evidence problem is disclosed', () => {
  const base = {
    overallAssessment: 'The review cannot be assessed confidently.',
    researchQuestionAlignment: 'Alignment is unclear.',
    methodologyAssessment: 'The supplied text does not provide enough detail.',
    evidenceAssessment: 'No claim could be verified with an exact excerpt.',
    keyClaims: [],
    limitations: ['The available evidence is insufficient.'],
    qualityFlags: ['No key claim could be matched to a verbatim passage in the supplied full text.'],
    recommendations: ['Require editorial review before using this source.'],
    qualityDecision: 'needs_revision',
    editorialReadiness: false,
  };
  assert.equal(validateQualityOutput(base, 'Article body text.').valid, true);
  assert.equal(validateQualityOutput({ ...base, qualityFlags: [] }, 'Article body text.').valid, false);
  assert.equal(validateQualityOutput({ ...base, qualityDecision: 'pass', editorialReadiness: true }, 'Article body text.').valid, false);
});

test('rejects malformed quality flags', () => {
  const fullText = 'Climate change affects mental health in many different populations, according to the review.';
  const result = validateQualityOutput({
    overallAssessment: 'Assessment.',
    researchQuestionAlignment: 'Aligned.',
    methodologyAssessment: 'Described.',
    evidenceAssessment: 'Supported.',
    keyClaims: [{
      claim: 'Claim.',
      evidenceExcerpt: 'Climate change affects mental health in many different populations',
      assessment: 'Supported.',
    }],
    limitations: ['A limitation.'],
    qualityFlags: ['  '],
    recommendations: ['A recommendation.'],
    qualityDecision: 'needs_revision',
    editorialReadiness: false,
  }, fullText);
  assert.equal(result.valid, false);
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


test('downgrades a pass when no evidence-backed claims survive verification', () => {
  const original = {
    overallAssessment: 'The article appears relevant.',
    researchQuestionAlignment: 'Aligned.',
    methodologyAssessment: 'Methods are described.',
    evidenceAssessment: 'Evidence needs checking.',
    limitations: ['Evidence excerpt could not be verified.'],
    qualityFlags: [],
    recommendations: [],
    keyClaims: [],
    qualityDecision: 'pass',
    editorialReadiness: true,
  };
  const result = downgradeUnverifiedPass(original, 'en');
  assert.equal(result.qualityDecision, 'needs_revision');
  assert.equal(result.editorialReadiness, false);
  assert.equal(result.qualityFlags.length, 1);
  assert.match(result.qualityFlags[0], /no key claim had a verifiable evidence excerpt/);
  assert.equal(result.recommendations.length, 1);
  assert.equal(original.qualityDecision, 'pass');
  assert.equal(validateQualityOutput(result, 'Article body text.').valid, true);
});

test('does not downgrade a pass that has verified evidence-backed claims', () => {
  const original = {
    qualityDecision: 'pass',
    editorialReadiness: true,
    keyClaims: [{ claim: 'A supported claim.', evidenceExcerpt: 'This is a sufficiently long exact excerpt.', assessment: 'Supported.' }],
  };
  const result = downgradeUnverifiedPass(original, 'en');
  assert.equal(result, original);
});


test('splits full text into bounded overlapping segments without gaps', () => {
  const source = 'a'.repeat(40000);
  const chunks = splitFullTextIntoChunks(source, 10000, 500);
  assert.equal(chunks.length, 5);
  assert.equal(chunks[0].start, 0);
  assert.equal(chunks[1].start, 9500);
  assert.ok(chunks[0].text.endsWith(chunks[1].text.slice(0, 500)));
  assert.equal(chunks.at(-1).start + chunks.at(-1).text.length, source.length);
});

test('caps segment count to protect Worker runtime and model usage', () => {
  const chunks = splitFullTextIntoChunks('a'.repeat(200000), 10000, 500);
  assert.equal(chunks.length, 6);
  assert.equal(chunks.at(-1).start, 47500);
});
