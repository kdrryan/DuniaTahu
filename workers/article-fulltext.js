const EUROPE_PMC_BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const MAX_FULL_TEXT_CHARS = 50000;

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
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const a = new Uint8Array(providedHash);
  const b = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripXml(value) {
  return decodeXml(value
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\?[^>]*\?>/g, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[\u00a0\t\r\n ]+/g, ' ')
    .trim();
}

export function extractLicensedFullText(xml) {
  if (typeof xml !== 'string' || !xml.trim()) {
    return { valid: false, error: 'Full-text XML is empty.' };
  }
  const licenseMatch = xml.match(/<license\b([^>]*)>([\s\S]*?)<\/license>/i);
  if (!licenseMatch) return { valid: false, error: 'The article license could not be verified.' };

  const hrefMatch = licenseMatch[1].match(/(?:xlink:)?href=["']([^"']+)["']/i);
  const licenseUrl = hrefMatch?.[1] || '';
  const licenseText = stripXml(licenseMatch[2]);
  const isCcBy40 = licenseUrl
    ? /^https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/?$/i.test(licenseUrl)
    : /creative commons attribution license \(cc by 4\.0\)/i.test(licenseText);
  if (!isCcBy40) {
    return { valid: false, error: 'The full-text license is not an approved CC BY 4.0 license.' };
  }

  const bodyMatch = xml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return { valid: false, error: 'The article body was not found.' };
  const body = bodyMatch[1]
    .replace(/<(?:ref-list|fig|table-wrap|supplementary-material|media|ack|fn-group)\b[\s\S]*?<\/(?:ref-list|fig|table-wrap|supplementary-material|media|ack|fn-group)>/gi, ' ')
    .replace(/<(?:graphic|inline-graphic)\b[^>]*\/?\s*>/gi, ' ');
  const text = stripXml(body).slice(0, MAX_FULL_TEXT_CHARS);
  if (text.length < 1000) {
    return { valid: false, error: 'The retrieved article body is too short for full-text review.' };
  }
  return {
    valid: true,
    text,
    license: 'CC BY 4.0',
    licenseUrl: licenseUrl || 'https://creativecommons.org/licenses/by/4.0/',
    characterCount: text.length,
    truncated: text.length >= MAX_FULL_TEXT_CHARS,
  };
}

export function retainEvidenceBackedClaims(value, fullText) {
  if (!value || !Array.isArray(value.keyClaims) || typeof fullText !== 'string') {
    return { claims: [], rejectedCount: 0 };
  }
  const normalizedText = fullText.replace(/\s+/g, ' ').toLocaleLowerCase();
  const claims = value.keyClaims.filter((claim) => {
    if (!claim || typeof claim.claim !== 'string' || !claim.claim.trim() ||
        typeof claim.evidenceExcerpt !== 'string' || !claim.evidenceExcerpt.trim() ||
        typeof claim.assessment !== 'string' || !claim.assessment.trim()) return false;
    const excerpt = claim.evidenceExcerpt.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    return excerpt.length >= 24 && normalizedText.includes(excerpt);
  });
  return { claims, rejectedCount: value.keyClaims.length - claims.length };
}

export function validateQualityOutput(value, fullText = '') {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, errors: ['Quality output must be an object.'] };
  }
  for (const key of ['overallAssessment', 'researchQuestionAlignment', 'methodologyAssessment', 'evidenceAssessment']) {
    if (typeof value[key] !== 'string' || !value[key].trim()) errors.push(key + ' is required.');
  }
  for (const key of ['limitations', 'qualityFlags', 'recommendations']) {
    if (!Array.isArray(value[key]) || value[key].length === 0 ||
        value[key].some((item) => typeof item !== 'string' || !item.trim())) {
      errors.push(key + ' must contain non-empty text items.');
    }
  }
  if (!Array.isArray(value.keyClaims) || value.keyClaims.length === 0) {
    errors.push('keyClaims must contain at least one evidence-backed claim.');
  } else {
    const normalizedText = fullText.replace(/\s+/g, ' ').toLocaleLowerCase();
    value.keyClaims.forEach((claim, index) => {
      if (!claim || typeof claim.claim !== 'string' || !claim.claim.trim() ||
          typeof claim.assessment !== 'string' || !claim.assessment.trim() ||
          typeof claim.evidenceExcerpt !== 'string' || claim.evidenceExcerpt.trim().length < 24) {
        errors.push('keyClaims[' + index + '] is incomplete.');
      } else if (fullText && !normalizedText.includes(claim.evidenceExcerpt.replace(/\s+/g, ' ').trim().toLocaleLowerCase())) {
        errors.push('keyClaims[' + index + '] evidence is not present in the full text.');
      }
    });
  }
  if (!['pass', 'needs_revision', 'reject'].includes(value.qualityDecision)) {
    errors.push('qualityDecision is invalid.');
  }
  if (typeof value.editorialReadiness !== 'boolean') errors.push('editorialReadiness must be boolean.');
  if (value.qualityDecision !== 'pass' && value.editorialReadiness === true) {
    errors.push('Editorial readiness cannot be true unless qualityDecision is pass.');
  }
  return { valid: errors.length === 0, errors };
}

