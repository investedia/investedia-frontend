import json
from pathlib import Path
import unittest
from tools import legal_check
ROOT=Path(__file__).resolve().parents[1]
class ReleaseGate(unittest.TestCase):
 def test_all_facts_block_release_until_set(self):
  values=legal_check.config();self.assertTrue(legal_check.issues(values=values))
  complete={k:'Verified owner value' for k in values}
  self.assertEqual(legal_check.issues(values=complete),[])
  for k in complete:
   trial=dict(complete);trial[k]=None
   self.assertTrue(any(k in i for i in legal_check.issues(values=trial)),k)
 def test_render_escapes_values_and_retains_null_markers(self):
  self.assertIn('owner-placeholder',legal_check.render('[OWNER: legal name]',{}))
  self.assertEqual(legal_check.render('[OWNER: legal name]',{'legal_name':'A&B <Ltd>'}),'A&amp;B &lt;Ltd&gt;')
  self.assertEqual(legal_check.render('[OWNER: legal name]',{},styled=False),'[OWNER: legal name]')
 def test_unknown_source_marker_fails(self):
  sources=''.join(p.read_text() for p in (ROOT/'src/pages').rglob('*.html') if ' ' not in p.name)
  for m in legal_check.MARKER.findall(sources):self.assertIn(m,legal_check.fields())
 def test_redirects_are_lightweight_and_not_indexed(self):
  for name,dest in json.loads((ROOT/'tests/fixtures/retired-urls.json').read_text()).items():
   text=(ROOT/f'{name}.html').read_text()
   self.assertIn('content="noindex"',text);self.assertIn(f'url={dest}',text)
   self.assertIn('location.replace',text);self.assertNotIn(f'https://investedia.com/{name}.html',(ROOT/'sitemap.xml').read_text())
if __name__=='__main__':unittest.main()
