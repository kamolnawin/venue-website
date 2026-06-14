/* VENUE — Tweaks island. Applies tokens to <html>, broadcasts to the hero canvas. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": ["#F58220", "#FC7017", "#FFA64D"],
  "hero": "wayfinding",
  "motion": 100,
  "displayFont": "Fredoka"
}/*EDITMODE-END*/;

function hexA(hex,a){
  const h=hex.replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

function VenueTweaks(){
  const [t,setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(()=>{
    const r=document.documentElement;
    r.dataset.theme = t.theme;
    r.dataset.motion = String(t.motion);
    r.dataset.heroVariant = t.hero;
    const [a0,a1,a2]=t.accent;
    r.style.setProperty('--accent',a0);
    r.style.setProperty('--accent-deep',a1);
    r.style.setProperty('--accent-light',a2);
    r.style.setProperty('--accent-grad',`linear-gradient(135deg, ${a2} 0%, ${a1} 100%)`);
    r.style.setProperty('--accent-soft',hexA(a0,0.10));
    r.style.setProperty('--accent-ring',hexA(a0,0.30));
    r.style.setProperty('--ff-display',`'${t.displayFont}','IBM Plex Sans Thai',system-ui,sans-serif`);
    window.dispatchEvent(new CustomEvent('tweakschange'));
  },[t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <TweakRadio label="Mode" value={t.theme} options={['light','dark']}
        onChange={v=>setTweak('theme',v)} />
      <TweakColor label="Accent" value={t.accent}
        options={[
          ['#F58220','#FC7017','#FFA64D'],
          ['#FF5A47','#E8412E','#FF8E80'],
          ['#2A7DE1','#1A5FBF','#6AA8F2'],
          ['#16A085','#0E8A72','#5AD3BE']
        ]}
        onChange={v=>setTweak('accent',v)} />

      <TweakSection label="Hero background" />
      <TweakRadio label="Style" value={t.hero}
        options={['wayfinding','aurora','constellation']}
        onChange={v=>setTweak('hero',v)} />
      <TweakSlider label="Motion" value={t.motion} min={0} max={100} step={10} unit="%"
        onChange={v=>setTweak('motion',v)} />

      <TweakSection label="Type" />
      <TweakSelect label="Display font" value={t.displayFont}
        options={['Fredoka','Poppins','Quicksand','Baloo 2','Inter']}
        onChange={v=>setTweak('displayFont',v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<VenueTweaks/>);
