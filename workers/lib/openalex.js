const OPENALEX_API_URL = 'https://api.openalex.org/works';
const OPENALEX_TIMEOUT_MS = 10000;

function cleanText(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function normalizeOpenAlexWork(work) {
  if (!work || typeof work !== 'object') return null;

  const authors = Array.isArray(work.authorships)
    ? work.authorships
        .map((entry) => cleanText(entry?.author?.display_name, 160))
        .filter(Boolean)
        .slice(0, 12)
    : [];

  const primaryLocation = work.primary_location || {};
  const source = primaryLocation.source || {};
  const openAccess = work.open_access || {};
  const ids = work.ids || {};

  return {
    openAlexId: cleanText(work.id, 300),
    title: cleanText(work.title, 500),
    publicationYear: Number.isInteger(work.publication_year)
      ? work.publication_year
      : null,
    type: cleanText(work.type, 80) || null,
    doi: cleanText(work.doi, 300) || cleanText(ids.doi, 300) || null,
    authors,
    citedByCount: Number.isFinite(work.cited_by_count)
      ? work.cited_by_count
      : 0,
    sourceName: cleanText(source.display_name, 200) || null,
    landingPageUrl: cleanText(primaryLocation.landing_page_url, 1000) || null,
    pdfUrl: cleanText(primaryLocation.pdf_url, 1000) || null,
    isOpenAccess: openAccess.is_oa === true,
    openAccessStatus: cleanText(openAccess.oa_status, 40) || null,
    openAccessLicense: cleanText(openAccess.license, 80) || null,
  };
}

export async function searchOpenAlexWorks(query, options = {}) {
  const normalizedQuery = cleanText(query, 200);
  if (normalizedQuery.length < 3) {
    throw new TypeError('OpenAlex search query must contain at least 3 characters.');
  }

  const requestedLimit = Number.parseInt(options.limit ?? 10, 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(10, Math.max(1, requestedLimit))
    : 10;

  const url = new URL(OPENALEX_API_URL);
  url.searchParams.set('search', normalizedQuery);
  url.searchParams.set('per-page', String(limit));
  url.searchParams.set(
    'select',
    'id,doi,title,publication_year,type,authorships,cited_by_count,primary_location,open_access,ids'
  );
  if (options.apiKey) url.searchParams.set('api_key', options.apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENALEX_TIMEOUT_MS);

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!upstream.ok) {
      throw new Error(`OpenAlex returned HTTP ${upstream.status}.`);
    }

    const payload = await upstream.json();
    const results = Array.isArray(payload.results)
      ? payload.results.map(normalizeOpenAlexWork).filter((item) => item?.title)
      : [];

    return {
      total: Number.isFinite(payload.meta?.count) ? payload.meta.count : results.length,
      results,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
