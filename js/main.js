// ---------- Verdrahtung & Start ----------
$('go').onclick=()=>runAll(0);
$('srch').onclick=()=>runAll(1);

// Änderungen an General-Werten: neu rechnen und pro General speichern
['gmin','gmax','gacc','gfs','gsp','gfl','t_dmg','t_off','t_swift','t_heavy','t_hp','t_edm','t_eacc','t_boss','t_rec','t_sp']
  .forEach(i=>{$(i).oninput=$(i).onchange=()=>{cap();autosave()}});

// Generäle vergleichen
$('mga').onclick=()=>{document.querySelectorAll('#mgl input').forEach(i=>i.checked=true);mgCount()};
$('mgn').onclick=()=>{document.querySelectorAll('#mgl input').forEach(i=>i.checked=false);mgCount()};

// Karte
$('zp').onclick=()=>{zl=Math.min(4,zl+.5);$('mapin').style.width=zl*100+'%'};
$('zm').onclick=()=>{zl=Math.max(1,zl-.5);$('mapin').style.width=zl*100+'%'};
$('rq').onclick=()=>{rqMode=!rqMode;$('rq').textContent='Pflicht-Lager markieren: '+(rqMode?'AN (Karte anklicken)':'aus');$('rq').classList.toggle('on',rqMode)};

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
