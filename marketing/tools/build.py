"""Build Cripton marketing sources. Local-only; never publishes or modifies the POS."""
from pathlib import Path
import argparse, base64, csv, hashlib, html, json, math, os, shutil, subprocess, wave
from xml.etree import ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[1]
if __name__ == '__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('--root'); args=ap.parse_args()
    if args.root: ROOT=Path(args.root).resolve()
DATA=json.loads((ROOT/'campaigns/launch-30d/campaign.json').read_text(encoding='utf-8'))
NAVY='#051828'; TEAL='#056877'; CYAN='#31CCD4'; WHITE='#FFFFFF'; SURFACE='#F4F7FA'
BASE=ROOT/'campaigns/launch-30d'; SOURCES=BASE/'sources'; EXPORTS=BASE/'exports'
for p in [SOURCES,EXPORTS,ROOT/'qa',ROOT/'copy',ROOT/'strategy']:p.mkdir(parents=True,exist_ok=True)
FONTS={w:TTFont(ROOT/f'brand/fonts/Inter-{n}.ttf') for w,n in [(400,'Regular'),(500,'Medium'),(700,'Bold')]}
FONTCACHE={}; BOUNDS=[]; MANIFEST=[]
def esc(s):return html.escape(str(s),quote=True)
def measure(text,size=32,weight=400):
    f=FONTS[weight]; cmap=f.getBestCmap(); u=f['head'].unitsPerEm
    return sum(f['hmtx'].metrics[cmap.get(ord(c),'space')][0] for c in text)*size/u
def wrap(text,size,maxwidth,weight=400):
    out=[]; line=''
    for word in text.split():
        nxt=(line+' '+word).strip()
        if line and measure(nxt,size,weight)>maxwidth:out.append(line);line=word
        else:line=nxt
    if line:out.append(line)
    return out
def text(s,x,y,size,fill,weight=400,outlined=False,tracking=0):
    if not outlined:return f'<text x="{x}" y="{y}" fill="{fill}" font-family="Inter" font-size="{size}" font-weight="{weight}" letter-spacing="{tracking}">{esc(s)}</text>'
    key=(s,size,weight,tracking)
    if key not in FONTCACHE:
        f=FONTS[weight];gs=f.getGlyphSet();cm=f.getBestCmap();u=f['head'].unitsPerEm;off=0;parts=[]
        for c in s:
            name=cm.get(ord(c),'space');pen=SVGPathPen(gs);gs[name].draw(pen);d=pen.getCommands()
            if d:parts.append(f'<path transform="translate({off:.3f} 0)" d="{d}"/>')
            off+=f['hmtx'].metrics[name][0]+tracking*u/size
        FONTCACHE[key]=f'<g transform="scale({size/u:.8f} {-size/u:.8f})">'+''.join(parts)+'</g>'
    return f'<g fill="{fill}" transform="translate({x} {y})">{FONTCACHE[key]}</g>'
def rect(x,y,w,h,fill,rx=0,stroke=None):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="1"' if stroke else '')+'/>'
def embed(path,x,y,w,h):
    path=Path(path)
    if path.suffix=='.svg':
        raw=path.read_text(encoding='utf-8');svg=ET.fromstring(raw);vb=svg.attrib.get('viewBox','0 0 100 100')
        content=raw[raw.index('>',raw.index('<svg'))+1:raw.rfind('</svg>')]
        return f'<svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{vb}" preserveAspectRatio="xMidYMid meet">{content}</svg>'
    b64=base64.b64encode(path.read_bytes()).decode();return f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="data:image/jpeg;base64,{b64}" preserveAspectRatio="xMidYMid meet"/>'
