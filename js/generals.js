let SAVED=[];try{SAVED=JSON.parse(localStorage.getItem('nf_gens')||'[]')}catch(e){}
const persist=()=>{try{localStorage.setItem('nf_gens',JSON.stringify(SAVED))}catch(e){}};
const cmp=(a,b)=>a.n.localeCompare(b.n,'de');
const std=[...D.g].sort(cmp);
function genOpts(keep){const s=$('gen');s.innerHTML='';if(SAVED.length){const o=document.createElement('optgroup');o.label='Deine Generäle';[...SAVED].sort((a,b)=>a.name.localeCompare(b.name,'de')).forEach(g=>o.append(new Option(g.name,'S:'+g.name)));s.append(o)}
const o=document.createElement('optgroup');o.label='Standard-Generäle';std.forEach(g=>o.append(new Option(g.n,'G:'+g.u)));s.append(o);s.value=keep||('G:'+std[0].u);mgList()}
const base=v=>v.startsWith('S:')?D.g.find(g=>g.u==SAVED.find(x=>x.name==v.slice(2)).u):D.g.find(g=>g.u==v.slice(2));
const TF=['dmg','off','swift','heavy','hp','edm','boss','rec'];
const mgSel=()=>[...document.querySelectorAll('#mgl input:checked')].map(i=>i.value);
const mgCount=()=>{$('mgs').textContent='Mehrere Generäle vergleichen ('+mgSel().length+' gewählt)'};
function mgList(){const d=$('mgl');d.innerHTML='';const add=(v,t)=>{const l=document.createElement('label');l.className='mgi';l.innerHTML=`<input type="checkbox" value="${v}"> ${t}`;d.append(l);const i=l.querySelector('input');if(i)i.onchange=mgCount};
[...SAVED].sort((a,b)=>a.name.localeCompare(b.name,'de')).forEach(g=>add('S:'+g.name,'★ '+g.name+' (gespeichert)'));std.forEach(g=>add('G:'+g.u,g.n));mgCount()}

// ---------- Skillung & Werte pro General (automatisch gespeichert) ----------
let BUILDS={};try{BUILDS=JSON.parse(localStorage.getItem('nf_builds')||'{}')}catch(e){}
const persistB=()=>{try{localStorage.setItem('nf_builds',JSON.stringify(BUILDS))}catch(e){}};
let loading=false;

// gespeicherter Zustand eines Generals (Standard-General: eigene Skillung, falls vorhanden)
function gobj(v){
  const g=base(v);
  if(v.startsWith('S:'))return{...SAVED.find(x=>x.name==v.slice(2))};
  const b=BUILDS[g.u];
  return b?{...b}:{mn:g.mn,mx:g.mx,a:g.a,fs:!!g.fs,sp:!!g.sp,fl:!!g.fl,t:{eacc:100,...(g.t||{})},sk:{}};
}
// Momentaufnahme der Eingabefelder + Skillbaum
function snap(){
  const t={};TF.forEach(k=>t[k]=+$('t_'+k).value||0);
  t.eacc=+$('t_eacc').value;t.sp=$('t_sp').checked;
  return{mn:+$('gmin').value,mx:+$('gmax').value,a:+$('gacc').value,fs:$('gfs').checked,sp:$('gsp').checked,fl:$('gfl').checked,t,sk:{...sk}};
}
function autosave(){
  if(loading)return;
  const v=$('gen').value;
  if(v.startsWith('S:')){
    const i=SAVED.findIndex(x=>x.name==v.slice(2));
    if(i>=0){SAVED[i]={...SAVED[i],...snap()};persist()}
  }else{BUILDS[v.slice(2)]=snap();persistB()}
}
function fillFields(o){
  $('gmin').value=o.mn;$('gmax').value=o.mx;$('gacc').value=o.a;
  $('gfs').checked=!!o.fs;$('gsp').checked=!!o.sp;$('gfl').checked=!!o.fl;
  const t=o.t||{};
  TF.forEach(k=>$('t_'+k).value=t[k]||0);
  $('t_eacc').value=t.eacc??100;$('t_sp').checked=!!t.sp;
}
function pickGen(){
  loading=true;
  const v=$('gen').value,g=base(v),o=gobj(v);
  fillFields(o);
  sk={...(o.sk||{})};
  $('sname').value=v.startsWith('S:')?v.slice(2):'';
  $('skt').textContent=v.startsWith('S:')?v.slice(2):g.n;
  $('gnote').textContent=g.note||'Werte aus Wiki und Originaldaten, alles anpassbar.';
  loading=false;
  drawTree();
}
$('gen').onchange=pickGen;

// Werte (nicht Skills) auf Wiki-Standard zurücksetzen
$('rstv').onclick=()=>{
  const g=base($('gen').value);
  fillFields({mn:g.mn,mx:g.mx,a:g.a,fs:g.fs,sp:g.sp,fl:g.fl,t:{eacc:100,...(g.t||{})}});
  cap();autosave();
};
// Als eigene Variante unter neuem Namen speichern
$('save').onclick=()=>{
  const name=$('sname').value.trim();if(!name)return;
  const u=base($('gen').value).u,e={name,u,...snap()};
  const i=SAVED.findIndex(x=>x.name==name);
  if(i>=0)SAVED[i]=e;else SAVED.push(e);
  persist();genOpts('S:'+name);pickGen();
};
$('del').onclick=()=>{
  const v=$('gen').value;if(!v.startsWith('S:'))return;
  SAVED=SAVED.filter(x=>x.name!=v.slice(2));persist();genOpts();pickGen();
};

// ---------- Zustände für die Simulation ----------
function stateOf(v){
  const g=base(v),o=gobj(v);
  return{n:v.startsWith('S:')?v.slice(2):g.n,u:g.u,mn:o.mn,mx:o.mx,a:o.a,fs:!!o.fs,sp:!!o.sp,fl:!!o.fl,t:{eacc:100,...(o.t||{})},sk:{...(o.sk||{})},c:g.c,h:g.h};
}
function curState(){
  const v=$('gen').value,g=base(v),s=snap();
  return{n:v.startsWith('S:')?v.slice(2):g.n,u:g.u,...s,c:g.c,h:g.h};
}
