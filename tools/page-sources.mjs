// Development tools inspect grouped sources but visit the existing flat URLs.
import fs from 'node:fs';
import path from 'node:path';

export function pageSources(root = 'src/pages') {
  const pages = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const source = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(source);
      else if (entry.isFile() && /^[a-z0-9-]+\.html$/.test(entry.name)) {
        pages.push({name: entry.name, source});
      }
    }
  }
  visit(root);
  pages.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const seen = new Set();
  for (const page of pages) {
    if (seen.has(page.name)) throw new Error(`Duplicate page output: ${page.name}`);
    seen.add(page.name);
  }
  return pages;
}
