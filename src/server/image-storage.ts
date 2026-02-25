import crypto from 'crypto';
import path from 'path';

const DEFAULT_IMAGE_DIR = path.resolve(process.cwd(), 'storage/images');

function ensureSafeExt(filename: string, mimeType: string) {
  const extFromName = path.extname(filename).toLowerCase();
  if (extFromName) {
    return extFromName;
  }
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  return '.bin';
}

export function getImageRootDir() {
  const configured = process.env.PRODUCT_IMAGE_DIR;
  return configured ? path.resolve(configured) : DEFAULT_IMAGE_DIR;
}

export function buildStorageKey(filename: string, mimeType: string) {
  const now = new Date();
  const parts = [
    now.getUTCFullYear().toString(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ];
  const ext = ensureSafeExt(filename, mimeType);
  const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  return ['products', ...parts, `${uuid}${ext}`].join('/');
}

export function resolveAbsoluteImagePath(storageKey: string) {
  if (!storageKey) throw new Error('storageKey is required');
  const key = storageKey.replace(/^\/+/, '');
  const normalized = path.normalize(key);
  if (normalized.includes('..')) {
    throw new Error('Invalid storage key');
  }
  const root = getImageRootDir();
  const absolutePath = path.join(root, normalized);
  const rootWithSlash = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (!absolutePath.startsWith(rootWithSlash)) {
    throw new Error('Invalid storage key');
  }
  return absolutePath;
}

export function guessImageContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}
