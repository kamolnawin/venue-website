/* ============================================================
   VENUE — hero canvas: living wayfinding map background
   Variants: wayfinding (default) | aurora | constellation
   Reads document.documentElement.dataset: theme, motion, heroVariant
   ============================================================ */
(function(){
  const canvas = document.getElementById('heroCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W=0,H=0,dpr=1;
  let motion = 1;            // 0..1
  let variant = 'wayfinding';
  let theme = 'light';
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  const mouse = {x:.5,y:.5,tx:.5,ty:.5};

  const PAL = {
    light:{ line:'rgba(24,20,34,0.055)', block:'rgba(24,20,34,0.05)', edge:'rgba(24,20,34,0.07)',
            route:'#F58220', routeSoft:'#FBA23E', node:'#F58220', orb:'252,112,23', orbA:0.12 },
    dark :{ line:'rgba(255,255,255,0.045)', block:'rgba(255,255,255,0.03)', edge:'rgba(255,255,255,0.06)',
            route:'#FF8C42', routeSoft:'#FFB070', node:'#FF8C42', orb:'252,112,23', orbA:0.20 }
  };
  const p = ()=>PAL[theme]||PAL.light;

  let blocks=[], routes=[], orbs=[], nodes=[];

  function rng(seed){ let s=seed; return ()=> (s=Math.sin(s*9301+49297)*49297, (s-Math.floor(s))); }

  function build(){
    const r = rng(7);
    blocks=[]; routes=[]; orbs=[]; nodes=[];
    // soft drifting orbs (all variants) — premium glow
    const orbN = variant==='aurora'?6:4;
    for(let i=0;i<orbN;i++){
      orbs.push({
        x:r()*W, y:r()*H*0.9, r:(variant==='aurora'?280:200)+r()*180,
        dx:(r()-.5)*0.08, dy:(r()-.5)*0.06, ph:r()*Math.PI*2,
        a: (variant==='aurora'?0.16:p().orbA)*(0.6+r()*0.6)
      });
    }
    if(variant==='wayfinding'){
      // grid of map building blocks
      const cols=7, rowsN=4, gx=W/cols, gy=H/ (rowsN+0.5);
      for(let cx=0;cx<cols;cx++)for(let cy=0;cy<rowsN;cy++){
        if(r()<0.32) continue;
        const pad=gx*0.16;
        const w=gx*(0.55+r()*0.35), h=gy*(0.5+r()*0.4);
        blocks.push({x:cx*gx+pad+r()*pad, y:cy*gy+pad+r()*pad+H*0.02, w, h, depth:0.4+r()*0.6});
      }
      // wayfinding routes (polylines) across the map
      const mkRoute=(pts,seedPhase)=>({pts,len:pathLen(pts),phase:seedPhase,speed:0.10+r()*0.05});
      routes.push(mkRoute([[W*0.08,H*0.78],[W*0.30,H*0.62],[W*0.30,H*0.34],[W*0.55,H*0.26]], r()*10));
      routes.push(mkRoute([[W*0.92,H*0.30],[W*0.70,H*0.44],[W*0.70,H*0.70],[W*0.46,H*0.80]], r()*10));
      routes.push(mkRoute([[W*0.20,H*0.18],[W*0.46,H*0.20],[W*0.62,H*0.52],[W*0.86,H*0.62]], r()*10));
    }
    if(variant==='constellation'){
      const N=Math.round(34*(0.5+0.5));
      for(let i=0;i<N;i++) nodes.push({x:r()*W,y:r()*H,vx:(r()-.5)*0.18,vy:(r()-.5)*0.18,s:1.2+r()*1.8});
    }
  }
  function pathLen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
  function pointAt(pts,t){ // t 0..1 along polyline
    const L=pathLen(pts); let d=t*L;
    for(let i=1;i<pts.length;i++){const seg=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
      if(d<=seg){const k=d/seg;return [pts[i-1][0]+(pts[i][0]-pts[i-1][0])*k, pts[i-1][1]+(pts[i][1]-pts[i-1][1])*k];}d-=seg;}
    return pts[pts.length-1];
  }
  function rr(x,y,w,h,rad){ctx.beginPath();ctx.moveTo(x+rad,y);ctx.arcTo(x+w,y,x+w,y+h,rad);ctx.arcTo(x+w,y+h,x,y+h,rad);ctx.arcTo(x,y+h,x,y,rad);ctx.arcTo(x,y,x+w,y,rad);ctx.closePath();}

  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    const rect=canvas.getBoundingClientRect();
    W=rect.width; H=Math.max(rect.height,1);
    canvas.width=W*dpr; canvas.height=H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    build();
  }

  function readState(){
    const r=document.documentElement;
    theme = r.dataset.theme||'light';
    const m = parseFloat(r.dataset.motion); motion = isNaN(m)?1:m/100;
    const v = r.dataset.heroVariant||'wayfinding';
    if(v!==variant){variant=v;build();}
    render(performance.now()); // repaint immediately (covers paused-rAF contexts)
  }

  let t0=performance.now();
  function render(now){
    const time=(now-t0)/1000;
    const mm = reduce?0:motion;
    // ease mouse
    mouse.x+=(mouse.tx-mouse.x)*0.05; mouse.y+=(mouse.ty-mouse.y)*0.05;
    const px=(mouse.x-.5), py=(mouse.y-.5);
    const pal=p();
    ctx.clearRect(0,0,W,H);

    // orbs (soft glow)
    orbs.forEach(o=>{
      o.x+=o.dx*mm; o.y+=o.dy*mm;
      const wob=Math.sin(time*0.5+o.ph)*18*mm;
      const ox=o.x+px*40, oy=o.y+py*30+wob;
      if(o.x< -o.r) o.x=W+o.r; if(o.x>W+o.r) o.x=-o.r;
      if(o.y< -o.r) o.y=H+o.r; if(o.y>H+o.r) o.y=-o.r;
      const g=ctx.createRadialGradient(ox,oy,0,ox,oy,o.r);
      g.addColorStop(0,`rgba(${pal.orb},${o.a})`);
      g.addColorStop(1,`rgba(${pal.orb},0)`);
      ctx.fillStyle=g; ctx.beginPath();ctx.arc(ox,oy,o.r,0,7);ctx.fill();
    });

    if(variant==='wayfinding'){
      // faint grid
      ctx.strokeStyle=pal.line; ctx.lineWidth=1;
      const step=64;
      ctx.beginPath();
      for(let x=(px*16)%step;x<W;x+=step){ctx.moveTo(x,0);ctx.lineTo(x,H);}
      for(let y=(py*16)%step;y<H;y+=step){ctx.moveTo(0,y);ctx.lineTo(W,y);}
      ctx.stroke();
      // building blocks
      blocks.forEach(b=>{
        const ox=b.x+px*22*b.depth, oy=b.y+py*16*b.depth;
        ctx.fillStyle=pal.block; ctx.strokeStyle=pal.edge; ctx.lineWidth=1;
        rr(ox,oy,b.w,b.h,10); ctx.fill(); ctx.stroke();
      });
      // routes
      routes.forEach(rt=>{
        // base faint line
        ctx.strokeStyle=pal.line; ctx.lineWidth=6; ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath(); rt.pts.forEach((q,i)=>{const ox=q[0]+px*18,oy=q[1]+py*14; i?ctx.lineTo(ox,oy):ctx.moveTo(ox,oy);}); ctx.stroke();
        // glowing dashed orange
        ctx.save();
        ctx.strokeStyle=pal.route; ctx.lineWidth=3.2; ctx.setLineDash([16,14]);
        ctx.lineDashOffset = -time*60*mm - rt.phase*10;
        ctx.shadowColor=pal.route; ctx.shadowBlur=14;
        ctx.beginPath(); rt.pts.forEach((q,i)=>{const ox=q[0]+px*18,oy=q[1]+py*14; i?ctx.lineTo(ox,oy):ctx.moveTo(ox,oy);}); ctx.stroke();
        ctx.restore();
        // travelling pulse dot
        const tt=((time*rt.speed*mm + rt.phase)%1+1)%1;
        const pos=pointAt(rt.pts.map(q=>[q[0]+px*18,q[1]+py*14]),tt);
        ctx.save();ctx.shadowColor=pal.route;ctx.shadowBlur=18;ctx.fillStyle='#fff';
        ctx.beginPath();ctx.arc(pos[0],pos[1],4.5,0,7);ctx.fill();
        ctx.fillStyle=pal.route;ctx.beginPath();ctx.arc(pos[0],pos[1],2.4,0,7);ctx.fill();ctx.restore();
        // destination pin (last point)
        const end=rt.pts[rt.pts.length-1]; const ex=end[0]+px*18, ey=end[1]+py*14;
        const bob=Math.sin(time*2+rt.phase)*2*mm;
        ctx.save();ctx.translate(ex,ey-10+bob);
        ctx.fillStyle=pal.route;ctx.shadowColor=pal.route;ctx.shadowBlur=10;
        ctx.beginPath();ctx.arc(0,0,7,Math.PI*0.15,Math.PI*0.85,true);ctx.lineTo(0,12);ctx.closePath();ctx.fill();
        ctx.fillStyle=theme==='dark'?'#141418':'#fff';ctx.beginPath();ctx.arc(0,-1,2.6,0,7);ctx.fill();ctx.restore();
      });
    }

    if(variant==='constellation'){
      nodes.forEach(n=>{n.x+=n.vx*mm;n.y+=n.vy*mm;
        if(n.x<0||n.x>W)n.vx*=-1; if(n.y<0||n.y>H)n.vy*=-1;});
      // links
      for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j];const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<150){const al=(1-d/150)*0.5;ctx.strokeStyle=`rgba(${pal.orb},${al})`;ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(a.x+px*20,a.y+py*16);ctx.lineTo(b.x+px*20,b.y+py*16);ctx.stroke();}
      }
      nodes.forEach(n=>{const ox=n.x+px*20,oy=n.y+py*16;
        ctx.fillStyle=pal.node;ctx.shadowColor=pal.node;ctx.shadowBlur=10;
        ctx.beginPath();ctx.arc(ox,oy,n.s,0,7);ctx.fill();ctx.shadowBlur=0;});
    }
  }
  function frame(now){ render(now); requestAnimationFrame(frame); }

  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('pointermove',e=>{mouse.tx=e.clientX/window.innerWidth;mouse.ty=Math.min(e.clientY/window.innerHeight,1);},{passive:true});
  window.addEventListener('tweakschange',readState);
  // observe theme attribute changes
  new MutationObserver(readState).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-motion','data-hero-variant']});

  readState(); resize(); frame(performance.now());
})();
