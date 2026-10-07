"""Local packaging only: no implicit install/build/network/publication."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json, hashlib


def deploy_text(version):
    return f'''Syntax Atlas 배포본
빌드 버전: {version}

빌드가 완료된 정적 웹 파일입니다.
index.html, assets/ 및 이 ZIP의 파일 구조를 그대로 정적 서버에 올리세요.
file:// 더블클릭 실행은 지원하지 않습니다.
플레이용 배포 파일에는 Node.js 설치나 소스 빌드가 필요하지 않습니다.

현재 콘텐츠와 변경 사항은 게임 화면과 저장소의 README/CHANGELOG를 확인하세요.
개발은 YEOMT/grammardealer의 최신 소스에서 진행합니다.
배포 ZIP을 main의 개발 소스 대신 덮어쓰지 마세요.
기존 GitHub Actions 배포 구성을 따르며, 이 안내 때문에 Pages 설정을 변경하지 마세요.

로컬 저장은 같은 브라우저·같은 사이트 주소의 저장소에 보관됩니다.
앱을 로드한 뒤에는 연결 없이 계속 플레이할 수 있지만,
오프라인 새 로드나 PWA 설치 지원을 뜻하지는 않습니다.

이 패키징 명령은 로컬 ZIP을 생성합니다.
원격 push·병합·공개 배포 여부는 해당 작업 보고서를 확인하세요.
'''


def package_release(root):
    version = json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
    out, dist = root/'release', root/'dist'
    if not (dist/'index.html').is_file():
        raise RuntimeError('Run npm run build first.')
    out.mkdir(exist_ok=True)
    (dist/'.nojekyll').touch()
    (dist/'DEPLOY_KO.txt').write_text(deploy_text(version), encoding='utf-8')
    manifest = {p.relative_to(dist).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in sorted(dist.rglob('*')) if p.is_file() and p.name != 'build-manifest.json'}
    (dist/'build-manifest.json').write_text(json.dumps({'version':version,'files':manifest},indent=2)+'\n',encoding='utf-8')
    source=out/f'SentenceBalatro_{version}_source.zip'
    deploy=out/f'SentenceBalatro_{version}_deploy.zip'
    # Authored roots only; never traverse local validation, runtime, credential or cache folders.
    dirs={'src','public','tests','tools','spec','docs','.github'}
    files={'AGENTS.md','README.md','README_KO.md','CHANGELOG.md','PROGRESS.md','package.json','package-lock.json','index.html','vite.config.js','.gitignore'}
    excluded={'node_modules','dist','release','.git','test-results','__pycache__','evidence','codex-baseline'}
    with ZipFile(source,'w',ZIP_DEFLATED) as z:
        for name in sorted(dirs|files):
            target=root/name
            for p in sorted(target.rglob('*')) if target.is_dir() else [target]:
                if not p.is_file():continue
                rel=p.relative_to(root)
                if any(part in excluded or part.startswith(('.local-','evidence-')) for part in rel.parts):continue
                if p.suffix in {'.log','.pyc'} or p.name.startswith('.env'):continue
                z.write(p,'sentence-balatro/'+rel.as_posix())
    with ZipFile(deploy,'w',ZIP_DEFLATED) as z:
        for p in sorted(dist.rglob('*')):
            if p.is_file():z.write(p,p.relative_to(dist).as_posix())
    with ZipFile(deploy) as z:
        names=z.namelist()
        assert {'index.html','.nojekyll','build-manifest.json','DEPLOY_KO.txt'}<=set(names)
        assert any(n.startswith('assets/') for n in names)
        assert not any(n.startswith(('src/','node_modules/','.git/')) for n in names)
        for name,digest in manifest.items():assert hashlib.sha256(z.read(name)).hexdigest()==digest
    report={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [source,deploy]}
    (out/'release-manifest.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    return report


if __name__=='__main__':
    print(json.dumps(package_release(Path(__file__).resolve().parents[1]),indent=2))
