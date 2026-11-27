window.QCAT=[{id:'form',name:'Form',features:[{id:'shape',label:'Shape',hint:'geometric vs organic shapes, clarity of silhouettes'},{id:'line',label:'Line quality',hint:'contour, direction, weight, expressiveness of lines'},{id:'volume',label:'Volume & mass',hint:'three-dimensional solidity of objects and figures'},{id:'space',label:'Positive & negative space',hint:'balance between filled and empty areas'}]},
{id:'colour',name:'Colour',features:[{id:'hue',label:'Hue palette',hint:'dominant colours and their range'},{id:'value',label:'Value & tonal range',hint:'light-dark range and contrast'},{id:'saturation',label:'Saturation & intensity',hint:'vividness vs muted tones'},{id:'temperature',label:'Colour temperature',hint:'warm vs cool and how they interact'},{id:'harmony',label:'Colour harmony',hint:'complementary, analogous, triadic etc.'}]},
{id:'depth',name:'Depth perception',features:[{id:'overlap',label:'Overlapping',hint:'objects covering others to imply distance'},{id:'sizegrad',label:'Size gradient',hint:'diminishing size with distance'},{id:'perspective',label:'Linear perspective',hint:'converging lines, vanishing points'},{id:'atmos',label:'Atmospheric perspective',hint:'haze, lower contrast and cooler tone in the distance'},{id:'texture',label:'Texture gradient',hint:'detail and texture fading with distance'},{id:'shading',label:'Light & shading',hint:'chiaroscuro, cast shadows, modelling of form'}]},
{id:'design',name:'Design basics',features:[{id:'balance',label:'Balance',hint:'symmetrical or asymmetrical visual weight'},{id:'contrast',label:'Contrast',hint:'tension between opposing elements'},{id:'emphasis',label:'Emphasis & focal point',hint:'where the eye lands first'},{id:'rhythm',label:'Rhythm & repetition',hint:'repeated elements creating beat'},{id:'proportion',label:'Proportion & scale',hint:'size relationships between parts'},{id:'movement',label:'Movement',hint:'how the eye is led through the work'},{id:'unity',label:'Unity',hint:'how well all parts feel like one whole'}]}];
// Quick mode: measures the image pixels in the browser. No AI, no key. Approximate.
window.quickAnalyse=src=>new Promise((ok,no)=>{const im=new Image();im.onerror=()=>no(new Error('Image load failed'));im.onload=()=>{
const W=96,H=Math.max(24,Math.round(96*im.height/im.width)),N=W*H,cv=document.createElement('canvas');cv.width=W;cv.height=H;const cx=cv.getContext('2d');cx.drawImage(im,0,0,W,H);const d=cx.getImageData(0,0,W,H).data;
const L=new Float32Array(N),S=new Float32Array(N),Hu=new Float32Array(N);
for(let i=0;i<N;i++){const r=d[i*4]/255,g=d[i*4+1]/255,b=d[i*4+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),df=mx-mn;L[i]=.299*r+.587*g+.114*b;S[i]=mx?df/mx:0;let h=0;if(df){h=mx===r?((g-b)/df)%6:mx===g?(b-r)/df+2:(r-g)/df+4;h*=60;if(h<0)h+=360}Hu[i]=h}
const gm=new Float32Array(N),an=new Float32Array(N);let gs=0,ec=0,soft=0,low=0,dg=0,fl=0;
for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,gx=L[i+1]-L[i-1],gy=L[i+W]-L[i-W],m=Math.hypot(gx,gy);gm[i]=m;an[i]=Math.atan2(gy,gx);gs+=m;if(m>.08){ec++;const a=Math.abs(Math.atan2(Math.abs(gy),Math.abs(gx)));if(a>.35&&a<1.2)dg++}if(m>.01&&m<.06)soft++;if(m<.004)fl++;if(m<.02)low++}
const M=(W-2)*(H-2),fr=fl/M,mG=gs/M,e=ec/M,sf=soft/M,lf=low/M,dgs=ec?dg/ec:0;
let hb=new Array(12).fill(0),tot=0,wm=0,cl=0,sS=0,sL=0;for(let i=0;i<N;i++){sS+=S[i];sL+=L[i];if(S[i]>.15){hb[Math.floor(Hu[i]/30)%12]+=S[i];tot+=S[i];const h=Hu[i];if(h<70||h>=300)wm++;else if(h>=150&&h<270)cl++}}
const mS=sS/N,mL=sL/N;let vL=0;for(let i=0;i<N;i++)vL+=(L[i]-mL)**2;const sd=Math.sqrt(vL/N);
const occ=hb.filter(v=>tot&&v/tot>.04).length,srt=[...hb].sort((a,b)=>b-a),top2=tot?(srt[0]+srt[1])/tot:1;
const ls=Float32Array.from(L).sort(),p5=ls[Math.floor(N*.05)],p95=ls[Math.floor(N*.95)];
// 8x8 block saliency
const B=8,bs=[];let sx=0,sy=0,st=0,lw=0,rw=0,tg=0,bg=0,tS=0,bS=0,tl=[],bl=[];
for(let by=0;by<B;by++)for(let bx=0;bx<B;bx++){let a=0,n=0;for(let y=Math.max(1,Math.floor(by*H/B));y<Math.min(H-1,Math.floor((by+1)*H/B));y++)for(let x=Math.max(1,Math.floor(bx*W/B));x<Math.min(W-1,Math.floor((bx+1)*W/B));x++){a+=gm[y*W+x]+Math.abs(L[y*W+x]-mL)*.3;n++}a=n?a/n:0;bs.push(a);sx+=a*(bx+.5)/B;sy+=a*(by+.5)/B;st+=a;if(bx<B/2)lw+=a;else rw+=a;}
for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(y<H/2){tg+=gm[i];tS+=S[i];tl.push(L[i])}else{bg+=gm[i];bS+=S[i];bl.push(L[i])}}
const sdv=a=>{const m=a.reduce((p,c)=>p+c,0)/a.length;return Math.sqrt(a.reduce((p,c)=>p+(c-m)**2,0)/a.length)};
const ratio=(bg+1e-6)/(tg+1e-6),cx0=st?sx/st:.5,cy0=st?sy/st:.5,bal=1-Math.abs(lw-rw)/(lw+rw+1e-6);
const sal=Math.max(...bs)/(st/64+1e-6);
let c2=0,s2=0,ne=0;for(let i=0;i<N;i++)if(gm[i]>.05){c2+=Math.cos(2*an[i]);s2+=Math.sin(2*an[i]);ne++}const coh=ne?Math.hypot(c2,s2)/ne:0;
const col=new Float32Array(W);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)col[x]+=gm[y*W+x];const cm=col.reduce((a,b)=>a+b,0)/W;let ac=0;for(let lag=4;lag<W/2;lag++){let n=0,dn=0,d2=0;for(let x=1;x<W-1-lag;x++){n+=(col[x]-cm)*(col[x+lag]-cm);dn+=(col[x]-cm)**2;d2+=(col[x+lag]-cm)**2}const v=n/(Math.sqrt(dn*d2)+1e-9);if(v>ac)ac=v}
const th=[1/3,2/3];let md=9;th.forEach(a=>th.forEach(b=>md=Math.min(md,Math.hypot(cx0-a,cy0-b))));
const k=v=>Math.max(0,Math.min(10,v)),tri=(v,c,w)=>k(10*(1-Math.abs(v-c)/w)),r=v=>Math.round(k(v)*10)/10,pc=v=>Math.round(v*100)+'%';
const wS=tot?wm/(wm+cl+1e-6):.5,cS=1-wS,tmp=3+.7*(tot?Math.min(wS,cS)/Math.max(wS,cS,1e-6)*10:3);
const CI=Math.max(0,Math.min(1,.4*Math.min(1,sf*2.2)+.3*(1-Math.min(1,fr*1.5))+.2*(1-Math.min(1,Math.abs(mS-.3)/.3))+.1*(1-Math.min(1,mG/.1))));
const F={
shape:[3+.7*tri(e,.07,.2),`Strong edges cover ${pc(e)} of the image; shapes are ${e>.2?'busy and fragmented':e<.04?'soft and diffuse':'reasonably defined'}.`],
line:[tri(mG,.05,.07),`Average edge strength is ${mG.toFixed(3)}, so linework reads as ${mG>.07?'bold':mG>.035?'moderate':'delicate or blended'}.`],
volume:[sf*14*(1-.9*fr),`${pc(sf)} of the surface has soft tonal gradients, which ${sf>.4?'suggests rounded, modelled forms':'suggests flatter, more graphic forms'}.`],
space:[tri(lf,.5,.5),`${pc(lf)} of the canvas is calm, low-detail area, ${lf>.7?'leaving lots of open space':lf<.3?'so it is densely filled':'a healthy balance of filled and open space'}.`],
hue:[tri(occ,5,8),`${occ} of 12 hue families are present; a focused palette of about 5-6 reads as most refined.`],
value:[(p95-p5)*11,`Tonal range from dark to light spans ${pc(p95-p5)} of the scale.`],
saturation:[tri(mS,.3,.35),`Average saturation is ${pc(mS)}, so colours feel ${mS>.5?'vivid':mS>.25?'balanced':'muted'}.`],
temperature:[tmp,`${pc(wS)} warm vs ${pc(cS)} cool among coloured areas.`],
harmony:[top2*11,`The two strongest hue families hold ${pc(top2)} of the colour, ${top2>.7?'an analogous, tightly harmonised palette':'a wide, contrasting palette'}.`],
overlap:[2+e*18+sf*6,`Edge-junction density is ${pc(e)}; more overlaps and layering usually raise this.`],
sizegrad:[5+Math.max(-2,Math.min(2,(ratio-1)*3)),`Detail in the lower half is ${ratio.toFixed(1)}× the upper half${ratio>1.2?', consistent with a receding background':''}.`],
perspective:[3+dgs*10,`${pc(dgs)} of strong edges run diagonally, ${dgs>.4?'hinting at converging lines':'with little sign of converging lines'}.`],
atmos:[Math.max(3,Math.min(7,4+(bS/(N/2)-tS/(N/2))*20+(sdv(bl)-sdv(tl))*20)),`Upper half is ${tS>bS?'more':'less'} saturated and ${sdv(tl)>sdv(bl)?'higher':'lower'} in contrast than the lower half.`],
texture:[(4+(ratio-1)*3)*(1-.7*fr)-fr*2,`Texture detail changes top to bottom by a factor of ${ratio.toFixed(1)}.`],
shading:[((p95-p5)*6+sf*8)*(1-.9*fr),`Tonal range plus soft gradients indicate ${(p95-p5)*6+sf*8>6.5?'convincing light and shadow modelling':'modest light and shadow modelling'}.`],
balance:[bal*10,`Left and right visual weight differ by ${pc(1-bal)}.`],
contrast:[sd*28,`Brightness varies with a spread of ${pc(sd)}.`],
emphasis:[3+(sal-1)*2,`The busiest area is ${sal.toFixed(1)}× the average, so the focal point is ${sal>2.5?'clear':'diffuse'}.`],
rhythm:[ac*12,`Repetition in vertical detail scores ${ac.toFixed(2)} (1 = strongly periodic).`],
proportion:[10-md*25,`The main area of interest sits ${pc(md)} of the frame away from a rule-of-thirds point.`],
movement:[coh*14,`Edge directions are ${coh>.4?'strongly aligned, leading the eye along a path':'varied, so movement is scattered'} (coherence ${coh.toFixed(2)}).`],
unity:[top2*7+(1-sd*1.5)*3,`Colour concentration and tonal evenness combine to ${top2>.6&&sd<.25?'a unified whole':'a varied, less uniform whole'}.`]};
const features={};Object.keys(F).forEach(id=>features[id]={score:r(5+(F[id][0]-5)*1.8+(CI-.5)*28),note:F[id][1]});
ok({ci:CI,title:'Untitled painting',style:'Pixel-based estimate',medium:'Digital image',summary:'Scored from measurable colour, contrast and edge statistics in your browser. It is not an expert reading, so treat it as a first draft.',features})};im.src=src});
