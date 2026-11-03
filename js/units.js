// ---------- Einheiten: Einsatz, Auffüllen, Leeren, Schutz ----------
const lock={},ROWS={};
const IC={
  fill:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14M12 20V8M6 13l6-6 6 6"/></svg>',
  zero:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20h14M12 4v12M6 11l6 6 6-6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M6.3 6.3l11.4 11.4"/></svg>'
};
function mkBtn(svg,title,fn){
  const b=document.createElement('button');
  b.type='button';b.className='ub';b.innerHTML=svg;b.title=title;b.onclick=fn;return b;
}
function setLock(id,v){
  lock[id]=!!v;
  ROWS[id].row.classList.toggle('lk',!!v);
  ROWS[id].lk.classList.toggle('on',!!v);
}
D.p.forEach(id=>{
  const row=document.createElement('div');row.className='urow';
  row.innerHTML=`<div class="un">${ico(id)}<span>${nm(id)}</span></div>`;
  const inp=document.createElement('input');
  inp.type='number';inp.min=0;inp.value=0;inp.id='u_'+id;inp.oninput=cap;
  const fill=mkBtn(IC.fill,'Auf die maximale Kapazität des Generals auffüllen',()=>{inp.value=capMax();cap()});
  const zero=mkBtn(IC.zero,'Auf 0 setzen',()=>{inp.value=0;cap()});
  const lk=mkBtn(IC.lock,'Schützen: Einheit kämpft mit, darf aber keine Verluste haben',()=>{setLock(id,!lock[id]);cap()});
  row.append(inp,fill,zero,lk);
  ROWS[id]={row,lk};
  $('units').append(row);
});
$('uclear').onclick=()=>{D.p.forEach(id=>$('u_'+id).value=0);cap()};
// Nur Schwertkämpfer, Berittene Schwertkämpfer und Ritter dürfen fallen – alle anderen sind geschützt
const TANKS=['Swordsman','MountedSwordsman','Knight'];
$('tank').onclick=()=>{D.p.forEach(id=>setLock(id,!TANKS.includes(id)));cap()};

const capMax=st=>{st=st||curState();return st.c+svK(st.sk,'cap')};
function cap(){
  let t=0;D.p.forEach(id=>{t+=+$('u_'+id).value||0});
  const c=capMax();
  $('capbar').style.width=Math.min(100,t/c*100)+'%';
  $('captxt').innerHTML=`Einsatz <b>${t}</b> / ${c}`+(t>c?` <em>· mehr als die Kapazität – die Einheitensuche wählt daraus die beste Armee</em>`:'');
  effp();
}

// ---------- Kurzübersicht + berechnete Werte (nur Anzeige, alles automatisch) ----------
function effDetail(st,M,mn,mx,a){
  const spc=st.sp||M.all?100:M.pJ*100;
  const r=[['Schaden',Math.round(mn)+'–'+Math.round(mx)],['Treffer',a+' %'],['Kapazität',capMax(st)],['Lebenspunkte',st.h],
    ['Angriffe/Runde',M.lt?2:1],['Initiative',st.fs?'Erstschlag':'Normal'],['Splash',spc?spc.toFixed(0)+' %':'–'],['Flankieren',st.fl?'Ja':'Nein']];
  if(M.fS)r.push(['Schnelle',`+${M.fS} Schaden, Splash ${Math.round(M.pS*100)} %`]);
  if(M.fE)r.push(['Elitesoldaten',`+${M.fE} Schaden, Splash ${Math.round(M.pE*100)} %`]);
  if(M.fH)r.push(['Schwere','+'+M.fH+' Schaden']);
  if(M.fR)r.push(['Bogenschützen','Max +'+M.fR]);
  if(M.sMn)r.push(['Langbogen/Scharfsch.',`Min +${M.sMn} %, Max +${M.sMx} %`]);
  if(M.bf)r.push(['Kampfrausch','+'+M.bf+' % pro Runde']);
  if(M.boss)r.push(['Boss-HP',M.boss+' %']);
  if(M.rec)r.push(['Rückgewinn',M.rec+' %']);
  $('eff').innerHTML=r.map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
}
function effp(){
  const st=curState(),M=mods(st),f=1+M.dmg/100,mn=st.mn*f+M.fJ,mx=st.mx*f+M.fJ,a=Math.min(100,st.a+M.acc);
  $('gsum').innerHTML=$('dsum').innerHTML=
    `<span>Kapazität<b>${capMax(st)}</b></span><span>Schaden<b>${Math.round(mn)}–${Math.round(mx)}</b></span><span>Treffer<b>${a} %</b></span><span>Skills<b>${spent(()=>1)}/21</b></span>`;
  effDetail(st,M,mn,mx,a);
}
