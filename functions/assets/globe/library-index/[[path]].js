// Existing index URLs read only a complete published version for this exact static archive.
const HEX = /^[0-9a-f]{64}$/;
const FILE = /^(?:all|meta|tick-[A-Z_])\.json$/;

export async function publishedIndex(context) {
  const { request, env } = context;
  if (!["GET", "HEAD"].includes(request.method) || !env.ARTICLE_STORE || !env.ASSETS) return null;
  const response = await env.ASSETS.fetch(new Request(new URL("/assets/globe/library-index/meta.json", request.url)));
  if (!response.ok) return null;
  const baseline = await response.json();
  if (!HEX.test(baseline?.catalog_sha256)) return null;
  const saved = await env.ARTICLE_STORE.get("published/library-index/current.json");
  if (!saved || !Number.isSafeInteger(saved.size) || saved.size < 2 || saved.size > 256 * 1024) return null;
  const manifest = JSON.parse(await saved.text());
  if (!HEX.test(manifest?.version) || manifest.baseline_sha256 !== baseline.catalog_sha256 || !manifest.files
      || !Array.isArray(manifest.pages) || manifest.pages.length < 1 || manifest.pages.length > 4167) return null;
  return manifest;
}

export function indexHeaders(saved) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff" });
  if (saved?.httpEtag) headers.set("ETag", saved.httpEtag);
  return headers;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join("/") : params.path || "";
  const page = /^page-([1-9][0-9]{0,3})\.json$/.exec(path);
  if (!FILE.test(path) && !page) return context.next();
  try {
    const manifest = await publishedIndex(context);
    if (!manifest) return context.next();
    const name = page ? "all.json" : path, file = manifest.files[name];
    if (!file || !HEX.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 2 || file.size > 32 * 1024 * 1024) return context.next();
    const key = `published/library-index/versions/${manifest.version}/${name}`;
    const head = request.method === "HEAD";
    if (page) {
      const range = manifest.pages[Number(page[1]) - 1];
      if (!range || range.length !== 2 || !Number.isSafeInteger(range[0]) || range[0] < 1
          || !Number.isSafeInteger(range[1]) || range[1] < 0 || range[1] > 512 * 1024 || range[0] + range[1] > file.size - 1) return context.next();
      if (head) {
        const saved = await env.ARTICLE_STORE.head(key);
        if (!saved || saved.size !== file.size || saved.customMetadata?.sha256 !== file.sha256) return context.next();
        const headers = indexHeaders(); headers.set("Content-Length", String(range[1] + 2));
        return new Response(null, { headers });
      }
      if (range[1] === 0) return new Response("[]", { headers: indexHeaders() });
      const saved = await env.ARTICLE_STORE.get(key, { range: { offset: range[0], length: range[1] } });
      if (!saved || saved.size !== file.size || saved.customMetadata?.sha256 !== file.sha256 || saved.range?.offset !== range[0] || saved.range?.length !== range[1]) return context.next();
      const body = await saved.arrayBuffer();
      if (body.byteLength !== range[1]) return context.next();
      const wrapped = new Uint8Array(body.byteLength + 2); wrapped[0] = 91; wrapped.set(new Uint8Array(body), 1); wrapped[wrapped.length - 1] = 93;
      return new Response(wrapped, { headers: indexHeaders() });
    }
    const saved = await (head ? env.ARTICLE_STORE.head(key) : env.ARTICLE_STORE.get(key));
    if (!saved || saved.size !== file.size || saved.customMetadata?.sha256 !== file.sha256) return context.next();
    return new Response(head ? null : saved.body, { headers: indexHeaders(saved) });
  } catch { return context.next(); }
}
