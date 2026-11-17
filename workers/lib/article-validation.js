const ALLOWED_BLOCK_TYPES = new Set([
  'heading', 'paragraph', 'list', 'quote', 'image', 'callout', 'divider', 'markdown',
]);

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateArticleDraft(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, errors: ['Article payload must be an object.'] };
  }

  const requiredText = ['title', 'summary', 'contentMarkdown', 'language'];
  if (typeof input.categoryCode !== 'string' || !/^[A-Z]$/.test(input.categoryCode)) {
    errors.push('categoryCode must be one uppercase letter.');
  }
  for (const key of requiredText) {
    if (typeof input[key] !== 'string' || !input[key].trim()) {
      errors.push(`${key} is required.`);
    }
  }

  if (input.title?.length > 180) errors.push('title must be 180 characters or fewer.');
  if (input.summary?.length > 500) errors.push('summary must be 500 characters or fewer.');
  if (!['id', 'en'].includes(input.language)) errors.push('language must be id or en.');

  if (!Array.isArray(input.contentBlocks) || input.contentBlocks.length === 0) {
    errors.push('contentBlocks must contain at least one block.');
  } else {
    input.contentBlocks.forEach((block, index) => {
      if (!block || typeof block !== 'object' || !ALLOWED_BLOCK_TYPES.has(block.type)) {
        errors.push(`contentBlocks[${index}] has an unsupported block type.`);
      } else if (block.type !== 'divider' && typeof block.content !== 'string' && !Array.isArray(block.items)) {
        errors.push(`contentBlocks[${index}] is missing content.`);
      }
    });
  }

  if (!Array.isArray(input.sources) || input.sources.length === 0) {
    errors.push('At least one source reference is required.');
  } else {
    input.sources.forEach((source, index) => {
      if (!source || typeof source.sourceKey !== 'string' || !source.sourceKey.trim()) {
        errors.push(`sources[${index}].sourceKey is required.`);
      }
      if (!source || !isHttpsUrl(source.sourceUrl)) {
        errors.push(`sources[${index}].sourceUrl must be an HTTPS URL.`);
      }
      if (!source || typeof source.sourceTitle !== 'string' || !source.sourceTitle.trim()) {
        errors.push(`sources[${index}].sourceTitle is required.`);
      }
    });
  }

  if (input.coverImage) {
    const image = input.coverImage;
    if (!isHttpsUrl(image.url)) errors.push('Cover image URL must use HTTPS.');
    if (!isHttpsUrl(image.sourceUrl)) errors.push('Cover image source URL must use HTTPS.');
    if (!isHttpsUrl(image.licenseUrl)) errors.push('Cover image license URL must use HTTPS.');
    for (const key of ['alt', 'creator', 'license', 'attribution', 'verifiedAt']) {
      if (typeof image[key] !== 'string' || !image[key].trim()) {
        errors.push(`Cover image ${key} is required to document usage rights.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
