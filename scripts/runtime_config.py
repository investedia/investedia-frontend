"""Public build configuration from Pages variables only; never config.local.json."""
import os
from pathlib import Path
import warnings
from scripts.serve import validate_config, runtime_script


def build_config(environ=None):
    env = os.environ if environ is None else environ
    api = env.get('INV_API_BASE_URL', '').strip()
    url = env.get('INV_SUPABASE_URL', '').strip()
    key = env.get('INV_SUPABASE_PUBLISHABLE_KEY', '').strip()
    analytics = env.get('INV_ANALYTICS_ENABLED', '').strip().lower()
    if analytics not in ('', 'true', 'false'):
        raise ValueError('INV_ANALYTICS_ENABLED must be true or false')
    config = {'apiBaseUrl': api, 'dataMode': 'worker' if api else 'static',
              'analyticsEnabled': analytics == 'true',
              'supabase': {'url': '', 'publishableKey': ''}}
    # Validate even partially supplied settings, so a secret key is never silently accepted.
    if url or key:
        validate_config({**config, 'supabase': {
            'url': url or 'https://unconfigured.invalid',
            'publishableKey': key or 'sb_publishable_unconfigured'}})
        if url and key:
            config['supabase'] = {'url': url, 'publishableKey': key}
        else:
            warnings.warn('Both INV_SUPABASE_URL and INV_SUPABASE_PUBLISHABLE_KEY are needed; accounts remain unconfigured.')
    result = validate_config(config)
    if api and (not api.startswith('https://') or result['localSnapshot']):
        raise ValueError('INV_API_BASE_URL must be a public HTTPS Worker URL')
    return result


def write_build_config(root, environ=None):
    # Write only to the published tree, after mirror_docs replaces static defaults.
    target = Path(root)/'docs/assets/runtime-config.js'
    target.write_bytes(runtime_script(build_config(environ)))
