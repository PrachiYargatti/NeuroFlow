import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export async function extractText(filePath, fileType) {
  if (fileType === 'txt' || fileType === 'md') {
    return { text: await fs.readFile(filePath, 'utf8'), metadata: {} };
  }

  if (fileType === 'csv') {
    const raw = await fs.readFile(filePath, 'utf8');
    const rows = parse(raw, { skip_empty_lines: true, relax_column_count: true });
    return {
      text: rows.map((row, index) => `Row ${index + 1}: ${row.join(' | ')}`).join('\n'),
      metadata: { rows: rows.length }
    };
  }

  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: result.value, metadata: { warnings: result.messages?.length || 0 } };
  }

  if (fileType === 'pdf') {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return { text: result.text, metadata: { pages: result.numpages || 0 }, pageCount: result.numpages || 0 };
  }

  if (fileType === 'image') {
    const worker = await createWorker('eng');
    try {
      const result = await worker.recognize(filePath);
      return { text: result.data.text, metadata: { ocr: true } };
    } finally {
      await worker.terminate();
    }
  }

  return { text: '', metadata: {} };
}

export function cleanText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function summarizeText(text) {
  const safeText = String(text || '');
  const sentences = safeText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.slice(0, 3).join(' ').slice(0, 700) || safeText.slice(0, 700);
}
