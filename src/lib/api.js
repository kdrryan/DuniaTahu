
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Terjadi kesalahan pada server');
  }

  return data;
}

export async function fetchDailyFact(lang = 'id') {
  const data = await apiRequest('/api/dailyFact', {
    method: 'POST',
    body: JSON.stringify({ lang }),
  });

  return data?.fact ?? null;
}

export async function askWorld({ question, lang = 'id' }) {
  const data = await apiRequest('/api/askWorld', {
    method: 'POST',
    body: JSON.stringify({ question, lang }),
  });

  if (!data.answer) throw new Error('Jawaban kosong');

  return {
    title: data.title || '',
    answer: data.answer,
    quick_facts: data.quick_facts || [],
  };
}
