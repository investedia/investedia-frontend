import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = await readFile(new URL("../functions/assets/globe/library-index/[[path]].js", import.meta.url), "utf8");
const uri = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { onRequest } = await import(uri);
const statsSource = await readFile(new URL("../functions/assets/globe/site-stats.js", import.meta.url), "utf8");
const { onRequest: statsRequest } = await import(`data:text/javascript;base64,${Buffer.from(statsSource.replace('"./library-index/[[path]].js"', JSON.stringify(uri))).toString("base64")}`);
const real = JSON.parse(await readFile(new URL("../assets/globe/news-live.json", import.meta.url), "utf8")).stories.slice(0, 2);
const all = Buffer.from(JSON.stringify(real));
const meta = Buffer.from(JSON.stringify({ total: real.length, sources: new Set(real.map(r => r.source.name)).size }));
const sha = value => createHash("sha256").update(value).digest("hex");
function fixture(path = "page-1.json", method = "GET") {
  const calls = [], version = sha(all), baseline = sha("static catalog");
  const manifest = { version, baseline_sha256: baseline, pages: [[1, all.byteLength - 2]], files: {
    "all.json": { size: all.byteLength, sha256: sha(all) }, "meta.json": { size: meta.byteLength, sha256: sha(meta) }
  } };
  const context = { request: new Request("https://investedia.com/assets/globe/library-index/" + path, { method }), params: { path: [path] },
    next: async () => { calls.push("fallback"); return new Response("static"); },
    env: { ASSETS: { fetch: async req => {
      const url = new URL(req.url); calls.push(url.pathname);
      if (url.pathname === "/assets/globe/library-index/meta.json") return Response.json({ catalog_sha256: baseline });
      assert.equal(url.pathname, "/assets/globe/site-stats.json"); return Response.json({ articles: 1, sources: 1, projects: 2797 });
    } }, ARTICLE_STORE: {} }, calls, manifest };
  const object = (key, options) => {
    calls.push([key, options]);
    if (key === "published/library-index/current.json") return { size: JSON.stringify(manifest).length, text: async () => JSON.stringify(manifest) };
    assert.ok(key.startsWith(`published/library-index/versions/${version}/`));
    const body = key.endsWith("/meta.json") ? meta : all;
    const selected = options?.range ? body.subarray(options.range.offset, options.range.offset + options.range.length) : body;
    return { size: body.byteLength, body: selected, customMetadata: { sha256: sha(body) }, httpEtag: '"index"',
      range: options?.range, text: async () => body.toString(), arrayBuffer: async () => Uint8Array.from(selected).buffer };
  };
  context.env.ARTICLE_STORE.get = async (key, options) => object(key, options);
  context.env.ARTICLE_STORE.head = async key => object(key);
  return context;
}

test("old page URL reads only the exact byte range, returning unchanged article fields", async () => {
  const ctx = fixture(); const response = await onRequest(ctx);
  assert.deepEqual(await response.json(), real);
  assert.deepEqual(ctx.calls.at(-1), [`published/library-index/versions/${ctx.manifest.version}/all.json`, { range: { offset: 1, length: all.byteLength - 2 } }]);
  assert.equal(response.headers.get("Content-Type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
});
test("search index and metadata return immutable published bytes", async () => {
  for (const [name, expected] of [["all.json", all], ["meta.json", meta]]) {
    const ctx = fixture(name); const response = await onRequest(ctx);
    assert.equal(await response.text(), expected.toString()); assert.equal(response.headers.get("ETag"), '"index"');
  }
});
test("HEAD requests never read a large object body", async () => {
  const ctx = fixture("page-1.json", "HEAD");
  ctx.env.ARTICLE_STORE.get = async key => { assert.equal(key, "published/library-index/current.json"); return { size: JSON.stringify(ctx.manifest).length, text: async () => JSON.stringify(ctx.manifest) }; };
  const response = await onRequest(ctx); assert.equal(await response.text(), "");
  assert.equal(response.headers.get("Content-Length"), String(all.byteLength));
});
test("unbound, failed or mismatched publication keeps the static archive", async () => {
  const absent = fixture(); delete absent.env.ARTICLE_STORE;
  const missing = fixture(); missing.env.ARTICLE_STORE.get = async () => null;
  const failed = fixture(); failed.env.ARTICLE_STORE.get = async () => { throw Error("private storage detail"); };
  const mismatch = fixture(); mismatch.manifest.baseline_sha256 = sha("newer static archive");
  for (const ctx of [absent, missing, failed, mismatch]) assert.equal(await (await onRequest(ctx)).text(), "static");
});
test("invalid paths and write requests never touch R2", async () => {
  for (const path of ["../state.json.gz", "trial/state.json.gz", "current.json", "state.json.gz", "page-0.json", "page-1.json/extra", "tick-../private.json"]) {
    const ctx = fixture(path); await onRequest(ctx); assert.deepEqual(ctx.calls, ["fallback"]);
  }
  for (const method of ["POST", "PUT", "DELETE"]) {
    const ctx = fixture("meta.json", method); await onRequest(ctx); assert.deepEqual(ctx.calls, ["fallback"]);
  }
});
test("malformed manifests and unfulfilled ranges fail closed", async () => {
  for (const change of [m => m.version = "../private", m => m.pages[0] = [0, 2], m => m.pages[0] = [1, 99999999],
    m => m.files["all.json"].size = 99 * 1024 * 1024, m => m.files["all.json"].sha256 = "invalid"]) {
    const ctx = fixture(); change(ctx.manifest); assert.equal(await (await onRequest(ctx)).text(), "static");
  }
  const ctx = fixture(); const get = ctx.env.ARTICLE_STORE.get;
  ctx.env.ARTICLE_STORE.get = async (key, options) => { const object = await get(key, options); if (options) object.range = undefined; return object; };
  assert.equal(await (await onRequest(ctx)).text(), "static");
});
test("homepage totals change only article/source counts and preserve project totals", async () => {
  const ctx = fixture(); const response = await statsRequest(ctx);
  assert.deepEqual(await response.json(), { articles: real.length, sources: JSON.parse(meta.toString()).sources, projects: 2797 });
});
test("homepage totals retain the static response if the catalog changed or publication is unavailable", async () => {
  for (const change of [ctx => ctx.manifest.baseline_sha256 = sha("different"), ctx => ctx.env.ARTICLE_STORE.get = async () => null]) {
    const ctx = fixture(); change(ctx); assert.equal(await (await statsRequest(ctx)).text(), "static");
  }
});
