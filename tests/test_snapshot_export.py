import unittest,tempfile,subprocess,sys,shutil
from pathlib import Path
SCRIPT=Path(__file__).resolve().parents[1]/'scripts/sync-snapshots.py'
class SnapshotExportTest(unittest.TestCase):
 def setup_repos(self,tmp):
  base=Path(tmp);front=base/'frontend';back=base/'backend';(front/'scripts').mkdir(parents=True);(back/'api').mkdir(parents=True);(back/'api/pom.xml').write_text('test only');shutil.copy2(SCRIPT,front/'scripts/sync-snapshots.py');return front,back
 def test_export_includes_new_photo_bytes_and_feed_json(self):
  with tempfile.TemporaryDirectory() as tmp:
   front,back=self.setup_repos(tmp);photos=back/'assets/globe/photos';photos.mkdir(parents=True);(photos/'test.webp').write_bytes(b'test-only photo bytes');(back/'assets/globe/news-live.json').write_text('{"test":"fixture"}')
   result=subprocess.run([sys.executable,str(front/'scripts/sync-snapshots.py'),'--backend',str(back)],capture_output=True);self.assertEqual(result.returncode,0);self.assertEqual((front/'assets/globe/photos/test.webp').read_bytes(),(photos/'test.webp').read_bytes());self.assertEqual((front/'assets/globe/news-live.json').read_bytes(),(back/'assets/globe/news-live.json').read_bytes())
 def test_frozen_history_conflict_stops_before_exporting_other_files(self):
  with tempfile.TemporaryDirectory() as tmp:
   front,back=self.setup_repos(tmp);(back/'assets/globe').mkdir(parents=True);(front/'assets/globe').mkdir(parents=True);(front/'assets/globe/v5-ledger.json').write_text('original test fixture');(back/'assets/globe/v5-ledger.json').write_text('different test fixture');(back/'assets/globe/news-live.json').write_text('{}')
   result=subprocess.run([sys.executable,str(front/'scripts/sync-snapshots.py'),'--backend',str(back)],capture_output=True);self.assertNotEqual(result.returncode,0);self.assertFalse((front/'assets/globe/news-live.json').exists());self.assertEqual((front/'assets/globe/v5-ledger.json').read_text(),'original test fixture')
if __name__=='__main__':unittest.main()
