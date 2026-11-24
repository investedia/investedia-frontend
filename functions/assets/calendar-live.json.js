// Existing calendar URL reads only the public calendar endpoint through a private service binding.
const LIMIT = 2 * 1024 * 1024;
async function bounded(response) {
  if (response.status !== 200 || !response.body) { await response.body?.cancel(); throw Error("Calendar unavailable"); }
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > LIMIT) throw Error("Calendar too large"); chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
function date(value) {
  const time = typeof value === "string" ? Date.parse(value) : NaN;
  if (!Number.isFinite(time) || time > Date.now() + 300000) throw Error("Invalid calendar date");
  return time;
}
export async function onRequest(context) {
  const { request, env } = context, fallback = await context.next();
  if (!["GET", "HEAD"].includes(request.method) || (!fallback.ok && fallback.status !== 304) || !env.LIVE_API) return fallback;
  try {
    const baseline = request.method === "HEAD" || fallback.status === 304 ? await env.ASSETS.fetch(new Request(new URL("/assets/calendar-live.json", request.url))) : fallback.clone();
    if (!baseline.ok) return fallback;
    const previous = await baseline.json();
    const response = await env.LIVE_API.fetch("https://api.investedia.com/v1/calendar", { method: "GET", redirect: "manual", signal: AbortSignal.timeout(10000), headers: { Accept: "application/json", "User-Agent": "InvestediaCalendarRead/1.0" } });
    let bytes = await bounded(response);
    const decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), data = decoded.data ?? decoded;
    if (!Array.isArray(data?.events) || data.events.length > 1000 || !Array.isArray(data.earnings) || data.earnings.length > 200
        || !data.sources || typeof data.sources !== "object" || data.events.some(row => !row || typeof row.t !== "string" || !Number.isFinite(Date.parse(row.at)))) return fallback;
    if (date(data.updated_at) < date(previous.updated_at)) return fallback;
    if (data !== decoded) bytes = new TextEncoder().encode(JSON.stringify(data));
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), value => value.toString(16).padStart(2, "0")).join("");
    const etag = '"' + sha + '"', headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff", ETag: etag };
    if ((request.headers.get("If-None-Match") || "").split(",").some(value => [etag, "W/" + etag, "*"].includes(value.trim()))) return new Response(null, { status: 304, headers });
    headers["Content-Length"] = String(bytes.byteLength);
    return new Response(request.method === "HEAD" ? null : bytes, { headers });
  } catch { return fallback; }
}