def logo(x,y,w,dark):return embed(ROOT/f'brand/cripton_horizontal_{"reverso" if dark else "color"}_v1.0.svg',x,y,w,w*409.226/1517.039)
def svg_art(slide,identity,kind='feed',dark=False,outlined=False,alt=''):
    # A format is composed independently; production exports never auto-crop text.
    w,h={'feed':(1080,1350),'square':(1080,1080),'story':(1080,1920),'landscape':(1200,628)}[kind]
    fg=WHITE if dark else NAVY; bg=NAVY if dark else WHITE;muted='#B9D6DD' if dark else TEAL
    tx=lambda s,x,y,sz,col=fg,weight=400,tracking=0:text(s,x,y,sz,col,weight,outlined,tracking)
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img"><title>{esc(identity)}</title><desc>{esc(alt or slide.get("body",""))}</desc>',rect(0,0,w,h,bg)]
    out += [f'<path d="M{w-320} 0H{w}V{h}H{w-84}Z" fill="{TEAL if dark else SURFACE}" opacity="{0.32 if dark else 1}"/>',rect(0,0,14,h,CYAN)]
    if kind=='landscape':
        out+=[logo(52,36,320,dark),tx('CRIPTON POS',52,155,18,muted,700,2)]
        titles=slide['title'];size=51 if max(map(len,titles))<23 else 45
        for i,line in enumerate(titles):out.append(tx(line,52,224+i*59,size,fg,700))
        by=224+len(titles)*59+12
        for i,line in enumerate(wrap(slide['body'],24,530)):out.append(tx(line,52,by+i*33,24,muted))
        if slide.get('capture'):
            p=ROOT/f'captures/{slide["capture"]}.jpg';out +=[rect(638,122,514,350,WHITE,12,TEAL),embed(p,646,130,498,334),tx('Interfaz real · datos de demostración',638,499,17,muted)]
        else:
            for i,line in enumerate(slide.get('list',['Ventas','Caja','Inventario'])):out += [rect(660,148+i*90,470,66,TEAL,12),tx(line,680,190+i*90,25,WHITE,500)]
        out +=[rect(52,522,450,60,CYAN,9),tx('Solicita una demostración',73,562,25,NAVY,700),tx('@cripton.colombia',750,573,23,fg,500)]
    else:
        story=kind=='story';square=kind=='square';m=72;top=286 if story else 62
        out += [logo(m,top,400,dark),tx(slide.get('tag','CRIPTON POS'),m,top+157,21,muted,700,1.5)]
        y=top+266;size=72 if square else 78;lineheight=83 if square else 90
        for line in slide['title']:
            actual=size
            while measure(line,actual,700)>936:actual-=1
            out.append(tx(line,m,y,actual,fg,700));BOUNDS.append({'asset':identity,'format':kind,'text':line,'right':m+measure(line,actual,700),'baseline':y,'font':actual,'canvas':[w,h]});y+=lineheight
        by=y+8
        for line in wrap(slide['body'],29 if square else 31,930):out.append(tx(line,m,by,29 if square else 31,muted));by+=42
        bottom=1100 if story else (916 if square else 1180)
        capture=slide.get('capture')
        if capture:
            ih=min(420 if story else (265 if square else 420),bottom-by-92)
            iy=by+34
            out +=[rect(m-5,iy-5,946,ih+10,TEAL,14),rect(m,iy,936,ih,WHITE,10),embed(ROOT/f'captures/{capture}.jpg',m+8,iy+8,920,ih-16),tx('Interfaz real · datos de demostración',m,iy+ih+34,20,muted)]
        elif slide.get('list'):
            listy=by+38
            for i,item in enumerate(slide['list']):
                rowy=listy+i*78;out +=[rect(m,rowy,936,62,TEAL if dark else SURFACE,10),rect(m+19,rowy+23,15,15,CYAN,3),tx(item,m+54,rowy+41,27,WHITE if dark else NAVY,500)]
        else:
            yy=by+62
            for i,s in enumerate(['Ventas','Caja','Inventario']):
                xx=m+i*316;out +=[rect(xx,yy,296,70,TEAL if dark else SURFACE,10),tx(s,xx+22,yy+45,28,WHITE if dark else NAVY,500)]
        cta=slide.get('cta',DATA['cta']);out +=[rect(m,bottom,936,74,CYAN,10),tx(cta,m+24,bottom+48,30,NAVY,700)]
        footer=bottom+126;out +=[tx('@cripton.colombia',m,footer,24,fg,500),tx('POS PARA COMERCIOS',m+598,footer,20,muted,700,1)]
    return ''.join(out)+'</svg>'
def save_art(slide,identity,kind,dark,alt,category):
    rel=f'{category}/{identity}-{kind}'
    src=SOURCES/(rel+'.svg');outsvg=EXPORTS/('vectors/'+rel+'.svg')
    for p in [src,outsvg]:p.parent.mkdir(parents=True,exist_ok=True)
    src.write_text(svg_art(slide,identity,kind,dark,False,alt),encoding='utf-8')
    outsvg.write_text(svg_art(slide,identity,kind,dark,True,alt),encoding='utf-8')
    MANIFEST.append({'id':identity,'format':kind,'category':category,'source':str(src.relative_to(ROOT)).replace('\\','/'),'vector':str(outsvg.relative_to(ROOT)).replace('\\','/'),'png':str((EXPORTS/rel).relative_to(ROOT)).replace('\\','/')+'.png','alt':alt,'status':'revisión del propietario pendiente'})
for p in DATA['posts']:
    for i,s in enumerate(p['slides'],1):
        for fmt in ['feed','square']:save_art(s,f'{p["id"]}-{i:02}',fmt,p['dark'],p['alt'],'posts')
    save_art(p['slides'][0],p['id'],'landscape',p['dark'],p['alt'],'facebook-links')
