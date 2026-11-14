"""Preserve the original narration, removing only the obsolete request-a-demo CTA."""
from pathlib import Path
import subprocess,json,hashlib
import imageio_ffmpeg
P=Path(__file__).resolve().parent
FF=imageio_ffmpeg.get_ffmpeg_exe()
def run(args):
 p=subprocess.run([FF,'-y','-v','error',*map(str,args)],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return p.stdout
v2=P/'exports/cripton-piloto-remotion-v2.mp4'
music=P.parent/'piloto-pos-real-v1/sources/musica-chill-wave-extracto.mp3'
# The retained speech ends at17.94s. The removed demo invitation starts at18.39s.
# Crossfade into the same musical position before that phrase; no new TTS or clone.
audio_filter='[0:a]atrim=start=0:end=18.15,asetpts=PTS-STARTPTS[original];[1:a]loudnorm=I=-28:TP=-3:LRA=7,afade=t=in:st=0:d=0.5,afade=t=out:st=20.5:d=1.5,atrim=start=18:end=22,asetpts=PTS-STARTPTS[tail];[original][tail]acrossfade=d=0.15:c1=tri:c2=tri,alimiter=limit=0.95[out]'
run(['-i',v2,'-i',music,'-filter_complex',audio_filter,'-map','[out]','-t','22','-c:a','aac','-b:a','192k',P/'render/soundtrack-trial.m4a'])
out=P/'exports/cripton-prueba-gratis-15-dias.mp4'
run(['-i',P/'render/picture-trial.mp4','-i',P/'render/soundtrack-trial.m4a','-map','0:v:0','-map','1:a:0','-c','copy','-t','22','-movflags','+faststart',out])
run(['-i',out,'-f','null','-'])
reader=imageio_ffmpeg.read_frames(str(out));meta=next(reader);reader.close()
assert meta['source_size']==(1080,1920) and meta['fps']==30 and abs(meta['duration']-22)<.1
for t in [1,18.5,20.2,21.5]:run(['-ss',t,'-i',out,'-frames:v','1',P/f'render/trial-{t}.jpg'])
run(['-ss','20.2','-i',out,'-frames:v','1',P/'exports/portada-prueba-15-dias.jpg'])
report={'date':'2026-11-14','composition':'CriptonTrial15','engine':'Remotion 4.0.543','duration':22,'dimensions':[1080,1920],'fps':30,'full_decode':True,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'commercial_offer':{'source':'explicit owner definition 2026-11-14','trial_days':15,'eligibility':'new users','flow':['register','use free trial','choose and pay a suitable plan'],'cta':'Regístrate y empieza tu prueba'},'audio':{'new_voice_generated':False,'voice_cloned':False,'retained':'original mixed narration through18.15s; last retained speech ends17.94s','removed':'demo invitation at18.39–20.947s','music':'same Chill Wave excerpt, musical tail restored at the same position with a0.15s crossfade','note':'The audio is intentionally edited, not bit-identical to v2'},'visual_review_seconds':[1,18.5,20.2,21.5],'technical_onboarding_retested':False,'public_signup_url_added':False,'publication':False}
(P/'qa-trial15.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(out)
