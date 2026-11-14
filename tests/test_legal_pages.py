"""Legal drafts, navigation and storage inventory stay connected to the built site."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['legal','terms','privacy','cookies','disclaimer','ai-disclosure','sources','copyright',
         'editorial-policy','corrections','affiliate-disclosure','accessibility','contact']
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.hrefs=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a': self.hrefs.extend(v for k,v in attrs if k=='href')

class LegalPages(unittest.TestCase):
    def test_pages_built_and_readable(self):
        for name in PAGES:
            with self.subTest(page=name):
                root=(ROOT/f'{name}.html').read_text()
                self.assertEqual(root,(ROOT/'docs'/f'{name}.html').read_text())
                self.assertRegex(root,r'<h1[^>]*>.+?</h1>')
                self.assertIn('Last updated',root)
                self.assertNotIn('TODO',re.sub(r'\[OWNER:[^\]]+\]','',root))
                parser=Links();parser.feed(root)
                for other in PAGES:
                    if other!=name:self.assertIn(f'{other}.html',parser.hrefs)
                for href in parser.hrefs:
                    if href.startswith(('https:','mailto:','#','javascript:')): continue
                    self.assertTrue((ROOT/href.split('#')[0]).exists(),href)

    def test_sitemap_and_security(self):
        tree=ET.parse(ROOT/'sitemap.xml')
        urls={n.text for n in tree.findall('.//{*}loc')}
        for name in PAGES:self.assertIn('https://www.investedia.com/'+name,urls)
        security=(ROOT/'.well-known/security.txt').read_text()
        self.assertEqual(security,(ROOT/'docs/.well-known/security.txt').read_text())
        self.assertIn('Contact: mailto:',security);self.assertIn('Policy:',security);self.assertIn('Expires:',security)

    def test_footer_links_and_signup_destinations(self):
        ui=(ROOT/'assets/ui.js').read_text()
        footer=ui.split('// ---------- footer ----------',1)[1].split('// ---------- charts ----------',1)[0]
        # The compact footer routes through the legal hub and cookies page.
        for name in ('legal', 'terms', 'privacy', 'cookies', 'disclaimer', 'contact'):
            self.assertIn(f'href="{name}.html"', footer)
        hub = (ROOT/'legal.html').read_text()
        for name in PAGES:
            if name != 'legal': self.assertIn(f'href="{name}.html"', hub)
        self.assertIn('data-cookie-settings', (ROOT/'cookies.html').read_text())
        self.assertNotIn('about.html#terms',ui);self.assertNotIn('about.html#contact',ui)
        parser=Links();parser.feed(footer)
        for href in parser.hrefs:
            if href.startswith(('http','mailto:','${')):continue
            self.assertTrue((ROOT/href.split('#')[0]).exists(),href)

    def test_storage_inventory_covers_real_literal_keys(self):
        fixture=json.loads((ROOT/'tests/fixtures/legal-storage.json').read_text())
        inventory=' '.join(row['name'] for row in fixture)
        files=[ROOT/'tools/globe-news/page.html',*list((ROOT/'assets').glob('*.js')),*list((ROOT/'assets/js').glob('*.js')),*list((ROOT/'src/pages').rglob('*.html'))]
        keys=set()
        for path in files:
            text=path.read_text()
            keys.update(re.findall(r"(?:getItem|setItem|removeItem|\bstore|\bss)\(\s*['\"](inv-[a-z-]+)",text))
        keys.update(['inv-watch','inv-follow','inv-follow-topics','inv-follow-items','inv-consent'])
        for key in keys:self.assertIn(key,inventory,key)
        cookies=(ROOT/'src/pages/legal/cookies.html').read_text()
        for row in fixture:self.assertIn(row['name'],cookies)

    def test_owner_placeholders_are_collected(self):
        checklist=(ROOT/'LEGAL-TODO.md').read_text()
        self.assertIn('must be reviewed by a Belgian lawyer',checklist)
        for name in PAGES:
            folder = 'company' if name in ('about', 'contact') else 'legal'
            text=(ROOT/'src/pages'/folder/f'{name}.html').read_text()
            for placeholder in re.findall(r'\[OWNER:[^\]]+\]',text):self.assertIn(placeholder,checklist)

if __name__=='__main__':unittest.main()
