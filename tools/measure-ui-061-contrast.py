"""Read real browser-composited background pixels; no authored-token-only PASS."""
import sys,json,re,math
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1] if len(sys.argv)>1 else '.local-validation/v061/browser')
report=json.loads((root/'report.json').read_text(encoding='utf-8-sig'))
def lum(rgb):
 c=[v/255 for v in rgb]
 c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
 return .2126*c[0]+.7152*c[1]+.0722*c[2]
def contrast(a,b):
 a,b=sorted([lum(a),lum(b)]);return (b+.05)/(a+.05)
rows=[]
for probes in report['contrastProbes']:
 im=Image.open(root/probes['backgroundFile']).convert('RGB')
 before=Image.open(root/probes['textFile']).convert('RGB')
 for p in probes['probes']:
  r=p['rect'];fg=tuple(int(v) for v in re.findall(r'[\d.]+',p['foreground'])[:3])
  # Inset avoids the border outside the text line's actual background.
  x1=max(0,math.ceil(r['x'])+1);y1=max(0,math.ceil(r['y'])+1)
  x2=min(im.width,math.floor(r['x']+r['width'])-1);y2=min(im.height,math.floor(r['y']+r['height'])-1)
  # Only actual changed glyph pixels belong to text. A focus outline at a
  # label rectangle's edge must not be counted as its text background.
  old=list(before.crop((x1,y1,x2,y2)).getdata());new=list(im.crop((x1,y1,x2,y2)).getdata())
  bg={b for a,b in zip(old,new) if a!=b}
  if not bg: raise RuntimeError('No text was removed at '+probes['state']+' '+p['selector'])
  ratio=min(contrast(fg,b) for b in bg)
  rows.append({**p,'state':probes['state'],'image':probes['backgroundFile'],'minimumActualPixelContrast':round(ratio,3),'backgroundPixelColours':len(bg),'status':'PASS' if ratio>=p['minimum'] else 'FAIL'})
result={'kind':'ACTUAL_COMPOSITED_BROWSER_PNG_BACKGROUND_WITH_TRANSPARENT_TEXT','checks':rows,'status':'PASS' if all(x['status']=='PASS' for x in rows) else 'FAIL'}
(root/'contrast.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':result['status'],'checks':len(rows),'failures':[{k:v for k,v in r.items() if k in ['state','selector','minimumActualPixelContrast','minimum']} for r in rows if r['status']=='FAIL']},ensure_ascii=False,indent=2))
raise SystemExit(0 if result['status']=='PASS' else 1)
