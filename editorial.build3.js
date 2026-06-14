/* VENUE Editorial — interactions: nav, clock, kinetic rotator, reveals, feature list, marquee speed */
(function(){
  // nav stuck
  const nav=document.getElementById('nav');
  const onScroll=()=>nav&&nav.classList.toggle('stuck',window.scrollY>16);
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});

  // clock ICT (UTC+7)
  function tick(){const now=new Date();const ms=now.getTime()+(now.getTimezoneOffset()*60000)+(7*3600000);const d=new Date(ms);
    const el=document.getElementById('clock');if(el)el.textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
  tick();setInterval(tick,15000);

  // anim-ready flag (enables reveal hiding only when JS is live)
  requestAnimationFrame(()=>document.documentElement.classList.add('anim-ready'));

  // kinetic rotator — JS driven (robust: first word always visible if interval stalls)
  const rot=document.querySelector('.rotator');
  if(rot){
    const words=[...rot.querySelectorAll('.rot-word')];
    let i=0;
    const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(!reduce && words.length>1){
      setInterval(()=>{
        const cur=words[i];const next=words[(i+1)%words.length];
        cur.classList.add('is-leaving');cur.classList.remove('is-active');
        next.classList.remove('is-leaving');next.classList.add('is-active');
        const done=cur;setTimeout(()=>done.classList.remove('is-leaving'),600);
        i=(i+1)%words.length;
      },2200);
    }
  }

  // reveal — true scroll-triggered: each element animates in as it enters the viewport
  const revealEls=[...document.querySelectorAll('.reveal, .reveal-stagger')];
  const show=el=>el.classList.add('in');
  // primary: IntersectionObserver (fires exactly when an element scrolls into view)
  let io=null;
  if('IntersectionObserver' in window){
    io=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ show(e.target); io.unobserve(e.target); } });
    },{threshold:0, rootMargin:'0px 0px -12% 0px'});
    revealEls.forEach(el=>io.observe(el));
  }
  // backup: position check on scroll (covers any environment where IO is flaky)
  const byScroll=()=>{
    const vh=window.innerHeight||document.documentElement.clientHeight||800;
    for(let i=revealEls.length-1;i>=0;i--){
      const el=revealEls[i];
      if(el.classList.contains('in')){revealEls.splice(i,1);continue;}
      if(el.getBoundingClientRect().top < vh*0.88){show(el);if(io)io.unobserve(el);revealEls.splice(i,1);}
    }
  };
  window.addEventListener('scroll',byScroll,{passive:true});
  window.addEventListener('resize',byScroll);
  byScroll(); // reveal whatever is already in view on load (hero area)

  // key-features interactive list ↔ preview
  const items=[...document.querySelectorAll('.kf-item')];
  const frames=[...document.querySelectorAll('.kf-preview .frame')];
  function activate(n){
    items.forEach((it,k)=>it.classList.toggle('active',k===n));
    frames.forEach((f,k)=>f.classList.toggle('show',k===n));
  }
  items.forEach((it,n)=>{
    it.addEventListener('mouseenter',()=>activate(n));
    it.addEventListener('click',()=>activate(n));
    it.addEventListener('focus',()=>activate(n));
  });
  if(items.length)activate(0);

  // hero parallax (image drifts slower than scroll) — gives the page life
  const _reduceFX=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const heroImg=document.querySelector('.hero-media .hero-img');
  // BIG IDEA — scroll-linked zoom + word-spread (Tap. Find. Go. push out to the clip edges)
  const bigCard=document.querySelector('.bigidea-card');
  const bigGlow=document.querySelector('.bigidea-glow');
  const heroLines=[...document.querySelectorAll('.crosslines.hero-cl line')];
  const heroLineF=[0.013,-0.010,0.017];
  // scroll-driven frame-expand hero
  const heroFrameEl=document.querySelector('.hero-frame');
  const hfFrame=document.getElementById('hfFrame');
  const hfHead=document.getElementById('hfHead');
  const hfStage=document.querySelector('.hf-frame .device-stage');
  const hfScreen=document.querySelector('.hf-frame .dev-screen');
  const hfAnim=document.querySelector('.hf-frame .hf-anim');
  const hfSilk=document.getElementById('hfSilk')||document.getElementById('hfBends');
  const bigWords=document.querySelector('.bigidea-words');
  const bw=bigWords?[...bigWords.querySelectorAll('.bw')]:[];
  let bwCache=null;
  function measureBW(){
    if(!bigWords||!bw.length) return;
    bw.forEach(el=>{el.style.transform='none';});
    const stage=bigWords.getBoundingClientRect();
    const W=stage.width, pad=W*0.02;
    bwCache=bw.map(el=>{const r=el.getBoundingClientRect();return {el,c0:(r.left-stage.left)+r.width/2,w:r.width};});
    bwCache[0].cT=pad+bwCache[0].w/2;           // Tap → left edge
    bwCache[1].cT=W/2;                          // Find → centre
    bwCache[bwCache.length-1].cT=W-pad-bwCache[bwCache.length-1].w/2; // Go → right edge
  }
  // targets are recomputed on scroll; displayed values EASE toward them every frame
  // (buttery, slightly-laggy scroll feel — basestructures-style)
  let tgtP=0, curP=0, tgtY=0, curY=0;
  function computeTargets(){
    tgtY=window.scrollY;
    if(bigCard){
      const r=bigCard.getBoundingClientRect();
      const vh=window.innerHeight||document.documentElement.clientHeight||800;
      const cardCenter=r.top + r.height/2;
      let p=(vh - cardCenter)/(vh*0.5);
      tgtP=Math.max(0,Math.min(1,p));
    }
  }
  const LERP=0.055;            // lower = slower / more lag
  function applyFX(){
    curP += (tgtP-curP)*LERP;
    curY += (tgtY-curY)*0.09;
    if(heroImg) heroImg.style.transform=`translateY(${(curY*0.18).toFixed(1)}px) scale(1.06)`;
    if(heroLines.length && !_reduceFX){
      heroLines.forEach((ln,i)=>{const f=heroLineF[i]||0.013;ln.setAttribute('transform',`translate(${(curY*f).toFixed(2)} ${(curY*f*0.32).toFixed(2)})`);});
    }
    if(hfFrame && heroFrameEl){
      const total=heroFrameEl.offsetHeight-window.innerHeight;
      const sp=total>0?Math.max(0,Math.min(1,window.scrollY/total)):0;
      const e=1-Math.pow(1-sp,3);                 // ease-out
      const ix=(3-3*e).toFixed(2), iy=(9-9*e).toFixed(2), r=(28-28*e).toFixed(1);
      hfFrame.style.clipPath=`inset(${iy}vh ${ix}vw round ${r}px)`;
      hfFrame.style.setProperty('--scrim',(1-sp).toFixed(3));   // fade dark scrim → frame matches next section
      if(hfAnim) hfAnim.style.opacity=(0.5*(1-sp)).toFixed(3);
      if(hfStage){const off=((1-e)*30).toFixed(2);hfStage.style.transform=`translate(-50%, calc(-50% + ${off}vh))`;hfStage.style.setProperty('--glow',(0.34*(1-e)).toFixed(3));}
      if(hfScreen){const rx=(8*(1-e)).toFixed(2),ry=(-13*(1-e)).toFixed(2),sc=(1+e*0.34).toFixed(3);hfScreen.style.transform=`translate(-50%,-50%) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`;}
      if(hfSilk){hfSilk.style.transform=`scale(${(1+e*0.45).toFixed(3)})`;hfSilk.style.opacity=Math.max(0,1-sp*1.25).toFixed(3);}
      if(hfHead){hfHead.style.opacity=Math.max(0,1-sp*1.8).toFixed(3);hfHead.style.transform=`translateY(${(-sp*54).toFixed(1)}px)`;hfHead.style.pointerEvents=sp>0.35?'none':'';}
    }
    if(bigCard && !_reduceFX){
      bigCard.style.transform=`scale(${(0.66 + curP*0.34).toFixed(4)})`;
      if(bigGlow){bigGlow.style.opacity=(0.4+curP*0.4).toFixed(3);bigGlow.style.transform=`scale(${((0.66+curP*0.34)*1.12).toFixed(3)})`;}
      if(bwCache) bwCache.forEach(o=>{o.el.style.transform=`translateX(${((o.cT-o.c0)*curP).toFixed(1)}px)`;});
    }
    requestAnimationFrame(applyFX);
  }
  window.addEventListener('scroll',computeTargets,{passive:true});
  window.addEventListener('resize',()=>{measureBW();computeTargets();});
  measureBW();computeTargets();applyFX();
  // re-measure once webfonts settle (word widths change when Inter loads)
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>{measureBW();computeTargets();});}
  setTimeout(()=>{measureBW();computeTargets();},600);

  // ---------- loading intro ----------
  const reduceM=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const pl=document.getElementById('preloader');
  function finishLoad(){
    document.documentElement.classList.add('loaded');
    if(pl){pl.classList.add('done');setTimeout(()=>{pl.style.display='none';},1300);}
  }
  if(pl && !reduceM){
    const num=document.getElementById('plNum'),bar=document.getElementById('plBar');
    let p=0;
    const iv=setInterval(()=>{
      p=Math.min(100,p+Math.round(4+Math.random()*8));
      if(num)num.textContent=p;if(bar)bar.style.width=p+'%';
      if(p>=100){clearInterval(iv);setTimeout(finishLoad,520);}
    },140);
    setTimeout(()=>{clearInterval(iv);if(num)num.textContent=100;if(bar)bar.style.width='100%';finishLoad();},4600); // hard fallback
  }else{finishLoad();}

  // ---------- scroll progress ----------
  const prog=document.getElementById('scrollProg');
  if(prog){
    const upd=()=>{const h=document.documentElement;const max=h.scrollHeight-h.clientHeight;prog.style.transform='scaleX('+(max>0?Math.min(1,h.scrollTop/max):0)+')';};
    upd();window.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);
  }

  // ---------- magnetic buttons ----------
  if(!reduceM){
    document.querySelectorAll('.hero-cta-over .btn, .cta-box .btn').forEach(b=>{
      b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();const mx=e.clientX-r.left-r.width/2,my=e.clientY-r.top-r.height/2;b.style.transform='translate('+(mx*0.2)+'px,'+(my*0.3)+'px)';});
      b.addEventListener('pointerleave',()=>{b.style.transform='';});
    });
  }

  // ---------- smooth scroll (Lenis-style inertia for the whole page) ----------
  // Desktop / fine-pointer only; native scroll stays on touch. Respects reduced-motion.
  const finePointer = window.matchMedia('(pointer:fine)').matches;
  if(finePointer && !reduceM){
    const SMOOTH=0.075;          // lower = slower glide / more delay
    const WHEEL_MULT=0.9;        // wheel sensitivity
    let target=window.scrollY;
    let running=false;
    const maxScroll=()=>document.documentElement.scrollHeight-window.innerHeight;
    const clamp=()=>{target=Math.max(0,Math.min(maxScroll(),target));};
    document.documentElement.style.scrollBehavior='auto'; // we drive it ourselves
    function frame(){
      const cur=window.scrollY;
      const diff=target-cur;
      if(Math.abs(diff)<0.4){window.scrollTo(0,target);running=false;return;}
      window.scrollTo(0,cur+diff*SMOOTH);
      requestAnimationFrame(frame);
    }
    function kick(){ if(!running){running=true;requestAnimationFrame(frame);} }
    window.addEventListener('wheel',(e)=>{
      if(e.ctrlKey) return;               // let pinch-zoom through
      e.preventDefault();
      target+=e.deltaY*WHEEL_MULT; clamp(); kick();
    },{passive:false});
    // keyboard scrolling
    window.addEventListener('keydown',(e)=>{
      const tag=(e.target.tagName||'').toLowerCase();
      if(tag==='input'||tag==='textarea'||e.target.isContentEditable) return;
      const vh=window.innerHeight; let d=0;
      if(e.key==='ArrowDown')d=90; else if(e.key==='ArrowUp')d=-90;
      else if(e.key==='PageDown'||e.key===' ')d=vh*0.85; else if(e.key==='PageUp')d=-vh*0.85;
      else if(e.key==='Home'){target=0;clamp();kick();e.preventDefault();return;}
      else if(e.key==='End'){target=maxScroll();clamp();kick();e.preventDefault();return;}
      if(d){e.preventDefault();target+=d;clamp();kick();}
    });
    // in-page anchor links glide via the same system
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click',(e)=>{
        const id=a.getAttribute('href');
        if(id.length<2) return;
        const el=document.querySelector(id);
        if(!el) return;
        e.preventDefault();
        const navH=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||74;
        target=el.getBoundingClientRect().top+window.scrollY-navH; clamp(); kick();
      });
    });
    // keep target in sync if the user drags the scrollbar (only when idle)
    window.addEventListener('scroll',()=>{ if(!running) target=window.scrollY; },{passive:true});
    window.addEventListener('resize',clamp);
  }

  // icons
  if(window.lucide)lucide.createIcons();

  // header dark/light toggle (persists; Tweaks reads the same key)
  const themeToggle=document.getElementById('themeToggle');
  if(themeToggle){
    themeToggle.addEventListener('click',()=>{
      const next=document.documentElement.dataset.theme==='light'?'dark':'light';
      document.documentElement.dataset.theme=next;
      try{localStorage.setItem('venue-theme',next);}catch(e){}
      window.dispatchEvent(new CustomEvent('tweakschange'));
    });
  }

  // ensure the BIG IDEA clip plays (some browsers/iframes need an explicit play() call)
  const biVid=document.querySelector('.bigidea-video');
  [biVid, document.querySelector('.hero-vid')].forEach(v=>{
    if(!v) return;
    v.muted=true; v.playsInline=true;
    const tryPlay=()=>{const p=v.play();if(p&&p.catch)p.catch(()=>{});};
    tryPlay();
    v.addEventListener('canplay',tryPlay,{once:true});
    if('IntersectionObserver' in window){new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)tryPlay();})).observe(v);}
    ['pointerdown','keydown','scroll','touchstart'].forEach(ev=>window.addEventListener(ev,tryPlay,{once:true,passive:true}));
  });
})();
