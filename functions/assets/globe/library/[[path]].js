// Keep existing article URLs; only explicitly published objects can be served.
export async function onRequest(context) {
  const { request, env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join("/") : params.path || "";
  const match = /^([A-Za-z0-9_-]{4,80})\.json$/.exec(path);
  const fallback = await context.next();
  if (fallback.status !== 404 || !["GET", "HEAD"].includes(request.method) || !match || !env.ARTICLE_STORE) return fallback;
  // Bundled static articles keep their existing loader path and original contents.
  try {
    const index = await env.ASSETS.fetch(new Request(new URL("/assets/globe/library-days/ids.json", request.url)));
    if (!index.ok) return fallback;
    const ids = await index.json();
    if (!ids || typeof ids !== "object" || Array.isArray(ids) || Object.hasOwn(ids, match[1])) return fallback;
  } catch { return fallback; }
  let saved;
  try {
    const key = `published/library/articles/${match[1]}.json`;
    saved = await (request.method === "HEAD" ? env.ARTICLE_STORE.head(key) : env.ARTICLE_STORE.get(key));
  } catch { return fallback; }
  if (!saved) return fallback;
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" });
  if (saved.httpEtag) headers.set("ETag", saved.httpEtag);
  return new Response(request.method === "HEAD" ? null : saved.body, { headers });
}
