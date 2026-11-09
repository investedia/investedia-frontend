"""Validate complete language packs and flag changed numbers or literal storage identifiers."""
import collections,json,pathlib,re,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
def numbers(text):
 text=re.sub(r'(?<=\d)[,.\s]+(?=\d)','',text)
 return collections.Counter(re.findall(r'\d+',text))
def check():
 sources=json.loads((ROOT/'assets/locales/source.json').read_text());errors=[]
 for lang in ['fr','nl','de','es','it','pt']:
  path=ROOT/f'assets/locales/{lang}.json'
  if not path.exists():errors.append(f'{lang}: pack missing');continue
  pack=json.loads(path.read_text())
  if pack.get('language')!=lang:errors.append(f'{lang}: language mismatch')
  for source in sources:
   value=pack.get('strings',{}).get(source)
   if not isinstance(value,str) or not value.strip():errors.append(f'{lang}: missing string {source[:60]}');continue
   if numbers(source)!=numbers(value):errors.append(f'{lang}: numbers differ: {source[:100]} => {value[:100]}')
   for key in re.findall(r'\binv-[a-z-]+\b',source):
    if key not in value:errors.append(f'{lang}: storage identifier changed: {key}')
 for error in errors[:60]:print(error)
 print(f'{len(sources)} source strings; {len(errors)} validation errors')
 return len(errors)
if __name__=='__main__':sys.exit(bool(check()))
