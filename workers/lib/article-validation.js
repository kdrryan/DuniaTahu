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

function validateLicensedImage(image, label, errors) {
  if (!image || typeof image !== 'object') {
    errors.push(`${label} must include license metadata.`);
    return;
  }

  if (!isHttpsUrl(image.url)) errors.push(`${label} URL must use HTTPS.`);
  if (!isHttpsUrl(image.sourceUrl)) errors.push(`${label} source URL must use HTTPS.`);
  if (!isHttpsUrl(image.licenseUrl)) errors.push(`${label} license URL must use HTTPS.`);

  for (const key of ['alt', 'creator', 'license', 'attribution', 'verifiedAt']) {
    if (typeof image[key] !== 'string' || !image[key].trim()) {
      errors.push(`${label} ${key} is required to document usage rights.`);
    }
  }

  if (image.verifiedAt && Number.isNaN(Date.parse(image.verifiedAt))) {
    errors.push(`${label} verifiedAt must be a valid date.`);
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
  if (input.contentMarkdown?.length > 80000) errors.push('contentMarkdown is too long.');
  if (!['id', 'en'].includes(input.language)) errors.push('language must be id or en.');
  if (input.slug !== undefined && (typeof input.slug !== 'string' || !input.slug.trim())) {
    errors.push('slug must be a non-empty string when provided.');
  }
  if (input.readingTimeMinutes !== undefined &&
      (!Number.isFinite(input.readingTimeMinutes) || input.readingTimeMinutes < 1 || input.readingTimeMinutes > 120)) {
    errors.push('readingTimeMinutes must be between 1 and 120.');
  }

  // Images in Markdown are disallowed; use licensed structured image blocks instead.
  if (typeof input.contentMarkdown === 'string' && /!\[[^\]]*\]\([^)]*\)/.test(input.contentMarkdown)) {
    errors.push('Use licensed image blocks instead of embedded Markdown images.');
  }

  if (!Array.isArray(input.contentBlocks) || input.contentBlocks.length === 0) {
    errors.push('contentBlocks must contain at least one block.');
  } else {
    input.contentBlocks.forEach((block, index) => {
      if (!block || typeof block !== 'object' || !ALLOWED_BLOCK_TYPES.has(block.type)) {
        errors.push(`contentBlocks[${index}] has an unsupported block type.`);
      } else if (block.type === 'image') {
        validateLicensedImage(block.image, `contentBlocks[${index}] image`, errors);
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

  if (input.coverImage) validateLicensedImage(input.coverImage, 'Cover image', errors);

  return { valid: errors.length === 0, errors };
}
