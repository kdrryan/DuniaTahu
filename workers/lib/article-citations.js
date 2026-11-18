export function normalizeCitationText(value) {
  if (typeof value !== 'string') return value;
  const withoutNumericMarkers = value
    .replace(/\s*\[\d+\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  return withoutNumericMarkers ? withoutNumericMarkers + ' [1]' : withoutNumericMarkers;
}

export function normalizeCitationBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block) => block?.type === 'paragraph'
    ? { ...block, content: normalizeCitationText(block.content) }
    : block);
}

export function markdownFromContentBlocks(blocks) {
  const lines = [];
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (block?.type === 'heading') {
      const level = Number.isInteger(block.level) ? Math.min(6, Math.max(1, block.level)) : 2;
      lines.push('#'.repeat(level) + ' ' + String(block.content || ''));
    } else if (block?.type === 'paragraph') {
      lines.push(normalizeCitationText(String(block.content || '')));
    }
  }
  return lines.join('\n\n').trim();
}
