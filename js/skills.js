const LV={lt:[1],acc:[10],rapid:[5,10,15],jugg:[20,40,60],rec:[2,4,6],sniper:[45,85,130],boss:[8,16,25],swift:[1,2,3],bf:[10,20,30],cleave:[4,8,12],heavy:[10,20,30],cap:[5,10,15]},SPC=[.33,.66,1];
const S='Skill_',TREE=[[['IncreaseBowmanMaximumAD','rapid',3],['IncreaseGeneralSplashAndAD','jugg',3],['ResurrectLosses','rec',3],['IncreasePeacefulMovementSpeed','',3]],
[['IncreaseLongbowmanAndMarksmanAD','sniper',3],['DescreaseBossHP','boss',3],['GetRecruits','',3],['IncreaseTravelSpeed','',3]],
[['IncreaseSwiftSplashAndAD','swift',3],['IncreaseADEveryRound','bf',3],['IncreaseXP','',3],['IncreaseRecoverySpeed','',3]],
[['IncreaseEliteSoldierSplashAndAD','cleave',3],['IncreaseHeavyAD','heavy',3],['IncreaseCapacity','cap',3],['IncreaseCombatSpeed','',3]],
[['GeneralAttacksTwice','lt',1],['IncreaseAccuracy','acc',1],['GetStarCoins','',1],['InstantRecovery','',1]]];
const GL=d=>`<svg viewBox="0 0 24 24" class="ic" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const STAR='M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z',HEART='M12 20s-7-4.400-7-9.500A4 4 0 0 1 12 8a4 4 0 0 1 7 2.500C19 15.600 12 20 12 20z',CHEV='M6 6l6 6-6 6M13 6l6 6-6 6';
const SKI={IncreaseBowmanMaximumAD:'u:Bowman',IncreaseGeneralSplashAndAD:'u:General',ResurrectLosses:'g:M12 5v14M5 12h14',IncreasePeacefulMovementSpeed:'g:'+CHEV,IncreaseLongbowmanAndMarksmanAD:'u:Longbowman',DescreaseBossHP:'u:_skull',GetRecruits:'u:Recruit',IncreaseTravelSpeed:'g:'+CHEV,IncreaseSwiftSplashAndAD:'u:Cavalry',IncreaseADEveryRound:'g:M13 3L5 14h6l-1 7 8-11h-6z',IncreaseXP:'g:'+STAR,IncreaseRecoverySpeed:'g:'+HEART,IncreaseEliteSoldierSplashAndAD:'u:EliteSoldier',IncreaseHeavyAD:'u:Cannoneer',IncreaseCapacity:'g:M4 4h16v16H4zM12 8v8M8 12h8',IncreaseCombatSpeed:'g:M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',GeneralAttacksTwice:'g:M5 19L19 5M5 12L12 5M12 19l7-7',IncreaseAccuracy:'g:M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',GetStarCoins:'g:'+STAR,InstantRecovery:'g:'+HEART};
const skIco=id=>SKIMG[id]?`<img class="ic sic" src="${SKIMG[id]}" alt="">`:(()=>{const v=SKI[id]||'';return v.startsWith('u:')?ico(v.slice(2)):v.startsWith('g:')?GL(v.slice(2)):''})();
const SKM={};let sk={};
TREE.forEach((r,ri)=>r.forEach(s=>SKM[s[0]]={k:s[1],mx:s[2],r:ri,n:D.s[S+s[0]]||s[0]}));
const spent=(f)=>Object.keys(sk).filter(f).reduce((a,k)=>a+sk[k],0);
const lvK=(s,k)=>{for(const id in s)if(SKM[id]&&SKM[id].k==k)return s[id];return 0},svK=(s,k)=>{const l=lvK(s,k);return l?LV[k][l-1]:0},spK=(s,k)=>{const l=lvK(s,k);return l?SPC[l-1]:0};
const lvl=k=>lvK(sk,k),sv=k=>svK(sk,k),sp=k=>spK(sk,k);

// ---------- Skillbaum zeichnen (kleine, gleichmäßige Kacheln) ----------
function drawTree(){
  const t=$('tree');t.innerHTML='';
  [...TREE].reverse().forEach(r=>{
    const d=document.createElement('div');d.className='trow';
    r.forEach(s=>{
      const m=SKM[s[0]],l=sk[s[0]]||0,b=document.createElement('button');
      b.type='button';
      b.className='sk'+(l?' on':'')+(l==m.mx?' max':'')+(m.k?'':' dim');
      b.innerHTML=`${skIco(s[0])}<span>${m.n}</span><b>${l}/${m.mx}</b>`;
      b.title=m.n+(m.k?'':' – kein Kampfeffekt')+' (Linksklick +1, Rechtsklick −1)';
      b.onclick=()=>clk(s[0]);
      b.oncontextmenu=e=>{e.preventDefault();dec(s[0])};
      d.append(b);
    });
    t.append(d);
  });
  const n=spent(()=>1);
  $('pts').textContent=n+'/21';$('skn').textContent=n+'/21';
  cap();
}
function clk(id){
  const m=SKM[id],l=sk[id]||0;
  if(l>=m.mx)delete sk[id];
  else{if(spent(()=>1)>=21)return;sk[id]=l+1}
  drawTree();autosave();
}
function dec(id){
  const l=sk[id]||0;
  if(l<=1)delete sk[id];else sk[id]=l-1;
  drawTree();autosave();
}
$('rst').onclick=()=>{sk={};drawTree();autosave()};