async function fetchJson(url, label) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const result = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!result.ok) throw new Error(label + ' returned HTTP ' + result.status + '.');
    return await result.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchEuropePmcFullText(doi) {
  const searchUrl = new URL(EUROPE_PMC_BASE + '/search');
  searchUrl.searchParams.set('query', 'EXT_ID:' + doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, ''));
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('pageSize', '1');
  const search = await fetchJson(searchUrl, 'Europe PMC search');
  const record = search?.resultList?.result?.[0];
  const pmcid = typeof record?.pmcid === 'string' ? record.pmcid : '';
  if (!/^PMC\d+$/.test(pmcid) || record.isOpenAccess !== 'Y') {
    throw new Error('Europe PMC does not identify this work as an eligible open-access full-text article.');
  }
  const xmlUrl = EUROPE_PMC_BASE + '/' + pmcid + '/fullTextXML';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const result = await fetch(xmlUrl, { headers: { Accept: 'application/xml,text/xml' }, signal: controller.signal });
    if (!result.ok) throw new Error('Europe PMC full text returned HTTP ' + result.status + '.');
    const xml = await result.text();
    const extracted = extractLicensedFullText(xml);
    if (!extracted.valid) throw new Error(extracted.error);
    return { ...extracted, pmcid, sourceUrl: 'https://europepmc.org/articles/' + pmcid };
  } finally {
    clearTimeout(timeout);
  }
}

async function generateQualityReview(env, source, research, fullText, language) {
  if (!env.GEMINI_API_KEY) throw new Error('AI quality review is not configured.');
  const prompt = [
    'You are Ratio Research Quality Reviewer. Assess the full article text against the prior abstract-only research summary.',
    'Use only the supplied article text and prior research JSON. Do not add outside facts or invented methods, findings, citations, or page numbers.',
    'Treat the article authors\' statements as claims to assess, not as automatically proven facts.',
    'Check whether the prior research summary accurately represents the full article, whether methods and evidence support its claims, and what limitations or contradictions matter.',
    'Every keyClaims item must include an exact verbatim excerpt of at least 24 characters copied from the supplied full text.',
    'Do not reproduce long passages. Keep evidence excerpts short. Do not provide medical advice.',
    language === 'en' ? 'Write explanatory fields in clear English.' : 'Tulis semua penjelasan dalam Bahasa Indonesia yang jelas.',
    'Set qualityDecision to pass only when the source is sufficiently clear, the prior research is materially supported, and no critical unresolved issue remains. Otherwise use needs_revision or reject.',
    'editorialReadiness may be true only when qualityDecision is pass. A pass is not publication approval.',
    'Return JSON with: overallAssessment, researchQuestionAlignment, methodologyAssessment, evidenceAssessment, keyClaims[{claim,evidenceExcerpt,assessment}], limitations[], qualityFlags[], recommendations[], qualityDecision(pass|needs_revision|reject), editorialReadiness(boolean).',
    'SOURCE: ' + JSON.stringify({ title: source.title, doi: source.doi, pmcid: fullText.pmcid, license: fullText.license }),
    'ABSTRACT-ONLY RESEARCH: ' + JSON.stringify(research),
    'FULL ARTICLE TEXT:', fullText.text,
  ].join('\n\n');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' +
      GEMINI_MODEL + ':generateContent', {
      method: 'POST',
      headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'Be rigorous, transparent, evidence-bound, and conservative. Return valid JSON only.' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, responseMimeType: 'application/json', temperature: 0.1 },
      }),
      signal: controller.signal,
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) throw new Error('Gemini quality review returned HTTP ' + upstream.status + '.');
    const content = body?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!content) throw new Error('Gemini quality review returned no content.');
    return JSON.parse(content.replace(/^\uFEFF/, '').trim());
  } finally {
    clearTimeout(timeout);
  }
}

