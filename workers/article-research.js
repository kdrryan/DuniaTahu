import { normalizeOpenAlexWork } from './lib/openalex.js';

const WORKS_URL = 'https://api.openalex.org/works';
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

async function tokenMatches(provided, expected) {
  if (!provided || !expected) return false;
  const encoder = new TextEncoder();
  const hashes = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const a = new Uint8Array(hashes[0]);
  const b = new Uint8Array(hashes[1]);
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) difference |= a[i] ^ b[i];
  return difference === 0;
}

export function reconstructOpenAlexAbstract(index) {
  if (!index || typeof index !== 'object' || Array.isArray(index)) return '';
  const words = [];
  for (const [word, positions] of Object.entries(index)) {
    if (typeof word !== 'string' || !Array.isArray(positions)) continue;
    for (const position of positions) {
      if (Number.isInteger(position) && position >= 0 && position <= 100000) {
        words[position] = word;
      }
    }
  }
  return words.map((word) => typeof word === 'string' ? word : '')
    .join(' ').replace(/\s+/g, ' ').trim().slice(0, 30000);
}

export function retainEvidenceBackedFindings(value, abstract) {
  if (!value || !Array.isArray(value.keyFindings) || typeof abstract !== 'string') {
    return { findings: [], rejectedCount: 0 };
  }
  const normalizedAbstract = abstract.replace(/\s+/g, ' ').toLocaleLowerCase();
  const findings = value.keyFindings.filter((finding) => {
    if (!finding || typeof finding.claim !== 'string' || !finding.claim.trim() ||
        typeof finding.evidenceFromAbstract !== 'string' || !finding.evidenceFromAbstract.trim() ||
        !['high', 'medium', 'low'].includes(finding.confidence)) return false;
    const evidence = finding.evidenceFromAbstract.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    return normalizedAbstract.includes(evidence);
  });
  return { findings, rejectedCount: value.keyFindings.length - findings.length };
}

export function validateResearchOutput(value, abstract = '') {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, errors: ['Research output must be an object.'] };
  }
  for (const key of ['researchQuestion', 'abstractSummary', 'sourceAssessment']) {
    if (typeof value[key] !== 'string' || !value[key].trim()) errors.push(key + ' is required.');
  }
  for (const key of ['keyFindings', 'limitations']) {
    if (!Array.isArray(value[key]) || value[key].length === 0) errors.push(key + ' must contain at least one item.');
  }
  if (Array.isArray(value.keyFindings)) {
    value.keyFindings.forEach((finding, index) => {
      if (!finding || typeof finding.claim !== 'string' || !finding.claim.trim()) {
        errors.push('keyFindings[' + index + '].claim is required.');
      }
      if (!finding || typeof finding.evidenceFromAbstract !== 'string' || !finding.evidenceFromAbstract.trim()) {
        errors.push('keyFindings[' + index + '].evidenceFromAbstract is required.');
      }
      if (finding && typeof abstract === 'string' && abstract &&
          typeof finding.evidenceFromAbstract === 'string' && finding.evidenceFromAbstract.trim()) {
        const normalizedAbstract = abstract.replace(/\s+/g, ' ').toLocaleLowerCase();
        const normalizedEvidence = finding.evidenceFromAbstract.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
        if (!normalizedAbstract.includes(normalizedEvidence)) {
          errors.push('keyFindings[' + index + '].evidenceFromAbstract is not present in the source abstract.');
        }
      }
      if (!finding || !['high', 'medium', 'low'].includes(finding.confidence)) {
        errors.push('keyFindings[' + index + '].confidence is invalid.');
      }
    });
  }
  if (Array.isArray(value.limitations) &&
      value.limitations.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push('Every limitation must be a non-empty string.');
  }
  return { valid: errors.length === 0, errors };
}

