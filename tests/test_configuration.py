import unittest,tempfile,json,sys,base64
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from serve import load_config,runtime_script

class PublicConfigurationTest(unittest.TestCase):
 def config(self,value):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'config.json';p.write_text(json.dumps(value));return load_config(p)
 def test_local_api_is_snapshot_and_accounts_optional(self):
  cfg=self.config({});self.assertTrue(cfg['localSnapshot']);self.assertFalse(cfg['analyticsEnabled']);self.assertEqual(cfg['supabase']['publishableKey'],'')
 def test_secret_and_service_role_keys_rejected(self):
  for key in ['sb_secret_do_not_publish','x.'+base64.urlsafe_b64encode(b'{"role":"service_role"}').decode()+'.x']:
   with self.subTest(keytype=key.split('_')[0]),self.assertRaises(ValueError):self.config({'supabase':{'url':'https://example.supabase.co','publishableKey':key}})
 def test_legacy_anon_and_publishable_supported(self):
  for key in ['sb_publishable_example','x.'+base64.urlsafe_b64encode(b'{"role":"anon"}').decode()+'.x']:
   self.assertEqual(self.config({'supabase':{'url':'https://example.supabase.co','publishableKey':key}})['supabase']['publishableKey'],key)
 def test_external_api_requires_https_and_no_credentials(self):
  for url in ['http://remote.example','https://user:password@remote.example','https://remote.example?token=private']:
   with self.subTest(url=url),self.assertRaises(ValueError):self.config({'apiBaseUrl':url})
  self.assertFalse(self.config({'apiBaseUrl':'https://api.example'})['localSnapshot'])
 def test_unknown_fields_never_reach_browser(self):
  with self.assertRaises(ValueError):self.config({'cloudflareToken':'do-not-expose'})
  with self.assertRaises(ValueError):self.config({'supabase':{'url':'','publishableKey':'','serviceRoleKey':'do-not-expose'}})
 def test_no_html_script_injection(self):
  self.assertNotIn(b'<',runtime_script({'value':'</script>'}))
if __name__=='__main__':unittest.main()
