/**
 * lib/storage.ts
 * Wrapper untuk upload file ke Object Storage (S3-compatible).
 * Mendukung: AWS S3, IDCloudHost, Cloudflare R2, MinIO, dll.
 */
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Buat S3 client menggunakan env vars — TIDAK ada kredensial hardcoded
function createS3Client(): S3Client {
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: process.env.S3_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  };

  // Jika ada custom endpoint (non-AWS), tambahkan
  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT;
    config.forcePathStyle = true; // wajib untuk MinIO / kebanyakan S3-compatible
  }

  return new S3Client(config);
}

export interface UploadResult {
  key: string;      // nama file di bucket
  publicUrl: string; // URL publik yang bisa diakses browser
}

/**
 * Upload buffer file ke Object Storage.
 * @param fileBuffer  - Buffer konten file
 * @param originalName - Nama file asli (untuk ekstensi)
 * @param mimeType    - MIME type (image/jpeg, image/png, dll)
 * @returns UploadResult berisi key dan publicUrl
 */
export async function uploadToStorage(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const s3 = createS3Client();
  const bucket = process.env.S3_BUCKET_NAME!;

  // Buat nama file unik agar tidak overwrite file lain
  const ext = originalName.split('.').pop() || 'jpg';
  const key = `ktp/${uuidv4()}.${ext}`;

  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    // ACL 'public-read' → file bisa dibuka langsung via URL
    // Hapus baris ini jika bucket sudah diset public lewat policy
    ACL: 'public-read',
  };

  await s3.send(new PutObjectCommand(params));

  // Susun URL publik
  const baseUrl = process.env.S3_PUBLIC_URL
    ? process.env.S3_PUBLIC_URL.replace(/\/$/, '')
    : `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com`;

  const publicUrl = `${baseUrl}/${key}`;

  return { key, publicUrl };
}
