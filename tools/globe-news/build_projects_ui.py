"""Rebuild Projects source blocks without reverting independently published globe fixes.

The full globe template currently lags its published News/Markets output. This
bounded builder preserves those bytes until that separate source drift is fixed.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSS_START = '/* Claude Projects target v6, scoped to Projects mode. */'
JS_START = "// Projects dashboard, built on Claude's supplied layout. Data lives in shared JSON."
JS_END = '// Reading list + news filter presets (this browser only; not synced to an account)'


def replace_block(page, start, end, source):
    if page.count(start) != 1 or end not in page[page.index(start):]:
        raise ValueError('Projects source boundary missing or ambiguous; refusing to modify globe')
    a = page.index(start)
    b = page.index(end, a)
    if b <= a:
        raise ValueError('Projects source boundaries out of order')
    return page[:a] + source.rstrip() + '\n\n' + page[b:]


def render(page, css, js):
    # The Projects CSS is the final block in the document's sole style element.
    return replace_block(replace_block(page, CSS_START, '</style>', css), JS_START, JS_END, js)


if __name__ == '__main__':
    page = ROOT/'assets/globe/news.html'
    css = (ROOT/'tools/globe-news/projects.css').read_text()
    js = (ROOT/'tools/globe-news/projects-mode.js').read_text()
    result = render(page.read_text(), css, js)
    page.write_text(result)
    print('Rebuilt Projects CSS/JS only; all other globe bytes preserved. Run python build.py next.')
