"""Free, local production of the Cripton conversion campaign. Never publishes."""
from pathlib import Path
import argparse, base64, csv, hashlib, html, json, shutil, subprocess
from xml.etree import ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ap=argparse.ArgumentParser(); ap.add_argument('--marketing',required=True); ap.add_argument('--output',required=True)
args=ap.parse_args(); ROOT=Path(args.marketing); OUT=Path(args.output)
for d in ['sources','vectors','images','videos','copy','qa','assets/fonts']: (OUT/d).mkdir(parents=True,exist_ok=True)
NAVY='#051828'; TEAL='#056877'; CYAN='#31CCD4'; WHITE='#FFFFFF'; LIGHT='#F0F6F7'
FONTS={w:TTFont(ROOT/f'brand/fonts/Inter-{n}.ttf') for w,n in [(400,'Regular'),(700,'Bold')]}
CACHE={}; BOUNDS=[]; MANIFEST=[]
def esc(s): return html.escape(str(s),quote=True)
def measure(s,size,weight=400):
 f=FONTS[weight]; cm=f.getBestCmap(); return sum(f['hmtx'].metrics[cm.get(ord(c),'space')][0] for c in s)*size/f['head'].unitsPerEm
def wrap(s,size,width,weight=400):
 lines=[]; line=''
 for word in s.split():
  nxt=(line+' '+word).strip()
  if line and measure(nxt,size,weight)>width: lines.append(line);line=word
  else: line=nxt
 if line: lines.append(line)
 return lines
def text(s,x,y,size,color,weight=400,outlined=False):
 if not outlined: return f'<text x="{x}" y="{y}" font-family="Inter" font-size="{size}" font-weight="{weight}" fill="{color}">{esc(s)}</text>'
 key=(s,size,weight)
 if key not in CACHE:
  f=FONTS[weight]; gs=f.getGlyphSet(); cm=f.getBestCmap(); off=0; parts=[]; units=f['head'].unitsPerEm
  for c in s:
   n=cm.get(ord(c),'space'); pen=SVGPathPen(gs);gs[n].draw(pen);d=pen.getCommands()
   if d:parts.append(f'<path transform="translate({off} 0)" d="{d}"/>')
   off+=f['hmtx'].metrics[n][0]
  CACHE[key]=f'<g transform="scale({size/units} {-size/units})">'+''.join(parts)+'</g>'
 return f'<g fill="{color}" transform="translate({x} {y})">{CACHE[key]}</g>'
def rect(x,y,w,h,fill,rx=0):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"/>'
def svg_embed(p,x,y,w,h):
 raw=p.read_text(encoding='utf-8'); vb=ET.fromstring(raw).attrib['viewBox']; content=raw[raw.index('>',raw.index('<svg'))+1:raw.rfind('</svg>')]
 return f'<svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{vb}" preserveAspectRatio="xMidYMid meet">{content}</svg>'
def image(p,x,y,w,h):return f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" href="data:image/jpeg;base64,{base64.b64encode(p.read_bytes()).decode()}"/>'