for i,s in enumerate(DATA['stories']):save_art(s,s['id'],'story',i%2==0,s['body'],'stories')
for i,a in enumerate(DATA['ads']):
    for fmt in ['feed','square','story']:save_art(a,a['id'],fmt,i%2==0,a['primary'],'ads')
for i,r in enumerate(DATA['reels']):
    for j,card in enumerate(r['cards']):
        s={'title':card,'body': ['Conoce Cripton POS.','Un recorrido con datos de demostración.','Revisa el alcance según tu plan.','Cuéntanos qué necesita tu negocio.'][j], 'tag':f'CRIPTON POS · {j+1:02} / 04','cta':'Solicita una demostración'}
        if j in (1,2) and r.get('capture'):s['capture']=r['capture']
        save_art(s,f'{r["id"]}-{j+1:02}','story',(j+i)%2==0,r['script'],'reels')
    (ROOT/f'copy/{r["id"]}-guion.md').write_text(f'# {r["id"]} · {r["title"]}\n\nDuración de montaje: 24 segundos; cuatro planos de seis segundos.\nVoz propuesta: español colombiano, cercana y clara; 130–145 palabras/minuto.\n\n## Locución propuesta\n\n{r["script"]}\n\n## Gancho alternativo\n\n{r["hooks"][1]}\n\n## Planos\n\n'+''.join(f'{j+1}. {j*6:02}–{(j+1)*6:02} s: '+ ' '.join(c)+'. Corte editorial; logo estático.\n' for j,c in enumerate(r['cards']))+'\n## Publicación\n\nInstagram/Facebook: versión vertical y descripción del tema, invitando a solicitar una demo por mensaje. TikTok: gancho en el primer segundo y CTA de conocer el producto; verificar mensajes habilitados antes de pedir DM. YouTube Shorts: título del tema y descripción con invitación a conocer Cripton; no depender de enlaces clicables en la descripción del Short.\n\nEl MP4 entregado contiene textos y música instrumental original de prueba, sin locución. La captura es estática y real: no representa una grabación completa del flujo. Para versión narrada, ajustar tiempos al audio aprobado y generar nuevos subtítulos desde esa locución.\n',encoding='utf-8')
    # Editorial card captions; these are not falsely labelled voice transcription.
    srt=''
    for j,card in enumerate(r['cards']):srt+=f'{j+1}\n00:00:{j*6:02},000 --> 00:00:{(j+1)*6:02},000\n'+ ' '.join(card)+'\n\n'
    (ROOT/f'copy/{r["id"]}-textos-pantalla.srt').write_text(srt.rstrip()+'\n',encoding='utf-8')
    ssml=f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-CO"><voice name="es-CO-SalomeNeural"><prosody rate="-5%">{esc(r["script"])}</prosody></voice></speak>'
    (ROOT/f'copy/{r["id"]}-locucion-propuesta.ssml').write_text(ssml,encoding='utf-8')

# Owner-supplied accounts are recorded without inventing access, reach or followers.
channels=[{'channel':k,'url':v,'provenance':'Aportado por el propietario, 2026-10-26','verified_public_access':k in ['instagram','tiktok','youtube'],'public_observation':{'instagram':'Perfil público visible, nombre cripton','tiktok':'Perfil público visible; sin descripción corta','youtube':'Canal Cripton, @cripton.colombia, sin contenido','facebook':'Este contenido no está disponible en este momento'}[k],'publishing_access':'No acreditado en este bloque'} for k,v in DATA['channels'].items()]
(ROOT/'strategy/channels.json').write_text(json.dumps(channels,ensure_ascii=False,indent=2),encoding='utf-8')
with (ROOT/'copy/videos-por-red.csv').open('w',encoding='utf-8-sig',newline='') as f:
    cw=csv.writer(f);cw.writerow(['id','canal','titulo','descripcion','archivo','estado'])
    for r in DATA['reels']:
        for ch in ['instagram','facebook','tiktok','youtube']:
            title=r['title']+' | Cripton POS'+(' #Shorts' if ch=='youtube' else '')
            desc=r['hooks'][0]+' '+r['script']+'\n\nMontaje con capturas estáticas reales y datos de demostración. El alcance depende del plan y configuración.'
            if ch in ['instagram','facebook']:desc+=' Solicita una demostración por mensaje.'
            if ch in ['instagram','tiktok']:desc+='\n#CriptonPOS #SoftwarePOS #ComerciosColombia'
            cw.writerow([r['id'],ch,title,desc,f'campaigns/launch-30d/exports/reels/{r["id"]}.mp4','Preparado; revisar cuenta y destino antes de publicar'])
