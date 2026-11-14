"""Prepare privacy-cropped recordings. The voice and mix are copied from pilot v1."""
from pathlib import Path
import argparse,json,shutil,subprocess,hashlib
import imageio_ffmpeg
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
clips=[('products',76,3.4,1,'1314:828:602:200'),('cart',103,2.8,1,'1314:828:602:200'),('open',222.5,2.6,2,'1314:828:602:200'),('convert',245.5,3.9,1.6,'630:876:940:146'),('accepted',252,5.5,1,'1314:828:602:200')]
for name,start,duration,speed,crop in clips:
 run(['-ss',start,'-i',raw,'-t',duration,'-vf',f'setpts=(PTS-STARTPTS)/{speed},crop={crop},setsar=1,fps=30','-an','-c:v','libx264','-preset','fast','-crf','17',public/f'{name}.mp4'])
 print('Prepared',name,flush=True)
v1=MKT/'campaigns/piloto-pos-real-v1/exports/cripton-piloto-pos-real.mp4'
run(['-i',v1,'-map','0:a:0','-c:a','copy',public/'soundtrack.m4a'])
shutil.copyfile(REPO/'Cripton_Kit_Marca_v1_0/02_png/cripton_horizontal_reverso_v1.0_1200px.png',public/'logo.png')
shutil.copyfile(MKT/'campaigns/papeleria-v2/exports/anuncio-papeleria-tactil-v3-usuario.png',public/'hero.png')
for weight in ['Regular','Bold']:shutil.copyfile(MKT/f'brand/fonts/Inter-{weight}.ttf',public/f'Inter-{weight}.ttf')
shutil.copyfile(MKT/'brand/fonts/LICENSE.txt',public/'Inter-LICENSE.txt')
(ROOT/'source-manifest.json').write_text(json.dumps({'source':'same OBS recording as v1','raw_sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'clips':[dict(name=n,start=s,seconds=d,speed=sp,crop=c) for n,s,d,sp,c in clips],'audio':'AAC stream copied from v1; do not synthesize, remix or change voice','source_v1_sha256':hashlib.sha256(v1.read_bytes()).hexdigest()},indent=2),encoding='utf-8')
