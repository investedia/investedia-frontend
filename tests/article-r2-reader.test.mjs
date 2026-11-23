import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../functions/assets/globe/library/[[path]].js", import.meta.url), "utf8");
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const article = JSON.parse(await readFile(new URL("../assets/globe/news-live.json", import.meta.url), "utf8")).stories[0];
const body = JSON.stringify(article);
function context(path = article.id + ".json", method = "GET") {
  const calls = [];
  const result = { request: new Request("https://investedia.com/assets/globe/library/" + path, { method }), params: { path },
    env: { ARTICLE_STORE: { get: async key => { calls.push(["get", key]); return { body, httpEtag: '"saved-article"' }; },
      head: async key => { calls.push(["head", key]); return { httpEtag: '"saved-article"' }; } } },
    next: async () => { calls.push(["fallback"]); return new Response("static fallback", { status: 404 }); }, calls };
  return result;
}
test("old article URL returns exact saved bytes from the published prefix only", async () => {
  const ctx = context(); const response = await onRequest(ctx);
  assert.equal(await response.text(), body);
  assert.deepEqual(ctx.calls, [["fallback"], ["get", `published/library/articles/${article.id}.json`]]);
  assert.equal(response.headers.get("Content-Type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("ETag"), '"saved-article"');
});
test("HEAD reads metadata and never fetches an article body", async () => {
  const ctx = context(article.id + ".json", "HEAD"); const response = await onRequest(ctx);
  assert.equal(await response.text(), "");
  assert.deepEqual(ctx.calls, [["fallback"], ["head", `published/library/articles/${article.id}.json`]]);
});
test("unbound, missing and unavailable storage retain the existing static article", async () => {
  const absent = context(); absent.env = {};
  const missing = context(); missing.env.ARTICLE_STORE.get = async () => null;
  const unavailable = context(); unavailable.env.ARTICLE_STORE.get = async () => { throw Error("private storage detail"); };
  for (const ctx of [absent, missing, unavailable]) {
    const response = await onRequest(ctx);
    assert.equal(await response.text(), "static fallback");
    assert.equal(ctx.calls.filter(c => c[0] === "fallback").length, 1);
  }
});
test("paths, private namespaces, config names and write requests never reach R2", async () => {
  for (const path of ["../config.local.json", "trial/state.json.gz", "published/library/articles/private.json", "id.json/extra", "%2e%2e%2fkey.json", "config.local.json", ""]) {
    const ctx = context(path); await onRequest(ctx); assert.deepEqual(ctx.calls, [["fallback"]]);
  }
  for (const method of ["POST", "PUT", "DELETE"]) {
    const ctx = context(article.id + ".json", method); await onRequest(ctx); assert.deepEqual(ctx.calls, [["fallback"]]);
  }
});

test("existing static articles always win without a storage lookup", async () => {
  const ctx = context();
  ctx.params.path = [article.id + ".json"];
  ctx.next = async () => { ctx.calls.push(["fallback"]); return new Response("original static article", { status: 200 }); };
  const response = await onRequest(ctx);
  assert.equal(await response.text(), "original static article");
  assert.deepEqual(ctx.calls, [["fallback"]]);
});
test("Pages catch-all array parameters resolve only a single approved article file", async () => {
  const ctx = context(); ctx.params.path = [article.id + ".json"];
  assert.equal(await (await onRequest(ctx)).text(), body);
  const nested = context(); nested.params.path = ["trial", article.id + ".json"];
  await onRequest(nested); assert.deepEqual(nested.calls, [["fallback"]]);
});
