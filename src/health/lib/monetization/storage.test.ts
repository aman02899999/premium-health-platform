import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  presignGetObject,
  getStorageConfig,
  isStorageConfigured,
  authorizeDownload,
  getDownloadUsage,
  hashActor,
  DEFAULT_DOWNLOAD_LIMIT,
} from "./storage";

const ENV_KEYS = [
  "STORAGE_DRIVER",
  "STORAGE_BUCKET",
  "STORAGE_REGION",
  "STORAGE_ENDPOINT",
  "STORAGE_ACCESS_KEY_ID",
  "STORAGE_SECRET_ACCESS_KEY",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "STORAGE_PUBLIC_BASE_URL",
  "R2_ACCOUNT_ID",
];

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function configureS3(): void {
  process.env.STORAGE_DRIVER = "s3";
  process.env.STORAGE_BUCKET = "bhg-downloads";
  process.env.STORAGE_REGION = "ap-south-1";
  process.env.STORAGE_ACCESS_KEY_ID = "AKIAEXAMPLE";
  process.env.STORAGE_SECRET_ACCESS_KEY = "secret-example";
}

describe("getStorageConfig", () => {
  it("reports unconfigured local driver when env is empty", () => {
    const cfg = getStorageConfig();
    expect(cfg.driver).toBe("local");
    expect(isStorageConfigured()).toBe(false);
  });

  it("defaults region to auto for R2 and ap-south-1 for S3", () => {
    process.env.STORAGE_DRIVER = "r2";
    expect(getStorageConfig().region).toBe("auto");

    process.env.STORAGE_DRIVER = "s3";
    expect(getStorageConfig().region).toBe("ap-south-1");
  });
});

describe("presignGetObject", () => {
  it("falls back to an unsigned dev URL when unconfigured", () => {
    const result = presignGetObject({ key: "products/guide.pdf" });
    expect(result.signed).toBe(false);
    expect(result.driver).toBe("local");
    expect(result.url).toContain("products/guide.pdf");
    expect(result.url).not.toContain("X-Amz-Signature");
  });

  it("produces a SigV4 presigned URL when credentials are present", () => {
    configureS3();
    const result = presignGetObject({ key: "products/guide.pdf", ttlSeconds: 300 });

    expect(result.signed).toBe(true);
    expect(result.driver).toBe("s3");
    expect(result.url).toContain("https://s3.ap-south-1.amazonaws.com/bhg-downloads/products/guide.pdf");
    expect(result.url).toContain("X-Amz-Algorithm=AWS4-HMAC-SHA256");
    expect(result.url).toContain("X-Amz-Credential=AKIAEXAMPLE");
    expect(result.url).toContain("X-Amz-Expires=300");
    expect(result.url).toContain("X-Amz-SignedHeaders=host");
    expect(result.url).toContain("X-Amz-Signature=");
  });

  it("adds a content-disposition filename when requested", () => {
    configureS3();
    const result = presignGetObject({ key: "a.pdf", filename: "Thali Builder.pdf" });
    expect(result.url).toContain("response-content-disposition");
    expect(result.url).toContain("Thali%20Builder.pdf");
  });

  it("percent-encodes object keys with spaces", () => {
    configureS3();
    const result = presignGetObject({ key: "guides/my guide.pdf" });
    expect(result.url).toContain("guides/my%20guide.pdf");
  });

  it("returns an expiry timestamp in the future", () => {
    configureS3();
    const result = presignGetObject({ key: "a.pdf", ttlSeconds: 60 });
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("authorizeDownload", () => {
  it("allows up to the download limit then denies", () => {
    const order = "order-limit";
    for (let i = 0; i < DEFAULT_DOWNLOAD_LIMIT; i++) {
      const res = authorizeDownload({ token: `t${i}`, orderId: order, productId: "p1" });
      expect(res.allowed).toBe(true);
      expect(res.outcome).toBe("granted");
    }
    const denied = authorizeDownload({ token: "t-final", orderId: order, productId: "p1" });
    expect(denied.allowed).toBe(false);
    expect(denied.outcome).toBe("denied_limit");
    expect(denied.remaining).toBe(0);
    expect(getDownloadUsage(order, "p1")).toBe(DEFAULT_DOWNLOAD_LIMIT);
  });

  it("scopes the limit per order and product", () => {
    const a = authorizeDownload({ token: "t", orderId: "order-a", productId: "p1" });
    const b = authorizeDownload({ token: "t", orderId: "order-b", productId: "p1" });
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(getDownloadUsage("order-a", "p1")).toBe(1);
    expect(getDownloadUsage("order-b", "p1")).toBe(1);
  });

  it("denies an expired token without consuming the allowance", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const res = authorizeDownload({
      token: "expired",
      orderId: "order-exp",
      productId: "p1",
      tokenExpiresAt: past,
    });
    expect(res.allowed).toBe(false);
    expect(res.outcome).toBe("denied_expired");
    expect(getDownloadUsage("order-exp", "p1")).toBe(0);
  });

  it("denies a revoked token", () => {
    const res = authorizeDownload({
      token: "revoked",
      orderId: "order-rev",
      productId: "p1",
      revokedAt: new Date().toISOString(),
    });
    expect(res.allowed).toBe(false);
    expect(res.outcome).toBe("denied_revoked");
  });

  it("honours a custom download limit", () => {
    const res = authorizeDownload({ token: "t", orderId: "order-custom", productId: "p1", limit: 1 });
    expect(res.allowed).toBe(true);
    expect(res.limit).toBe(1);
    const second = authorizeDownload({ token: "t2", orderId: "order-custom", productId: "p1", limit: 1 });
    expect(second.allowed).toBe(false);
  });
});

describe("hashActor", () => {
  it("hashes deterministically and never returns the raw value", () => {
    const a = hashActor("203.0.113.9");
    const b = hashActor("203.0.113.9");
    expect(a).toBe(b);
    expect(a).not.toBe("203.0.113.9");
    expect(a).toHaveLength(32);
  });

  it("returns undefined for a missing actor", () => {
    expect(hashActor(undefined)).toBeUndefined();
    expect(hashActor(null)).toBeUndefined();
  });
});
