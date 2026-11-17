// Article IDs: [category letter][category sequence]-[special article number].
// Example S001-00 = Science, article 001 in that category, special number not assigned.
// Reserve 00 until a special-article number is assigned.

export const ARTICLE_CATEGORIES = Object.freeze({
  S: 'science', H: 'history', N: 'nature',
  T: 'technology', B: 'body', A: 'astronomy',
});

export function formatArticleId(categoryCode, categoryArticleNumber, specialArticleNumber = 0) {
  if (!Object.hasOwn(ARTICLE_CATEGORIES, categoryCode)) throw new Error('Unknown article category code.');
  if (!Number.isInteger(categoryArticleNumber) || categoryArticleNumber < 1) throw new Error('Category article number must be positive.');
  if (!Number.isInteger(specialArticleNumber) || specialArticleNumber < 0) throw new Error('Special article number must be zero or positive.');
  return `${categoryCode}${String(categoryArticleNumber).padStart(3, '0')}-${String(specialArticleNumber).padStart(2, '0')}`;
}

export const ARTICLES = [
  {
    id: formatArticleId('S', 1), category: 'science',
    title: 'Your brain is constantly rewriting what you remember',
    summary: 'Memory is not a perfect recording. Each time you recall an experience, your brain can update the way it is stored.',
    readingTime: 4, label: 'Today’s discovery', featured: true, curated: true,
  },
  {
    id: formatArticleId('H', 1), category: 'history',
    title: 'The ancient library that tried to gather the world',
    summary: 'The Library of Alexandria became a symbol of humanity’s ambition to collect and preserve knowledge.',
    readingTime: 5, curated: true,
  },
  {
    id: formatArticleId('N', 1), category: 'nature',
    title: 'Trees can share resources through underground networks',
    summary: 'Fungi connected to tree roots can move nutrients and chemical signals through forest soil.',
    readingTime: 3, curated: true,
  },
  {
    id: formatArticleId('T', 1), category: 'technology',
    title: 'Why the internet does not really live in the cloud',
    summary: 'The cloud is a network of physical data centers, cables, power systems, and machines around the world.',
    readingTime: 4, curated: false,
  },
  {
    id: formatArticleId('A', 1), category: 'astronomy',
    title: 'A day on Venus lasts longer than its year',
    summary: 'Venus rotates so slowly that one full rotation takes longer than one trip around the Sun.',
    readingTime: 2, curated: true,
  },
];

const articleIds = ARTICLES.map((article) => article.id);
if (new Set(articleIds).size !== articleIds.length) throw new Error('Article IDs must be unique.');
