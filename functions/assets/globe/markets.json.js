// Keep the existing static snapshot unless a complete, newer published object is valid.
const LIMIT = 4 * 1024 * 1024, FILES = { markets: "markets.json", fx: "fx-ecb.json" };
function stamp(data, job) {
  const value = job === "markets" ? data?.asof : data?.as_of;
  const pattern = job === "markets" ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/ : /^\d{4}-\d{2}-\d{2}$/;
  const time = typeof value === "string" && pattern.test(value) ? Date.parse(value) : NaN;
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value.slice(0, 10) || time > Date.now() + 300000) throw Error("Invalid snapshot date");
  if (job === "markets") {
    if (!Array.isArray(data.assets) || !data.assets.length || data.assets.length > 1000
        || data.assets.some(a => typeof a?.s !== "string" || !a.s || a.s.length > 80)
        || new Set(data.assets.map(a => a.s)).size !== data.assets.length) throw Error("Invalid markets");
  } else if (data.schema !== "investedia.fx-ecb/v1" || !data.usd || Object.keys(data.usd).length < 20
      || Object.entries(data.usd).some(([code, rate]) => !/^[A-Z]{3}$/.test(code) || !Number.isFinite(rate) || rate <= 0)) throw Error("Invalid FX");
  return value;
}
export async function readSnapshot(context, job) {
  const fallback = await context.next(), { request, env } = context;
  if ((!fallback.ok && fallback.status !== 304) || !["GET", "HEAD"].includes(request.method) || !Object.hasOwn(FILES, job) || !env.ARTICLE_STORE) return fallback;
  try {
    const staticResponse = request.method === "HEAD" || fallback.status === 304 ? await env.ASSETS.fetch(new Request(new URL("/assets/globe/" + FILES[job], request.url))) : fallback.clone();
    if (!staticResponse.ok) return fallback;
    const baseline = await staticResponse.json(), baselineDate = stamp(baseline, job);
    const saved = await env.ARTICLE_STORE.get("published/data/" + FILES[job]);
    if (!saved || !Number.isSafeInteger(saved.size) || saved.size < 2 || saved.size > LIMIT || !/^[0-9a-f]{64}$/.test(saved.customMetadata?.sha256)) return fallback;
    const bytes = await saved.arrayBuffer(); if (bytes.byteLength !== saved.size) return fallback;
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), x => x.toString(16).padStart(2, "0")).join("");
    if (sha !== saved.customMetadata.sha256) return fallback;
    const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), date = stamp(data, job);
    if (date !== saved.customMetadata.asof || Date.parse(date) <= Date.parse(baselineDate)) return fallback;
    if (job === "markets" && (data.assets.length !== baseline.assets.length || data.assets.some((a, i) => a.s !== baseline.assets[i].s))) return fallback;
    const etag = '"' + sha + '"', headers = {
      "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff", ETag: etag
    };
    if ((request.headers.get("If-None-Match") || "").split(",").some(value => [etag, "W/" + etag, "*"].includes(value.trim())))
      return new Response(null, { status: 304, headers });
    headers["Content-Length"] = String(bytes.byteLength);
    return new Response(request.method === "HEAD" ? null : bytes, { headers });
  } catch { return fallback; }
}
export const onRequest = context => readSnapshot(context, "markets");
