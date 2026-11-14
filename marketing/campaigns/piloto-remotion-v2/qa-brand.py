"""OCR checks on rendered media files only. Does not inspect any application UI."""
from pathlib import Path
import argparse,json,re
import cv2
from rapidocr_onnxruntime import RapidOCR
P=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--final',action='store_true');args=parser.parse_args()
engine=RapidOCR(intra_op_num_threads=2,inter_op_num_threads=1,use_cls=False,det_limit_type='max',det_limit_side_len=1280);hits=[];checked=0;records=[]
def textlines(image):
 result,_=engine(image)
 return [entry[1] for entry in (result or [])]
def check(image,ref):
 global checked
 lines=textlines(image);checked+=1
 for text in lines:
  normalized=re.sub(r'[^a-z]','',text.lower())
  if 'factus' in normalized:hits.append({'frame':ref,'text':text})
 return lines
if args.final:
 cap=cv2.VideoCapture(str(P/'exports/cripton-prueba-gratis-15-dias.mp4'));frame=0;fps=cap.get(cv2.CAP_PROP_FPS)
 while True:
  ok,img=cap.read()
  if not ok:break
  # One full-frame sample per second plus every third frame through the sensitive scenes.
  if frame%30==0 or (264<=frame<546 and frame%3==0):
   roi=img[515:1506,:] if frame%30 else img
   lines=check(roi,frame);records.append({'frame':frame,'recognized_lines':len(lines)})
  frame+=1
 cap.release();report={'kind':'final video OCR','frames_decoded':frame,'samples':checked,'hits':hits,'sampling':'Full frame each second; recording region every third frame during conversion/result','note':'OCR supplements deterministic source masks and visual inspection; it is not a proof for arbitrary unreviewed sources'}
 (P/'qa-brand-final.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
else:
 regions={'open':(320,675,440,716),'convert':(135,430,542,482),'accepted':(367,724,482,756)}
 # Detect a known branded reference before scanning: guards against an inactive OCR engine.
 control_cap=cv2.VideoCapture(str(P/'render/source-convert.mp4'));control_cap.set(cv2.CAP_PROP_POS_MSEC,2000)
 ok,control=control_cap.read();control_cap.release();assert ok,'Run prepare.py to generate the private OCR control clip'
 control_lines=textlines(control[430:482,135:542]);assert any('factus' in re.sub(r'[^a-z]','',s.lower()) for s in control_lines),control_lines
 for name,(x1,y1,x2,y2) in regions.items():
  cap=cv2.VideoCapture(str(P/f'public/{name}.mp4'));frame=0
  while True:
   ok,img=cap.read()
   if not ok:break
   roi=cv2.resize(img[y1:y2,x1:x2],None,fx=2,fy=2)
   check(roi,f'{name}:{frame}');frame+=1
   if name=='convert':check(cv2.resize(img[782:815,28:145],None,fx=2,fy=2),f'{name}:post:{frame-1}')
  cap.release();records.append({'clip':name,'all_frames_checked':frame});print('Checked source',name,frame,flush=True)
 report={'kind':'source-region OCR','positive_control':True,'regions':regions,'clips':records,'samples':checked,'hits':hits}
 (P/'qa-brand-sources.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
if hits:raise SystemExit(1)
