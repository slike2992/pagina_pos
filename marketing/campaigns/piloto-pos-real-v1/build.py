"""Render one review-only reel from an OBS recording. No browser automation."""
from pathlib import Path
import argparse,json,subprocess,shutil,textwrap,hashlib
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import imageio_ffmpeg

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
REPO=ROOT.parent
FONTS=ROOT/'brand/fonts'
W,H=1080,1920
NAVY='#051828'; CYAN='#31CCD4'; WHITE='#FFFFFF'
def font(n,bold=False): return ImageFont.truetype(str(FONTS/('Inter-Bold.ttf' if bold else 'Inter-Regular.ttf')),n)
def tx(d,xy,s,n=36,color=WHITE,bold=False): d.text(xy,s,font=font(n,bold),fill=color,stroke_width=0)
def centered(d,y,s,n=36,color=WHITE,bold=False):
    x=(W-d.textlength(s,font=font(n,bold)))/2;tx(d,(x,y),s,n,color,bold)
def canvas(step,lines):
    im=Image.new('RGB',(W,H),NAVY);d=ImageDraw.Draw(im)
    for y in range(H):
        v=max(0,1-abs(y-1000)/900)
        d.line((0,y,W,y),fill=(5,int(24+v*7),int(40+v*11)))
    logo=Image.open(REPO/'Cripton_Kit_Marca_v1_0/02_png/cripton_horizontal_reverso_v1.0_1200px.png').convert('RGBA')
    logo.thumbnail((340,110));im.paste(logo,(60,66),logo)
    d=ImageDraw.Draw(im);d.rounded_rectangle((780,76,1020,127),radius=25,fill='#123745')
    tx(d,(805,89),'DEMO · SANDBOX',21,CYAN,True)
    tx(d,(64,205),step,27,CYAN,True)
    for i,line in enumerate(lines):tx(d,(60,275+i*88),line,76,CYAN if i==len(lines)-1 else WHITE,True)
    d.rounded_rectangle((52,608,1028,1508),radius=26,fill='#153542',outline='#2E6570',width=2)
    d.ellipse((79,635,91,647),fill=CYAN)
    tx(d,(109,629),'CRIPTON POS · CAPTURA REAL',23,'#DAEBEF',True)
    tx(d,(66,1735),'Requiere plan con electrónica y configuración fiscal.',25,'#D6E5E9')
    tx(d,(66,1773),'El documento interno no sustituye la factura exigida.',25,'#D6E5E9')
    tx(d,(66,1839),'Datos QA · Secuencia editada para demostración',23,'#8EADB6')
    tx(d,(66,1874),'Música: Chill Wave · Kevin MacLeod · CC BY 4.0',20,'#8EADB6')
    return im

