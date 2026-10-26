import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';import crypto from 'node:crypto';
const root=path.resolve(process.argv[2]);const raw=path.resolve(process.argv[3]);const require=createRequire(path.join(root,'..','package.json'));const sharp=require('sharp');
const regions={catalogo:{left:208,top:126,width:1064,height:455},stock:{left:208,top:168,width:1064,height:330},kardex:{left:208,top:168,width:1064,height:190},ventas:{left:208,top:120,width:640,height:275},caja:{left:208,top:56,width:1064,height:252}};
const report=[];
for(const [name,region] of Object.entries(regions)){
 const input=path.join(raw,`${name}-raw-local.jpg`);const target=path.join(root,'captures',`${name}.jpg`);
 await sharp(input).extract(region).jpeg({quality:94}).toFile(target);
 const stats=await sharp(target).stats();if(Math.max(...stats.channels.map(c=>c.stdev))<10)throw new Error(`Captura vacía: ${name}`);
 report.push({file:`captures/${name}.jpg`,region,source:'Captura visible del navegador, bruto privado fuera del repositorio',sha256:crypto.createHash('sha256').update(await fs.readFile(target)).digest('hex'),minimumVisualDetail:Math.max(...stats.channels.map(c=>c.stdev))});
}
await fs.writeFile(path.join(root,'qa','capture-provenance.json'),JSON.stringify(report,null,2)+'\n');console.log(`Prepared ${report.length} cropped real screenshots`);
