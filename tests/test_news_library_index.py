import hashlib, importlib.util, json, pathlib, tempfile, unittest
from unittest.mock import patch
ROOT = pathlib.Path(__file__).resolve().parents[1]
IDX = ROOT / 'assets/globe/library-index'

class NewsLibraryIndex(unittest.TestCase):
    def test_index_matches_library(self):
        lib = [p for p in (ROOT / 'assets/globe/library').glob('*.json')]
        days = ROOT / 'assets/globe/library-days'
        bundled = sum(len(json.loads(f.read_text())) for f in days.glob('????-??-??.json')) if days.is_dir() else 0
        meta = json.loads((IDX / 'meta.json').read_text())
        rows = json.loads((IDX / 'all.json').read_text())
        self.assertEqual(meta['total'], len(rows))
        self.assertLessEqual(meta['total'], len(lib) + bundled)
        self.assertEqual(meta['pages'], -(-len(rows) // meta['per_page']))
        self.assertEqual(sum(meta['categories'].values()), meta['total'])
        paged = [r for p in range(meta['pages']) for r in json.loads((IDX / f'page-{p + 1}.json').read_text())]
        self.assertEqual([r['id'] for r in paged], [r['id'] for r in rows])
        self.assertEqual(rows, sorted(rows, key=lambda r: (r['t'], r['id']), reverse=True))

    def test_catalog_fingerprint_matches_exact_built_bytes_and_docs_mirror(self):
        spec = importlib.util.spec_from_file_location('original_library_builder', ROOT / 'tools/news_library_index.py')
        builder = importlib.util.module_from_spec(spec); spec.loader.exec_module(builder)
        article = json.loads((ROOT / 'assets/globe/news-live.json').read_text(encoding='utf-8'))['stories'][0]
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            library = root / 'assets/globe/library'; library.mkdir(parents=True)
            (root / 'docs/assets/globe').mkdir(parents=True)
            (library / (article['id'] + '.json')).write_text(json.dumps(article), encoding='utf-8')
            with patch.object(builder, 'ROOT', root): meta = builder.write()
            raw = (root / 'assets/globe/library-index/all.json').read_bytes()
            self.assertEqual(meta['catalog_sha256'], hashlib.sha256(raw).hexdigest())
            self.assertEqual((root / 'docs/assets/globe/library-index/all.json').read_bytes(), raw)
            self.assertEqual(json.loads(raw)[0]['t'], article['published_at'])
            self.assertEqual(json.loads((root / 'docs/assets/globe/library-index/meta.json').read_bytes()), meta)

if __name__ == '__main__': unittest.main()