slides=[
 dict(id='C01-01',tag='MENOS DIGITACIÓN',title='Ya registraste los productos.',body='Aprovecha esa información para generar tu factura electrónica con Cripton POS.',visual='flow',dark=True),
 dict(id='C01-02',tag='01 · EL ORIGEN',title='Parte de la información registrada.',body='El documento interno es el origen de los datos. No sustituye la factura fiscal exigida.',visual='document'),
 dict(id='C01-03',tag='02 · LA EMISIÓN',title='Genera la factura electrónica.',body='La función de conversión utiliza la información del documento de origen. Requiere configuración fiscal y un plan con electrónica.',visual='flow'),
 dict(id='C01-04',tag='03 · EL SEGUIMIENTO',title='Consulta el resultado del proceso.',body='Revisa el estado y la relación documental desde el POS. La validación y entrega forman parte de la emisión.',visual='steps'),
 dict(id='C01-05',tag='VEÁMOSLO EN TU NEGOCIO',title='Conoce el flujo completo.',body='Pide una demostración de Cripton POS y revisa cómo se adapta a tu operación.',visual='cta',dark=True),
 dict(id='P01',tag='PARA TU NEGOCIO',title='¿Digitar los mismos productos otra vez?',body='Del documento interno a la factura electrónica, aprovechando la información que ya registraste.',visual='flow',dark=True),
 dict(id='P02',tag='PAPELERÍAS',title='Cuadernos. Carpetas. Lapiceros.',body='Conoce una forma de conectar la información de tus documentos con la emisión electrónica.',visual='paper'),
 dict(id='P03',tag='CONOCE CRIPTON POS',title='Mira el sistema por dentro.',body='Catálogo, ventas e inventario: solicita una demostración aplicada a tu negocio.',visual='capture',capture='catalogo.jpg'),
 dict(id='S01',tag='¿TIENES UNA PAPELERÍA?',title='Tus productos, ya registrados.',body='Conoce el proceso para aprovechar esa información al generar una factura electrónica.',visual='paper',dark=True),
 dict(id='S02',tag='DOCUMENTOS CONECTADOS',title='Del origen a la electrónica.',body='Cripton POS permite generar una factura electrónica desde la información del documento interno.',visual='flow'),
 dict(id='S03',tag='UNA DIFERENCIA IMPORTANTE',title='Interno y electrónico no son lo mismo.',body='El documento interno no reemplaza la factura fiscal. La emisión debe realizarse en el momento legal que corresponda.',visual='document'),
 dict(id='S04',tag='DEMOSTRACIÓN',title='¿Quieres verlo en tu negocio?',body='Escríbenos DEMO por mensaje privado. Cuéntanos qué vendes y cómo manejas tus documentos.',visual='cta',dark=True)
]
videos=[
 dict(id='R01',name='Información que conecta',seconds=30,slides=[
  dict(tag='¿TE PASA?',title='¿Volver a digitar los mismos productos?',body='Conoce la función de conversión de Cripton POS.',visual='flow',dark=True),
  dict(tag='EL PUNTO DE PARTIDA',title='La información ya está registrada.',body='Un documento interno conserva el detalle de los productos.',visual='document'),
  dict(tag='LA FUNCIÓN',title='Aprovéchala en la factura electrónica.',body='Genera la factura desde la información del documento de origen.',visual='flow'),
  dict(tag='PARA EMITIR',title='Configuración y validación fiscal.',body='Requiere plan con electrónica y configuración fiscal. Consulta el resultado del proceso.',visual='steps'),
  dict(tag='PIDE TU DEMOSTRACIÓN',title='Veámoslo con tu negocio.',body='Escríbenos DEMO por mensaje privado.',visual='cta',dark=True)]),
 dict(id='R02',name='Papelerías',seconds=24,slides=[
  dict(tag='PARA PAPELERÍAS',title='Cuadernos, carpetas y lapiceros.',body='Tu negocio maneja muchas referencias.',visual='paper',dark=True),
  dict(tag='INFORMACIÓN REGISTRADA',title='Aprovecha el detalle de tus productos.',body='Conoce cómo se utiliza en la generación de la factura electrónica.',visual='document'),
  dict(tag='CRIPTON POS',title='Conoce el catálogo del sistema.',body='Captura de la interfaz con productos QA; no representa un catálogo de papelería.',visual='capture',capture='catalogo.jpg'),
  dict(tag='HABLEMOS DE TU PAPELERÍA',title='Te mostramos el proceso.',body='Escríbenos PAPELERÍA por mensaje privado.',visual='cta',dark=True)]),
 dict(id='R03',name='Documentos internos y electrónicos',seconds=30,slides=[
  dict(tag='PREGUNTA FRECUENTE',title='¿Interno significa factura electrónica?',body='Son documentos con funciones diferentes.',visual='document',dark=True),
  dict(tag='DOCUMENTO INTERNO',title='Registra información de la operación.',body='No sustituye la factura fiscal exigida.',visual='document'),
  dict(tag='FACTURA ELECTRÓNICA',title='Su emisión tiene requisitos propios.',body='Incluye generación, transmisión, validación y entrega según corresponda.',visual='steps'),
  dict(tag='CONVERSIÓN EN CRIPTON',title='Reutiliza la información registrada.',body='La función no modifica el momento legal en que se debe facturar.',visual='flow'),
  dict(tag='CONOCE EL ALCANCE',title='Solicita una demostración.',body='Escríbenos DEMO y revisemos el flujo disponible.',visual='cta',dark=True)])
]