def run(args):
    p=subprocess.run([FF,'-y','-v','error',*map(str,args)],capture_output=True,text=True)
    if p.returncode:raise RuntimeError(p.stderr[-5000:])

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--recording',required=True);parser.add_argument('--audio-dir',required=True)
    args=parser.parse_args();audio=Path(args.audio_dir);raw=Path(args.recording)
    FF=imageio_ffmpeg.get_ffmpeg_exe()
    sources=HERE/'sources';exports=HERE/'exports';work=HERE/'render';sources.mkdir(exist_ok=True);exports.mkdir(exist_ok=True);work.mkdir(exist_ok=True)
    shutil.copyfile(audio/'locucion.wav',sources/'locucion.wav')
    timing=json.loads((audio/'voice-timing.json').read_text(encoding='utf-8'))
    (sources/'voice-timing.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2),encoding='utf-8')
    # Only the licensed excerpt is versioned; the original remains in local tooling.
    run(['-ss','18','-i',audio/'Chill Wave.mp3','-t','22','-c:a','libmp3lame','-b:a','192k',sources/'musica-chill-wave-extracto.mp3'])
    scenes=[
      # (start, output seconds, source speed, crop w:h:x:y, canvas, title)
      (76,3.4,1,'612:506:674:207','01 · TU PAPELERÍA',['¿Otra vez','los mismos','productos?']),
      (103,2.8,1,'606:600:1300:207','02 · APROVECHA LO REGISTRADO',['Tu documento.','Los datos','ya están ahí.']),
      (222.5,2.6,2.0,'1314:828:602:200','02 · APROVECHA LO REGISTRADO',['Tu documento.','Los datos','ya están ahí.']),
      (245.5,5.0,1.6,'630:876:940:146','03 · DOCUMENTO A ELECTRÓNICA',['Convierte a','factura','electrónica.']),
      (296,4.4,1,'760:400:675:520','04 · CONSULTA EL RESULTADO',['Menos trabajo','repetido.','Más claridad.']),
    ]
    manifest=[]
    for i,(start,duration,speed,crop,step,title) in enumerate(scenes):
        bg=canvas(step,title);bg.save(work/f'bg-{i}.png')
        # Each excerpt is actual continuous recorded motion. Scaling/cuts are editorial.
        vf=f'[0:v]setpts=(PTS-STARTPTS)/{speed},crop={crop},scale=960:810:force_original_aspect_ratio=decrease:flags=lanczos,pad=960:810:(ow-iw)/2:(oh-ih)/2:color=0xF3F5FA,setsar=1[screen];[1:v][screen]overlay=60:680:shortest=1,drawbox=x=60:y=1518:w={round(960*sum(x[1] for x in scenes[:i+1])/22)}:h=5:color=0x31CCD4:t=fill,format=yuv420p[out]'
        run(['-ss',start,'-i',raw,'-loop','1','-framerate','30','-i',work/f'bg-{i}.png','-filter_complex',vf,'-map','[out]','-t',duration,'-r','30','-an','-c:v','libx264','-preset','fast','-crf','19',work/f'part-{i}.mp4'])
        manifest.append({'source_start':start,'duration':duration,'speed':speed,'crop':crop,'step':step})
        print('Rendered real recording scene',i+1,flush=True)
    # Brand end card uses the approved illustrative stationery scene, explicitly separated.
    end=canvas('CONOCE CRIPTON POS',['¿Lo vemos','en tu negocio?'])
    hero=Image.open(ROOT/'campaigns/papeleria-v2/exports/anuncio-papeleria-tactil-v3-usuario.png').convert('RGB')
    hero=hero.crop((0,445,1122,1210)).resize((960,655),Image.Resampling.LANCZOS)
    end.paste(hero,(60,680));d=ImageDraw.Draw(end)
    d.rectangle((104,620,1000,670),fill='#153542')
    tx(d,(109,629),'CRIPTON POS · CONOCE LA DEMO',23,'#DAEBEF',True)
    d.rounded_rectangle((115,1380,965,1490),radius=55,fill=CYAN)
    centered(d,1408,'Escríbenos DEMO',51,NAVY,True)
    tx(d,(80,1324),'Escena ilustrativa · interfaz QA',20,WHITE)
    end.save(work/'end.png')
    run(['-loop','1','-framerate','30','-i',work/'end.png','-t','3.8','-vf','format=yuv420p','-an','-c:v','libx264','-preset','fast','-crf','19',work/'part-5.mp4'])
    (work/'concat.txt').write_text('\n'.join("file 'part-%s.mp4'"%i for i in range(6)),encoding='utf-8')
    run(['-f','concat','-safe','0','-i',work/'concat.txt','-c','copy',work/'picture.mp4'])
    # Captions split by meaning, timed to the neural narration. Reflowed below the recording.
    captions=[(0.45,3.04,'¿Volver a digitar\nlos mismos productos?'),(3.49,5.4,'Con Cripton, aprovecha\nla información'),(5.4,8.51,'que ya registraste\nen tu documento interno.'),(8.96,11.15,'Genera la factura electrónica'),(11.15,13.61,'y consulta su estado\ndesde el mismo sistema.'),(14.06,15.85,'Menos trabajo repetido.'),(15.85,17.94,'Más claridad para tu negocio.'),(18.39,20.95,'Escríbenos DEMO\ny conoce Cripton.')]
    def stamp(sec):
        ms=round(sec*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    (exports/'cripton-piloto.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(s)} --> {stamp(e)}\n{text}' for i,(s,e,text) in enumerate(captions))+'\n',encoding='utf-8')
    inputs=['-i',work/'picture.mp4','-i',sources/'locucion.wav','-i',sources/'musica-chill-wave-extracto.mp3']
    filters=[];last='0:v'
    for i,(s,e,text) in enumerate(captions):
        cap=Image.new('RGBA',(1080,170));cd=ImageDraw.Draw(cap)
        for j,line in enumerate(text.split('\n')):
            x=(1080-cd.textlength(line,font=font(43,True)))/2;tx(cd,(x,8+j*56),line,43,WHITE,True)
        cap.save(work/f'caption-{i}.png')
        inputs+=['-loop','1','-framerate','30','-i',work/f'caption-{i}.png']
        name=f'cv{i}';filters.append(f'[{last}][{3+i}:v]overlay=0:1560:enable=\'between(t,{s},{e})\'[{name}]');last=name
    filters+=['[1:a]highpass=f=80,loudnorm=I=-17:TP=-2:LRA=7,asplit=2[voice][duck]', '[2:a]loudnorm=I=-28:TP=-3:LRA=7,afade=t=in:st=0:d=0.5,afade=t=out:st=20.5:d=1.5[music]', '[music][duck]sidechaincompress=threshold=0.04:ratio=5:attack=15:release=350[bed]', '[voice][bed]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]']
    run([*inputs,'-filter_complex',';'.join(filters),'-map',f'[{last}]','-map','[a]','-t','22','-r','30','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',exports/'cripton-piloto-pos-real.mp4'])
    # Fully decode the deliverable and save review frames.
    run(['-i',exports/'cripton-piloto-pos-real.mp4','-f','null','-'])
    for t in (1,5,8,11,16,20):run(['-ss',t,'-i',exports/'cripton-piloto-pos-real.mp4','-frames:v','1',work/f'review-{t}.jpg'])
    shutil.copyfile(work/'review-1.jpg',exports/'portada.jpg')
    (HERE/'manifest.json').write_text(json.dumps({'date':'2026-11-13','status':'review_only','seconds':22,'size':[1080,1920],'fps':30,'recording':'OBS window capture of Codex browser; private raw not versioned','raw_sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'sale_id':28,'internal':'POS3','fe':'QABF5','factus':'SETP990046480','environment':'sandbox','scenes':manifest,'voice':{'model':'Kokoro-82M v1.0 ONNX','voice':'ef_dora','lang':'es','speed':0.94,'license':'Apache-2.0'},'music':{'title':'Chill Wave','author':'Kevin MacLeod','isrc':'USUAN1600048','license':'CC BY 4.0','excerpt_seconds':[18,40]},'public_capture_privacy':'All recorded frames are cropped to POS page; application chrome/chat/user header excluded','external_publication':False},ensure_ascii=False,indent=2),encoding='utf-8')
    print(exports/'cripton-piloto-pos-real.mp4',flush=True)
