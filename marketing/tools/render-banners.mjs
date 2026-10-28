import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve('marketing');const require=createRequire(path.join(root,'../package.json'));const sharp=require('sharp');
const data=JSON.parse(await fs.readFile(path.join(root,'qa/banner-layout.json'),'utf8'));
for(const item of data.items){await sharp(path.join(root,item.vector)).withIccProfile('srgb').png().toFile(path.join(root,item.png));const m=await sharp(path.join(root,item.png)).metadata();if(m.width!==item.canvas[0]||m.height!==item.canvas[1]||!m.hasProfile)throw Error(item.id+' invalid output');}
await sharp(path.join(root,'campaigns/launch-30d/sources/profiles/avatar-fondo-blanco.svg')).resize(400,400).withIccProfile('srgb').png().toFile(path.join(root,'campaigns/launch-30d/exports/profiles/x-avatar-v1.png'));
console.log(data.items.length+' banner exports and X avatar with sRGB verified');