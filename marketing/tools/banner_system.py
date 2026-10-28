"""Brand 1.1.0 banner compositions. Uses exact official SVG paths; no network."""
from pathlib import Path
import json, types, shutil
ROOT=Path(__file__).resolve().parents[1]
KIT=ROOT.parent/'Cripton_Kit_Marca_v1_0'

def build_banners():
    b=types.ModuleType('brand_helpers');b.__file__=str(ROOT/'tools/build.py');b.__dict__['__name__']='brand_helpers'
    exec((ROOT/'tools/build.py').read_text(encoding='utf-8').split('def svg_art(')[0],b.__dict__)
    for variant in ['color','reverso']:
        name=f'cripton_nombre_{variant}_v1.0.svg'
        shutil.copyfile(KIT/'01_maestros_svg'/name,ROOT/'brand'/name)
    layout=[]
    def tx(s,x,y,size,color=b.WHITE,weight=500,outlined=False):
        # Font bbox is conservative; explicit positions are reviewed against each safe crop.
        if outlined:layout.append({'text':s,'x':x,'baseline':y,'size':size,'right':x+b.measure(s,size,weight)})
        return b.text(s,x,y,size,color,weight,outlined)
    def word(x,y,w,dark=True):return b.embed(ROOT/'brand'/f'cripton_nombre_{"reverso" if dark else "color"}_v1.0.svg',x,y,w,w*307.044/1081.845)
    def start(w,h,title,bg):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img"><title>{title}</title><desc>Marca Cripton. Paleta oficial, Inter y firma vectorial sin modificar.</desc>'+b.rect(0,0,w,h,bg)
    def facebook(outlined):
        # Content in the upper band avoids the large centered mobile profile avatar.
        # Name-only is permitted here: official raptor avatar and page name provide context.
        return start(1640,720,'Cripton · software para negocios · portada Facebook',b.NAVY)+'<path d="M1270 0H1640V720H1040Z" fill="'+b.TEAL+'"/>'+word(72,58,780)+tx('Software',962,142,78,b.WHITE,700,outlined)+tx('para negocios',962,236,78,b.WHITE,700,outlined)+'<path d="M1290 510H1470L1432 534H1252Z" fill="'+b.CYAN+'"/></svg>'
    def x_header(outlined):
        # X avatar overlaps the lower left. Essential brand content stays above it.
        return start(1500,500,'Cripton · portada X',b.NAVY)+'<path d="M1180 0H1500V500H1020Z" fill="'+b.TEAL+'"/>'+word(60,80,700)+tx('Software',850,170,76,b.WHITE,700,outlined)+tx('para negocios',850,262,76,b.WHITE,700,outlined)+'<path d="M1170 380H1340L1302 404H1132Z" fill="'+b.CYAN+'"/></svg>'
    def youtube(outlined):
        # At 2560x1440 the conservative central safe area is 1544x422.
        return start(2560,1440,'Cripton · soluciones de software · banner YouTube',b.NAVY)+'<path d="M2140 0H2560V1440H1840Z" fill="'+b.TEAL+'"/>'+b.logo(560,526,1440,True)+'</svg>'
    def web(outlined,mobile=False):
        if mobile:
            return start(780,960,'Cripton · banner web móvil',b.NAVY)+'<path d="M660 0H780V960H490Z" fill="'+b.TEAL+'"/>'+word(64,70,510)+tx('Software para',64,365,78,b.WHITE,700,outlined)+tx('tu negocio.',64,459,78,b.WHITE,700,outlined)+tx('Conoce Cripton POS',64,605,40,b.CYAN,700,outlined)+tx('Ventas, caja e inventario.',64,673,34,b.WHITE,400,outlined)+b.rect(64,753,620,100,b.CYAN,12)+tx('Solicita una demostración',94,817,36,b.NAVY,700,outlined)+'</svg>'
        return start(1920,760,'Cripton · banner web escritorio',b.NAVY)+'<path d="M1510 0H1920V760H1230Z" fill="'+b.TEAL+'"/>'+b.logo(100,58,540,True)+tx('Software para',100,341,94,b.WHITE,700,outlined)+tx('tu negocio.',100,453,94,b.WHITE,700,outlined)+tx('Conoce Cripton POS',1110,276,48,b.CYAN,700,outlined)+tx('Ventas, caja e inventario.',1110,350,36,b.WHITE,400,outlined)+b.rect(1110,430,650,100,b.CYAN,12)+tx('Solicita una demostración',1140,495,38,b.NAVY,700,outlined)+'</svg>'
    defs=[('x-header-v1',1500,500,x_header,'profiles'),('facebook-cover-v2',1640,720,facebook,'profiles'),('youtube-banner-v2',2560,1440,youtube,'profiles'),('web-banner-desktop',1920,760,lambda o:web(o),'banners'),('web-banner-mobile',780,960,lambda o:web(o,True),'banners')]
    manifest=[]
    for name,w,h,fn,folder in defs:
        source=ROOT/f'campaigns/launch-30d/sources/{folder}/{name}.svg';vector=ROOT/f'campaigns/launch-30d/exports/{folder}/{name}.svg'
        source.parent.mkdir(parents=True,exist_ok=True);vector.parent.mkdir(parents=True,exist_ok=True)
        source.write_text(fn(False),encoding='utf-8');before=len(layout);vector.write_text(fn(True),encoding='utf-8')
        manifest.append({'id':name,'canvas':[w,h],'source':str(source.relative_to(ROOT)).replace('\\','/'),'vector':str(vector.relative_to(ROOT)).replace('\\','/'),'png':str(vector.with_suffix('.png').relative_to(ROOT)).replace('\\','/'),'text':layout[before:]})
    data={'brandRevision':'1.1.0','date':'2026-10-27','items':manifest,'youtubeSafeArea':[508,509,1544,422],'youtubeLogoBox':[560,526,1440,1440*409.226/1517.039],'facebookStrategy':'Firma de nombre oficial en banda superior, sin texto bajo el avatar; descriptor corporativo, detalle POS en biografía. Verificación de Facebook real separada de simulaciones.','masters':'Cripton_Kit_Marca_v1_0/01_maestros_svg','limits':['No sustituye ensayo en aplicaciones nativas de redes','YouTube pendiente vista de carga en cuenta real','Banner web es un recurso de marketing listo para integrar, no una modificación de la web pública']}
    (ROOT/'qa/banner-layout.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'banners':len(manifest),'brand':'1.1.0'}))
    return data
if __name__=='__main__':build_banners()