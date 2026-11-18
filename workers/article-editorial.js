const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const PROMPT_VERSION = 'ratio-editorial-v1';

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
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

function normalizeEvidence(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

export function validateEditorialOutput(value, evidenceClaims) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, errors: ['Editorial output must be an object.'] };
  }
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 180) {
    errors.push('title must be a non-empty string of at most 180 characters.');
  }
  if (typeof value.summary !== 'string' || !value.summary.trim() || value.summary.length > 500) {
    errors.push('summary must be a non-empty string of at most 500 characters.');
  }
  if (!Array.isArray(value.sections) || value.sections.length < 4 || value.sections.length > 8) {
    errors.push('sections must contain between 4 and 8 sections.');
  } else {
    value.sections.forEach((section, index) => {
      if (!section || typeof section.heading !== 'string' || !section.heading.trim()) {
        errors.push('sections[' + index + '].heading is required.');
      }
      if (!section || !Array.isArray(section.paragraphs) || section.paragraphs.length < 1 ||
          section.paragraphs.length > 3 ||
          section.paragraphs.some((paragraph) => typeof paragraph !== 'string' ||
            paragraph.trim().length < 40 || paragraph.length > 1800)) {
        errors.push('sections[' + index + '].paragraphs must contain 1 to 3 substantive paragraphs.');
      }
    });
  }
  if (!Array.isArray(value.verifiedClaims) || value.verifiedClaims.length < 3 ||
      value.verifiedClaims.length > 8) {
    errors.push('verifiedClaims must contain between 3 and 8 evidence-linked claims.');
  } else {
    value.verifiedClaims.forEach((claim, index) => {
      if (!claim || typeof claim.claim !== 'string' || !claim.claim.trim()) {
        errors.push('verifiedClaims[' + index + '].claim is required.');
      }
      if (!Number.isInteger(claim?.evidenceIndex) || claim.evidenceIndex < 0 ||
          claim.evidenceIndex >= evidenceClaims.length) {
        errors.push('verifiedClaims[' + index + '].evidenceIndex is invalid.');
      }
      if (!Number.isInteger(claim?.sectionIndex) || claim.sectionIndex < 0 ||
          claim.sectionIndex >= (Array.isArray(value.sections) ? value.sections.length : 0)) {
        errors.push('verifiedClaims[' + index + '].sectionIndex is invalid.');
      }
    });
  }
  if (typeof value.editorialNote !== 'string' || !value.editorialNote.trim()) {
    errors.push('editorialNote is required.');
  }
  return { valid: errors.length === 0, errors };
}

export function buildEditorialContent(value) {
  const blocks = [];
  const markdown = [];
  for (const section of value.sections) {
    blocks.push({ type: 'heading', content: section.heading, level: 2 });
    markdown.push('## ' + section.heading);
    for (const paragraph of section.paragraphs) {
      blocks.push({ type: 'paragraph', content: paragraph });
      markdown.push(paragraph);
    }
    markdown.push('');
  }
  return { contentMarkdown: markdown.join('\n').trim(), contentBlocks: blocks };
}

async function callGemini(env, prompt) {
  if (!env.GEMINI_API_KEY) throw new Error('Editorial generation is not configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const upstream = await fetch(GEMINI_URL + '/' + GEMINI_MODEL + ':generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': env.GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: 'You are Ratio Editorial Writer. Create original, careful educational journalism from the supplied research evidence. Never invent facts, sources, quotations, statistics, or causal claims. Do not reproduce source wording. Return valid JSON only.',
          }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.error('Editorial Gemini request failed.', { status: upstream.status });
      throw new Error('Editorial AI provider returned an error.');
    }
    const text = body?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '').join('').trim();
    if (!text) throw new Error('Editorial AI returned no content.');
    return JSON.parse(text.replace(/^\uFEFF/, '').trim());
  } finally {
    clearTimeout(timeout);
  }
}

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}

function countWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

