/* VENUE Editorial — Tweaks island */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": ["#FF6A2C"],
  "marquee": "on",
  "displayWeight": "800"
}/*EDITMODE-END*/;

function hexA(hex,a){const h=hex.replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}

function VenueTweaks(){
  let _init=TWEAK_DEFAULTS;
  try{const s=localStorage.getItem('venue-theme');if(s)_init={...TWEAK_DEFAULTS,theme:s};}catch(e){}
  const [t,setTweak]=useTweaks(_init);
  React.useEffect(()=>{
    const r=document.documentElement;
    r.dataset.theme=t.theme;
    try{localStorage.setItem('venue-theme',t.theme);}catch(e){}
    const a=t.accent[0];
    r.style.setProperty('--accent',a);
    r.style.setProperty('--accent-soft',hexA(a,0.12));
    // darken for accent-ink
    const h=a.replace('#','');const n=parseInt(h,16);
    const dk='#'+[((n>>16)&255),((n>>8)&255),(n&255)].map(v=>Math.max(0,Math.round(v*0.82)).toString(16).padStart(2,'0')).join('');
    r.style.setProperty('--accent-ink',dk);
    document.querySelectorAll('.marquee-track,.logo-track').forEach(el=>{el.style.animationPlayState = t.marquee==='on'?'running':'paused';});
    document.querySelectorAll('.hero-display,.footer .f-brand,.statement h2,.cta-box h2').forEach(el=>el.style.fontWeight=t.displayWeight);
  },[t]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <TweakRadio label="Mode" value={t.theme} options={['light','dark']} onChange={v=>setTweak('theme',v)} />
      <TweakColor label="Accent" value={t.accent}
        options={[['#FF6A2C'],['#E2520F'],['#1F6FEB'],['#117A55'],['#16140F']]}
        onChange={v=>setTweak('accent',v)} />
      <TweakSection label="Motion & Type" />
      <TweakRadio label="Marquees" value={t.marquee} options={['on','off']} onChange={v=>setTweak('marquee',v)} />
      <TweakRadio label="Headline weight" value={t.displayWeight} options={['600','700','800']} onChange={v=>setTweak('displayWeight',v)} />
    </TweaksPanel>
  );
}
ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<VenueTweaks/>);
