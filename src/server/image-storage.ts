import crypto from 'crypto';
import path from 'path';

type AwsClientModule = typeof import('@aws-sdk/client-s3');
type AwsPresignerModule = typeof import('@aws-sdk/s3-request-presigner');
type S3Client = import('@aws-sdk/client-s3').S3Client;

const DEFAULT_REGION = process.env.AWS_REGION || 'ap-northeast-2';
const SIGNED_URL_TTL_SECONDS = Number(process.env.PRODUCT_IMAGE_URL_TTL_SECONDS ?? '300');

let awsClientModulePromise: Promise<AwsClientModule> | null = null;
let awsPresignerModulePromise: Promise<AwsPresignerModule> | null = null;
let cachedS3Client: S3Client | null = null;

function ensureAwsAvailable() {
  if (process.env.SKIP_AWS === '1') {
    throw new Error('AWS SDK is disabled during build (SKIP_AWS=1).');
  }
}

async function loadAwsClientModule() {
  ensureAwsAvailable();
  if (!awsClientModulePromise) {
    awsClientModulePromise = import('@aws-sdk/client-s3');
  }
  return awsClientModulePromise;
}

async function loadAwsPresignerModule() {
  ensureAwsAvailable();
  if (!awsPresignerModulePromise) {
    awsPresignerModulePromise = import('@aws-sdk/s3-request-presigner');
  }
  return awsPresignerModulePromise;
}

async function getS3Client() {
  if (cachedS3Client) {
    return cachedS3Client;
  }
  const { S3Client } = await loadAwsClientModule();
  cachedS3Client = new S3Client({
    region: DEFAULT_REGION,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
  return cachedS3Client;
}

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

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, '-');
}

export function buildStorageKey(filename: string, mimeType: string, options?: { productId?: string | null }) {
  const ext = ensureSafeExt(filename, mimeType);
  const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const productSegment = options?.productId ? sanitizeSegment(options.productId) : 'tmp';
  return `products/${productSegment}/${uuid}${ext}`;
}

export async function uploadImage(storageKey: string, buffer: Buffer, contentType: string) {
  if (!storageKey) throw new Error('storageKey is required');
  const { PutObjectCommand } = await loadAwsClientModule();
  const s3 = await getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: normalizeStorageKey(storageKey),
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function createSignedImageUrl(storageKey: string, options?: { expiresIn?: number }) {
  if (!storageKey) throw new Error('storageKey is required');
  const Key = normalizeStorageKey(storageKey);
  const { GetObjectCommand } = await loadAwsClientModule();
  const { getSignedUrl } = await loadAwsPresignerModule();
  const s3 = await getS3Client();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key,
    }),
    { expiresIn: options?.expiresIn ?? SIGNED_URL_TTL_SECONDS }
  );
}

function getBucketName() {
  const bucket = process.env.PRODUCT_IMAGE_S3_BUCKET;
  if (!bucket) {
    throw new Error('PRODUCT_IMAGE_S3_BUCKET 환경변수가 설정되어야 합니다.');
  }
  return bucket;
}

function normalizeStorageKey(storageKey: string) {
  const key = storageKey.replace(/^\/+/, '');
  if (key.includes('..')) {
    throw new Error('Invalid storage key');
  }
  return key;
}

export function guessImageContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}
