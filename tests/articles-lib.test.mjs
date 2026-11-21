import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/js/articles-lib.js', import.meta.url), 'utf8');
// Test-only articles; never published as site data.
const rows = [
  {id: 'fixture-one', h: '[Test fixture] Economy article', c: 'economy', g: 'eu', t: '2026-11-20T12:00:00Z', k: 1},
  {id: 'fixture-two', h: '[Test fixture] Company article', c: 'companies', g: 'na', t: '2026-11-19T12:00:00Z', k: 2},
];
const response = data => ({ok: true, json: async () => data});
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return {promise, resolve, reject}; };
const settle = async () => { for (let n = 0; n < 4; n++) await new Promise(resolve => setImmediate(resolve)); };

function setup(overrides = {}, onNews = true) {
  const nodes = new Map(), events = {}, calls = [];
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {innerHTML: '', textContent: '', value: '', addEventListener() {}, scrollIntoView() {}});
    return nodes.get(id);
  };
  const location = new URL('https://fixture.invalid/news.html');
  const update = (_, __, url) => { location.href = new URL(url, location).href; };
  const data = {
    'meta.json': {total: 4, sources: 2, first: rows[1].t, pages: 2, per_page: 2, categories: {economy: 2, companies: 2}, regions: {eu: 2, na: 2}},
    'page-1.json': rows, 'page-2.json': rows, 'all.json': rows,
  };
  vm.runInNewContext(source, {
    window: {InvData: {get: async () => ({data: {days: {}}})}},
    document: {readyState: 'complete', getElementById: node, querySelector: () => onNews ? {} : null, addEventListener: (name, fn) => { events[name] = fn; }},
    location, history: {pushState: update, replaceState: update}, URLSearchParams, setTimeout, clearTimeout,
    addEventListener() {},
    fetch: async url => {
      const file = url.split('/').pop(); calls.push(file);
      if (overrides[file]) return overrides[file]();
      return response(file === 'news-live.json' ? {stories: []} : data[file]);
    },
  });
  const filter = cat => events.click({target: {closest: selector => selector === '[data-k]' ? {dataset: {k: 'cat', v: cat}} : null}});
  const page = number => events.click({preventDefault() {}, target: {closest: selector => selector === '#al-pg a[data-page]' ? {getAttribute: () => `news.html?page=${number}`} : null}});
  return {node, calls, filter, page};
}

test('initialization and returning to page one reuse a single download', async () => {
  const app = setup(); await settle();
  app.page(2); await settle(); app.page(1); await settle();
  assert.equal(app.calls.filter(f => f === 'page-1.json').length, 1);
  assert.match(app.node('al-list').innerHTML, /fixture-one/);
});

test('rapid filters share the pending index and only the newest selection renders', async () => {
  const pending = deferred(), app = setup({'all.json': () => pending.promise}); await settle();
  app.filter('economy'); app.filter('companies');
  pending.resolve(response(rows)); await settle();
  assert.equal(app.calls.filter(f => f === 'all.json').length, 1);
  assert.match(app.node('al-list').innerHTML, /fixture-two/);
  assert.doesNotMatch(app.node('al-list').innerHTML, /fixture-one/);
});

test('a slow page cannot replace a newer filter', async () => {
  const pending = deferred(), app = setup({'page-2.json': () => pending.promise}); await settle();
  app.page(2); app.filter('companies'); await settle();
  pending.resolve(response(rows)); await settle();
  assert.match(app.node('al-list').innerHTML, /fixture-two/);
  assert.doesNotMatch(app.node('al-list').innerHTML, /fixture-one/);
});

test('a failed old request cannot erase newer results', async () => {
  const pending = deferred(), app = setup({'page-2.json': () => pending.promise}); await settle();
  app.page(2); app.filter('companies'); await settle();
  pending.reject(Error('Test-only network failure')); await settle();
  assert.match(app.node('al-list').innerHTML, /fixture-two/);
  assert.doesNotMatch(app.node('al-list').innerHTML, /could not load/);
});

test('a failed index download is retried on the next filter', async () => {
  let attempts = 0;
  const app = setup({'all.json': () => ++attempts === 1 ? Promise.reject(Error('Test-only outage')) : response(rows)}); await settle();
  app.filter('economy'); await settle();
  assert.match(app.node('al-list').innerHTML, /could not load/);
  app.filter('companies'); await settle();
  assert.equal(attempts, 2);
  assert.match(app.node('al-list').innerHTML, /fixture-two/);
});

test('a delayed lead summary cannot attach to a newer selection', async () => {
  const pending = deferred();
  const app = setup({'page-1.json': () => response([{...rows[0], i: 'test-only.jpg'}, rows[1]]), 'fixture-one.json': () => pending.promise}, false);
  await settle();
  app.filter('companies'); await settle();
  pending.resolve(response({summary: '[Test-only outdated summary]'})); await settle();
  assert.equal(app.node('al-lead-sum').textContent, '');
});
