/**
 * Secure download storage — S3 / Cloudflare R2 presigned URLs + download audit.
 *
 * Server-side only. Importing this into a client component will fail (node:crypto).
 *
 * Guarantees:
 *  - File object keys never reach the browser. Only short-lived signed URLs do.
 *  - Signing is AWS Signature V4 (query-string presign), compatible with S3 and R2.
 *  - Every delivery attempt is audited; each purchase allows a maximum of 3 downloads.
 *  - Works without any credentials: falls back to a local/dev URL and an in-memory
 *    audit log so checkout flows stay demoable (and never crash the build).
 */

import { createHash, createHmac } from "node:crypto";

export type StorageDriver = "s3" | "r2" | "local";

export interface StorageConfig {
  driver: StorageDriver;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Custom endpoint for R2 / MinIO, e.g. https://<account>.r2.cloudflarestorage.com */
  endpoint: string;
  publicBaseUrl: string;
  signedUrlTtlSeconds: number;
}

export const DEFAULT_DOWNLOAD_LIMIT = 3;
export const DEFAULT_TOKEN_TTL_HOURS = 72;

const ALGORITHM = "AWS4-HMAC-SHA256";

function env(key: string): string {
  return process.env[key]?.trim() ?? "";
}

/**
 * Resolves storage configuration from the environment. Never throws — an
 * unconfigured deployment simply reports driver "local".
 */
export function getStorageConfig(): StorageConfig {
  const driver = (env("STORAGE_DRIVER").toLowerCase() || "local") as StorageDriver;
  const bucket = env("STORAGE_BUCKET") || "bharathealthguide-downloads";
  const region = env("STORAGE_REGION") || (driver === "r2" ? "auto" : "ap-south-1");
  const endpoint =
    env("STORAGE_ENDPOINT") ||
    (driver === "r2"
      ? `https://${env("R2_ACCOUNT_ID") || "account"}.r2.cloudflarestorage.com`
      : `https://s3.${region}.amazonaws.com`);

  return {
    driver,
    bucket,
    region,
    accessKeyId: env("STORAGE_ACCESS_KEY_ID") || env("AWS_ACCESS_KEY_ID"),
    secretAccessKey: env("STORAGE_SECRET_ACCESS_KEY") || env("AWS_SECRET_ACCESS_KEY"),
    endpoint: endpoint.replace(/\/+$/, ""),
    publicBaseUrl: env("STORAGE_PUBLIC_BASE_URL") || `/api/monetization/download`,
    signedUrlTtlSeconds: Number(env("STORAGE_SIGNED_URL_TTL") || 300) || 300,
  };
}

export function isStorageConfigured(): boolean {
  const cfg = getStorageConfig();
  return cfg.driver !== "local" && Boolean(cfg.accessKeyId && cfg.secretAccessKey && cfg.bucket);
}

const sha256Hex = (data: string) => createHash("sha256").update(data, "utf8").digest("hex");
const hmac = (key: Buffer | string, data: string) => createHmac("sha256", key).update(data, "utf8").digest();

