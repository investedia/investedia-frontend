import datetime as dt, unittest
from tools import country_briefs as cb

def art(i, c, t, mm=False, s='First sentence about the economy here today. More.'):
    return {'id': f'n{i}', 'headline': f'H{i}', 'summary': s, 'category': 'economy', 'published_at': t, 'market_moving': mm,
            'location': {'country': c}, 'source': {'name': f'S{i % 3}'}}

class T(unittest.TestCase):
    def test_week_and_filters(self):
        lib = [art(i, 'Brazil', '2026-11-03T10:00:00Z', mm=i < 4, s=' '.join(f'w{i}x{k}' for k in range(8)) + ' end of line here.') for i in range(12)]
        lib += [art(99, 'Brazil', '2026-11-10T10:00:00Z'), art(100, 'Chile', '2026-11-03T10:00:00Z')]
        ix, per = cb.build(dt.date(2026, 11, 12), lib)
        self.assertEqual((ix['from'], ix['to']), ('2026-11-02', '2026-11-08'))
        self.assertEqual([c['cc'] for c in ix['countries']], ['br'])  # Chile under 10 articles; next-week article excluded
        b = per['br']; self.assertEqual((b['n'], b['mm'], b['sources']), (12, 4, 3))
        self.assertEqual(len(b['lines']), 4); self.assertTrue(all(l['id'] for l in b['lines']))
        self.assertTrue(b['top'][0]['mm'])

    def test_duplicate_lines_dropped(self):
        s = "Brazil's central bank kept the Selic rate at 13.75% in November."
        self.assertGreater(cb.similar(s, "Brazil's central bank voted to keep the Selic rate at 13.75% per year."), 0.3)

if __name__ == '__main__': unittest.main()
