import { publishedIndex, indexHeaders } from "./library-index/[[path]].js";

export async function onRequest(context) {
  const fallback = await context.next();
  if (!fallback.ok) return fallback;
  try {
    const manifest = await publishedIndex(context);
    const file = manifest?.files?.["meta.json"];
    if (!file || !/^[0-9a-f]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size > 64 * 1024) return fallback;
    const saved = await context.env.ARTICLE_STORE.get(`published/library-index/versions/${manifest.version}/meta.json`);
    if (!saved || saved.size !== file.size || saved.customMetadata?.sha256 !== file.sha256) return fallback;
    const meta = JSON.parse(await saved.text());
    if (!Number.isSafeInteger(meta.total) || meta.total < 0 || !Number.isSafeInteger(meta.sources) || meta.sources < 0) return fallback;
    // Keep projects and every unrelated homepage statistic from the deployed site.
    const stats = await context.env.ASSETS.fetch(new Request(new URL("/assets/globe/site-stats.json", context.request.url)));
    if (!stats.ok) return fallback;
    const body = { ...await stats.json(), articles: meta.total, sources: meta.sources };
    return new Response(context.request.method === "HEAD" ? null : JSON.stringify(body), { headers: indexHeaders() });
  } catch { return fallback; }
}
