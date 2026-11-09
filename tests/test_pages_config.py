import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pages_build', ROOT/'scripts/build-pages.py')
pages = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pages)


class PagesConfig(unittest.TestCase):
    def config(self, **changes):
        value = {'apiBaseUrl': 'https://live.investedia.com', 'dataMode': 'worker',
                 'analyticsEnabled': False, 'supabase': {'url': '', 'publishableKey': ''}}
        value.update(changes)
        return value

    def validate(self, config):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'public.json'
            path.write_text(json.dumps(config))
            return pages.production_config(path)

    def test_valid_public_config_uses_existing_runtime_serializer(self):
        result = self.validate(self.config())
        self.assertFalse(result['localSnapshot'])
        self.assertIn(b'https://live.investedia.com', pages.server.runtime_script(result))

    def test_secrets_unknown_fields_and_localhost_rejected(self):
        invalid = [self.config(serviceRoleKey='forbidden'), self.config(apiBaseUrl='http://127.0.0.1:8080'),
                   self.config(analyticsEnabled='false'),
                   self.config(supabase={'url': 'https://project.supabase.co', 'publishableKey': 'sb_secret_forbidden'}),
                   self.config(supabase={'url': '', 'publishableKey': '', 'serviceRoleKey': 'forbidden'})]
        for value in invalid:
            with self.subTest(value=value), self.assertRaises(ValueError): self.validate(value)
