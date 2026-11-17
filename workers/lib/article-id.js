export function formatArticleId(categoryCode, categorySequence, specialNumber = 0) {
  if (typeof categoryCode !== 'string' || !/^[A-Z]$/.test(categoryCode)) {
    throw new TypeError('Category code must be one uppercase letter.');
  }
  if (!Number.isSafeInteger(categorySequence) || categorySequence < 1) {
    throw new RangeError('Category sequence must be a positive integer.');
  }
  if (!Number.isSafeInteger(specialNumber) || specialNumber < 0 || specialNumber > 99) {
    throw new RangeError('Special number must be an integer from 0 to 99.');
  }

  return `${categoryCode}${String(categorySequence).padStart(3, '0')}-${String(specialNumber).padStart(2, '0')}`;
}

export function parseArticleId(articleId) {
  if (typeof articleId !== 'string') return null;
  const match = /^([A-Z])(\d{3,})-(\d{2})$/.exec(articleId);
  if (!match) return null;

  return {
    categoryCode: match[1],
    categorySequence: Number(match[2]),
    specialNumber: Number(match[3]),
  };
}
