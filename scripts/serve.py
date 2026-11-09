"""Local-only static server with whitelisted PUBLIC runtime configuration. Never reads cloud secrets."""
import argparse,base64,json,os,sys
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]

def load_config(path=None):
    path=Path(path) if path else ROOT/'config.local.json'
    cfg=json.loads((ROOT/'config/site.example.json').read_text(encoding='utf-8-sig'))
    if path.exists():
        supplied=json.loads(path.read_text(encoding='utf-8-sig'))
        if set(supplied)-set(cfg): raise ValueError('Unknown configuration fields; never put secrets in frontend configuration')
        cfg.update(supplied)
    return validate_config(cfg)

def validate_config(cfg):
    """Validate an explicit public mapping without reading any local files."""
    allowed={'apiBaseUrl','dataMode','analyticsEnabled','supabase'}
    if set(cfg)-allowed:raise ValueError('Unknown public configuration fields')
    cfg=dict(cfg)
    if not isinstance(cfg.get('apiBaseUrl'),str):raise ValueError('API URL must be text')
    if type(cfg.get('analyticsEnabled')) is not bool:raise ValueError('analyticsEnabled must be boolean')
    if not isinstance(cfg.get('supabase'),dict):raise ValueError('Supabase configuration must be an object')
    api=urlsplit(cfg['apiBaseUrl'])
    local=api.hostname in {'127.0.0.1','localhost','::1'}
    if (cfg['apiBaseUrl'] or cfg['dataMode']!='static') and (api.scheme not in {'http','https'} or not api.hostname or api.username or api.password or api.query or api.fragment or (api.scheme=='http' and not local)):raise ValueError('API URL must be HTTPS, or a loopback HTTP URL, without credentials or query parameters')
    sb=cfg['supabase']
    if set(sb)-{'url','publishableKey'}:raise ValueError('Only Supabase URL and public/publishable key are allowed in frontend configuration')
    key=sb.get('publishableKey','');url=sb.get('url','')
    if not isinstance(key,str) or not isinstance(url,str):raise ValueError('Supabase public fields must be text')
    if bool(key)!=bool(url):raise ValueError('Supply both Supabase URL and publishable key, or neither')
    if url and (urlsplit(url).scheme!='https' or urlsplit(url).username or urlsplit(url).password):raise ValueError('Supabase must use HTTPS without embedded credentials')
    if key and not key.startswith('sb_publishable_'):
        try:payload=json.loads(base64.urlsafe_b64decode(key.split('.')[1]+'==='))
        except Exception:raise ValueError('Use a Supabase publishable key or legacy anon key, never a secret/service-role key')
        if payload.get('role')!='anon':raise ValueError('Only an anon/publishable key is safe in the browser')
    if cfg['dataMode'] not in {'static','shadow','worker'}:raise ValueError('Unknown data mode')
    cfg['localSnapshot']=local
    cfg['analyticsEnabled']=bool(cfg['analyticsEnabled'])
    cfg['apiBaseUrl']=cfg['apiBaseUrl'].rstrip('/')
    return cfg

def runtime_script(cfg):
    data=json.dumps(cfg,ensure_ascii=True).replace('<','\\u003c')
    return ('window.INV_CONFIG = '+data+';\n').encode()

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path=='/assets/runtime-config.js':
            try:body=runtime_script(load_config())
            except (ValueError,KeyError,TypeError):self.send_error(503,'Invalid local public configuration');return
            self.send_response(200);self.send_header('Content-Type','text/javascript; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
        super().do_GET()
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','strict-origin-when-cross-origin')
        super().end_headers()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);args=parser.parse_args()
    load_config()
    if not (ROOT/'docs/index.html').exists():raise SystemExit('Build first: python build.py')
    server=ThreadingHTTPServer(('127.0.0.1',args.port),lambda *a,**kw:Handler(*a,directory=str(ROOT/'docs'),**kw))
    print(f'Investedia frontend: http://127.0.0.1:{args.port} (saved snapshot mode; loopback only)',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:server.server_close()
