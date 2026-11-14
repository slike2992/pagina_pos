// Render only this composition. This is media generation, not browser UI automation.
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE;
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public')});
const composition=await selectComposition({serveUrl,id:'CriptonPilot',browserExecutable});
await mkdir('render',{recursive:true});
const frames=[30,150,220,300,455,600];
if(!process.argv.includes('--video-only'))for (const frame of frames){await renderStill({serveUrl,composition,output:path.resolve(`render/review-${frame}.png`),frame,browserExecutable});console.log('Reviewed frame',frame);}
if(process.argv.includes('--video')||process.argv.includes('--video-only')){
 let last=-1;
 await renderMedia({serveUrl,composition,codec:'h264',outputLocation:path.resolve('render/picture.mp4'),crf:18,concurrency:4,browserExecutable,onProgress:({progress})=>{const tenth=Math.floor(progress*10);if(tenth!==last){last=tenth;console.log(`Render ${tenth*10}%`);}}});
 console.log('\nRendered Remotion picture');
}
