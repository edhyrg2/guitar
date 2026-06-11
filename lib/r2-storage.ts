import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "";
const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "";
const rootPrefix = process.env.CLOUDFLARE_R2_ROOT_PREFIX ?? "";
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "";

let cachedClient: S3Client | null = null;

function getR2Client() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 credentials are not configured. Set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY in your environment."
    );
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedClient;
}

/**
 * Upload a buffer to Cloudflare R2 and return its public URL.
 *
 * The final object key is `{ROOT_PREFIX}/{key}` — for example
 * `money/component-assets/pickup-abc12345-asset.png`.
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const fullKey = rootPrefix ? `${rootPrefix}/${key}` : key;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fullKey,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return getR2PublicUrl(key);
}

/**
 * Construct a public URL for a given R2 key.
 */
export function getR2PublicUrl(key: string): string {
  const base = publicUrl.replace(/\/+$/, "");
  const prefix = rootPrefix ? `/${rootPrefix}` : "";

  return `${base}${prefix}/${key}`;
}
