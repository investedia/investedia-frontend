import base64
import json
from pathlib import Path
import tempfile
import unittest
import warnings
from scripts.runtime_config import build_config, write_build_config


class BuildRuntimeConfig(unittest.TestCase):
    def test_missing_vars_keep_safe_static_defaults(self):
        self.assertEqual(build_config({}), {'apiBaseUrl': '', 'dataMode': 'static',
            'analyticsEnabled': False, 'localSnapshot': False,
            'supabase': {'url': '', 'publishableKey': ''}})

    def test_pages_vars_produce_worker_config_without_reading_local_file(self):
        env = {'INV_API_BASE_URL': 'https://api.example.test/',
               'INV_SUPABASE_URL': 'https://project.supabase.co',
               'INV_SUPABASE_PUBLISHABLE_KEY': 'sb_publishable_test',
               'INV_ANALYTICS_ENABLED': 'false'}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'docs/assets').mkdir(parents=True)
            (root/'config.local.json').write_text('not JSON; must never be read')
            write_build_config(root, env)
            text = (root/'docs/assets/runtime-config.js').read_text()
            cfg = json.loads(text.removeprefix('window.INV_CONFIG = ').strip().removesuffix(';'))
            self.assertEqual(cfg['apiBaseUrl'], 'https://api.example.test')
            self.assertEqual(cfg['dataMode'], 'worker')
            self.assertEqual(cfg['supabase']['publishableKey'], 'sb_publishable_test')
            self.assertFalse(cfg['analyticsEnabled'])

    def test_partial_account_vars_fall_back_but_secret_keys_fail(self):
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            self.assertEqual(build_config({'INV_SUPABASE_URL': 'https://project.supabase.co'})['supabase'],
                             {'url': '', 'publishableKey': ''})
        service = 'x.'+base64.urlsafe_b64encode(b'{"role":"service_role"}').decode()+'.x'
        for key in ('sb_secret_test', service):
            with self.subTest(keytype=key.split('_')[0]), self.assertRaises(ValueError):
                build_config({'INV_SUPABASE_PUBLISHABLE_KEY': key})

    def test_invalid_explicit_values_fail_closed(self):
        for env in ({'INV_API_BASE_URL': 'http://127.0.0.1:8080'},
                    {'INV_API_BASE_URL': 'https://user:pass@api.example.test'},
                    {'INV_ANALYTICS_ENABLED': 'yes'}):
            with self.subTest(fields=list(env)), self.assertRaises(ValueError): build_config(env)