def art(s,fmt,outlined):
 w=1080;h={'feed':1350,'square':1080,'story':1920}[fmt];story=fmt=='story';square=fmt=='square';m=76; top=205 if story else 64
 dark=s.get('dark',False); fg=WHITE if dark else NAVY;muted='#BAD9DF' if dark else TEAL;bg=NAVY if dark else WHITE
 a=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{esc(s["title"])}</title>',rect(0,0,w,h,bg),rect(0,0,12,h,CYAN)]
 t=lambda z,x,y,sz=30,col=fg,weight=400:text(z,x,y,sz,col,weight,outlined)
 a+=[svg_embed(ROOT/f'brand/cripton_horizontal_{"reverso" if dark else "color"}_v1.0.svg',m,top,380,103),t(s['tag'],m,top+155,22,muted,700)]
 y=top+250;size=64 if square else 76;lines=wrap(s['title'],size,920,700)
 for ln in lines:a.append(t(ln,m,y,size,fg,700));y+=size*1.13
 y+=14
 for ln in wrap(s['body'],29 if square else 32,915):a.append(t(ln,m,y,29 if square else 32,muted));y+=42
 y+=35; ctabottom=h-(330 if story else 230); avail=ctabottom-y-25
 if avail<100:raise ValueError(f'Text leaves insufficient visual space: {s["title"]} {fmt}')
 visual=s['visual']; boxbg=TEAL if dark else LIGHT
 if visual=='capture':
  ih=min(430,avail-40); a+=[rect(m,y,928,ih,WHITE,14),image(ROOT/'captures'/s['capture'],m+10,y+10,908,ih-20),t('Interfaz real · datos de demostración',m,y+ih+27,21,muted)]
 elif visual=='flow':
  bh=min(395,avail-35); bw=412
  for x,label,detail in [(m,'Documento interno','Información registrada'),(m+516,'Factura electrónica','Proceso de emisión')]:
   a+=[rect(x,y,bw,bh,boxbg,16),t(label,x+24,y+44,27,WHITE if dark else NAVY,700),t(detail,x+24,y+85,22,WHITE if dark else TEAL)]
   if bh>210:
    a +=[rect(x+28,y+117,bw-56,bh-148,WHITE if dark else '#DDEBED',10)]
    for j,width in enumerate([194,258,222]):
     if 148+j*34+7<bh-31:a.append(rect(x+55,y+148+j*34,width,7,TEAL,3))
  mid=y+bh/2
  a += [f'<path d="M{m+439} {mid}h50m-15-15 15 15-15 15" fill="none" stroke="{CYAN if dark else TEAL}" stroke-width="5"/>',t('Esquema explicativo del flujo',m,y+bh+28,21,muted)]
 elif visual in ['document','steps']:
  labels=['Información de origen','Generación y validación','Consulta del resultado'] if visual=='steps' else ['Productos y cantidades','Información del documento','Origen de la conversión']
  rh=min(115,(avail-20)/3)
  for i,label in enumerate(labels):
   yy=y+i*(rh+8);a +=[rect(m,yy,928,rh,boxbg,12),t(f'0{i+1}',m+22,yy+rh*.66,25,CYAN if dark else TEAL,700),t(label,m+90,yy+rh*.66,27,fg)]
 elif visual=='paper':
  bh=min(320,avail);bw=296
  for i,(label,count) in enumerate([('Cuadernos','01'),('Carpetas','02'),('Lapiceros','03')]):
   x=m+i*316;a +=[rect(x,y,bw,bh,boxbg,14),t(count,x+22,y+38,23,CYAN if dark else TEAL,700),t(label,x+22,y+85,29,fg,700)]
   if bh>210:
    a +=[rect(x+60,y+125,130,150,WHITE if dark else '#DDEBED',8)]
    for j in range(3):a.append(rect(x+78,y+151+j*30,94,5,TEAL,2))
 elif visual=='cta':
  a += [rect(m,y,928,min(280,avail),boxbg,18),t('Tu negocio. Tus preguntas.',m+30,y+65,39,fg,700),t('Una demostración para conocer el flujo.',m+30,y+120,28,WHITE if dark else TEAL)]
  if avail>220:a.append(t('DEMO',m+30,y+225,74,CYAN if dark else TEAL,700))
 a += [rect(m,ctabottom,928,78,CYAN,12),t('Escríbenos DEMO por mensaje privado',m+24,ctabottom+49,29,NAVY,700)]
 # Distinguish commercial explanation from a recorded software interaction.
 foot=ctabottom+116
 for ln in wrap('Función sujeta a plan con electrónica y configuración fiscal.',22,925):a.append(t(ln,m,foot,22,muted));foot+=29
 for ln in wrap('El documento interno no sustituye la factura fiscal exigida.',22,925):a.append(t(ln,m,foot,22,muted));foot+=29
 a.append(t('Cripton POS  /  @cripton.colombia',m,foot+10,22,fg,700))
 BOUNDS.append(dict(id=s.get('id'),format=fmt,visualY=y,visualSpace=round(avail),footerEnd=foot+10,canvasHeight=h))
 return ''.join(a)+'</svg>'

def save(s,fmt,category):
 stem=f'{s["id"]}-{fmt}'; paths={k:f'{k}/{stem}.{ext}' for k,ext in [('sources','svg'),('vectors','svg'),('images','png')]}
 for k in ['sources','vectors']:(OUT/paths[k]).write_text(art(s,fmt,k=='vectors'),encoding='utf-8')
 MANIFEST.append(dict(id=s['id'],category=category,format=fmt,title=s['title'],alt=s['title']+' '+s['body'],**paths))
for s in slides:
 fmts=['feed','square'] if s['id'].startswith(('C','P')) else ['story']
 for fmt in fmts:save(s,fmt,'carousel' if s['id'].startswith('C') else 'post' if s['id'].startswith('P') else 'story')