with (ROOT/'copy/publicaciones.csv').open('w',encoding='utf-8-sig',newline='') as f:
    cw=csv.writer(f);cw.writerow(['id','tema','canal','texto','texto_alternativo','archivo_base','estado'])
    for p in DATA['posts']:
        for channel in ['instagram','facebook']:cw.writerow([p['id'],p['theme'],channel,p[channel],p['alt'],f'campaigns/launch-30d/exports/posts/{p["id"]}-01-feed.png','Pendiente de revisión'])
with (ROOT/'copy/historias.csv').open('w',encoding='utf-8-sig',newline='') as f:
    cw=csv.writer(f);cw.writerow(['id','texto','cta','interaccion_nativa','redes','archivo','estado'])
    for s in DATA['stories']:cw.writerow([s['id'],' / '.join(s['title'])+' '+s['body'],s['cta'],s.get('interaction','Sin sticker obligatorio'),'Instagram/Facebook',f'campaigns/launch-30d/exports/stories/{s["id"]}-story.png','Añadir interacción nativa indicada al programar'])

# Thirty editorial days, not automatic publishing dates.
post_days=[1,4,6,9,11,14,16,19,21,24,26,29];reel_days=[3,8,13,18,23,28];story_days=[x for x in range(1,31) if x not in post_days+reel_days]
cal=[]
for day in range(1,31):
    if day in post_days:
        item=DATA['posts'][post_days.index(day)];id=item['id'];channel='Instagram + Facebook';fmt='Carrusel' if len(item['slides'])>1 else 'Imagen';resource=f'posts/{id}-01-feed.png';goal='Reconocimiento' if day<8 else ('Consideración' if day<22 else 'Conversación de demo');copy=f'copy/publicaciones.csv · {id}'
    elif day in reel_days:
        item=DATA['reels'][reel_days.index(day)];id=item['id'];channel='Instagram Reels + Facebook Reels + TikTok + YouTube Shorts';fmt='Video vertical · 24 s';resource=f'reels/{id}.mp4';goal='Demostración visual';copy=f'copy/{id}-guion.md'
    else:
        item=DATA['stories'][story_days.index(day)];id=item['id'];channel='Instagram + Facebook Stories';fmt='Historia';resource=f'stories/{id}-story.png';goal='Interacción';copy=f'copy/historias.csv · {id}'
    cal.append({'dia':day,'semana':(day-1)//7+1,'id':id,'objetivo':goal,'canal':channel,'formato':fmt,'recurso':'campaigns/launch-30d/exports/'+resource,'texto':copy,'cta':item.get('cta','Solicita una demostración'),'hora':'Propuesta a probar: 12:30 America/Bogota; ajustar con Insights, sin garantía de mejor horario','estado':'Borrador visual preparado; pendiente aprobación y programación'})
with (ROOT/'strategy/calendario-30-dias.csv').open('w',encoding='utf-8-sig',newline='') as f:
    dw=csv.DictWriter(f,fieldnames=list(cal[0]));dw.writeheader();dw.writerows(cal)
(ROOT/'strategy/calendario-30-dias.json').write_text(json.dumps(cal,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'qa/layout-bounds.json').write_text(json.dumps(BOUNDS,ensure_ascii=False,indent=2),encoding='utf-8')
(BASE/'manifest.json').write_text(json.dumps(MANIFEST,ensure_ascii=False,indent=2),encoding='utf-8')
with (ROOT/'copy/anuncios.csv').open('w',encoding='utf-8-sig',newline='') as f:
    cw=csv.writer(f);cw.writerow(['id','texto_principal','titular','cta','objetivo','hipotesis','presupuesto','estado'])
    for a in DATA['ads']:cw.writerow([a['id'],a['primary'],a['headline'],'Solicitar demostración',a['objective'],a['hypothesis'],'Sin asignar; no activar','Concepto sin campaña creada'])

# UTM drafts deliberately contain no PII and remain inactive until the public destination passes QA.
with (ROOT/'strategy/utm-links.csv').open('w',encoding='utf-8-sig',newline='') as f:
    cw=csv.writer(f);cw.writerow(['id','canal','url_propuesta','estado'])
    for p in DATA['posts']:
        for ch in ['instagram','facebook']:
            cw.writerow([p['id'],ch,f'https://cripton.com.co/?utm_source={ch}&utm_medium=organic_social&utm_campaign=cripton_launch_30d&utm_content={p["id"].lower()}#contacto','Pendiente validar HTTPS público, ruta y consentimiento; no usar aún'])

print(json.dumps({'sources':len(MANIFEST),'posts':len(DATA['posts']),'post_slides':sum(len(x['slides']) for x in DATA['posts']),'stories':len(DATA['stories']),'reels':len(DATA['reels']),'ads':len(DATA['ads']),'out':str(ROOT)},ensure_ascii=False))
