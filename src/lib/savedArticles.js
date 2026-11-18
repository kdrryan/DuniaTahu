const STORAGE_KEY = 'ratio.savedArticles';

export function getSavedArticles() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function isArticleSaved(articleId) {
  return getSavedArticles().some((article) => article.id === articleId);
}

export function toggleSavedArticle(article) {
  const current = getSavedArticles();
  const exists = current.some((item) => item.id === article.id);
  const next = exists
    ? current.filter((item) => item.id !== article.id)
    : [{ ...article, savedAt: new Date().toISOString() }, ...current];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Saving is unavailable in this browser session.
  }

  return { saved: !exists, articles: next };
}

export function removeSavedArticle(articleId) {
  const next = getSavedArticles().filter((article) => article.id !== articleId);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Keep the current view usable if storage is unavailable.
  }
  return next;
}
