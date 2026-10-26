"""Profiles, original instrumental bed and editorial video exports. No remote calls."""
from pathlib import Path
import json, subprocess, shutil, wave, math, array
import numpy as np
import imageio_ffmpeg
import build as b

ROOT=b.ROOT;BASE=b.BASE;OUT=b.EXPORTS;DATA=b.DATA
profiles=OUT/'profiles';profiles.mkdir(parents=True,exist_ok=True)
source=b.SOURCES/'profiles';source.mkdir(parents=True,exist_ok=True)
# Profiles use the approved icon unmodified; banner graphics are editable vector compositions.
shutil.copyfile(ROOT.parent/'Cripton_Kit_Marca_v1_0/04_iconos/cripton_maskable_1024.png',profiles/'avatar.png')
T=lambda s,x,y,size,color=b.WHITE,weight=700:b.text(s,x,y,size,color,weight,True)
U=lambda s,x,y,size,color=b.WHITE,weight=700:b.text(s,x,y,size,color,weight,False)
def banner(name,w,h,logo_rect,title_rect,sub_rect,handle_rect,title,size):
    def draw(outlined):
        tx=T if outlined else U
        return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Cripton POS · {name}</title>'+b.rect(0,0,w,h,b.NAVY)+f'<path d="M{int(w*.8)} 0H{w}V{h}H{int(w*.63)}Z" fill="{b.TEAL}" opacity=".4"/>'+b.logo(*logo_rect,True)+tx(title,*title_rect,size)+tx('Ventas, caja e inventario',*sub_rect,int(size*.5),b.CYAN,500)+tx('@cripton.colombia',*handle_rect,int(size*.4),b.WHITE,500)+'</svg>'
    (source/(name+'.svg')).write_text(draw(False),encoding='utf-8');(profiles/(name+'.svg')).write_text(draw(True),encoding='utf-8')
banner('facebook-cover',1640,720,(160,116,450),(160,400),(160,472),(1000,646),'Tu negocio, con más claridad.',59)
# Keep meaningful YouTube content inside the centered 1546×423 editorial safe region.
banner('youtube-banner',2560,1440,(580,525,400),(580,744),(580,820),(1570,822),'Tu negocio, con más claridad.',58)
shutil.copyfile(ROOT.parent/'Cripton_Kit_Marca_v1_0/04_iconos/cripton_maskable_v1.0.svg',source/'avatar.svg')
for label in ['POS','Inventario','Caja','Planes','Demo']:
    for outlined,target in [(False,source),(True,profiles)]:
        tx=T if outlined else U
        art='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>Cripton · '+label+'</title>'+b.rect(0,0,512,512,b.NAVY)+b.embed(ROOT/'brand/cripton_simbolo_reverso_v1.0.svg',144,64,224,211)+tx(label,256-b.measure(label,42,700)/2,362,42,b.WHITE)+'</svg>'
        (target/f'destacada-{label.lower()}.svg').write_text(art,encoding='utf-8')
profile_report=[{'name':'avatar','dimensions':[1024,1024],'source':'Icono maskable oficial, copia sin modificación','platform_preview':'pendiente recorte real de cada cuenta'},{'name':'facebook-cover','dimensions':[1640,720],'platform_preview':'pendiente encuadre escritorio/móvil'},{'name':'youtube-banner','dimensions':[2560,1440],'safe_zone_proposal':[507,508,1546,423],'platform_preview':'pendiente comprobar en el canal real'}]
(ROOT/'qa/profiles.json').write_text(json.dumps(profile_report,ensure_ascii=False,indent=2),encoding='utf-8')

