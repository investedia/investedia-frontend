"""Explicitly import saved snapshots from a separately located backend, never run its jobs."""
import argparse,hashlib,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--backend',type=Path,required=True);args=p.parse_args()
source=args.backend.resolve()
if not (source/'api/pom.xml').exists():raise SystemExit('Choose the backend repository root')
pending=[]
for directory in ['assets','data']:
 for f in (source/directory).rglob('*'):
  if not f.is_file() or (f.suffix!='.json' and f.name not in {'quotes.js','news.js','data.js'}):continue
  target=root/f.relative_to(source)
  if f.name.startswith('v5-') and target.exists() and target.read_bytes()!=f.read_bytes():raise SystemExit('Frozen V5 data differs; stopping rather than overwriting history.')
  pending.append((f,target))
for f,target in pending:
 target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,target)
print('Saved files copied without changing timestamps or running providers. Rebuild the frontend next.')
