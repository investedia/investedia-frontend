import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('registry_launcher', ROOT/'scripts/build-market-focus.py')
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class RegistryBuilder(unittest.TestCase):
    def test_missing_backend_is_rejected(self):
        with tempfile.TemporaryDirectory() as path:
            with self.assertRaisesRegex(ValueError, 'backend checkout'):
                launcher.prepare(Path(path))

    def test_mismatch_rejected_and_explicit_canonical_module_loaded(self):
        previous = sys.modules.get('registry')
        try:
            with tempfile.TemporaryDirectory() as path:
                backend = Path(path)/'backend'
                frontend = Path(path)/'frontend'
                for root in (backend, frontend): (root/'data').mkdir(parents=True)
                (backend/'api').mkdir()
                (backend/'api/pom.xml').write_text('<project/>')
                (backend/'registry.py').write_text('CANONICAL = True\n')
                (backend/'data/registry.json').write_text('{}')
                (frontend/'data/registry.json').write_text('{"different":true}')
                with self.assertRaisesRegex(ValueError, 'snapshots differ'):
                    launcher.prepare(backend, frontend)
                (frontend/'data/registry.json').write_text('{}')
                module = launcher.prepare(backend, frontend)
                self.assertTrue(module.CANONICAL)
                self.assertEqual(Path(module.__file__), backend/'registry.py')
        finally:
            if previous is None: sys.modules.pop('registry', None)
            else: sys.modules['registry'] = previous
