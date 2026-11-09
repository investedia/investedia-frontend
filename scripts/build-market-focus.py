"""Run the frontend projection with the backend's canonical registry implementation."""
import argparse
import importlib.util
from pathlib import Path
import runpy
import sys

ROOT = Path(__file__).resolve().parents[1]


def prepare(backend, frontend=ROOT):
    backend = backend.resolve()
    source = backend / 'registry.py'
    if not (backend / 'api/pom.xml').is_file() or not source.is_file():
        raise ValueError('Choose a backend checkout containing api/pom.xml and registry.py')
    local_data = frontend / 'data/registry.json'
    backend_data = backend / 'data/registry.json'
    if local_data.read_bytes() != backend_data.read_bytes():
        raise ValueError('Registry snapshots differ. Review and run scripts/sync-snapshots.py --backend PATH first.')
    # Import the explicit source, without copying or forking registry logic.
    spec = importlib.util.spec_from_file_location('registry', source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    sys.modules['registry'] = module
    return module


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend', type=Path, required=True)
    parser.add_argument('--check', action='store_true', help='Validate imports and data without writing projections')
    args = parser.parse_args(argv)
    try:
        prepare(args.backend)
        builder = ROOT / 'tools/globe-news/build_market_focus.py'
        runpy.run_path(str(builder), run_name='market_focus_check' if args.check else '__main__')
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + '\n')
    print('Registry and projection imports verified.' if args.check else 'Projection build complete.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