async function runFullTextReview(request, env) {
  if (!env.ARTICLE_ADMIN_TOKEN) return response({ error: 'Article management is not configured.' }, 503);
  const authorization = request.headers.get('Authorization') || '';
  if (!(await tokenMatches(authorization.startsWith('Bearer ') ? authorization.slice(7) : '', env.ARTICLE_ADMIN_TOKEN))) {
    return response({ error: 'Unauthorized.' }, 401);
  }
  if (!env.DB) return response({ error: 'Research storage is unavailable.' }, 503);
  const input = await request.json().catch(() => null);
  const openAlexId = input?.openAlexId;
  if (typeof openAlexId !== 'string' || !/^https:\/\/openalex\.org\/W\d+$/.test(openAlexId)) {
    return response({ error: 'A valid OpenAlex work ID is required.' }, 400);
  }
  const researchRow = await env.DB.prepare(
    'SELECT id, language, research_json, source_snapshot_json FROM article_research_runs WHERE openalex_id = ? ORDER BY created_at DESC, id DESC LIMIT 1'
  ).bind(openAlexId).first();
  if (!researchRow) return response({ error: 'Complete abstract research is required before full-text review.' }, 409);
  let research;
  let source;
  try {
    research = JSON.parse(researchRow.research_json);
    source = JSON.parse(researchRow.source_snapshot_json);
  } catch {
    return response({ error: 'The saved research record is invalid.' }, 500);
  }
  if (!source.doi) return response({ error: 'This source has no DOI for full-text matching.' }, 422);

  let fullText;
  try {
    fullText = await fetchEuropePmcFullText(source.doi);
  } catch (error) {
    console.error('Licensed full-text retrieval failed.', { name: error?.name || 'Error', message: error?.message || 'Unknown error' });
    return response({ error: 'A verifiable, licensed full text could not be retrieved. Manual review is required.' }, 422);
  }

  let quality;
  try {
    quality = await generateQualityReview(env, source, research, fullText, researchRow.language);
  } catch (error) {
    console.error('Full-text quality review failed.', { name: error?.name || 'Error' });
    return response({ error: 'Full-text quality review could not be completed right now.' }, 502);
  }
  const evidence = retainEvidenceBackedClaims(quality, fullText.text);
  quality.keyClaims = evidence.claims;
  quality.rejectedUnsupportedClaimCount = evidence.rejectedCount;
  const validation = validateQualityOutput(quality, fullText.text);
  if (!validation.valid) {
    console.error('Full-text quality output failed validation.', { errors: validation.errors });
    return response({ error: 'The quality review did not pass evidence validation.' }, 502);
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fullText.text));
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  try {
    const saved = await env.DB.prepare(
      'INSERT INTO article_fulltext_reviews (research_run_id, openalex_id, source_provider, pmcid, source_url, license, license_url, fulltext_sha256, fulltext_char_count, fulltext_snapshot_json, quality_json, review_status, model) VALUES (?, ?, \'europe_pmc\', ?, ?, ?, ?, ?, ?, ?, ?, \'completed\', ?) RETURNING id, created_at'
    ).bind(
      researchRow.id, openAlexId, fullText.pmcid, fullText.sourceUrl, fullText.license,
      fullText.licenseUrl, hash, fullText.characterCount,
      JSON.stringify({ text: fullText.text, truncated: fullText.truncated }),
      JSON.stringify(quality), 'google/' + GEMINI_MODEL
    ).first();
    return response({
      reviewId: saved.id,
      researchId: researchRow.id,
      openAlexId,
      status: 'completed',
      source: { provider: 'Europe PMC', pmcid: fullText.pmcid, url: fullText.sourceUrl, license: fullText.license, licenseUrl: fullText.licenseUrl },
      fullText: { characterCount: fullText.characterCount, truncated: fullText.truncated, sha256: hash },
      quality,
      createdAt: saved.created_at,
    }, 201);
  } catch (error) {
    console.error('Full-text quality review could not be saved.', { name: error?.name || 'Error' });
    return response({ error: 'The full-text quality review could not be saved.' }, 500);
  }
}

async function getLatestFullTextReview(request, env) {
  if (!env.ARTICLE_ADMIN_TOKEN) return response({ error: 'Article management is not configured.' }, 503);
  const authorization = request.headers.get('Authorization') || '';
  if (!(await tokenMatches(authorization.startsWith('Bearer ') ? authorization.slice(7) : '', env.ARTICLE_ADMIN_TOKEN))) {
    return response({ error: 'Unauthorized.' }, 401);
  }
  if (!env.DB) return response({ error: 'Research storage is unavailable.' }, 503);
  const openAlexId = new URL(request.url).searchParams.get('openAlexId') || '';
  if (!/^https:\/\/openalex\.org\/W\d+$/.test(openAlexId)) return response({ error: 'A valid OpenAlex work ID is required.' }, 400);
  const row = await env.DB.prepare(
    'SELECT id, research_run_id, source_provider, pmcid, source_url, license, license_url, fulltext_sha256, fulltext_char_count, quality_json, review_status, model, created_at FROM article_fulltext_reviews WHERE openalex_id = ? ORDER BY created_at DESC, id DESC LIMIT 1'
  ).bind(openAlexId).first();
  if (!row) return response({ error: 'No full-text review was found.' }, 404);
  let quality = {};
  try { quality = JSON.parse(row.quality_json); } catch { quality = {}; }
  return response({
    reviewId: row.id, researchId: row.research_run_id, openAlexId,
    status: row.review_status, model: row.model,
    source: { provider: row.source_provider, pmcid: row.pmcid, url: row.source_url, license: row.license, licenseUrl: row.license_url },
    fullText: { characterCount: row.fulltext_char_count, sha256: row.fulltext_sha256 },
    quality, createdAt: row.created_at,
  });
}

export async function handleArticleFullTextRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/admin/sources/openalex/fulltext-review') return null;
  if (request.method === 'POST') return runFullTextReview(request, env);
  if (request.method === 'GET') return getLatestFullTextReview(request, env);
  return null;
}
