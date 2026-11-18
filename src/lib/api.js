
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function apiRequest(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    let response;

    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } catch (error) {
      if (controller.signal.aborted || error.name === 'AbortError') {
        throw new ApiError('timeout');
      }

      if (error instanceof TypeError) {
        throw new ApiError('network');
      }

      throw new ApiError('unknown');
    }

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new ApiError('invalid_response');
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new ApiError('service');
      }

      throw new ApiError('request');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (controller.signal.aborted || error.name === 'AbortError') {
      throw new ApiError('timeout');
    }

    throw new ApiError('unknown');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDailyFact(lang = 'id') {
  const data = await apiRequest('/api/dailyFact', {
    method: 'POST',
    body: JSON.stringify({ lang }),
  });

  if (!data?.fact) {
    throw new ApiError('empty_response');
  }

  return data.fact;
}

export async function fetchArticles(lang = 'id', limit = 20) {
  const query = new URLSearchParams({
    lang: lang === 'en' ? 'en' : 'id',
    limit: String(Math.min(50, Math.max(1, limit))),
  });
  const data = await apiRequest('/api/articles?' + query.toString());
  return Array.isArray(data?.articles) ? data.articles : [];
}

export async function fetchArticle(articleId) {
  if (typeof articleId !== 'string' || !/^[A-Z]\d{3,}-\d{2}$/.test(articleId)) {
    throw new ApiError('request');
  }
  const data = await apiRequest('/api/articles/' + encodeURIComponent(articleId));
  if (!data?.article || typeof data.article.title !== 'string') {
    throw new ApiError('empty_response');
  }
  return data.article;
}

export async function askWorld({ question, lang = 'id' }) {
  const data = await apiRequest('/api/askWorld', {
    method: 'POST',
    body: JSON.stringify({ question, lang }),
  });

  if (typeof data?.answer !== 'string' || !data.answer.trim()) {
    throw new ApiError('empty_response');
  }

  return {
    title: data.title || '',
    answer: data.answer,
    quick_facts: Array.isArray(data.quick_facts)
      ? data.quick_facts
      : [],
  };
}
