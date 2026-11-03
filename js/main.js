// ---------- Verdrahtung & Start ----------
$('go').onclick=()=>runAll(0);
$('srch').onclick=()=>runAll(1);

// Generäle vergleichen
$('mga').onclick=()=>{document.querySelectorAll('#mgl input').forEach(i=>i.checked=true);mgCount()};
$('mgn').onclick=()=>{document.querySelectorAll('#mgl input').forEach(i=>i.checked=false);mgCount()};

// Karte
$('zp').onclick=()=>{zl=Math.min(4,zl+.5);fitMap()};
$('zm').onclick=()=>{zl=Math.max(1,zl-.5);fitMap()};

// Karte im Vollbild: die ganze Karte wird eingepasst, Esc oder erneuter Klick verkleinert wieder
const msec=$('sec-map'),side=document.querySelector('.side');
function fitMap(){
  const mi=$('mapin');
  if(!msec.classList.contains('fs')){mi.style.width=zl*100+'%';return}
  const w=$('mapw'),ar=cur.w/cur.h;
  mi.style.width=Math.max(200,Math.floor(Math.min(w.clientWidth-4,(w.clientHeight-4)*ar)))+'px';
}
function toggleFs(on){
  on=on===undefined?!msec.classList.contains('fs'):on;
  msec.classList.toggle('fs',on);side.classList.toggle('fs-on',on);
  document.documentElement.classList.toggle('noscroll',on);
  $('mfs').title=on?'Vollbild beenden (Esc)':'Karte im Vollbild (Esc zum Schließen)';
  zl=1;fitMap();drawMarks();
}
$('mfs').onclick=()=>toggleFs();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&msec.classList.contains('fs')&&!document.querySelector('dialog[open]'))toggleFs(false)});
window.addEventListener('resize',fitMap);
$('rq').onclick=()=>{selMode=!selMode;$('rq').textContent='Lager auswählen: '+(selMode?'AN (Karte anklicken)':'aus');$('rq').classList.toggle('on',selMode)};
$('selclr').onclick=()=>{selSet().clear();saveSel();updSel();drawMarks()};
$('showplan').onchange=drawMarks;

// Skill-Dialog
const skd=$('skdlg');
$('skbtn').onclick=()=>skd.showModal();
$('skx').onclick=()=>skd.close();
skd.addEventListener('click',e=>{if(e.target===skd)skd.close()});

// Rechtstexte (Impressum / Datenschutz / Haftungsausschluss)
const lgd=$('legal');
function openLegal(id){
  lgd.querySelectorAll('.lg').forEach(s=>s.hidden=s.id!=='lg-'+id);
  lgd.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.legal===id));
  if(!lgd.open)lgd.showModal();
  lgd.scrollTop=0;
}
document.querySelectorAll('[data-legal]').forEach(b=>b.onclick=()=>openLegal(b.dataset.legal));
$('lgx').onclick=()=>lgd.close();
lgd.addEventListener('click',e=>{if(e.target===lgd)lgd.close()});
$('yr').textContent=new Date().getFullYear();

genOpts();pickMap();pickGen();
