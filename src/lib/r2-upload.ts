import { createHash, createHmac } from "node:crypto";

import { isR2Ready, type IntegrationSettings } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

export { extractR2ObjectKey, isDisplayableImageSrc, mediaSrc } from "@/lib/media";

const MAX_BYTES = 5 * 1024 * 1024;
const DATA_URL_MAX_BYTES = 350_000;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const receiptTypes = new Set([...allowedTypes, "application/pdf"]);
const EMPTY_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function hashHex(data: Buffer | string) {
  return createHash("sha256").update(data).digest("hex");
}

function objectPath(bucket: string, key: string) {
  return `/${bucket}/${key.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`;
}

function signR2Headers(
  settings: IntegrationSettings,
  method: "GET" | "PUT",
  path: string,
  payloadHash: string,
  contentType?: string,
) {
  const host = `${settings.r2AccountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const canonicalHeaders =
    method === "PUT" && contentType
      ? `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
      : `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders =
    method === "PUT" && contentType ? "content-type;host;x-amz-content-sha256;x-amz-date" : "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, hashHex(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${settings.r2SecretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${settings.r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: `https://${host}${path}`,
    headers: {
      ...(method === "PUT" && contentType ? { "Content-Type": contentType } : {}),
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    } as Record<string, string>,
  };
}

export function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "application/pdf") return "pdf";
  return "jpg";
}

function contentTypeForKey(key: string, header: string | null) {
  const fromHeader = header?.split(";")[0]?.trim() ?? "";
  if (fromHeader && fromHeader !== "application/octet-stream") {
    return fromHeader;
  }
  if (/\.png$/i.test(key)) return "image/png";
  if (/\.webp$/i.test(key)) return "image/webp";
  if (/\.gif$/i.test(key)) return "image/gif";
  if (/\.pdf$/i.test(key)) return "application/pdf";
  if (/\.jpe?g$/i.test(key)) return "image/jpeg";
  return fromHeader || "application/octet-stream";
}

export async function putR2Object(settings: IntegrationSettings, key: string, body: Buffer, contentType: string) {
  const path = objectPath(settings.r2Bucket, key);
  const payloadHash = hashHex(body);
  const signed = signR2Headers(settings, "PUT", path, payloadHash, contentType);
  const response = await fetch(signed.url, {
    method: "PUT",
    headers: signed.headers,
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    throw new Error("I couldn't upload that file just now.");
  }

  return `${settings.r2PublicUrl.replace(/\/$/, "")}/${key}`;
}

async function signedGet(settings: IntegrationSettings, path: string, payloadHash: string) {
  const signed = signR2Headers(settings, "GET", path, payloadHash);
  return fetch(signed.url, {
    method: "GET",
    headers: signed.headers,
    cache: "no-store",
  });
}

export async function getR2Object(settings: IntegrationSettings, key: string) {
  const path = objectPath(settings.r2Bucket, key);
  let response = await signedGet(settings, path, UNSIGNED_PAYLOAD);
  if (!response.ok && (response.status === 403 || response.status === 400)) {
    response = await signedGet(settings, path, EMPTY_HASH);
  }
  if (!response.ok) {
    return { ok: false as const, status: response.status };
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    ok: true as const,
    status: response.status,
    body: bytes,
    contentType: contentTypeForKey(key, response.headers.get("content-type")),
  };
}

export async function storeProfilePhoto(file: File, userId: string) {
  if (!file.size) {
    throw new Error("Upload your profile picture.");
  }

  if (!allowedTypes.has(file.type)) {
    throw new Error("Upload a JPG, PNG, or WEBP photo.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Keep the photo under 5 MB.");
  }

  const body = Buffer.from(await file.arrayBuffer());
  const settings = await getResolvedIntegrationSettings();

  if (isR2Ready(settings)) {
    const key = `profiles/${userId}/${Date.now()}.${extensionFor(file.type)}`;
    return putR2Object(settings, key, body, file.type);
  }

  if (body.length > DATA_URL_MAX_BYTES) {
    throw new Error("Use a smaller photo, or connect Cloudflare R2 so we can store larger pictures.");
  }

  return `data:${file.type};base64,${body.toString("base64")}`;
}

export async function storePaymentReceipt(file: File, email: string) {
  if (!file.size) {
    throw new Error("I-upload ang iyong resibo.");
  }

  if (!receiptTypes.has(file.type)) {
    throw new Error("Upload a JPG, PNG, WEBP, or PDF receipt.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Keep the receipt under 5 MB.");
  }

  const body = Buffer.from(await file.arrayBuffer());
  const settings = await getResolvedIntegrationSettings();
  const safeEmail = email.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48);

  if (isR2Ready(settings)) {
    const key = `receipts/mastermind/${safeEmail}/${Date.now()}.${extensionFor(file.type)}`;
    return putR2Object(settings, key, body, file.type);
  }

  if (body.length > DATA_URL_MAX_BYTES) {
    throw new Error("Use a smaller receipt, or connect Cloudflare R2 so we can store larger files.");
  }

  return `data:${file.type};base64,${body.toString("base64")}`;
}
