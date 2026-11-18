import { normalizeOpenAlexWork } from './lib/openalex.js';

const OPENALEX_WORKS_URL = 'https://api.openalex.org/works';
const OPENALEX_TIMEOUT_MS = 10000;
const MAX_SELECTION_SIZE = 10;

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
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

export function isOpenAlexWorkId(value) {
  return typeof value === 'string' && /^https:\/\/openalex\.org\/W\d+$/.test(value);
}

export function validateOpenAlexSelection(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      !Array.isArray(input.openAlexIds)) {
    return { valid: false, ids: [], error: 'openAlexIds must be an array.' };
  }

  if (input.openAlexIds.length < 1 || input.openAlexIds.length > MAX_SELECTION_SIZE) {
    return {
      valid: false,
      ids: [],
      error: `Select between 1 and ${MAX_SELECTION_SIZE} works at a time.`,
    };
  }

  if (!input.openAlexIds.every(isOpenAlexWorkId)) {
    return { valid: false, ids: [], error: 'Every selection must be a valid OpenAlex work ID.' };
  }

  return { valid: true, ids: [...new Set(input.openAlexIds)], error: null };
}

async function fetchOpenAlexWork(openAlexId, apiKey) {
  if (!isOpenAlexWorkId(openAlexId)) {
    throw new TypeError('Invalid OpenAlex work ID.');
  }

  const workId = openAlexId.slice('https://openalex.org/'.length);
  const url = new URL(`${OPENALEX_WORKS_URL}/${workId}`);
  url.searchParams.set(
    'select',
    'id,doi,title,publication_year,type,authorships,cited_by_count,primary_location,open_access,ids'
  );
  if (apiKey) url.searchParams.set('api_key', apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENALEX_TIMEOUT_MS);

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!upstream.ok) {
      const error = new Error(`OpenAlex returned HTTP ${upstream.status}.`);
      error.upstreamStatus = upstream.status;
      throw error;
    }

    const work = normalizeOpenAlexWork(await upstream.json());
    if (!work?.title || work.openAlexId !== openAlexId) {
      throw new Error('OpenAlex returned incomplete work metadata.');
    }
    return work;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function listCandidates(request, env) {
  if (!env.DB) return response({ error: 'Candidate library is unavailable.' }, 503);

  const url = new URL(request.url);
  const requestedStatus = url.searchParams.get('status');
  const allowedStatuses = new Set(['selected', 'researching', 'drafted', 'rejected']);
  if (requestedStatus && !allowedStatuses.has(requestedStatus)) {
    return response({ error: 'Candidate status is invalid.' }, 400);
  }

  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(50, Math.max(1, requestedLimit))
    : 20;
  const query = requestedStatus
    ? env.DB.prepare(
      `SELECT openalex_id, title, publication_year, work_type, doi, authors_json,
        cited_by_count, source_name, landing_page_url, pdf_url, is_open_access,
        open_access_status, open_access_license, candidate_status, selected_at,
        updated_at, metadata_json
       FROM openalex_candidates WHERE candidate_status = ?
       ORDER BY selected_at DESC LIMIT ?`
    ).bind(requestedStatus, limit)
    : env.DB.prepare(
      `SELECT openalex_id, title, publication_year, work_type, doi, authors_json,
        cited_by_count, source_name, landing_page_url, pdf_url, is_open_access,
        open_access_status, open_access_license, candidate_status, selected_at,
        updated_at, metadata_json
       FROM openalex_candidates
       ORDER BY selected_at DESC LIMIT ?`
    ).bind(limit);

  const result = await query.all();
  const candidates = (result.results || []).map((row) => {
    let metadata = {};
    try {
      metadata = JSON.parse(row.metadata_json);
    } catch {
      metadata = {};
    }
    let authors = [];
    try {
      authors = JSON.parse(row.authors_json);
    } catch {
      authors = [];
    }
    return {
      ...metadata,
      openAlexId: row.openalex_id,
      authors,
      candidateStatus: row.candidate_status,
      selectedAt: row.selected_at,
      updatedAt: row.updated_at,
    };
  });

  return response({ source: 'openalex', candidates, count: candidates.length });
}

async function saveCandidates(request, env) {
  if (!env.DB) return response({ error: 'Candidate library is unavailable.' }, 503);

  const input = await request.json().catch(() => null);
  const selection = validateOpenAlexSelection(input);
  if (!selection.valid) {
    return response({ error: selection.error }, 400);
  }

  let works;
  try {
    works = await Promise.all(
      selection.ids.map((id) => fetchOpenAlexWork(id, env.OPENALEX_API_KEY))
    );
  } catch (error) {
    console.error('Selected OpenAlex metadata could not be verified.', {
      name: error?.name || 'Error',
      status: error?.upstreamStatus || null,
    });
    return response({ error: 'Selected research records could not be verified right now.' }, 502);
  }

  const saved = [];
  const alreadySelected = [];
  try {
    for (const work of works) {
      const result = await env.DB.prepare(
        `INSERT INTO openalex_candidates (
          openalex_id, title, publication_year, work_type, doi, authors_json,
          cited_by_count, source_name, landing_page_url, pdf_url, is_open_access,
          open_access_status, open_access_license, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(openalex_id) DO NOTHING`
      ).bind(
        work.openAlexId,
        work.title,
        work.publicationYear,
        work.type,
        work.doi,
        JSON.stringify(work.authors),
        work.citedByCount,
        work.sourceName,
        work.landingPageUrl,
        work.pdfUrl,
        work.isOpenAccess ? 1 : 0,
        work.openAccessStatus,
        work.openAccessLicense,
        JSON.stringify(work)
      ).run();

      if (Number(result.meta?.changes || 0) > 0) {
        saved.push(work.openAlexId);
      } else {
        alreadySelected.push(work.openAlexId);
      }
    }
  } catch (error) {
    console.error('OpenAlex candidate records could not be saved.', error);
    return response({ error: 'Selected research records could not be saved.' }, 500);
  }

  return response({
    source: 'openalex',
    saved,
    alreadySelected,
    countSaved: saved.length,
    countAlreadySelected: alreadySelected.length,
  }, 201);
}

export async function handleOpenAlexCandidateRequest(request, env) {
  const url = new URL(request.url);
  const isCandidatePath = url.pathname === '/api/admin/sources/openalex/candidates';
  if (!isCandidatePath || !['GET', 'POST'].includes(request.method)) return null;

  if (!env.ARTICLE_ADMIN_TOKEN) {
    return response({ error: 'Article management is not configured.' }, 503);
  }

  const authorization = request.headers.get('Authorization') || '';
  const providedToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';
  if (!(await tokenMatches(providedToken, env.ARTICLE_ADMIN_TOKEN))) {
    return response({ error: 'Unauthorized.' }, 401);
  }

  if (request.method === 'GET') return listCandidates(request, env);
  return saveCandidates(request, env);
}
