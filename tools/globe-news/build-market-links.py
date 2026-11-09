"""Build only sourced bilateral links; run manually, never from the news robot.
Refresh saved source responses with --refresh. No credentials or dependencies.
The IMF CPIS mirror is a 2025-04 snapshot, annual 2023; no claim of live flows.
"""
import argparse,json,pathlib,urllib.request,urllib.parse,datetime,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
SOURCES=pathlib.Path(__file__).with_name('market-sources')
URLS={
 'comtrade-nigeria-2024.json':'https://comtradeapi.un.org/public/v1/preview/C/A/HS?period=2024&reporterCode=566&cmdCode=TOTAL&flowCode=X&partner2Code=0&customsCode=C00&motCode=0&maxRecords=500',
 'comtrade-partners.json':'https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json',
 'imf-cpis-nigeria.json':'https://api.db.nomics.world/v22/series/IMF/CPIS?limit=1000&observations=1&dimensions='+urllib.parse.quote(json.dumps({'REF_AREA':['NG'],'REF_SECTOR':['T'],'COUNTERPART_SECTOR':['T'],'FREQ':['A'],'INDICATOR':['I_L_T_T_T_BP6_DV_USD']}))}
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--refresh',action='store_true')
if parser.parse_args().refresh:
 for name,url in URLS.items():
  with urllib.request.urlopen(url,timeout=45) as r:SOURCES.joinpath(name).write_bytes(r.read())
read=lambda name:json.loads(SOURCES.joinpath(name).read_text())
partners={str(p['id']):p for p in read('comtrade-partners.json')['results'] if len(p.get('PartnerCodeIsoAlpha2',''))==2 and not p.get('isGroup')}
trade=[]
for r in read('comtrade-nigeria-2024.json')['data']:
 p=partners.get(str(r['partnerCode']))
 if p and r['primaryValue']>0 and r['flowCode']=='X' and r['period']=='2024':
  trade.append({'from':'NG','to':p['PartnerCodeIsoAlpha2'],'kind':'trade','year':2024,'value_usd':r['primaryValue'],'measure':'Annual merchandise exports, reporter Nigeria, TOTAL HS','source':'UN Comtrade','url':URLS['comtrade-nigeria-2024.json'],'record':{'reporter':566,'partner':r['partnerCode'],'flow':'X','period':'2024','cmdCode':'TOTAL'},'reported':r['isReported']})
investment=[]
for r in read('imf-cpis-nigeria.json')['series']['docs']:
 code=r['dimensions']['COUNTERPART_AREA']
 if len(code)!=2 or code=='NG' or '2023' not in r['period']:continue
 value=r['value'][r['period'].index('2023')]
 if not isinstance(value,(int,float)) or value<=0:continue
 investment.append({'from':code,'to':'NG','kind':'investment','year':2023,'value_usd':value,'measure':'Year-end portfolio holdings in Nigeria; derived liabilities from counterpart reports, total instruments, all sectors','source':'IMF CPIS (DBnomics mirror)','url':'https://db.nomics.world/IMF/CPIS/'+r['series_code'],'series':r['series_code'],'snapshot':'2025-04-09'})
links=[]
for rows in (trade,investment):
 for r in sorted(rows,key=lambda r:-r['value_usd'])[:10]:r['id']=r['kind']+'-'+r['from']+'-'+r['to']+'-'+str(r['year']);links.append(r)
out={'schema':'investedia.market-links/v1','coverage':'Nigeria exports: ten largest country partners in UN Comtrade 2024. Nigeria portfolio liabilities: ten largest reporting counterpart holders in IMF CPIS annual 2023 snapshot. Other bilateral pairs are not covered.','sources':[{'file':k,'url':v,'sha256':hashlib.sha256(SOURCES.joinpath(k).read_bytes()).hexdigest()}for k,v in URLS.items()],'links':links}
ROOT.joinpath('assets/globe/market-links.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
print(f'Built {len(links)} sourced bilateral links ({len(trade)} trade partners, {len(investment)} investment counterpart reports available).')