async function fetchWork(openAlexId, apiKey) {
  if (typeof openAlexId !== 'string' || !/^https:\/\/openalex\.org\/W\d+$/.test(openAlexId)) {
    throw new TypeError('Invalid OpenAlex work ID.');
  }
  const workId = openAlexId.slice('https://openalex.org/'.length);
  const url = new URL(WORKS_URL + '/' + workId);
  url.searchParams.set('select', 'id,doi,title,publication_year,type,authorships,cited_by_count,primary_location,open_access,ids,abstract_inverted_index');
  if (apiKey) url.searchParams.set('api_key', apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!upstream.ok) {
      const error = new Error('OpenAlex returned HTTP ' + upstream.status + '.');
      error.status = upstream.status;
      throw error;
    }
    const payload = await upstream.json();
    const metadata = normalizeOpenAlexWork(payload);
    if (!metadata || !metadata.title || metadata.openAlexId !== openAlexId) {
      throw new Error('OpenAlex metadata is incomplete.');
    }
    return { metadata, abstract: reconstructOpenAlexAbstract(payload.abstract_inverted_index) };
  } finally {
    clearTimeout(timeout);
  }
}

async function generateResearch(env, metadata, abstract, language) {
  if (!env.GEMINI_API_KEY) throw new Error('AI research is not configured.');
  const prompt = [
    'Analyze only the research metadata and abstract supplied below. Do not claim to have read the full paper.',
    'Do not add outside facts, invented statistics, methods, results, or citations.',
    'If a detail is absent from the abstract, say it is not stated in the abstract.',
    'Every key finding must include a short exact evidence excerpt copied from the abstract. Never fabricate excerpts.',
    'Distinguish the authors\' claims from what can independently be concluded.',
    'Identify limitations visible from the abstract and limitations that cannot be assessed without full text.',
    'Do not provide medical advice or infer clinical recommendations.',
    language === 'en' ? 'Write all explanatory fields in clear English.' : 'Tulis semua bagian penjelasan dalam Bahasa Indonesia yang jelas.',
    'Return JSON with this exact shape:',
    '{"researchQuestion":"...","abstractSummary":"...","keyFindings":[{"claim":"...","evidenceFromAbstract":"short exact excerpt","confidence":"high|medium|low"}],"limitations":["..."],"sourceAssessment":"..."}',
    'SOURCE METADATA:',
    JSON.stringify({
      title: metadata.title, year: metadata.publicationYear, type: metadata.type,
      authors: metadata.authors, doi: metadata.doi, journal: metadata.sourceName,
      openAccess: metadata.isOpenAccess, openAccessStatus: metadata.openAccessStatus,
      openAccessLicense: metadata.openAccessLicense,
    }),
    'ABSTRACT:', abstract,
  ].join('\n\n');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' +
      GEMINI_MODEL + ':generateContent', {
      method: 'POST',
      headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are Ratio Research Assistant. Be evidence-bound, transparent about uncertainty, and never invent source details. Return valid JSON only.' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, responseMimeType: 'application/json', temperature: 0.2 },
      }),
      signal: controller.signal,
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.error('Gemini research request failed.', { status: upstream.status });
      throw new Error('AI research provider returned an error.');
    }
    const text = body && body.candidates && body.candidates[0] &&
      body.candidates[0].content && body.candidates[0].content.parts
      ? body.candidates[0].content.parts.map((part) => part.text || '').join('').trim()
      : '';
    if (!text) throw new Error('AI research returned no content.');
    return JSON.parse(text.replace(/^\uFEFF/, '').trim());
  } finally {
    clearTimeout(timeout);
  }
}

async function authorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return tokenMatches(token, env.ARTICLE_ADMIN_TOKEN);
}

