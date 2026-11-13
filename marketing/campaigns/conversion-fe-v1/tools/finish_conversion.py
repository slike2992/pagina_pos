from pathlib import Path
import argparse,json,subprocess,hashlib,zipfile
from PIL import Image,ImageDraw,ImageFont
import imageio_ffmpeg
ap=argparse.ArgumentParser();ap.add_argument('root');args=ap.parse_args();root=Path(args.root)
campaign=json.loads((root/'campaign.json').read_text(encoding='utf-8'));ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();reports=[]
for v in campaign['videos']:
 duration=v['seconds']/len(v['slides']);playlist=root/'videos'/f'{v["id"]}-frames.txt';lines=[]
 for s in v['slides']:lines +=[f"file '../images/{s['id']}-story.png'",f'duration {duration}']
 lines.append(f"file '../images/{v['slides'][-1]['id']}-story.png'");playlist.write_text('\n'.join(lines),encoding='utf-8')
 target=root/'videos'/f'{v["id"]}.mp4'
 # Editorial cards at constant size; this is not UI footage.
 cmd=[ffmpeg,'-y','-v','error','-f','concat','-safe','0','-i',str(playlist),'-t',str(v['seconds']),'-vf','fps=30,scale=1080:1920,setsar=1,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','23','-movflags','+faststart','-an',str(target)]
 subprocess.run(cmd,check=True)
 probe=subprocess.run([ffmpeg,'-i',str(target),'-f','null','-'],capture_output=True,text=True)
 if probe.returncode:raise RuntimeError(probe.stderr)
 reports.append(dict(id=v['id'],seconds=v['seconds'],size=[1080,1920],fps=30,audio=False,bytes=target.stat().st_size,decode='passed',visual='Editorial cards, not a screen recording'))
(root/'qa/videos.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
manifest=json.loads((root/'manifest.json').read_text(encoding='utf-8'));chosen=[x for x in manifest if x['format']!='square' and x['category']!='video-scene']
cw=300;ch=460;cols=4;rows=(len(chosen)+cols-1)//cols;sheet=Image.new('RGB',(cols*cw,rows*ch),'#e5eef0');draw=ImageDraw.Draw(sheet);font=ImageFont.truetype(str(root/'assets/fonts/Inter-Regular.ttf'),16)
for i,item in enumerate(chosen):
 im=Image.open(root/item['images']).convert('RGB');im.thumbnail((cw-20,ch-45));x=(i%cols)*cw+(cw-im.width)//2;y=(i//cols)*ch+8;sheet.paste(im,(x,y));draw.text(((i%cols)*cw+10,(i//cols)*ch+ch-30),item['id'],font=font,fill='#051828')
sheet.save(root/'qa/contact-sheet.jpg',quality=92)
hashes={str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and p.name!='sha256.json'}
(root/'qa/sha256.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
print(json.dumps(dict(videos=reports,contactSheet=str(root/'qa/contact-sheet.jpg'))))