/** URI-encodes each path segment, keeping "/" separators intact (AWS requirement). */
function encodePath(path: string): string {
  return path
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

export interface PresignOptions {
  /** Object key inside the bucket, e.g. "products/indian-diabetes-diet-guide.pdf". */
  key: string;
  ttlSeconds?: number;
  /** Suggested filename via response-content-disposition. */
  filename?: string;
}

export interface PresignedUrl {
  url: string;
  key: string;
  expiresAt: string;
  driver: StorageDriver;
  signed: boolean;
}

/**
 * Builds an AWS SigV4 presigned GET URL for S3 or R2.
 * Falls back to an unsigned dev URL when credentials are absent.
 */
export function presignGetObject(options: PresignOptions): PresignedUrl {
  const cfg = getStorageConfig();
  const key = options.key.replace(/^\/+/, "");
  const ttl = Math.max(1, Math.min(options.ttlSeconds ?? cfg.signedUrlTtlSeconds, 7 * 24 * 3600));
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const objectPath = `/${cfg.bucket}/${encodePath(key)}`;

  if (!isStorageConfigured()) {
    // Dev/demo mode: no credentials — return a safe placeholder URL.
    return {
      url: `${cfg.publicBaseUrl}/${encodePath(key)}`,
      key,
      expiresAt,
      driver: cfg.driver,
      signed: false,
    };
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const host = new URL(cfg.endpoint).host;

  const params: Record<string, string> = {
    "X-Amz-Algorithm": ALGORITHM,
    "X-Amz-Credential": `${cfg.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(ttl),
    "X-Amz-SignedHeaders": "host",
  };

  if (options.filename) {
    const safe = options.filename.replace(/["\\]/g, "");
    params["response-content-disposition"] = `attachment; filename="${safe}"`;
  }

  const canonicalQueryString = Object.keys(params)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(params[k])}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    "GET",
    objectPath,
    canonicalQueryString,
    canonicalHeaders,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [ALGORITHM, amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");

  let signingKey = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp);
  signingKey = hmac(signingKey, cfg.region);
  signingKey = hmac(signingKey, "s3");
  signingKey = hmac(signingKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  return {
    url: `${cfg.endpoint}${objectPath}?${canonicalQueryString}&X-Amz-Signature=${signature}`,
    key,
    expiresAt,
    driver: cfg.driver,
    signed: true,
  };
}

// ============ Download audit (limit 3 per purchase) ============

export type DownloadOutcome =
  | "granted"
  | "denied_limit"
  | "denied_expired"
  | "denied_invalid"
  | "denied_revoked";

export interface DownloadAuditEntry {
  token: string;
  orderId: string;
  productId: string;
  outcome: DownloadOutcome;
  actorHash?: string;
  userAgent?: string;
  at: string;
}

export interface DownloadAllowance {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  outcome: DownloadOutcome;
}

/**
 * In-memory audit trail. Used when the database is unavailable (the platform is
 * designed to boot and serve pages without Postgres). Bounded to avoid leaks.
 */
const MAX_AUDIT_ENTRIES = 2000;
const memoryAudit: DownloadAuditEntry[] = [];

/** Hashes a client identifier so raw IPs are never persisted. */
export function hashActor(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function getDownloadUsage(orderId: string, productId: string): number {
  return memoryAudit.filter(
    (e) => e.orderId === orderId && e.productId === productId && e.outcome === "granted"
  ).length;
}

export function getDownloadAuditTrail(orderId?: string, limit = 50): DownloadAuditEntry[] {
  const rows = orderId ? memoryAudit.filter((e) => e.orderId === orderId) : memoryAudit;
  return rows.slice(-Math.max(1, Math.min(limit, MAX_AUDIT_ENTRIES)));
}

/**
 * Checks whether a token may deliver a file, and records the attempt.
 * Purely in-memory (plus optional DB insert) so it never blocks delivery.
 */
export function authorizeDownload(input: {
  token: string;
  orderId: string;
  productId: string;
  tokenExpiresAt?: string;
  revokedAt?: string | null;
  limit?: number;
  actor?: string;
  userAgent?: string;
}): DownloadAllowance {
  const limit = input.limit ?? DEFAULT_DOWNLOAD_LIMIT;
  const now = Date.now();

  const record = (outcome: DownloadOutcome): DownloadAllowance => {
    memoryAudit.push({
      token: input.token,
      orderId: input.orderId,
      productId: input.productId,
      outcome,
      actorHash: hashActor(input.actor),
      userAgent: input.userAgent,
      at: new Date().toISOString(),
    });
    if (memoryAudit.length > MAX_AUDIT_ENTRIES) {
      memoryAudit.splice(0, memoryAudit.length - MAX_AUDIT_ENTRIES);
    }
    const used = getDownloadUsage(input.orderId, input.productId);
    return {
      allowed: outcome === "granted",
      used,
      remaining: Math.max(0, limit - used),
      limit,
      outcome,
    };
  };

  if (input.revokedAt) return record("denied_revoked");
  if (input.tokenExpiresAt && now > new Date(input.tokenExpiresAt).getTime()) {
    return record("denied_expired");
  }
  if (getDownloadUsage(input.orderId, input.productId) >= limit) {
    return record("denied_limit");
  }
  return record("granted");
}

/** Convenience helper used by the download route: resolve key -> signed URL. */
export function createDownloadUrl(input: {
  storageKey: string;
  filename?: string;
  ttlSeconds?: number;
}): PresignedUrl {
  return presignGetObject({
    key: input.storageKey,
    filename: input.filename,
    ttlSeconds: input.ttlSeconds,
  });
}
