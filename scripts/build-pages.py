"""Build Pages output with validated public production configuration only."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('local_server', ROOT/'scripts/serve.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


def production_config(path):
    raw = json.loads(path.read_text(encoding='utf-8-sig'))
    required = {'apiBaseUrl', 'dataMode', 'analyticsEnabled', 'supabase'}
    if set(raw) != required:
        raise ValueError('Supply exactly the four supported public configuration fields')
    if type(raw['analyticsEnabled']) is not bool:
        raise ValueError('analyticsEnabled must be a boolean')
    if not isinstance(raw['supabase'], dict) or set(raw['supabase']) != {'url', 'publishableKey'}:
        raise ValueError('Supabase accepts only url and publishableKey')
    config = server.load_config(path)
    if config['localSnapshot']:
        raise ValueError('Production apiBaseUrl must use a public HTTPS host')
    return config


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, required=True, help='JSON containing public values only')
    args = parser.parse_args(argv)
    config = production_config(args.config)
    subprocess.run([sys.executable, str(ROOT/'build.py')], cwd=ROOT, check=True)
    # build.py mirrors safe static defaults; replace only the published runtime asset afterwards.
    (ROOT/'docs/assets/runtime-config.js').write_bytes(server.runtime_script(config))
    print('Pages output built in docs/ with validated public runtime configuration.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
