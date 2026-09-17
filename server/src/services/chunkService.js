const TARGET_SIZE = 1200;
const OVERLAP = 200;

export function chunkText(text) {
  const paragraphs = String(text || '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if ((current + '\n\n' + paragraph).trim().length <= TARGET_SIZE) {
      current = (current ? `${current}\n\n` : '') + paragraph;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = current.slice(Math.max(0, current.length - OVERLAP));
    }

    if (paragraph.length > TARGET_SIZE) {
      for (let index = 0; index < paragraph.length; index += TARGET_SIZE - OVERLAP) {
        chunks.push(paragraph.slice(index, index + TARGET_SIZE));
      }
      current = '';
    } else {
      current = paragraph;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.map((chunk, index) => ({
    chunkIndex: index,
    text: chunk,
    tokenCountApprox: Math.ceil(chunk.length / 4),
    metadata: { targetSize: TARGET_SIZE, overlap: OVERLAP }
  }));
}
