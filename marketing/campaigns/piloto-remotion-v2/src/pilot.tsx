import React,{useEffect,useState} from 'react';
import {AbsoluteFill,Easing,Img,OffthreadVideo,Sequence,cancelRender,continueRender,delayRender,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';

const N='#051828', C='#31CCD4', W='#fff';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const ease=Easing.bezier(.22,1,.36,1);
const lerp=(f:number,a:number,b:number,x:number,y:number)=>interpolate(f,[a,b],[x,y],{...clamp,easing:ease});
type Scene='products'|'cart'|'open'|'convert'|'accepted'|'end';
const data:{name:Scene;start:number;end:number;kicker:string;title:string[];accent:number}[]=[
 {name:'products',start:0,end:102,kicker:'PARA TU PAPELERÍA',title:['¿Digitar','otra vez?'],accent:1},
 {name:'cart',start:102,end:186,kicker:'01 / DOCUMENTO INTERNO',title:['Aprovecha','lo registrado.'],accent:1},
 {name:'open',start:186,end:264,kicker:'02 / CONVERSIÓN',title:['Los datos','te acompañan.'],accent:1},
 {name:'convert',start:264,end:381,kicker:'02 / CONVERSIÓN',title:['De interno','a electrónica.'],accent:1},
 {name:'accepted',start:381,end:546,kicker:'03 / CONSULTA EL ESTADO',title:['Menos repetir.','Más claridad.'],accent:1},
 {name:'end',start:546,end:660,kicker:'CONOCE CRIPTON POS',title:['¿Lo vemos','en tu negocio?'],accent:1}
];
const captions=[
 [14,91,['¿Volver a digitar','los mismos productos?']],
 [105,162,['Con Cripton, aprovecha','la información']],
 [162,255,['que ya registraste','en tu documento interno.']],
 [269,334,['Genera la factura electrónica']],
 [334,408,['y consulta su estado','desde el mismo sistema.']],
 [422,476,['Menos trabajo repetido.']],
 [476,538,['Más claridad para tu negocio.']],
 [552,629,['Escríbenos DEMO','y conoce Cripton.']]
] as const;

function Heading({scene}:{scene:typeof data[number]}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 return <div style={{position:'absolute',left:64,top:202,right:64}}>
  <div style={{fontSize:25,fontWeight:700,letterSpacing:3,color:C,opacity:lerp(frame,0,8,0,1)}}>{scene.kicker}</div>
  <div style={{marginTop:27,fontSize:91,lineHeight:1.07,letterSpacing:-4.2,fontWeight:700}}>
   {scene.title.map((line,i)=>{
    const s=spring({frame:frame-i*4,fps,config:{damping:24,stiffness:150,mass:.8}});
    return <div key={line} style={{overflow:'hidden',paddingBottom:5}}><div style={{transform:`translateY(${(1-s)*105}%)`,color:i===scene.accent?C:W}}>{line}</div></div>;
   })}
  </div>
 </div>;
}

type Cam={x:number;y:number;w:number;h:number};
function Camera({name,from,to,tag,highlight}:{name:Scene;from:Cam;to?:Cam;tag:string;highlight?:{x:number;y:number;w:number;h:number;label:string;at:number}}){
 const f=useCurrentFrame();const duration=data.find(s=>s.name===name)!.end-data.find(s=>s.name===name)!.start;
 const end=to??from;const progress=lerp(f,name==='open'?33:10,name==='open'?68:duration-6,0,1);
 const view={x:from.x+(end.x-from.x)*progress,y:from.y+(end.y-from.y)*progress,w:from.w+(end.w-from.w)*progress,h:from.h+(end.h-from.h)*progress};
 const windowW=984,windowH=916;
 const scale=Math.max(windowW/view.w,windowH/view.h);
 const nativeW=name==='convert'?630:1314,nativeH=name==='convert'?876:828;
 const entry=spring({frame:f,fps:30,config:{damping:25,stiffness:180,mass:.9}});
 const ann=highlight?lerp(f,highlight.at,highlight.at+8,0,1):0;
 return <div style={{position:'absolute',left:48,top:530,width:984,transform:`translateY(${(1-entry)*26}px)`,opacity:lerp(f,0,6,0,1)}}>
  <div style={{height:58,background:'#11313e',border:'1px solid #35606b',borderBottom:0,borderRadius:'24px 24px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',fontSize:21,color:'#d2e6ea',fontWeight:700,letterSpacing:.8}}>
   <span style={{display:'flex',alignItems:'center',gap:10}}><span style={{width:8,height:8,borderRadius:8,background:C}}/>{tag}</span><span style={{fontSize:18,color:'#a5c4cd'}}>CAPTURA REAL</span>
  </div>
  <div style={{height:windowH,position:'relative',overflow:'hidden',background:'#f3f5fa',borderRadius:'0 0 24px 24px',border:'1px solid #35606b',boxShadow:'0 22px 70px #0006'}}>
   <div style={{position:'absolute',width:nativeW,height:nativeH,left:-view.x*scale,top:-view.y*scale,transform:`scale(${scale})`,transformOrigin:'0 0'}}>
    <OffthreadVideo src={staticFile(`${name}.mp4`)} muted style={{position:'absolute',width:nativeW,height:nativeH}}/>
    {highlight&&<div style={{position:'absolute',left:highlight.x,top:highlight.y,width:highlight.w,height:highlight.h,border:`${3/scale}px solid ${C}`,borderRadius:6,opacity:ann,boxShadow:`0 0 0 ${3/scale}px #31ccd426`,pointerEvents:'none'}}/>}
   </div>
   {highlight&&<div style={{position:'absolute',right:22,bottom:22,color:W,background:N,border:'1px solid #31ccd4',borderRadius:99,padding:'11px 22px',fontSize:23,fontWeight:700,opacity:ann,transform:`translateY(${(1-ann)*10}px)`}}>{highlight.label}</div>}
  </div>
 </div>;
}

function SceneContent({scene}:{scene:typeof data[number]}){
 const f=useCurrentFrame();
 return <AbsoluteFill>
  <Heading scene={scene}/>
  {scene.name==='products'&&<Camera name="products" tag="PAPELERÍA / TUS PRODUCTOS" from={{x:72,y:13,w:622,h:580}} to={{x:81,y:24,w:605,h:580}}/>}
  {scene.name==='cart'&&<Camera name="cart" tag="LOS PRODUCTOS YA ESTÁN CARGADOS" from={{x:695,y:15,w:616,h:580}} to={{x:695,y:49,w:616,h:580}}/>}
  {scene.name==='open'&&<Camera name="open" tag="DESDE EL DOCUMENTO REGISTRADO" from={{x:710,y:0,w:600,h:560}} to={{x:330,y:38,w:650,h:600}} highlight={{x:1061,y:8,w:111,h:35,label:'Convertir a FE',at:5}}/>}
  {scene.name==='convert'&&<Camera name="convert" tag="CONVERSIÓN EN FACTUS SANDBOX" from={{x:0,y:0,w:630,h:600}} to={{x:0,y:155,w:630,h:600}}/>}
  {scene.name==='accepted'&&<Camera name="accepted" tag="LA MISMA VENTA / DOCUMENTOS VINCULADOS" from={{x:75,y:305,w:760,h:710}} to={{x:72,y:333,w:730,h:680}} highlight={{x:76,y:441,w:355,h:38,label:'Factura electrónica aceptada · Sandbox',at:8}}/>}
  {scene.name==='end'&&<div style={{position:'absolute',left:48,top:530,width:984,height:974,borderRadius:28,overflow:'hidden',border:'1px solid #35606b',boxShadow:'0 24px 80px #0006'}}>
    <div style={{position:'absolute',inset:'0 0 auto',height:710,overflow:'hidden'}}><Img src={staticFile('hero.png')} style={{position:'absolute',width:1050,left:-28,top:-420,transform:`scale(${lerp(f,0,114,1,1.035)})`,transformOrigin:'50% 70%'}}/></div>
    <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,#051828 0%,#051828 28%,transparent 58%)'}}/>
    <div style={{position:'absolute',top:27,left:28,fontSize:20,color:W,background:'#051828cc',padding:'8px 16px',borderRadius:30}}>Escena ilustrativa · interfaz QA</div>
    <div style={{position:'absolute',left:44,right:44,bottom:52,height:110,borderRadius:60,background:C,color:N,fontSize:53,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:28,transform:`translateY(${lerp(f,0,15,40,0)}px)`,opacity:lerp(f,0,12,0,1)}}>Escríbenos DEMO <span style={{fontSize:62,fontWeight:400}}>↗</span></div>
  </div>}
 </AbsoluteFill>;
}

export function Pilot(){
 const [fontHandle]=useState(()=>delayRender('Loading local Inter fonts'));
 useEffect(()=>{Promise.all([document.fonts.load('700 32px Inter'),document.fonts.load('400 32px Inter')]).then(()=>continueRender(fontHandle)).catch(cancelRender);},[fontHandle]);
 const f=useCurrentFrame();
 const caption=captions.find(c=>f>=c[0]&&f<c[1]);
 return <AbsoluteFill style={{background:N,color:W,fontFamily:'Inter',overflow:'hidden'}}>
  <style>{`@font-face{font-family:Inter;src:url('${staticFile('Inter-Regular.ttf')}') format('truetype');font-weight:400} @font-face{font-family:Inter;src:url('${staticFile('Inter-Bold.ttf')}') format('truetype');font-weight:700} *{box-sizing:border-box}`}</style>
  <AbsoluteFill style={{background:`radial-gradient(ellipse at ${lerp(f,0,660,14,80)}% 51%,#05687735,transparent 68%)`}}/>
  <div style={{position:'absolute',top:67,left:64,width:340}}><Img src={staticFile('logo.png')} style={{width:'100%'}}/></div>
  <div style={{position:'absolute',top:83,right:64,fontSize:21,fontWeight:700,letterSpacing:1,color:C,padding:'12px 20px',border:'1px solid #2c6470',borderRadius:32}}>DEMO · SANDBOX</div>
  {data.map(s=><Sequence key={s.name} from={s.start} durationInFrames={s.end-s.start} name={s.name}><SceneContent scene={s}/></Sequence>)}
  <div style={{position:'absolute',left:64,right:64,top:1541,height:7,display:'flex',gap:11}}>
   {data.slice(0,5).map((s,i)=><div key={i} style={{height:4,flex:1,background:'#21434e',overflow:'hidden',borderRadius:3}}><div style={{height:'100%',width:`${interpolate(f,[s.start,s.end],[0,100],clamp)}%`,background:C}}/></div>)}
  </div>
  {caption&&<div style={{position:'absolute',left:62,right:62,top:1580,textAlign:'center',fontSize:41,lineHeight:1.3,fontWeight:700,letterSpacing:-.7,opacity:lerp(f,caption[0],caption[0]+4,0,1),transform:`translateY(${lerp(f,caption[0],caption[0]+5,9,0)}px)`}}>{caption[2].map((line,i)=><div key={line} style={{color:i===caption[2].length-1?C:W}}>{line}</div>)}</div>}
  <div style={{position:'absolute',left:64,right:64,top:1746,fontSize:25,lineHeight:1.42,color:'#cadce2'}}>
   Requiere plan con electrónica y configuración fiscal.<br/>El documento interno no sustituye la factura exigida.
  </div>
  <div style={{position:'absolute',left:64,right:64,top:1840,fontSize:21,lineHeight:1.45,color:'#8eacb7'}}>Datos QA · Secuencia editada para demostración<br/>Música: Chill Wave · Kevin MacLeod · CC BY 4.0</div>
 </AbsoluteFill>;
}
