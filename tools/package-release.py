"""Package authored source and prebuilt static files; no implicit install/build/publication."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,hashlib
ROOT=Path(__file__).resolve().parents[1]
VERSION=json.loads((ROOT/'package.json').read_text())['version']
OUT=ROOT/'release';OUT.mkdir(exist_ok=True)
DIST=ROOT/'dist'
if not (DIST/'index.html').is_file():raise SystemExit('Run npm run build first.')
(DIST/'.nojekyll').touch()
(DIST/'DEPLOY_KO.txt').write_text(f'센텐스 발라트로 {VERSION} 배포본\n\nindex.html과 assets/ 전체를 함께 정적 서버에 올리세요. file:// 더블클릭 실행은 지원하지 않습니다. Node/소스 빌드가 필요 없는 빌드 완료 파일입니다.\n\n개발 인계: YEOMT/grammardealer에는 별도 source ZIP 안의 sentence-balatro/ 내용을 저장소 루트에 반영하세요. GitHub Settings → Pages → Source: GitHub Actions. main source 반영 후 workflow가 test/build/deploy를 실행합니다. 이 배포 ZIP을 main 소스 대신 올리지 마세요.\n대상 주소: https://yeomt.github.io/grammardealer/\n이번 작업에서는 원격 push/Pages 갱신을 실행하지 않았습니다.\n\n여행자·난이도1·초원3전투. 로컬 3슬롯은 origin별 IndexedDB입니다. 첫 로드 후 오프라인 플레이/저장은 가능하나 오프라인 새 로드/PWA는 지원하지 않습니다.\n',encoding='utf-8')
source=OUT/f'SentenceBalatro_{VERSION}_source.zip';deploy=OUT/f'SentenceBalatro_{VERSION}_deploy.zip'
with ZipFile(source,'w',ZIP_DEFLATED) as z:
 for p in sorted(ROOT.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(ROOT)
  if any(part in {'node_modules','dist','release','.git','test-results'} for part in rel.parts):continue
  z.write(p,str(Path('sentence-balatro')/rel))
with ZipFile(deploy,'w',ZIP_DEFLATED) as z:
 for p in sorted(DIST.rglob('*')):
  if p.is_file():z.write(p,str(p.relative_to(DIST)))
with ZipFile(deploy) as z:
 names=z.namelist();assert 'index.html' in names and '.nojekyll' in names and any(n.startswith('assets/') for n in names)
 assert not any(n.startswith('src/') or 'node_modules' in n for n in names)
report={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [source,deploy]}
(OUT/'release-manifest.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
