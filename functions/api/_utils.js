import { Buffer } from "node:buffer";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function withCors(headers = {}) {
  return { ...CORS_HEADERS, ...headers };
}

export function createJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCors({ "Content-Type": "application/json" }),
  });
}

export function createImageResponse(buffer, contentType = "image/png") {
  return new Response(buffer, {
    headers: withCors({ "Content-Type": contentType }),
  });
}

export function createTextResponse(text, contentType = "text/plain;charset=utf-8") {
  return new Response(text, {
    headers: withCors({ "Content-Type": contentType }),
  });
}

export function handleError(error) {
  if (error instanceof HttpError) {
    return createJsonResponse({ error: error.message }, error.status);
  }

  console.error(error);
  const message = error instanceof Error ? error.message : "Unknown error";
  return createJsonResponse({ error: message }, 500);
}

export async function readJsonBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json");
  }

  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON payload");
  }
}

export async function readImagePayload(request) {
  const body = await readJsonBody(request);
  if (!body || typeof body.image !== "string" || body.image.trim() === "") {
    throw new HttpError(400, "Missing image field");
  }
  const buffer = decodeImage(body.image);
  const mimeType = extractMimeType(body.image) ?? "image/png";
  return { body, buffer, mimeType };
}

export function decodeImage(imageString) {
  if (typeof imageString !== "string" || imageString.trim() === "") {
    throw new HttpError(400, "Image must be a base64 encoded string");
  }
  const trimmed = imageString.trim();
  const base64 = trimmed.startsWith("data:") ? trimmed.slice(trimmed.indexOf(",") + 1) : trimmed;
  try {
    return Buffer.from(base64, "base64");
  } catch {
    throw new HttpError(400, "Invalid base64 image data");
  }
}

export function extractMimeType(imageString) {
  if (typeof imageString !== "string") {
    return null;
  }
  const match = /^data:([^;]+);base64,/i.exec(imageString);
  return match ? match[1].toLowerCase() : null;
}

export function toArrayBuffer(input) {
  if (input instanceof ArrayBuffer) {
    return input;
  }
  if (ArrayBuffer.isView(input)) {
    const view = input;
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
  }
  if (Buffer.isBuffer(input)) {
    return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  }
  throw new HttpError(400, "Unsupported binary input type");
}

export function ensureAIImage(aiResult) {
  if (!aiResult) {
    throw new HttpError(502, "AI model did not return a result");
  }

  if (aiResult instanceof ArrayBuffer) {
    return Buffer.from(aiResult);
  }
  if (ArrayBuffer.isView(aiResult)) {
    return Buffer.from(aiResult.buffer, aiResult.byteOffset, aiResult.byteLength);
  }
  if (Buffer.isBuffer(aiResult)) {
    return aiResult;
  }
  if (Array.isArray(aiResult)) {
    return Buffer.from(aiResult);
  }
  if (typeof aiResult === "string") {
    return decodeImage(aiResult);
  }

  if (aiResult.image) {
    return ensureAIImage(aiResult.image);
  }
  if (aiResult.output) {
    return ensureAIImage(aiResult.output);
  }
  if (aiResult.result) {
    return ensureAIImage(aiResult.result);
  }
  if (aiResult.data) {
    return ensureAIImage(aiResult.data);
  }

  throw new HttpError(502, "Unexpected AI response format");
}

export function parseFramePayload(frames) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new HttpError(400, "frames must be a non-empty array");
  }

  return frames.map((frame, index) => {
    if (typeof frame === "string") {
      return { image: frame, delay: 100 };
    }
    if (frame && typeof frame === "object" && typeof frame.image === "string") {
      const delay = Number.isFinite(frame.delay) && frame.delay >= 0 ? Number(frame.delay) : 100;
      return { image: frame.image, delay };
    }
    throw new HttpError(400, `Invalid frame at index ${index}`);
  });
}
