// ---------- Abenteuerkarte, Lager, Markierungen, Plan-Anzeige ----------
// Markierungen:  rosa Ring = Boss-/Anführer-Lager (nur Info)
//                goldener Ring + Haken = deine eigene Auswahl
let cur=null,sc=null,RES={},PLAN={};
let busy=-1,selMode=false,zl=1;
const SELS={};                                   // eigene Auswahl je Abenteuer (Index-Set)
try{const o=JSON.parse(localStorage.getItem('nf_sel')||'{}');for(const k in o)SELS[k]=new Set(o[k])}catch(e){}
const saveSel=()=>{try{const o={};for(const k in SELS)o[k]=[...SELS[k]];localStorage.setItem('nf_sel',JSON.stringify(o))}catch(e){}};
const SEL=new Proxy({},{get:(t,k)=>{const s=selSet();const v=s[k];return typeof v==='function'?v.bind(s):v}});
function selSet(){const k=cur.n;if(!SELS[k])SELS[k]=new Set();return SELS[k]}
const isBoss=c=>Object.keys(c.j).some(x=>/Boss|Leader/.test(x));
const lab=(c,i)=>/^\d{4,}$/.test(c.n)?String(i+1):c.n;
const gShort=n=>n.replace(/^General(in)?\s+/,'').replace(/[\s-]*General(in)?$/,'').replace(/,.*$/,'').slice(0,9);

function pickMap(){
  cur=D.m[$('map').value];RES={};PLAN={};busy=-1;
  $('mapimg').src=cur.img;drawMarks();pickCamp(0);updSel();fitMap();
}
function updSel(){$('selcnt').textContent=selSet().size}

function drawMarks(){
  document.querySelectorAll('.mk,.ptag').forEach(e=>e.remove());
  const sel=selSet(),showPlan=$('showplan').checked,isFs=$('sec-map').classList.contains('fs');
  cur.c.forEach((c,i)=>{
    if(c.x==null)return;
    const b=document.createElement('button'),r=RES[i],left=c.x/cur.w*100+'%',top=c.y/cur.h*100+'%';
    b.className='mk'+(i==sc?' sel':'')+(i===busy?' run':'')+(isBoss(c)?' boss':'')+(sel.has(i)?' pick':'');
    b.textContent=lab(c,i);b.style.left=left;b.style.top=top;
    b.style.setProperty('--c',r?(r.p>=80?'#39ff88':r.p>=40?'#ffd23f':'#ff4d6d'):'#00f0ff');
    b.title='Lager '+lab(c,i)+' (ID '+c.n+')'+(isBoss(c)?' – Boss-/Anführer-Lager':'')+(sel.has(i)?' – in deiner Auswahl':'')+(r?' – '+r.p.toFixed(0)+' %':'');
    b.onclick=()=>{if(selMode){sel.has(i)?sel.delete(i):sel.add(i);saveSel();updSel();drawMarks()}else pickCamp(i)};
    $('mapin').append(b);
    const pl=PLAN[i];
    if(showPlan&&pl){
      const t=document.createElement('div');t.className='ptag';t.style.left=left;t.style.top=top;
      t.style.setProperty('--c',pl.p>=80?'#39ff88':pl.p>=40?'#ffd23f':'#ff4d6d');
      const w=pl.plan.length;
      t.innerHTML=isFs?`<b>${gShort(pl.gn)}</b> ${pl.plan.map(abbr).join(' <i>›</i> ')}`:`<b>${gShort(pl.gn)}</b> ${abbr(pl.plan[0])}${w>1?` <i>+${w-1}</i>`:''}`;
      t.title=pl.gn+': '+pl.plan.map((a,k)=>'Angriff '+(k+1)+': '+abbr(a)).join(' | ');
      $('mapin').append(t);
    }
  });
}
function pickCamp(i){
  sc=i;const c=cur.c[i];
  $('enemy').innerHTML=`<b style="width:100%">Lager ${lab(c,i)}${isBoss(c)?' ★':''}</b>`+Object.entries(c.j).map(([id,n])=>`<span class="chip">${ico(id)}${n}× ${nm(id)} <small>${U[id].h} HP · ${Math.round(U[id].mn)}–${Math.round(U[id].mx)}</small></span>`).join('');
  drawMarks();
}
D.m.forEach((m,i)=>$('map').add(new Option(m.n,i)));
$('map').onchange=pickMap;
