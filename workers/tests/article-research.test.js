import test from 'node:test';
import assert from 'node:assert/strict';
import { reconstructOpenAlexAbstract, validateResearchOutput } from '../article-research.js';

test('reconstructs OpenAlex inverted abstracts in word order', () => {
  assert.equal(reconstructOpenAlexAbstract({
    climate: [0, 3], change: [1], affects: [2], people: [4],
  }), 'climate change affects climate people');
});

test('returns an empty abstract for missing or malformed indexes', () => {
  assert.equal(reconstructOpenAlexAbstract(null), '');
  assert.equal(reconstructOpenAlexAbstract([]), '');
  assert.equal(reconstructOpenAlexAbstract({ climate: 'not-an-array' }), '');
});

test('accepts a structured evidence-bound research result', () => {
  assert.deepEqual(validateResearchOutput({
    researchQuestion: 'How is the topic discussed in the abstract?',
    abstractSummary: 'The abstract describes a review.',
    keyFindings: [{
      claim: 'The authors present a review.',
      evidenceFromAbstract: 'a systematic descriptive review',
      confidence: 'high',
    }],
    limitations: ['The abstract does not provide full methodological detail.'],
    sourceAssessment: 'The source is a journal review article.',
  }), { valid: true, errors: [] });
});

test('rejects findings without traceable abstract evidence', () => {
  const result = validateResearchOutput({
    researchQuestion: 'Question', abstractSummary: 'Summary',
    keyFindings: [{ claim: 'Claim', evidenceFromAbstract: '', confidence: 'high' }],
    limitations: ['Unknown'], sourceAssessment: 'Assessment',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('evidenceFromAbstract')));
});

test('rejects evidence excerpts that do not occur in the source abstract', () => {
  const result = validateResearchOutput({
    researchQuestion: 'Question',
    abstractSummary: 'Summary',
    keyFindings: [{
      claim: 'Claim',
      evidenceFromAbstract: 'fabricated source excerpt',
      confidence: 'high',
    }],
    limitations: ['Unknown'],
    sourceAssessment: 'Assessment',
  }, 'The actual source abstract contains different words.');
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('not present in the source abstract')));
});
