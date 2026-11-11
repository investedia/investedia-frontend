"""The Projects-only build must preserve independently published News/Markets fixes."""
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('projects_ui_builder',Path(__file__).parents[1]/'tools/globe-news/build_projects_ui.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)

class ProjectsUIBuildTests(unittest.TestCase):
    def test_preserves_unrelated_globe_fixes_and_later_style_elements(self):
        prefix='<html><style>/* existing region, headquarters and market fixes */\n'
        between='</style><style>/* later independent fixes */</style><script>const HQ_BY={};\n'
        tail=builder.JS_END+'\nconst NEWS_FIX=true;</script></html>'
        page=prefix+builder.CSS_START+'old projects css'+between+builder.JS_START+'old projects js\n'+tail
        result=builder.render(page,builder.CSS_START+'new css',builder.JS_START+'new js')
        self.assertTrue(result.startswith(prefix));self.assertIn(between,result);self.assertTrue(result.endswith(tail))
        self.assertNotIn('old projects',result)
        self.assertEqual(builder.render(result,builder.CSS_START+'new css',builder.JS_START+'new js'),result)

    def test_refuses_missing_or_duplicate_project_boundary(self):
        for page in ('missing',builder.CSS_START+builder.CSS_START+'</style>'+builder.JS_START+builder.JS_END):
            with self.assertRaises(ValueError):builder.render(page,'new css','new js')
