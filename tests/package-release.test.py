"""Temporary fake-dist tests are separate from actual production ZIP validation."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location('package_release', Path(__file__).resolve().parents[1]/'tools/package-release.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Packaging(unittest.TestCase):
    def test_versions_and_authored_roots(self):
        texts = []
        for version in ['0.5.1-test', '9.8.7-test']:
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                (root/'package.json').write_text(json.dumps({'version': version}), encoding='utf-8')
                (root/'dist/assets').mkdir(parents=True)
                (root/'dist/index.html').write_text('<script src="/grammardealer/assets/app.js"></script>')
                (root/'dist/assets/app.js').write_text('fixture')
                for folder in ['src','.local-validation','.local-tools','node_modules','.git']:
                    (root/folder).mkdir()
                    (root/folder/'must-check.txt').write_text('test fixture')
                report = module.package_release(root)
                self.assertEqual(len(report), 2)
                with ZipFile(root/f'release/SentenceBalatro_{version}_deploy.zip') as z:
                    text = z.read('DEPLOY_KO.txt').decode('utf-8')
                    self.assertIn('Syntax Atlas', text)
                    self.assertIn(version, text)
                    self.assertIn('build-manifest.json', z.namelist())
                    self.assertIn('.nojekyll', z.namelist())
                    self.assertFalse(any(p.startswith(('src/','.git/','node_modules/')) for p in z.namelist()))
                    texts.append(text.replace(version, '{version}'))
                with ZipFile(root/f'release/SentenceBalatro_{version}_source.zip') as z:
                    self.assertIn('sentence-balatro/src/must-check.txt', z.namelist())
                    self.assertFalse(any(x in p for p in z.namelist() for x in ['.local-','node_modules','.git/']))
        self.assertEqual(texts[0], texts[1])
        for stale in ['초원3전투','Stage5','22전투','Settings → Pages','이번 작업에서는']:
            self.assertNotIn(stale, texts[0])


if __name__ == '__main__':
    unittest.main()