async function runEditorialDraft(request, env) {
  if (!env.ARTICLE_ADMIN_TOKEN) return response({ error: 'Article management is not configured.' }, 503);
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!(await tokenMatches(token, env.ARTICLE_ADMIN_TOKEN))) return response({ error: 'Unauthorized.' }, 401);
  if (!env.DB || !env.GEMINI_API_KEY) return response({ error: 'Editorial generation is unavailable.' }, 503);

  const input = await request.json().catch(() => null);
  const openAlexId = input?.openAlexId;
  const categoryCode = input?.categoryCode;
  if (typeof openAlexId !== 'string' || !/^https:\/\/openalex\.org\/W\d+$/.test(openAlexId)) {
    return response({ error: 'A valid OpenAlex work ID is required.' }, 400);
  }
  if (typeof categoryCode !== 'string' || !/^[A-Z]$/.test(categoryCode)) {
    return response({ error: 'A valid internal article category code is required.' }, 400);
  }

  const category = await env.DB.prepare(
    'SELECT code FROM categories WHERE code = ? AND is_active = 1'
  ).bind(categoryCode).first();
  if (!category) return response({ error: 'The selected internal category is not active.' }, 400);

  const researchRow = await env.DB.prepare(
    'SELECT id, language, research_status, source_snapshot_json, research_json FROM article_research_runs WHERE openalex_id = ? ORDER BY created_at DESC, id DESC LIMIT 1'
  ).bind(openAlexId).first();
  if (!researchRow || researchRow.research_status !== 'completed') {
    return response({ error: 'A completed abstract research run is required.' }, 409);
  }

  const reviewRow = await env.DB.prepare(
    'SELECT id, research_run_id, source_provider, source_url, license, license_url, fulltext_sha256, fulltext_snapshot_json, quality_json, review_status FROM article_fulltext_reviews WHERE openalex_id = ? ORDER BY created_at DESC, id DESC LIMIT 1'
  ).bind(openAlexId).first();
  if (!reviewRow || reviewRow.review_status !== 'completed' ||
      reviewRow.research_run_id !== researchRow.id) {
    return response({ error: 'A full-text review for the latest research run is required.' }, 409);
  }

  let source;
  let research;
  let fullTextSnapshot;
  let quality;
  try {
    source = JSON.parse(researchRow.source_snapshot_json);
    research = JSON.parse(researchRow.research_json);
    fullTextSnapshot = JSON.parse(reviewRow.fulltext_snapshot_json);
    quality = JSON.parse(reviewRow.quality_json);
  } catch {
    return response({ error: 'The saved research evidence is invalid.' }, 500);
  }

  if (quality.qualityDecision !== 'pass' || quality.editorialReadiness !== true ||
      fullTextSnapshot.truncated !== false || typeof fullTextSnapshot.text !== 'string' ||
      fullTextSnapshot.text.length < 1000 || reviewRow.license !== 'CC BY 4.0') {
    return response({ error: 'The source has not passed the required full-text and license checks.' }, 409);
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fullTextSnapshot.text));
  const actualHash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (actualHash !== reviewRow.fulltext_sha256) {
    return response({ error: 'The stored source text no longer matches its verified checksum.' }, 409);
  }

  const evidenceClaims = Array.isArray(quality.keyClaims) ? quality.keyClaims : [];
  const normalizedFullText = normalizeEvidence(fullTextSnapshot.text);
  const verifiedEvidence = evidenceClaims.filter((claim) =>
    claim && typeof claim.claim === 'string' &&
    typeof claim.evidenceExcerpt === 'string' &&
    normalizeEvidence(claim.evidenceExcerpt).length >= 24 &&
    normalizedFullText.includes(normalizeEvidence(claim.evidenceExcerpt))
  );
  if (verifiedEvidence.length < 3) {
    return response({ error: 'At least three evidence-backed claims are required before editorial drafting.' }, 409);
  }

  const language = input.language === 'en' ? 'en' : input.language === 'id' ? 'id' : researchRow.language;
  const prompt = [
    'Create an original Ratio educational feature article. This is a fresh editorial explanation, not a summary or translation of the source paper.',
    language === 'en' ? 'Write naturally in English.' : 'Tulis secara natural dalam Bahasa Indonesia.',
    'Audience: curious general readers. Explain technical concepts clearly without oversimplifying or sensationalizing.',
    'Use only the source metadata, abstract research, full-text quality assessment, and verified evidence list supplied below. Do not use outside knowledge to add factual claims.',
    'Do not invent people, dates, statistics, mechanisms, study methods, sample sizes, causal relationships, or conclusions.',
    'Do not copy source sentences. Paraphrase in original language. Never include long quotations.',
    'Distinguish the review authors’ conclusions from established scientific consensus. Describe this source as a systematic descriptive review, not a meta-analysis. Preserve the stated limitation that it did not conduct a meta-analysis.',
    'Explain scope and limitations fairly. Do not turn population-level findings into claims about every individual. Avoid medical advice, diagnosis, or treatment recommendations.',
    'Create 4–6 coherent sections with 1–3 substantive paragraphs each. Every paragraph that states source-derived facts must end with citation marker [1].',
    'Create 3–6 verifiedClaims. Each must identify the index of one supplied evidence item and the section where the claim is discussed. Do not invent evidence or rewrite the evidence excerpts.',
    'Return JSON exactly shaped as: {"title":"...","summary":"...","sections":[{"heading":"...","paragraphs":["..."]}],"verifiedClaims":[{"claim":"...","evidenceIndex":0,"sectionIndex":0}],"editorialNote":"..."}',
    'EDITORIAL SOURCE METADATA: ' + JSON.stringify({
      title: source.title, year: source.publicationYear, authors: source.authors,
      doi: source.doi, journal: source.sourceName, landingPageUrl: source.landingPageUrl,
    }),
    'ABSTRACT RESEARCH: ' + JSON.stringify(research),
    'FULL-TEXT QUALITY REVIEW: ' + JSON.stringify({
      overallAssessment: quality.overallAssessment,
      methodologyAssessment: quality.methodologyAssessment,
      limitations: quality.limitations,
      qualityFlags: quality.qualityFlags,
      recommendations: quality.recommendations,
      qualityDecision: quality.qualityDecision,
    }),
    'VERIFIED EVIDENCE ITEMS (evidenceExcerpt values are immutable source quotations): ' +
      JSON.stringify(verifiedEvidence.map((item, index) => ({
        index, claim: item.claim, evidenceExcerpt: item.evidenceExcerpt,
        assessment: item.assessment,
      }))),
  ].join('\n\n');

  let generated;
  try {
    generated = await callGemini(env, prompt);
  } catch (error) {
    console.error('Editorial draft generation failed.', { name: error?.name || 'Error' });
    return response({ error: 'The editorial draft could not be generated right now.' }, 502);
  }

  const validation = validateEditorialOutput(generated, verifiedEvidence);
  if (!validation.valid) {
    console.error('Editorial draft failed validation.', { errors: validation.errors });
    return response({ error: 'The generated editorial draft did not pass structural and evidence validation.', details: validation.errors }, 502);
  }

  const { contentMarkdown, contentBlocks } = buildEditorialContent(generated);
  if (contentMarkdown.length > 80000) {
    return response({ error: 'The generated editorial draft exceeds the content limit.' }, 502);
  }
  const doi = String(source.doi || '').replace(/^https?:\/\/doi\.org\//i, '');
  if (!doi) return response({ error: 'The research source has no DOI citation.' }, 409);
  const sourceUrl = 'https://doi.org/' + doi;
  const sourceTitle = String(source.title || '').trim();
  const citationNote = [
    Array.isArray(source.authors) ? source.authors.join(', ') : '',
    source.publicationYear || '',
    'CC BY 4.0 full text reviewed via Europe PMC.',
    'Research evidence and editorial draft are linked to the saved review records.',
  ].filter(Boolean).join('. ');

  const sourceRecord = await env.DB.prepare(
    "SELECT source_key FROM sources WHERE source_key = 'frontiers'"
  ).first();
  if (!sourceRecord) return response({ error: 'The publisher source registry is not initialized.' }, 503);

  const slug = slugify(generated.title);
  if (!slug) return response({ error: 'The generated title could not be converted to a valid slug.' }, 502);
  const existing = await env.DB.prepare('SELECT article_id FROM articles WHERE slug = ?').bind(slug).first();
  if (existing) return response({ error: 'An article with this editorial slug already exists.' }, 409);

  const allocation = await env.DB.prepare(
    `UPDATE categories SET next_article_number = next_article_number + 1, updated_at = CURRENT_TIMESTAMP
     WHERE code = ? AND is_active = 1
     RETURNING next_article_number - 1 AS category_sequence`
  ).bind(categoryCode).first();
  if (!allocation) return response({ error: 'An article ID could not be allocated.' }, 409);

  const sequence = allocation.category_sequence;
  const articleId = String(categoryCode) + String(sequence).padStart(3, '0') + '-00';
  const readingTimeMinutes = Math.max(1, Math.ceil(countWords(contentMarkdown) / 200));
  const snapshot = {
    articleId, categoryCode, categorySequence: sequence, specialNumber: 0,
    slug, language, title: generated.title.trim(), summary: generated.summary.trim(),
    contentMarkdown, contentBlocks, readingTimeMinutes, status: 'draft',
    generatedFrom: { openAlexId, researchId: researchRow.id, fullTextReviewId: reviewRow.id },
  };
  const statements = [
    env.DB.prepare(
      `INSERT INTO articles (
        article_id, category_code, category_sequence, special_number, slug,
        language, title, summary, content_markdown, content_blocks_json,
        reading_time_minutes, status
      ) VALUES (?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, 'draft')`
    ).bind(articleId, categoryCode, slug, language, generated.title.trim(),
      generated.summary.trim(), contentMarkdown, JSON.stringify(contentBlocks), readingTimeMinutes),
    env.DB.prepare(
      `INSERT INTO article_sources
       (article_id, source_key, source_url, source_title, citation_note, is_primary)
       VALUES (?, 'frontiers', ?, ?, ?, 1)`
    ).bind(articleId, sourceUrl, sourceTitle, citationNote),
    env.DB.prepare(
      `INSERT INTO article_versions (article_id, version_number, snapshot_json, change_reason)
       VALUES (?, 1, ?, 'AI-generated editorial draft; pending human editorial review')`
    ).bind(articleId, JSON.stringify(snapshot)),
    env.DB.prepare(
      `INSERT INTO article_editorial_generations
       (article_id, research_run_id, fulltext_review_id, model, prompt_version, evidence_map_json, editorial_note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(articleId, researchRow.id, reviewRow.id, 'google/' + GEMINI_MODEL,
      PROMPT_VERSION, JSON.stringify(generated.verifiedClaims.map((item) => ({
        claim: item.claim,
        sectionIndex: item.sectionIndex,
        evidenceIndex: item.evidenceIndex,
        evidence: verifiedEvidence[item.evidenceIndex].evidenceExcerpt,
      }))), generated.editorialNote.trim()),
  ];

  try {
    await env.DB.batch(statements);
  } catch (error) {
    console.error('Editorial draft could not be saved.', { name: error?.name || 'Error' });
    return response({ error: 'The editorial draft could not be saved.' }, 500);
  }

  return response({
    articleId,
    status: 'draft',
    editorialStatus: 'pending_human_review',
    language,
    title: generated.title.trim(),
    summary: generated.summary.trim(),
    readingTimeMinutes,
    verifiedClaimCount: generated.verifiedClaims.length,
    source: { title: sourceTitle, url: sourceUrl, license: reviewRow.license },
    generatedFrom: { researchId: researchRow.id, fullTextReviewId: reviewRow.id },
  }, 201);
}

export async function handleEditorialDraftRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/admin/sources/openalex/editorial-draft') return null;
  if (request.method === 'POST') return runEditorialDraft(request, env);
  return response({ error: 'Method not allowed.' }, 405);
}
