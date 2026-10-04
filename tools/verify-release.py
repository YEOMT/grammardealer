"""Verify authored source and prebuilt ZIPs without modifying either archive."""
from pathlib import Path
from zipfile import ZipFile
import json, re

root = Path(__file__).resolve().parents[1]
release = root / 'release'
version=json.loads((root/'package.json').read_text())['version']
checks = []
def check(description, condition):
    if not condition:
        raise AssertionError(description)
    checks.append({'description': description, 'status': 'PASS'})

for kind in ['source', 'deploy']:
    file = release / f'SentenceBalatro_{version}_{kind}.zip'
    with ZipFile(file) as archive:
        check(f'{kind}: CRC integrity', archive.testzip() is None)
        names = set(archive.namelist())
        check(f'{kind}: safe relative paths', all(not n.startswith('/') and '..' not in Path(n).parts for n in names))
        check(f'{kind}: excludes node_modules', all('node_modules' not in Path(n).parts for n in names))
        if kind == 'source':
            prefix = 'sentence-balatro/'
            required = ['package.json', 'package-lock.json', 'vite.config.js', 'README_KO.md', 'src/main.js',
                        'src/game/runController.js', 'tests/e2e.mjs', 'docs/TEST_REPORT.md',
                        'docs/KNOWN_ISSUES.md', 'docs/PROGRESS.md', 'docs/NEXT_STEPS.md',
                        'docs/ARCHITECTURE.md', 'docs/DECISIONS.md', 'docs/acceptance-0.1.1.json','AGENTS.md','README.md','CHANGELOG.md','docs/PROJECT_HANDOFF.md','.github/workflows/deploy-pages.yml','spec/SentenceBalatro_0.1.1_Work_Patch_Prompt.md',
                        'spec/05_ACCEPTANCE_CASES_v0_1.json']
            check('source: required code, tests, specification, docs and lockfile', all(prefix+n in names for n in required))
            check('source: build/output folders omitted', not any(n.startswith(prefix+'dist/') or n.startswith(prefix+'release/') for n in names))
            check('source: every archived file equals current source bytes',all(archive.read(n)==(root/n.removeprefix(prefix)).read_bytes() for n in names))
            source_count = len(names)
        else:
            check('deploy: index/assets/.nojekyll/guide at ZIP root', {'index.html','.nojekyll','DEPLOY_KO.txt'} <= names and any(n.startswith('assets/') for n in names))
            check('deploy: source omitted', not any(n.startswith('src/') for n in names))
            html = archive.read('index.html').decode()
            references = re.findall(r'(?:src|href)="([^"#]+)"', html)
            check('deploy: every local HTML asset uses a valid relative path', all(not p.startswith('/') and not re.match(r'https?://',p) and p.removeprefix('./') in names for p in references))
            check('deploy: archive files equal tested dist bytes', all(archive.read(n) == (root/'dist'/n).read_bytes() for n in names))
            deploy_count = len(names)
report = {'status':'PASS','command':'python3 tools/verify-release.py','sourceFiles':source_count,'deployFiles':deploy_count,'checks':checks,
          'archiveHashes':'See release/release-manifest.json generated alongside final ZIPs; do not embed self-referential ZIP hashes in source.'}
(root/'release/release-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
