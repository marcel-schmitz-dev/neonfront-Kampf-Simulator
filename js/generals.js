// ---------- Generäle: Auswahl, Fähigkeiten, Skillungen ----------
// Jeder Standard-General merkt sich automatisch seine Skillung (BUILDS).
// Zusätzlich können beliebig viele benannte Skillungen gespeichert werden (SAVED),
// auch mehrfach vom selben General – z. B. zum Testen verschiedener Varianten.
const cmp=(a,b)=>a.n.localeCompare(b.n,'de');
const std=[...D.g].sort(cmp);

let SAVED=[];try{SAVED=JSON.parse(localStorage.getItem('nf_gens')||'[]')}catch(e){}
const persist=()=>{try{localStorage.setItem('nf_gens',JSON.stringify(SAVED))}catch(e){}};
let BUILDS={};try{BUILDS=JSON.parse(localStorage.getItem('nf_builds')||'{}')}catch(e){}
const persistB=()=>{try{localStorage.setItem('nf_builds',JSON.stringify(BUILDS))}catch(e){}};

const isVar=v=>v.startsWith('S:');
const varOf=v=>SAVED.find(x=>x.name==v.slice(2));
const base=v=>D.g.find(g=>g.u==(isVar(v)?varOf(v).u:v.slice(2)));
const varLabel=x=>`${x.name} (${(D.g.find(g=>g.u==x.u)||{n:x.u}).n})`;

function genOpts(keep){
  const s=$('gen');s.innerHTML='';
  SAVED=SAVED.filter(x=>D.g.some(g=>g.u==x.u));
  if(SAVED.length){
    const o=document.createElement('optgroup');o.label='Deine Skillungen';
    [...SAVED].sort((a,b)=>a.name.localeCompare(b.name,'de')).forEach(x=>o.append(new Option('★ '+varLabel(x),'S:'+x.name)));
    s.append(o);
  }
  const o=document.createElement('optgroup');o.label='Generäle';
  std.forEach(g=>o.append(new Option(g.n,'G:'+g.u)));s.append(o);
  let last=null;try{last=localStorage.getItem('nf_lastgen')}catch(e){}
  s.value=keep||last||'G:ResoluteGeneral';
  if(!s.value)s.value='G:ResoluteGeneral';
  if(!s.value)s.value='G:'+std[0].u;
  mgList();
}

// ----- Mehrere Generäle / Skillungen vergleichen -----
const mgSel=()=>[...document.querySelectorAll('#mgl input:checked')].map(i=>i.value);
const mgCount=()=>{$('mgs').textContent='Mehrere Generäle vergleichen ('+mgSel().length+' gewählt)'};
function mgList(){
  const d=$('mgl'),keep=new Set(mgSel());d.innerHTML='';
  const add=(v,t)=>{
    const l=document.createElement('label');l.className='mgi';
    l.innerHTML=`<input type="checkbox" value="${v}"${keep.has(v)?' checked':''}> ${t}`;
    d.append(l);l.querySelector('input').onchange=mgCount;
  };
  [...SAVED].sort((a,b)=>a.name.localeCompare(b.name,'de')).forEach(x=>add('S:'+x.name,'★ '+varLabel(x)));
  std.forEach(g=>add('G:'+g.u,g.n));
  mgCount();
}

// ----- Skillung speichern -----
let loading=false;
function autosave(){
  if(loading)return;
  const v=$('gen').value;
  if(isVar(v)){const x=varOf(v);if(x){x.sk={...sk};persist()}}
  else{BUILDS[v.slice(2)]={sk:{...sk}};persistB()}
}
const skOf=v=>isVar(v)?{...((varOf(v)||{}).sk||{})}:{...((BUILDS[v.slice(2)]||{}).sk||{})};

// Alle Werte kommen aus den Generaldaten (D.g) + Fähigkeiten (ABIL) – nur die Skillung ist veränderbar.
function stateOf(v){
  const g=base(v),ab=ABIL[g.u]||{};
  return{n:isVar(v)?v.slice(2):g.n,u:g.u,mn:g.mn,mx:g.mx,a:g.a,fs:!!g.fs,ls:!!g.ls,sp:!!g.sp,fl:!!g.fl,
    t:{eacc:100,...(ab.t||g.t||{})},sk:skOf(v),c:g.c,h:g.h};
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
  sk=skOf(v);
  $('skt').textContent=isVar(v)?v.slice(2)+' ('+g.n+')':g.n;
  $('sname').value=isVar(v)?v.slice(2):'';
  $('del').disabled=!isVar(v);
  try{localStorage.setItem('nf_lastgen',v)}catch(e){}
  renderTraits();
  loading=false;
  drawTree();
}
$('gen').onchange=pickGen;

// Skillung unter eigenem Namen speichern (derselbe General darf mehrfach vorkommen)
$('save').onclick=()=>{
  const name=$('sname').value.trim();if(!name)return;
  const u=base($('gen').value).u,i=SAVED.findIndex(x=>x.name==name);
  if(i>=0)SAVED[i]={name,u,sk:{...sk}};else SAVED.push({name,u,sk:{...sk}});
  persist();genOpts('S:'+name);pickGen();
};
$('del').onclick=()=>{
  const v=$('gen').value;if(!isVar(v))return;
  if(!confirm('Skillung „'+v.slice(2)+'“ löschen?'))return;
  SAVED=SAVED.filter(x=>x.name!=v.slice(2));persist();genOpts();pickGen();
};
