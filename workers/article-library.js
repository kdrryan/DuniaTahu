import { formatArticleId } from './lib/article-id.js';
import { searchOpenAlexWorks } from './lib/openalex.js';
import { handleOpenAlexCandidateRequest } from './openalex-candidates.js';
import { handleArticleResearchRequest } from './article-research.js';
import { validateArticleDraft } from './lib/article-validation.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
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

function parseArticle(row, includeContent = false) {
  if (!row) return null;
  const article = {
    id: row.article_id,
    slug: row.slug,
    categoryCode: row.category_code,
    language: row.language,
    title: row.title,
    summary: row.summary,
    coverImage: row.cover_image_url ? {
      url: row.cover_image_url,
      alt: row.cover_image_alt,
      creator: row.cover_image_creator,
      sourceUrl: row.cover_image_source_url,
      license: row.cover_image_license,
      licenseUrl: row.cover_image_license_url,
      attribution: row.cover_image_attribution,
    } : null,
    readingTimeMinutes: row.reading_time_minutes,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };

  if (includeContent) {
    article.contentMarkdown = row.content_markdown;
    try {
      article.contentBlocks = JSON.parse(row.content_blocks_json);
    } catch {
      article.contentBlocks = [];
    }
  }

  return article;
}

async function listArticles(request, env) {
  if (!env.DB) return response({ error: 'Article library is unavailable.' }, 503);

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const offset = (page - 1) * limit;
  const language = url.searchParams.get('lang');
  const query = url.searchParams.get('q')?.trim().slice(0, 100);

  const conditions = ["status = 'published'"];
  const params = [];
  if (language === 'id' || language === 'en') {
    conditions.push('language = ?');
    params.push(language);
  }
  if (query) {
    conditions.push('(title LIKE ? OR summary LIKE ?)');
    params.push(`%${query}%`, `%${query}%`);
  }

  const where = conditions.join(' AND ');
  const [rows, count] = await Promise.all([
    env.DB.prepare(
      `SELECT article_id, slug, category_code, language, title, summary,
        cover_image_url, cover_image_alt, cover_image_creator,
        cover_image_source_url, cover_image_license, cover_image_license_url,
        cover_image_attribution, reading_time_minutes, published_at, updated_at
       FROM articles WHERE ${where}
       ORDER BY published_at DESC, article_id ASC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all(),
    env.DB.prepare(
      `SELECT COUNT(*) AS total FROM articles WHERE ${where}`
    ).bind(...params).first(),
  ]);

  return response({
    articles: (rows.results || []).map((row) => parseArticle(row)),
    pagination: {
      page,
      limit,
      total: count?.total || 0,
      totalPages: Math.ceil((count?.total || 0) / limit),
    },
  });
}

async function getArticle(articleId, env) {
  if (!env.DB) return response({ error: 'Article library is unavailable.' }, 503);
  if (!/^[A-Z]\d{3,}-\d{2}$/.test(articleId)) {
    return response({ error: 'Article not found.' }, 404);
  }

  const row = await env.DB.prepare(
    `SELECT * FROM articles WHERE article_id = ? AND status = 'published'`
  ).bind(articleId).first();

  if (!row) return response({ error: 'Article not found.' }, 404);

  const sources = await env.DB.prepare(
    `SELECT s.display_name, a.source_url, a.source_title, a.citation_note
     FROM article_sources a
     JOIN sources s ON s.source_key = a.source_key
     WHERE a.article_id = ?
     ORDER BY a.is_primary DESC, s.display_name ASC`
  ).bind(articleId).all();

  return response({
    article: {
      ...parseArticle(row, true),
      sources: sources.results || [],
    },
  });
}

async function createArticleDraft(request, env) {
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
  if (!env.DB) return response({ error: 'Article library is unavailable.' }, 503);

  const input = await request.json().catch(() => null);
  const validation = validateArticleDraft(input);
  if (!validation.valid) {
    return response({ error: 'Article draft is invalid.', details: validation.errors }, 400);
  }

  const categoryCode = input.categoryCode;
  const category = await env.DB.prepare(
    'SELECT code FROM categories WHERE code = ? AND is_active = 1'
  ).bind(categoryCode).first();
  if (!category) {
    return response({ error: 'The selected article category is not active.' }, 400);
  }

  const sourceKeys = [...new Set(input.sources.map((source) => source.sourceKey))];
  for (const sourceKey of sourceKeys) {
    const source = await env.DB.prepare(
      "SELECT source_key FROM sources WHERE source_key = ? AND status = 'active' AND is_active = 1"
    ).bind(sourceKey).first();
    if (!source) {
      return response({ error: `Source '${sourceKey}' is not approved for use.` }, 400);
    }
  }

  const allocation = await env.DB.prepare(
    `UPDATE categories
     SET next_article_number = next_article_number + 1, updated_at = CURRENT_TIMESTAMP
     WHERE code = ? AND is_active = 1
     RETURNING next_article_number - 1 AS category_sequence`
  ).bind(categoryCode).first();

  if (!allocation) {
    return response({ error: 'Unable to allocate an article ID.' }, 409);
  }

  const categorySequence = allocation.category_sequence;
  const specialNumber = 0;
  const articleId = formatArticleId(categoryCode, categorySequence, specialNumber);
  const slug = slugify(input.slug || input.title);
  if (!slug) return response({ error: 'A valid article slug is required.' }, 400);

  const existingSlug = await env.DB.prepare(
    'SELECT article_id FROM articles WHERE slug = ?'
  ).bind(slug).first();
  if (existingSlug) return response({ error: 'Article slug already exists.' }, 409);

  const image = input.coverImage || null;
  const snapshot = {
    articleId,
    categoryCode,
    categorySequence,
    specialNumber,
    slug,
    language: input.language,
    title: input.title.trim(),
    summary: input.summary.trim(),
    contentMarkdown: input.contentMarkdown,
    contentBlocks: input.contentBlocks,
    coverImage: image,
    readingTimeMinutes: Math.max(1, Math.round(Number(input.readingTimeMinutes) || 1)),
    status: 'draft',
  };

  const statements = [
    env.DB.prepare(
      `INSERT INTO articles (
        article_id, category_code, category_sequence, special_number, slug,
        language, title, summary, content_markdown, content_blocks_json,
        cover_image_url, cover_image_alt, cover_image_creator, cover_image_source_url,
        cover_image_license, cover_image_license_url, cover_image_attribution,
        cover_image_verified_at, reading_time_minutes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
    ).bind(
      articleId, categoryCode, categorySequence, specialNumber, slug,
      input.language, input.title.trim(), input.summary.trim(),
      input.contentMarkdown, JSON.stringify(input.contentBlocks),
      image?.url || null, image?.alt || null, image?.creator || null,
      image?.sourceUrl || null, image?.license || null, image?.licenseUrl || null,
      image?.attribution || null, image?.verifiedAt || null,
      snapshot.readingTimeMinutes
    ),
    ...input.sources.map((source) => env.DB.prepare(
      `INSERT INTO article_sources
       (article_id, source_key, source_url, source_title, citation_note, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      articleId, source.sourceKey, source.sourceUrl, source.sourceTitle.trim(),
      source.citationNote || null, source.isPrimary ? 1 : 0
    )),
    env.DB.prepare(
      `INSERT INTO article_versions
       (article_id, version_number, snapshot_json, change_reason)
       VALUES (?, 1, ?, 'Initial draft')`
    ).bind(articleId, JSON.stringify(snapshot)),
  ];

  try {
    await env.DB.batch(statements);
  } catch (error) {
    console.error('Article draft could not be saved.', error);
    return response({ error: 'The article draft could not be saved.' }, 500);
  }

  return response({ articleId, status: 'draft' }, 201);
}

async function searchOpenAlex(request, env) {
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

  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim().slice(0, 200);
  if (query.length < 3) {
    return response({ error: 'Search query must contain at least 3 characters.' }, 400);
  }

  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '10', 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(10, Math.max(1, requestedLimit))
    : 10;

  try {
    const result = await searchOpenAlexWorks(query, {
      apiKey: env.OPENALEX_API_KEY,
      limit,
    });
    return response({
      source: 'openalex',
      query,
      total: result.total,
      results: result.results,
    });
  } catch (error) {
    console.error('OpenAlex search failed.', {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown error',
      stage: error?.upstreamStage || 'unknown',
      status: error?.upstreamStatus || null,
      statusText: error?.upstreamStatusText || null,
      code: error?.code || null,
      upstreamBody: error?.upstreamBody || null,
    });
    return response({ error: 'OpenAlex search is temporarily unavailable.' }, 502);
  }
}

export async function handleArticleLibraryRequest(request, env) {
  const researchResponse = await handleArticleResearchRequest(request, env);
  if (researchResponse) return researchResponse;

  const candidateResponse = await handleOpenAlexCandidateRequest(request, env);
  if (candidateResponse) return candidateResponse;

  const url = new URL(request.url);

  if (url.pathname === '/api/articles' && request.method === 'GET') {
    return listArticles(request, env);
  }

  if (url.pathname.startsWith('/api/articles/') && request.method === 'GET') {
    const articleId = decodeURIComponent(url.pathname.slice('/api/articles/'.length));
    return getArticle(articleId, env);
  }

  if (url.pathname === '/api/admin/articles' && request.method === 'POST') {
    return createArticleDraft(request, env);
  }

  if (url.pathname === '/api/admin/sources/openalex/search' && request.method === 'GET') {
    return searchOpenAlex(request, env);
  }

  return null;
}
