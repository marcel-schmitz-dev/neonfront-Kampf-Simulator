// ---------- Generäle: Auswahl, Fähigkeiten, Skillung (pro General gespeichert) ----------
const cmp=(a,b)=>a.n.localeCompare(b.n,'de');
const std=[...D.g].sort(cmp);
const base=v=>D.g.find(g=>g.u==v.slice(2));

function genOpts(keep){
  const s=$('gen');s.innerHTML='';
  std.forEach(g=>s.append(new Option(g.n,'G:'+g.u)));
  let last=null;try{last=localStorage.getItem('nf_lastgen')}catch(e){}
  s.value=keep||(last&&D.g.some(g=>'G:'+g.u==last)?last:'G:ResoluteGeneral');
  if(!s.value)s.value='G:'+std[0].u;
  mgList();
}

// ----- Mehrere Generäle vergleichen -----
const mgSel=()=>[...document.querySelectorAll('#mgl input:checked')].map(i=>i.value);
const mgCount=()=>{$('mgs').textContent='Mehrere Generäle vergleichen ('+mgSel().length+' gewählt)'};
function mgList(){
  const d=$('mgl');d.innerHTML='';
  std.forEach(g=>{
    const l=document.createElement('label');l.className='mgi';
    l.innerHTML=`<input type="checkbox" value="G:${g.u}"> ${g.n}`;
    d.append(l);l.querySelector('input').onchange=mgCount;
  });
  mgCount();
}

// ----- Skillung: pro General automatisch gespeichert -----
let BUILDS={};try{BUILDS=JSON.parse(localStorage.getItem('nf_builds')||'{}')}catch(e){}
const persistB=()=>{try{localStorage.setItem('nf_builds',JSON.stringify(BUILDS))}catch(e){}};
let loading=false;
function autosave(){
  if(loading)return;
  BUILDS[base($('gen').value).u]={sk:{...sk}};
  persistB();
}

// Alle Werte kommen aus den Generaldaten (D.g) + Fähigkeiten (ABIL) – nur die Skillung ist veränderbar.
function stateOf(v){
  const g=base(v),b=BUILDS[g.u];
  return{n:g.n,u:g.u,mn:g.mn,mx:g.mx,a:g.a,fs:!!g.fs,sp:!!g.sp,fl:!!g.fl,
    t:{eacc:100,...(g.t||{})},sk:{...((b&&b.sk)||{})},c:g.c,h:g.h};
}
function curState(){const st=stateOf($('gen').value);st.sk={...sk};return st}

// Fähigkeiten als lesbare Liste (aus ABIL bzw. den Grunddaten)
function traitLines(g){
  const ab=ABIL[g.u];if(ab&&ab.desc)return ab.desc;
  const t=g.t||{},L=[],s=v=>(v>0?'+':'')+v+' %';
  if(t.dmg)L.push('Alle Einheiten: '+s(t.dmg)+' Schaden');
  if(t.off)L.push('Angriffseinheiten: '+s(t.off)+' Schaden');
  if(t.swift)L.push('Schnelle Einheiten: '+s(t.swift)+' Schaden');
  if(t.heavy)L.push('Schwere Einheiten: '+s(t.heavy)+' Schaden');
  if(t.hp)L.push('Alle Einheiten: '+s(t.hp)+' Lebenspunkte');
  if(t.edm)L.push('Gegnerische Einheiten: '+s(t.edm)+' Schaden');
  if(t.eacc!=null&&t.eacc!==100)L.push('Gegnerische Trefferchance: '+t.eacc+' %');
  if(t.boss)L.push('Boss-Lebenspunkte: '+s(t.boss));
  if(t.rec)L.push('Rückgewinn: '+t.rec+' % der verlorenen Einheiten');
  if(t.sp)L.push('Alle Einheiten greifen mit Flächenschaden an');
  return L;
}
function renderTraits(){
  const g=base($('gen').value),L=traitLines(g);
  const note=(g.note||'').replace(/,?\s*bitte anpassen\.?/i,'.');
  $('gnote').innerHTML=(L.length?'<ul>'+L.map(x=>`<li>${x}</li>`).join('')+'</ul>':'<p class="note">Keine besonderen Fähigkeiten hinterlegt.</p>')
    +(note?`<p class="note">${note}</p>`:'');
}

function pickGen(){
  loading=true;
  const v=$('gen').value,g=base(v);
  sk={...((BUILDS[g.u]||{}).sk||{})};
  $('skt').textContent=g.n;
  try{localStorage.setItem('nf_lastgen',v)}catch(e){}
  renderTraits();
  loading=false;
  drawTree();
}
$('gen').onchange=pickGen;
