import path from 'path';

const supported = new Map([
  ['.pdf', 'pdf'],
  ['.docx', 'docx'],
  ['.txt', 'txt'],
  ['.md', 'md'],
  ['.csv', 'csv'],
  ['.png', 'image'],
  ['.jpg', 'image'],
  ['.jpeg', 'image'],
  ['.webp', 'image']
]);

export function inferFileType(filename) {
  return supported.get(path.extname(filename).toLowerCase()) || null;
}

export function isSupportedFile(filename) {
  return Boolean(inferFileType(filename));
}