# Original score: chord pad + four-note arpeggio + soft kick/hat; deterministic, no samples.
sr=44100;duration=24;audio=np.zeros((sr*duration,2),dtype=np.float64);beat=60/96
def tone(freq,start,seconds,amp=.1,pan=.0):
    count=int(seconds*sr);idx=int(start*sr)
    if idx>=len(audio):return
    count=min(count,len(audio)-idx);t=np.arange(count)/sr
    env=np.minimum(t/.04,1)*np.exp(-t*2.2);env*=np.minimum((seconds-t)/.1,1).clip(0,1)
    s=(np.sin(2*np.pi*freq*t)+.18*np.sin(4*np.pi*freq*t))*env*amp
    audio[idx:idx+count,0]+=s*(1-pan*.3);audio[idx:idx+count,1]+=s*(1+pan*.3)
notes=[(130.8128,[261.6256,329.6276,391.9954,493.8833]),(110,[220,261.6256,329.6276,391.9954]),(87.3071,[174.6141,220,261.6256,329.6276]),(97.9989,[195.9977,246.9417,293.6648,391.9954])]
rng=np.random.default_rng(20261026)
for k in range(math.ceil(duration/beat)):
    start=k*beat;root,chord=notes[(k//8)%4];tone(chord[k%4],start,.62,.075,-.35 if k%2 else .35)
    if k%4==0:
        tone(root,start,1.5,.12)
        for note in chord[:3]:tone(note,start,2.1,.028)
    count=min(int(.13*sr),len(audio)-int(start*sr));t=np.arange(count)/sr
    kick=np.sin(2*np.pi*(58*t+45*t*np.exp(-t*28)))*np.exp(-t*38)*.13
    if count>0:audio[int(start*sr):int(start*sr)+count]+=kick[:,None]
    hs=start+beat/2;idx=int(hs*sr);count=min(int(.055*sr),len(audio)-idx)
    if count>0:
        hat=rng.standard_normal(count);hat=np.r_[0,np.diff(hat)]*.005*np.exp(-np.arange(count)/sr*90);audio[idx:idx+count]+=hat[:,None]
fade=np.minimum(np.arange(len(audio))/sr,1)*np.minimum((len(audio)-np.arange(len(audio)))/sr,1);audio*=fade[:,None]
peak=float(np.max(np.abs(audio)));audio=audio/(peak or 1)*.5
audio_dir=ROOT/'audio';audio_dir.mkdir(exist_ok=True);wav=audio_dir/'pulso-cripton-demo.wav'
with wave.open(str(wav),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((audio*32767).astype('<i2').tobytes())
(audio_dir/'README.md').write_text('Pulso Cripton demo · composición procedural original de 24 s, 96 BPM, estéreo 44,1 kHz/16 bit. Sin muestras, canciones ni voz de terceros. Código reproducible en tools/finish.py. Es una propuesta de revisión, pendiente de audición/aprobación; no un audio de identidad adoptado. Los MP4 tienen texto y esta pista, sin locución.\n',encoding='utf-8')

ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();reports=[]
for reel in DATA['reels']:
    folder=OUT/'reels';lst=folder/f'{reel["id"]}-montaje.txt'
    lines=[]
    for n in range(1,5):lines +=[f"file '{reel['id']}-{n:02}-story.png'",'duration 6']
    lines +=[f"file '{reel['id']}-04-story.png'"]
    lst.write_text('\n'.join(lines)+'\n',encoding='utf-8')
    target=folder/f'{reel["id"]}.mp4'
    result=subprocess.run([ffmpeg,'-y','-v','error','-f','concat','-safe','0','-i',str(lst),'-i',str(wav),'-t','24','-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','24','-c:a','aac','-b:a','128k','-movflags','+faststart',str(target)],capture_output=True,text=True)
    if result.returncode:raise RuntimeError(result.stderr)
    reports.append({'id':reel['id'],'file':str(target.relative_to(ROOT)).replace('\\','/'),'seconds':24,'dimensions':[1080,1920],'fps':30,'codec':'H264/AAC','voice':False,'audio':'Original instrumental proposal','bytes':target.stat().st_size,'visual':'Four static editorial cards; real still screenshots where indicated'})
(ROOT/'qa/video-exports.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Exported {len(reports)} editorial videos with original music; voice not generated')
