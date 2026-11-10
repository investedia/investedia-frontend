"""World Bank WDI annual history; artifact output, no deployment or secret required."""
import argparse
import datetime as dt
import json
import math
from pathlib import Path
import re
import urllib.request

SERIES = dict(gdp='NY.GDP.MKTP.CD', growth='NY.GDP.MKTP.KD.ZG', infl='FP.CPI.TOTL.ZG',
              unemp='SL.UEM.TOTL.ZS', gdppc='NY.GDP.PCAP.CD', pop='SP.POP.TOTL')
SOURCE = 'https://api.worldbank.org/v2/country/all/indicator/'


def parse(rows, indicator):
    out = {}
    for r in rows:
        if r.get('indicator', {}).get('id') != indicator:
            raise ValueError('Unexpected series')
        year = str(r.get('date', ''))
        if not re.fullmatch(r'20\d{2}', year):
            continue
        value = r.get('value')
        if value is None:
            continue
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValueError('Invalid observation')
        # API country.id is ISO2; World Bank regions have official ISO3 ids.
        iso3 = r.get('countryiso3code')
        code = iso3 if iso3 in {'EMU', 'WLD'} else r.get('country', {}).get('id')
        if not re.fullmatch(r'[A-Z]{2,3}', code or ''):
            continue
        key = (code, int(year))
        if key in out and out[key] != value:
            raise ValueError('Conflicting annual observation')
        out[key] = value
    return out


def materialise(series, asof):
    countries = {}
    for key, observations in series.items():
        for (code, year), value in observations.items():
            country = countries.setdefault(code, {'schema': 'investedia.economy-history/v1', 'country': code,
                'source': 'World Bank WDI', 'source_url': 'https://data.worldbank.org',
                'license': 'CC BY 4.0', 'as_of': asof, 'frequency': 'annual', 'series': {}})
            data = country['series'].setdefault(key, {'code': SERIES[key], 'values': []})
            data['values'].append([year, value])
    for country in countries.values():
        for data in country['series'].values():
            data['values'].sort()
    return countries


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='out/economy-history')
    parser.add_argument('--saved', help='Offline conversion of existing snapshot, retaining its timestamp')
    args = parser.parse_args()
    if args.saved:
        snapshot = json.loads(Path(args.saved).read_text())
        series = {k: {} for k in SERIES}
        for code, country in snapshot['countries'].items():
            code = {'XC': 'EMU', '1W': 'WLD'}.get(code, code)
            for key in SERIES:
                values = country.get(key, [])
                if values and not isinstance(values[0], list):
                    values = [values]
                for year, value in values:
                    if 2000 <= year and math.isfinite(value):
                        series[key][(code, year)] = value
        result = materialise(series, snapshot['asof'])
    else:
        series = {}
        raw_dir = Path(args.output).parent / 'raw'
        raw_dir.mkdir(parents=True, exist_ok=True)
        for key, indicator in SERIES.items():
            url = SOURCE + indicator + '?format=json&date=2000:' + str(dt.date.today().year) + '&per_page=20000'
            request = urllib.request.Request(url, headers={'User-Agent': 'InvestediaRobot/1.0'})
            with urllib.request.urlopen(request, timeout=90) as response:
                payload = json.load(response)
            (raw_dir / (key + '.json')).write_text(json.dumps(payload))
            if not isinstance(payload, list) or len(payload) != 2 or payload[0].get('pages') != 1:
                raise ValueError('Incomplete World Bank response; retaining last good files')
            series[key] = parse(payload[1] or [], indicator)
            if not series[key] or not any(c == 'US' for c, _ in series[key]):
                raise ValueError('Incomplete indicator coverage')
        result = materialise(series, dt.datetime.now(dt.timezone.utc).isoformat())
        if not {'US', 'GB', 'EMU', 'WLD'} <= result.keys():
            raise ValueError('Required country/region coverage missing')
    # All six responses validate before writing any reviewed output.
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    for code, country in result.items():
        (output / (code + '.json')).write_text(json.dumps(country, separators=(',', ':')) + '\n')
    print(json.dumps({'countries_and_regions': len(result), 'source': 'World Bank', 'gemini_calls': 0}))


if __name__ == '__main__':
    main()
