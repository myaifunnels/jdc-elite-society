import { createHash, createHmac } from "node:crypto";

import { isR2Ready, type IntegrationSettings } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

const MAX_BYTES = 5 * 1024 * 1024;
const DATA_URL_MAX_BYTES = 350_000;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const receiptTypes = new Set([...allowedTypes, "application/pdf"]);

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function hashHex(data: Buffer | string) {
  return createHash("sha256").update(data).digest("hex");
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "application/pdf") return "pdf";
  return "jpg";
}

async function putR2Object(settings: IntegrationSettings, key: string, body: Buffer, contentType: string) {
  const host = `${settings.r2AccountId}.r2.cloudflarestorage.com`;
  const path = `/${settings.r2Bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const payloadHash = hashHex(body);
  const canonicalHeaders =
    `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, hashHex(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${settings.r2SecretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${settings.r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    throw new Error("I couldn't upload that photo just now.");
  }

  return `${settings.r2PublicUrl.replace(/\/$/, "")}/${key}`;
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
