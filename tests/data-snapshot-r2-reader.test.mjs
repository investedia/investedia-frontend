import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = await readFile(new URL("../functions/assets/globe/markets.json.js", import.meta.url), "utf8");
const uri = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { onRequest: marketsRequest } = await import(uri);
const fxSource = await readFile(new URL("../functions/assets/globe/fx-ecb.json.js", import.meta.url), "utf8");
const { onRequest: fxRequest } = await import(`data:text/javascript;base64,${Buffer.from(fxSource.replace('"./markets.json.js"', JSON.stringify(uri))).toString("base64")}`);
const records = Object.fromEntries(await Promise.all(["markets", "fx-ecb"].map(async name => [name, await readFile(new URL("../assets/globe/" + name + ".json", import.meta.url))])));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
function fixture(name, method = "GET") {
  const bytes = records[name], data = JSON.parse(bytes), field = name === "markets" ? "asof" : "as_of";
  // Only comparison metadata is made older; real saved observations remain untouched.
  const baseline = { ...data, [field]: name === "markets" ? "2000-01-01T00:00:00Z" : "2000-01-01" };
  const context = { request: new Request("https://investedia.com/assets/globe/" + name + ".json", { method }), next: async () => Response.json(baseline), env: {
    ARTICLE_STORE: { get: async key => { assert.equal(key, "published/data/" + name + ".json"); return { size: bytes.length, customMetadata: { asof: data[field], sha256: sha(bytes) }, arrayBuffer: async () => bytes }; } },
    ASSETS: { fetch: async () => Response.json(baseline) }
  } };
  return { context, bytes, baseline, run: name === "markets" ? marketsRequest : fxRequest };
}
test("both existing JSON URLs return exact saved bytes and dates, with HEAD parity", async () => {
  for (const name of ["markets", "fx-ecb"]) for (const method of ["GET", "HEAD"]) {
    const b = fixture(name, method), response = await b.run(b.context);
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
    assert.equal(response.headers.get("Content-Length"), String(b.bytes.length));
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), method === "HEAD" ? Buffer.alloc(0) : b.bytes);
  }
});
test("missing storage, read failures and absent objects retain static fallback", async () => {
  for (const mode of ["binding", "missing", "failure"]) {
    const b = fixture("markets");
    if (mode === "binding") delete b.context.env.ARTICLE_STORE;
    else b.context.env.ARTICLE_STORE.get = async () => { if (mode === "failure") throw Error("offline"); return null; };
    assert.equal(await (await b.run(b.context)).text(), JSON.stringify(b.baseline));
  }
});
test("bad checksums, oversized objects, equal dates and changed asset universes retain static", async () => {
  for (const mode of ["checksum", "size", "equal", "universe"]) {
    const b = fixture("markets"), original = b.context.env.ARTICLE_STORE.get;
    if (mode === "equal") b.context.next = async () => new Response(b.bytes);
    else if (mode === "universe") { b.baseline.assets = b.baseline.assets.slice(1); }
    else b.context.env.ARTICLE_STORE.get = async key => { const value = await original(key); if (mode === "checksum") value.customMetadata.sha256 = "0".repeat(64); else value.size = 5 * 1024 * 1024; return value; };
    const response = await b.run(b.context);
    assert.equal(response.headers.get("Cache-Control"), null);
  }
});

test("homepage JSON route forwards to the existing guarded stats reader", async () => {
  const alias = await readFile(new URL("../functions/assets/globe/site-stats.json.js", import.meta.url), "utf8");
  const handler = "data:text/javascript;base64," + Buffer.from("export const onRequest = () => new Response('existing-stats');").toString("base64");
  const { onRequest } = await import("data:text/javascript;base64," + Buffer.from(alias.replace('"./site-stats.js"', JSON.stringify(handler))).toString("base64"));
  assert.equal(await onRequest().text(), "existing-stats");
});

test("static 304 cannot hide a newer snapshot; conditional responses use the published checksum", async () => {
  const b = fixture("markets");
  b.context.next = async () => new Response(null, { status: 304 });
  const fresh = await b.run(b.context); assert.equal(fresh.status, 200);
  assert.deepEqual(Buffer.from(await fresh.arrayBuffer()), b.bytes);
  b.context.request = new Request(b.context.request, { headers: { "If-None-Match": fresh.headers.get("ETag") } });
  const unchanged = await b.run(b.context); assert.equal(unchanged.status, 304); assert.equal(await unchanged.text(), "");
});
