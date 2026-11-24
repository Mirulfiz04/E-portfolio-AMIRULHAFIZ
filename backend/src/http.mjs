// Small HTTP helpers shared by the API handlers (API Gateway HTTP API, payload format 2.0).
export const MAX_BODY_BYTES = 4096; // a review is at most ~700 characters; anything bigger is abuse

export function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
    body: JSON.stringify(body),
  };
}

// Browsers are already limited by the API's CORS config. This second check rejects a
// wrong Origin on state-changing routes. A request with no Origin (curl) is not a browser,
// so CORS was never going to stop it: throttling and the pending cap do that job.
export function originOk(event, allowed) {
  const origin = event.headers?.origin;
  return origin === undefined || origin === allowed;
}

export function readJson(event, maxBytes = MAX_BODY_BYTES) {
  const type = String(event.headers?.["content-type"] ?? "").toLowerCase();
  if (!type.startsWith("application/json")) return { ok: false, status: 415, error: "unsupported_media_type" };
  // Check the size before decoding so a huge base64 body is never expanded.
  if ((event.body?.length ?? 0) > maxBytes * 2) return { ok: false, status: 413, error: "too_large" };
  let raw = event.body ?? "";
  if (event.isBase64Encoded) raw = Buffer.from(raw, "base64").toString("utf8");
  if (Buffer.byteLength(raw) > maxBytes) return { ok: false, status: 413, error: "too_large" };
  let value;
  try { value = JSON.parse(raw); } catch { return { ok: false, status: 400, error: "invalid_json" }; }
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { ok: false, status: 400, error: "invalid_json" };
  return { ok: true, value };
}
