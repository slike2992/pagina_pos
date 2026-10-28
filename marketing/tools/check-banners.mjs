import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve('marketing'),require=createRequire(path.resolve('package.json')),sharp=require('sharp');
const plan=JSON.parse(await fs.readFile(path.join(root,'qa/banner-layout.json'),'utf8')),issues=[];
const check=(c,m)=>{if(!c)issues.push(m)};
for(const item of plan.items){
 const svg=await fs.readFile(path.join(root,item.vector),'utf8');
 const kind=item.id.startsWith('facebook')||item.id.startsWith('x-header')||item.id.endsWith('mobile')?'nombre':'horizontal';
 const master=await fs.readFile(path.join(root,'../Cripton_Kit_Marca_v1_0/01_maestros_svg',`cripton_${kind}_reverso_v1.0.svg`),'utf8');
 const body=master.slice(master.indexOf('>',master.indexOf('<svg'))+1,master.lastIndexOf('</svg>'));
 check(svg.includes(body),`Maestro alterado en ${item.id}`);
 const meta=await sharp(path.join(root,item.png)).metadata();
 check(meta.width===item.canvas[0]&&meta.height===item.canvas[1]&&meta.hasProfile,`Exportación no válida ${item.id}`);
 check((await fs.stat(path.join(root,item.png))).size<6*1024*1024,`Exportación supera 6 MiB: ${item.id}`);
 for(const t of item.text)check(t.x>=0&&t.right<=item.canvas[0]&&t.baseline-t.size>=0&&t.baseline<=item.canvas[1],`Texto fuera del lienzo ${item.id}`);
}
for(const v of ['color','reverso']){const n=`cripton_nombre_${v}_v1.0.svg`;check((await fs.readFile(path.join(root,'brand',n))).equals(await fs.readFile(path.join(root,'../Cripton_Kit_Marca_v1_0/01_maestros_svg',n))),`Copia no exacta ${n}`)}
const avatar=await sharp(path.join(root,'campaigns/launch-30d/exports/profiles/x-avatar-v1.png')).metadata();check(avatar.width===400&&avatar.height===400&&avatar.hasProfile,'Avatar X no válido');
const [sx,sy,sw,sh]=plan.youtubeSafeArea,[lx,ly,lw,lh]=plan.youtubeLogoBox;
check(lx>=sx&&ly>=sy&&lx+lw<=sx+sw&&ly+lh<=sy+sh,'Firma fuera de zona segura YouTube');
const youtubeVisible320=lw*(1435.19/1517.039)*320/sw;check(youtubeVisible320>=280,'Firma YouTube menor a mínimo a 320px de zona visible');
const measures=JSON.parse(await fs.readFile(path.join(root,'qa/banner-responsive-measures.json'),'utf8'));
check(measures.length===7,'Faltan medidas responsive');for(const m of measures){check(m.scrollWidth<=m.width&&m.imagesReady,`Desbordamiento o imagen ausente a ${m.width}`);for(const e of m.web)check(e.right<=m.width,`Elemento web cortado a ${m.width}`);const logo=m.web.find(e=>e.tag==='IMG');check(logo.width*(m.width<=600?1000/1081.845:1435.19/1517.039)>=(m.width<=600?120:280),`Firma web menor al mínimo a ${m.width}`)}
const imageMeasures=JSON.parse(await fs.readFile(path.join(root,'qa/banner-image-measures.json'),'utf8'));for(const m of imageMeasures)for(const i of m.images)check(Math.abs(i.width/i.height-i.naturalWidth/i.naturalHeight)<.001,`Imagen YouTube deformada a ${m.width}`);
const lum=hex=>{const a=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722};
const pairs=[['#FFFFFF','#051828'],['#FFFFFF','#056877'],['#31CCD4','#051828']].map(([a,b])=>({colors:[a,b],ratio:(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)}));for(const p of pairs)check(p.ratio>=4.5,'Contraste insuficiente');
const html=await fs.readFile(path.join(root,'banners.html'),'utf8');for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){const f=m[1];if(!f.startsWith('#')&&!f.includes(':'))await fs.access(path.join(root,f.split('#')[0])).catch(()=>issues.push(`Enlace local roto ${f}`))}
const report={date:'2026-10-27',status:issues.length?'failed':'passed',banners:plan.items.length,viewports:measures.map(m=>m.width),youtubeVisibleLogoAt320:youtubeVisible320,contrast:pairs,checks:['Maestros vectoriales sin modificar','PNG sRGB, dimensiones y peso','Texto dentro del lienzo','Zona segura YouTube y mínimo de marca','Medidas DOM de siete tamaños','Recursos HTML existentes','Proporción renderizada de imágenes YouTube'],limitations:plan.limits,issues};await fs.writeFile(path.join(root,'qa/banner-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exitCode=issues.length?1:0;
