import json, pathlib, unittest
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

if __name__ == '__main__': unittest.main()