async function runResearch(request, env) {
  if (!env.ARTICLE_ADMIN_TOKEN) return response({ error: 'Article management is not configured.' }, 503);
  if (!(await authorized(request, env))) return response({ error: 'Unauthorized.' }, 401);
  if (!env.DB) return response({ error: 'Research storage is unavailable.' }, 503);
  if (!env.GEMINI_API_KEY) return response({ error: 'AI research is not configured.' }, 503);
  const input = await request.json().catch(() => null);
  const openAlexId = input && input.openAlexId;
  const language = input && input.language === 'en' ? 'en' : 'id';
  if (typeof openAlexId !== 'string' || !/^https:\/\/openalex\.org\/W\d+$/.test(openAlexId)) {
    return response({ error: 'A valid OpenAlex work ID is required.' }, 400);
  }
  const candidate = await env.DB.prepare(
    'SELECT openalex_id FROM openalex_candidates WHERE openalex_id = ?'
  ).bind(openAlexId).first();
  if (!candidate) return response({ error: 'The selected research candidate was not found.' }, 404);

  let source;
  try {
    source = await fetchWork(openAlexId, env.OPENALEX_API_KEY);
  } catch (error) {
    console.error('OpenAlex research source could not be loaded.', {
      status: error && error.status || null, name: error && error.name || 'Error',
    });
    return response({ error: 'The research source could not be retrieved.' }, 502);
  }
  if (!source.abstract || source.abstract.length < 80) {
    return response({ error: 'This work has no usable abstract in OpenAlex. Full-text research is not available in this stage.' }, 422);
  }

  let research;
  try {
    research = await generateResearch(env, source.metadata, source.abstract, language);
  } catch (error) {
    console.error('AI research generation failed.', { name: error && error.name || 'Error' });
    return response({ error: 'AI research could not be completed right now.' }, 502);
  }
  const evidenceCheck = retainEvidenceBackedFindings(research, source.abstract);\n  research.keyFindings = evidenceCheck.findings;\n  research.rejectedUnsupportedFindingCount = evidenceCheck.rejectedCount;\n  const validation = validateResearchOutput(research, source.abstract);
  if (!validation.valid) {
    console.error('AI research output failed validation.', { errors: validation.errors });
    return response({ error: 'AI research returned an incomplete result.' }, 502);
  }

  research.fullTextReviewRequired = true;
  research.reviewScope = 'abstract_only';
  try {
    const saved = await env.DB.prepare(
      'INSERT INTO article_research_runs (openalex_id, language, research_status, model, source_snapshot_json, research_json) VALUES (?, ?, \'completed\', ?, ?, ?) RETURNING id, created_at'
    ).bind(
      openAlexId, language, 'google/' + GEMINI_MODEL,
      JSON.stringify({ ...source.metadata, abstract: source.abstract }),
      JSON.stringify(research)
    ).first();
    await env.DB.prepare(
      'UPDATE openalex_candidates SET candidate_status = \'researching\', updated_at = CURRENT_TIMESTAMP WHERE openalex_id = ? AND candidate_status = \'selected\''
    ).bind(openAlexId).run();
    return response({
      researchId: saved.id, openAlexId, status: 'completed',
      scope: 'abstract_only', fullTextReviewRequired: true,
      source: {
        title: source.metadata.title, doi: source.metadata.doi,
        publicationYear: source.metadata.publicationYear,
        sourceName: source.metadata.sourceName,
        landingPageUrl: source.metadata.landingPageUrl,
      },
      research, createdAt: saved.created_at,
    }, 201);
  } catch (error) {
    console.error('AI research result could not be saved.', { name: error && error.name || 'Error' });
    return response({ error: 'The research result could not be saved.' }, 500);
  }
}

async function getLatestResearch(request, env) {
  if (!env.ARTICLE_ADMIN_TOKEN) return response({ error: 'Article management is not configured.' }, 503);
  if (!(await authorized(request, env))) return response({ error: 'Unauthorized.' }, 401);
  if (!env.DB) return response({ error: 'Research storage is unavailable.' }, 503);
  const url = new URL(request.url);
  const openAlexId = url.searchParams.get('openAlexId') || '';
  if (!/^https:\/\/openalex\.org\/W\d+$/.test(openAlexId)) {
    return response({ error: 'A valid OpenAlex work ID is required.' }, 400);
  }
  const row = await env.DB.prepare(
    'SELECT id, language, research_status, model, source_snapshot_json, research_json, created_at FROM article_research_runs WHERE openalex_id = ? ORDER BY created_at DESC, id DESC LIMIT 1'
  ).bind(openAlexId).first();
  if (!row) return response({ error: 'No research run was found for this candidate.' }, 404);
  let research = {};
  let source = {};
  try { research = JSON.parse(row.research_json); } catch { research = {}; }
  try { source = JSON.parse(row.source_snapshot_json); } catch { source = {}; }
  return response({
    researchId: row.id, openAlexId, language: row.language,
    status: row.research_status, model: row.model,
    source: {
      title: source.title, doi: source.doi, publicationYear: source.publicationYear,
      sourceName: source.sourceName, landingPageUrl: source.landingPageUrl,
    },
    research, createdAt: row.created_at,
  });
}

export async function handleArticleResearchRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/admin/sources/openalex/research' && request.method === 'POST') {
    return runResearch(request, env);
  }
  if (url.pathname === '/api/admin/sources/openalex/research' && request.method === 'GET') {
    return getLatestResearch(request, env);
  }
  return null;
}
