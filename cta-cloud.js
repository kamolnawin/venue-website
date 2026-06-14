/* VENUE — CTA particle cloud (ponder-style dust), white + brand orange, mouse-repel.
   Dark canvas behind "Let's talk." ; keeps text legible via additive glow + page scrim. */
(function(){
  const box = document.querySelector('.cta-box');
  const canvas = document.getElementById('ctaCanvas');
  if(!box || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  let W=0,H=0,dpr=1,cx=0,cy=0,parts=[],raf=0,visible=true;
  const mouse={x:-9999,y:-9999,active:false};

  function accent(){ // read brand orange from CSS (so Tweaks accent changes carry through)
    const v=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#FF6A2C';
    const h=v.replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  let ORANGE=accent();

  function build(){
    const area=W*H;
    const N=Math.max(36,Math.min(190,Math.round(area/8200)));
    const R=Math.min(W,H)*0.42, cxL=W*0.5, cyL=H*0.5;
    parts=[];
    // soft haze blobs — big, faint, slow → reads as a dust cloud behind the sharp motes
    const hazeN=Math.max(5,Math.round(N*0.05));
    for(let i=0;i<hazeN;i++){
      const ang=Math.random()*Math.PI*2, rad=Math.pow(Math.random(),1.1)*R*0.8;
      parts.push({ang,rad,spin:(Math.random()*0.5+0.5)*0.0004*(Math.random()<0.5?-1:1),
        ox:0,oy:0,jx:Math.random()*6.28,jy:Math.random()*6.28,js:0.5+Math.random()*0.6,jr:7+Math.random()*12,
        size:18+Math.random()*30,a:0.025+Math.random()*0.04,orange:Math.random()<0.4});
    }
    for(let i=0;i<N;i++){
      // gaussian-ish radius bias → denser cloud near centre, sparse edges (clustered behind text)
      const t=Math.random(), rad=Math.pow(t,1.15)*R*(0.35+Math.random()*0.7);
      const ang=Math.random()*Math.PI*2;
      const orange=Math.random()<0.34;
      parts.push({
        ang, rad,
        spin:(Math.random()*0.5+0.5)*0.00072*(Math.random()<0.5?-1:1), // swirl (faster)
        ox:0, oy:0,                       // repel offset (decays)
        jx:Math.random()*Math.PI*2, jy:Math.random()*Math.PI*2,
        js:1.1+Math.random()*1.6,         // jitter speed (faster)
        jr:4+Math.random()*11,            // jitter radius (wider)
        size:orange?(0.9+Math.random()*2.1):(0.6+Math.random()*2.0),
        a:0.28+Math.random()*0.62,
        orange
      });
    }
    cx=cxL; cy=cyL;
  }

  function resize(){
    const r=canvas.getBoundingClientRect();   // canvas is CSS-sized taller/wider than the box
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=r.width||box.getBoundingClientRect().width; H=r.height||box.getBoundingClientRect().height;
    canvas.width=W*dpr; canvas.height=H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ORANGE=accent();
    build();
    drawStatic();   // always leave a painted frame so the cloud is never blank (covers paused rAF)
  }

  // soft fuzzy dot — radial gradient from solid centre to transparent edge (glow/bokeh look)
  function dot(x,y,r,col,a){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,`rgba(${col[0]},${col[1]},${col[2]},${a})`);
    g.addColorStop(0.5,`rgba(${col[0]},${col[1]},${col[2]},${a*0.45})`);
    g.addColorStop(1,`rgba(${col[0]},${col[1]},${col[2]},0)`);
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
  }

  function frame(t){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    const time=t*0.001;
    for(let i=0;i<parts.length;i++){
      const p=parts[i];
      p.ang+=p.spin;
      const jx=Math.cos(time*p.js+p.jx)*p.jr;
      const jy=Math.sin(time*p.js+p.jy)*p.jr;
      let x=cx+Math.cos(p.ang)*p.rad+jx;
      let y=cy+Math.sin(p.ang)*p.rad+jy;
      // mouse repel
      if(mouse.active){
        const dx=x-mouse.x, dy=y-mouse.y, d2=dx*dx+dy*dy, R=130;
        if(d2<R*R){const d=Math.sqrt(d2)||1, f=(1-d/R);p.ox+=(dx/d)*f*9;p.oy+=(dy/d)*f*9;}
      }
      p.ox*=0.90; p.oy*=0.90;       // offset eases back → scatter then settle
      x+=p.ox; y+=p.oy;
      const col=p.orange?ORANGE:[255,255,255];
      dot(x,y,p.size*2.6,col,p.a);   // *2.6 → fuzzy halo radius
    }
    ctx.globalCompositeOperation='source-over';
    if(visible) raf=requestAnimationFrame(frame);
  }

  function drawStatic(){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(const p of parts){
      const x=cx+Math.cos(p.ang)*p.rad, y=cy+Math.sin(p.ang)*p.rad;
      const col=p.orange?ORANGE:[255,255,255];
      dot(x,y,p.size*2.6,col,p.a);
    }
    ctx.globalCompositeOperation='source-over';
  }

  box.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;mouse.active=true;});
  box.addEventListener('pointerleave',()=>{mouse.active=false;mouse.x=-9999;mouse.y=-9999;});
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('tweakschange',()=>{ORANGE=accent();});

  resize();
  if(!reduce){
    // pause rAF when the CTA is offscreen (perf)
    if('IntersectionObserver' in window){
      new IntersectionObserver(es=>es.forEach(e=>{
        visible=e.isIntersecting;
        if(visible && !raf){raf=requestAnimationFrame(frame);}
        else if(!visible && raf){cancelAnimationFrame(raf);raf=0;}
      }),{threshold:0}).observe(box);
    }
    raf=requestAnimationFrame(frame);
  }
})();
