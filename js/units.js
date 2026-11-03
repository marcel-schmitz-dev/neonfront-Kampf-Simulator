// ---------- Einheiten: Einsatz, Auffüllen, Leeren, Schutz ----------
const lock={};
const IC={
  fill:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14M12 20V8M6 13l6-6 6 6"/></svg>',
  zero:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20h14M12 4v12M6 11l6 6 6-6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M6.3 6.3l11.4 11.4"/></svg>'
};
function mkBtn(svg,title,fn){
  const b=document.createElement('button');
  b.type='button';b.className='ub';b.innerHTML=svg;b.title=title;b.onclick=fn;return b;
}
D.p.forEach(id=>{
  const row=document.createElement('div');row.className='urow';
  row.innerHTML=`<div class="un">${ico(id)}<span>${nm(id)}</span></div>`;
  const inp=document.createElement('input');
  inp.type='number';inp.min=0;inp.value=0;inp.id='u_'+id;inp.oninput=cap;
  const fill=mkBtn(IC.fill,'Auf die maximale Kapazität des Generals auffüllen',()=>{inp.value=capMax();cap()});
  const zero=mkBtn(IC.zero,'Auf 0 setzen',()=>{inp.value=0;cap()});
  const lk=mkBtn(IC.lock,'Schützen: Einheit kämpft mit, darf aber keine Verluste haben',()=>{
    lock[id]=!lock[id];row.classList.toggle('lk',!!lock[id]);lk.classList.toggle('on',!!lock[id]);cap();
  });
  row.append(inp,fill,zero,lk);
  $('units').append(row);
});
$('uclear').onclick=()=>{D.p.forEach(id=>$('u_'+id).value=0);cap()};

const capMax=st=>{st=st||curState();return st.c+svK(st.sk,'cap')};
function cap(){
  let t=0;D.p.forEach(id=>{t+=+$('u_'+id).value||0});
  const c=capMax();
  $('capbar').style.width=Math.min(100,t/c*100)+'%';
  $('captxt').innerHTML=`Einsatz <b>${t}</b> / ${c}`+(t>c?` <em>· mehr als die Kapazität – die Einheitensuche wählt daraus die beste Armee</em>`:'');
  effp();
}

// ---------- Kurzübersicht + berechnete Werte ----------
function effDetail(){const M=mods(),f=1+M.dmg/100,mn=(+$('gmin').value)*f+M.fJ,mx=(+$('gmax').value)*f+M.fJ,a=Math.min(100,(+$('gacc').value)+M.acc),spc=$('gsp').checked||M.all?100:M.pJ*100;
const r=[['Schaden',Math.round(mn)+'–'+Math.round(mx)],['Treffer',a+' %'],['Kapazität',capMax()],['Lebenspunkte',base($('gen').value).h],['Angriffe/Runde',M.lt?2:1],['Initiative',$('gfs').checked?'Erstschlag':'Normal'],['Splash',spc?spc.toFixed(0)+' %':'–'],['Flankieren',$('gfl').checked?'Ja':'Nein']];
if(M.fS)r.push(['Schnelle',`+${M.fS} Schaden, Splash ${Math.round(M.pS*100)} %`]);if(M.fE)r.push(['Elitesoldaten',`+${M.fE} Schaden, Splash ${Math.round(M.pE*100)} %`]);if(M.fH)r.push(['Schwere','+'+M.fH+' Schaden']);if(M.fR)r.push(['Bogenschützen','Max +'+M.fR]);if(M.sMn)r.push(['Langbogen/Scharfsch.',`Min +${M.sMn} %, Max +${M.sMx} %`]);if(M.bf)r.push(['Battle Frenzy','+'+M.bf+' % pro Runde']);if(M.boss)r.push(['Boss-HP',M.boss+' %']);if(M.rec)r.push(['Rückgewinn',M.rec+' %']);
$('eff').innerHTML=r.map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}
function effp(){
  const M=mods(),f=1+M.dmg/100,mn=(+$('gmin').value)*f+M.fJ,mx=(+$('gmax').value)*f+M.fJ,a=Math.min(100,(+$('gacc').value)+M.acc);
  const html=`<span>Kapazität<b>${capMax()}</b></span><span>Schaden<b>${Math.round(mn)}–${Math.round(mx)}</b></span><span>Treffer<b>${a} %</b></span><span>Skills<b>${spent(()=>1)}/21</b></span>`;
  $('gsum').innerHTML=$('dsum').innerHTML=html;
  effDetail();
}
