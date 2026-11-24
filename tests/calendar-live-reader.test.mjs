import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../functions/assets/calendar-live.json.js", import.meta.url), "utf8");
const { onRequest } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const current = await readFile(new URL("./fixtures/calendar-api-2026-11-24.json", import.meta.url));
const previous = await readFile(new URL("../assets/calendar-live.json", import.meta.url));
function fixture(method = "GET") {
  const calls = [];
  const context = { request: new Request("https://www.investedia.com/assets/calendar-live.json?target=ignored", { method, headers: { Authorization: "private-browser-token", Cookie: "private-cookie" } }),
    next: async () => new Response(previous), env: { ASSETS: { fetch: async () => new Response(previous) }, LIVE_API: { fetch: async (url, options) => {
      calls.push(url); assert.equal(url, "https://api.investedia.com/v1/calendar"); assert.equal(options.method, "GET"); assert.equal(options.redirect, "manual");
      assert.equal(options.headers.Authorization, undefined); assert.equal(options.headers.Cookie, undefined);
      return new Response(current);
    } } } };
  return { context, calls };
}
test("existing URL returns every real API byte/value/date with HEAD parity and no forwarded browser credentials", async () => {
  for (const method of ["GET", "HEAD"]) {
    const b = fixture(method), response = await onRequest(b.context);
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=60"); assert.equal(response.headers.get("Content-Length"), String(current.length));
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), method === "HEAD" ? Buffer.alloc(0) : current); assert.equal(b.calls.length, 1);
  }
});
test("missing binding and upstream failure/redirect/invalid content preserve exact static fallback", async () => {
  for (const mode of ["unbound", "network", "server", "redirect", "json", "shape", "old"]) {
    const b = fixture();
    if (mode === "unbound") delete b.context.env.LIVE_API;
    else b.context.env.LIVE_API.fetch = async () => {
      if (mode === "network") throw Error("private error");
      if (mode === "server") return new Response("private upstream", { status: 503 });
      if (mode === "redirect") return new Response(null, { status: 302, headers: { Location: "https://outside.invalid" } });
      return new Response(mode === "json" ? "invalid" : mode === "shape" ? "{}" : previous);
    };
    if (mode === "old") b.context.next = async () => new Response(current);
    const response = await onRequest(b.context);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), mode === "old" ? current : previous);
  }
});
test("oversized calendar is cancelled; write requests never call the service", async () => {
  const b = fixture(); let cancelled = false;
  b.context.env.LIVE_API.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(2 * 1024 * 1024 + 1)); }, cancel() { cancelled = true; } }));
  assert.deepEqual(Buffer.from(await (await onRequest(b.context)).arrayBuffer()), previous); assert.equal(cancelled, true);
  const write = fixture("POST"); await onRequest(write.context); assert.equal(write.calls.length, 0);
});
test("static 304 cannot hide newer calendar; verified source ETag controls conditional responses", async () => {
  const b = fixture(); b.context.next = async () => new Response(null, { status: 304 });
  const response = await onRequest(b.context); assert.equal(response.status, 200);
  b.context.request = new Request(b.context.request, { headers: { "If-None-Match": response.headers.get("ETag") } });
  const unchanged = await onRequest(b.context); assert.equal(unchanged.status, 304); assert.equal(await unchanged.text(), "");
});
test("enveloped public API data is unwrapped without changing fields or dates", async () => {
  const b = fixture(), data = JSON.parse(current);
  b.context.env.LIVE_API.fetch = async () => Response.json({ data, meta: { ignored: true } });
  assert.deepEqual(await (await onRequest(b.context)).json(), data);
});
