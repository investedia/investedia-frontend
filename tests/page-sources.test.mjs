import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pageSources} from '../tools/page-sources.mjs';

function fixture(t, names) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'investedia-pages-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  for (const name of names) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, '{}\n<p>Source discovery fixture</p>');
  }
  return root;
}

test('grouped and flat sources retain flat sorted URLs', t => {
  const root = fixture(t, ['news/story.html', 'index.html', 'company/about.html']);
  const pages = pageSources(root);
  assert.deepEqual(pages.map(p => p.name), ['about.html', 'index.html', 'story.html']);
  assert.equal(pages[0].source, path.join(root, 'company/about.html'));
});

test('invalid names stay out of browser and locale page lists', t => {
  const root = fixture(t, ['legal/privacy.html', 'about 2.html', 'UPPER.html', 'readme.txt']);
  assert.deepEqual(pageSources(root).map(p => p.name), ['privacy.html']);
});

test('duplicate public outputs fail instead of silently hiding pages', t => {
  const root = fixture(t, ['index.html', 'site/index.html']);
  assert.throws(() => pageSources(root), /Duplicate page output: index.html/);
});