for v in videos:
 for i,s in enumerate(v['slides'],1):s['id']=f'{v["id"]}-{i:02}';save(s,'story','video-scene')
 cover=dict(v['slides'][0]);cover['id']=v['id']+'-cover';save(cover,'feed','video-cover')
for p in (ROOT/'brand/fonts').glob('*'):shutil.copy2(p,OUT/'assets/fonts'/p.name)
for n in ['cripton_horizontal_color_v1.0.svg','cripton_horizontal_reverso_v1.0.svg']:shutil.copy2(ROOT/'brand'/n,OUT/'assets'/n)
captions={
 'C01':'¿Ya registraste los productos? Cripton POS permite aprovechar la información de un documento interno para generar la factura electrónica. Conoce el flujo y sus requisitos en una demostración. Escríbenos DEMO por mensaje privado. Requiere plan con electrónica y configuración fiscal. El documento interno no sustituye la factura fiscal exigida ni modifica el momento legal de emisión.',
 'P01':'Volver a digitar los mismos productos puede ser trabajo repetido. Conoce la función de conversión de documentos de Cripton POS. Escríbenos DEMO. Requiere plan con electrónica y configuración fiscal; los documentos internos no sustituyen la factura fiscal exigida.',
 'P02':'¿Tienes una papelería? Conoce Cripton POS y su función para aprovechar la información registrada al generar una factura electrónica. Escríbenos PAPELERÍA por mensaje privado. Función sujeta a configuración fiscal y plan con electrónica; emisión en el momento legal correspondiente.',
 'P03':'Así se ve el catálogo de Cripton POS. La captura usa datos QA, no resultados de un cliente. ¿Quieres conocer el sistema aplicado a tu negocio? Escríbenos DEMO.',
 'S01':'¿Tienes una papelería? Escríbenos PAPELERÍA y conoce el proceso.',
 'S02':'Conoce la función de conversión de Cripton POS. Escríbenos DEMO.',
 'S03':'Documento interno y factura electrónica tienen funciones distintas. Conoce el alcance antes de elegir tu sistema.',
 'S04':'Escríbenos DEMO por mensaje privado y cuéntanos qué vendes.',
 'R01':'Conoce cómo Cripton POS aprovecha la información de un documento interno para generar la factura electrónica. Video explicativo, no grabación de una emisión. Requiere plan con electrónica y configuración fiscal. El documento interno no sustituye la factura exigida ni permite aplazar su emisión. Escríbenos DEMO.',
 'R02':'¿Tienes una papelería? Conoce el flujo documental de Cripton POS. Video explicativo con una captura real del catálogo y datos QA; no representa una venta real ni una emisión productiva. Escríbenos PAPELERÍA. Requiere plan con electrónica y configuración fiscal; emisión en el momento legal correspondiente.',
 'R03':'¿Un documento interno es una factura electrónica? No. Te explicamos la diferencia y qué aporta la conversión en Cripton POS. Contenido informativo general; no sustituye asesoría tributaria. Escríbenos DEMO para conocer el sistema.'}
with (OUT/'copy/textos.csv').open('w',encoding='utf-8-sig',newline='') as f:
 cw=csv.writer(f);cw.writerow(['id','canales','texto','estado'])
 for id,copy in captions.items():cw.writerow([id,'Instagram/Facebook'+('/TikTok/YouTube Shorts' if id.startswith('R') else ''),copy,'Borrador para aprobación'])
(OUT/'copy/textos.txt').write_text('\n\n'.join(f'{k}\n{v}' for k,v in captions.items()),encoding='utf-8')
for v in videos:
 step=v['seconds']/len(v['slides']); srt=[]; script=[f'# {v["id"]} · {v["name"]}', '', 'Video editorial con texto. No es una grabación del proceso de emisión. Sin voz ni música de terceros.', '']
 for i,s in enumerate(v['slides']):
  stamp=lambda sec:f'00:{int(sec)//60:02}:{int(sec)%60:02},000'
  srt.append(f'{i+1}\n{stamp(i*step)} --> {stamp((i+1)*step)}\n{s["title"]}\n{s["body"]}\n')
  script.append(f'{int(i*step):02}–{int((i+1)*step):02} s: {s["title"]} {s["body"]}')
 (OUT/'copy'/f'{v["id"]}.srt').write_text('\n'.join(srt),encoding='utf-8')
 (OUT/'copy'/f'{v["id"]}-guion.md').write_text('\n'.join(script),encoding='utf-8')
(OUT/'campaign.json').write_text(json.dumps(dict(version='1.0',status='draft',slides=slides,videos=videos,captions=captions),ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'manifest.json').write_text(json.dumps(MANIFEST,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'qa/layout.json').write_text(json.dumps(BOUNDS,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(images=len(MANIFEST),videos=len(videos),output=str(OUT))))
