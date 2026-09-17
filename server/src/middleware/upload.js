import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { httpError } from '../utils/httpError.js';
import { inferFileType, isSupportedFile } from '../utils/fileTypes.js';

const __filename = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(__filename), '../..');

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(serverRoot, 'uploads', req.user.id, req.params.workspaceId || 'unassigned');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeBase}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!isSupportedFile(file.originalname)) {
      cb(httpError(400, 'Unsupported file type'));
      return;
    }
    file.fileType = inferFileType(file.originalname);
    cb(null, true);
  }
});
