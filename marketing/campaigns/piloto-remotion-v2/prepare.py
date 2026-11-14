"""Prepare privacy-cropped recordings. The voice and mix are copied from pilot v1."""
from pathlib import Path
import argparse,json,shutil,subprocess,hashlib
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
MKT=ROOT.parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--recording',required=True);args=parser.parse_args()
public=ROOT/'public';public.mkdir(exist_ok=True)
(ROOT/'render').mkdir(exist_ok=True);(ROOT/'exports').mkdir(exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
def run(args):
 p=subprocess.run([FF,'-y','-v','error',*map(str,args)],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return p
raw=Path(args.recording)
brand_audit=[]
def clean_clip(name,path,duration):
 """Neutral editorial labels only; keep all business values and states intact."""
 if name not in ('open','convert','accepted'):
  shutil.copyfile(path,public/f'{name}.mp4');return
 reader=imageio_ffmpeg.read_frames(str(path),pix_fmt='rgb24');meta=next(reader);w,h=meta['size']
 enabled=[]
 for i,frame in enumerate(reader):
  im=Image.frombytes('RGB',(w,h),frame)
  pixel=im.getpixel((20,190) if name=='convert' else (100,100))
  enabled.append(i) if name=='accepted' or (name=='convert' and sum(pixel)/3<200) or (name=='open' and sum(pixel)/3>=200) else None
 reader.close()
 if not enabled:raise RuntimeError('Expected editorial redaction interval not found: '+name)
 first,last=min(enabled),max(enabled)
 if enabled!=list(range(first,last+1)):raise RuntimeError('Non-contiguous redaction interval: '+name)
 overlay=Image.new('RGBA',(w,h));d=ImageDraw.Draw(overlay)
 if name=='convert':
  d.rectangle((137,432,540,480),fill='white')
  font=ImageFont.truetype(str(MKT/'brand/fonts/Inter-Regular.ttf'),13)
  d.text((143,437),'El estado se actualizará al finalizar.',font=font,fill='#4b5563')
  d.text((143,460),'Espera un momento.',font=font,fill='#4b5563')
 else:
  x,y=(325,682) if name=='open' else (370,726)
  d.rectangle((x,y,x+108,y+27),fill='white')
  font=ImageFont.truetype(str(MKT/'brand/fonts/Inter-Bold.ttf'),14)
  d.text((x+3,y+4),'Envío FE',font=font,fill='#111827')
 mask=ROOT/f'render/neutral-{name}.png';overlay.save(mask)
 inputs=['-i',path,'-loop','1','-i',mask]
 filters=f"[0:v][1:v]overlay=0:0:shortest=1:enable='between(n,{first},{last})'[clean]"
 if name=='convert' and last<i:
  # A few source frames show the completed page after the modal closes.
  # This heading lies outside the current camera crop, but also clean the public source.
  post=Image.new('RGBA',(w,h));pd=ImageDraw.Draw(post)
  pd.rectangle((31,784,140,813),fill='white')
  pd.text((36,789),'Envío FE',font=ImageFont.truetype(str(MKT/'brand/fonts/Inter-Bold.ttf'),14),fill='#111827')
  post_mask=ROOT/'render/neutral-convert-post.png';post.save(post_mask)
  inputs+=['-loop','1','-i',post_mask]
  filters=filters.replace('[clean]','[modal]')+f";[modal][2:v]overlay=0:0:shortest=1:enable='between(n,{last+1},{i})'[clean]"
  brand_audit.append({'clip':name,'first_frame':last+1,'last_frame':i,'type':'neutral post-conversion heading','business_values_modified':False})
 run([*inputs,'-filter_complex',filters,'-map','[clean]','-t',duration,'-an','-c:v','libx264','-preset','fast','-crf','17',public/f'{name}.mp4'])
 brand_audit.append({'clip':name,'first_frame':first,'last_frame':last,'type':'neutral processing copy' if name=='convert' else 'neutral electronic-status heading','business_values_modified':False})
clips=[('products',76,3.4,1,'1314:828:602:200'),('cart',103,2.8,1,'1314:828:602:200'),('open',222.5,2.6,2,'1314:828:602:200'),('convert',245.5,3.9,1.6,'630:876:940:146'),('accepted',252,5.5,1,'1314:828:602:200')]
for name,start,duration,speed,crop in clips:
 intermediate=ROOT/f'render/source-{name}.mp4'
 run(['-ss',start,'-i',raw,'-t',duration,'-vf',f'setpts=(PTS-STARTPTS)/{speed},crop={crop},setsar=1,fps=30','-an','-c:v','libx264','-preset','fast','-crf','17',intermediate])
 clean_clip(name,intermediate,duration)
 print('Prepared',name,flush=True)
v1=MKT/'campaigns/piloto-pos-real-v1/exports/cripton-piloto-pos-real.mp4'
run(['-i',v1,'-map','0:a:0','-c:a','copy',public/'soundtrack.m4a'])
shutil.copyfile(REPO/'Cripton_Kit_Marca_v1_0/02_png/cripton_horizontal_reverso_v1.0_1200px.png',public/'logo.png')
shutil.copyfile(MKT/'campaigns/papeleria-v2/exports/anuncio-papeleria-tactil-v3-usuario.png',public/'hero.png')
for weight in ['Regular','Bold']:shutil.copyfile(MKT/f'brand/fonts/Inter-{weight}.ttf',public/f'Inter-{weight}.ttf')
shutil.copyfile(MKT/'brand/fonts/LICENSE.txt',public/'Inter-LICENSE.txt')
(ROOT/'source-manifest.json').write_text(json.dumps({'source':'same OBS recording as v1','raw_sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'clips':[dict(name=n,start=s,seconds=d,speed=sp,crop=c) for n,s,d,sp,c in clips],'editorial_brand_redactions':brand_audit,'audio':'AAC stream copied from v1; trial variant omits obsolete final invitation','source_v1_sha256':hashlib.sha256(v1.read_bytes()).hexdigest()},indent=2),encoding='utf-8')
