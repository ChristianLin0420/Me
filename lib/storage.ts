import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import crypto from 'crypto';

const isR2Configured = () =>
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME;

let s3: S3Client | null = null;

function getS3() {
  if (!s3 && isR2Configured()) {
    s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3;
}

function generateKey(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(8).toString('hex');
  return `uploads/${Date.now()}-${hash}${ext}`;
}

export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  const client = getS3();
  if (!client) throw new Error('R2 storage is not configured');

  const key = generateKey(originalName);

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicUrl = process.env.R2_PUBLIC_URL;
  return publicUrl ? `${publicUrl}/${key}` : key;
}

export async function deleteFromR2(url: string): Promise<void> {
  const client = getS3();
  if (!client) return;

  const publicUrl = process.env.R2_PUBLIC_URL;
  const key = publicUrl ? url.replace(`${publicUrl}/`, '') : url;

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  );
}

export function isCloudStorageEnabled(): boolean {
  return !!isR2Configured();
}
