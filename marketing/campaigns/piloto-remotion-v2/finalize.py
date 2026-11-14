"""Mux the unchanged original AAC stream and verify the resulting artifact."""
from pathlib import Path
import hashlib,json,subprocess,shutil
import imageio_ffmpeg
P=Path(__file__).resolve().parent;FF=imageio_ffmpeg.get_ffmpeg_exe()
def run(args):
 p=subprocess.run([FF,'-y','-v','error',*map(str,args)],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return p.stdout
v1=P.parent/'piloto-pos-real-v1/exports/cripton-piloto-pos-real.mp4'
out=P/'exports/cripton-piloto-remotion-v2.mp4'
run(['-i',P/'render/picture.mp4','-i',P/'public/soundtrack.m4a','-map','0:v:0','-map','1:a:0','-c','copy','-t','22','-movflags','+faststart',out])
def audiohash(file):return run(['-i',file,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-']).strip()
oldhash,newhash=audiohash(v1),audiohash(out)
assert oldhash==newhash,'Original voice/music packets changed'
run(['-i',out,'-f','null','-'])
reader=imageio_ffmpeg.read_frames(str(out));meta=next(reader);reader.close()
assert meta['source_size']==(1080,1920) and meta['fps']==30 and abs(meta['duration']-22)<.1
review=[1,5,7.2,8.5,10,12.5,15,17,20]
for t in review:run(['-ss',t,'-i',out,'-frames:v','1',P/f'render/final-{t}.jpg'])
shutil.copyfile(P/'render/final-1.jpg',P/'exports/portada.jpg')
shutil.copyfile(v1,P/'render/original.mp4')
report={'date':'2026-11-14','engine':'Remotion 4.0.543','duration':meta['duration'],'dimensions':meta['source_size'],'fps':meta['fps'],'codec':meta['codec'],'audio_codec':meta['audio_codec'],'full_decode':True,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'audio_packets_original_sha256':oldhash,'audio_packets_new_sha256':newhash,'audio_unchanged':True,'visual_review_seconds':review,'source':'same OBS recording and QA sale28 / POS3 to QABF5 as pilot v1','generation':'Remotion/React frame-based title reveals, camera paths, annotations and progress; FFmpeg source preparation/mux only','environment':'Sandbox','owner_creative_approval':'pending','external_publication':False}
(P/'qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
