import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve('marketing');const require=createRequire(path.join(root,'../package.json'));const sharp=require('sharp');
const data=JSON.parse(await fs.readFile(path.join(root,'qa/banner-layout.json'),'utf8'));
for(const item of data.items){await sharp(path.join(root,item.vector)).withIccProfile('srgb').png().toFile(path.join(root,item.png));const m=await sharp(path.join(root,item.png)).metadata();if(m.width!==item.canvas[0]||m.height!==item.canvas[1]||!m.hasProfile)throw Error(item.id+' invalid output');}
console.log('Four banner exports with sRGB verified');