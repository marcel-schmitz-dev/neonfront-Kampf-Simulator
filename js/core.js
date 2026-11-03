const $=s=>document.getElementById(s),U=D.u,I=D.i;
const ico=id=>I[id]?`<img class="ic" src="${I[id]}" alt="">`:`<span class="ic">${(id||'?')[0]}</span>`;
const nm=id=>(U[id]&&U[id].n)||id,sh=id=>nm(id).slice(0,9);
const SW=['Cavalry','Knight','MountedSwordsman','MountedMarksman'],HV=['Cannoneer','Besieger'],OF=['Bowman','Longbowman','Crossbowman','Marksman','ArmoredMarksman','MountedMarksman','Cavalry','Knight'];

// Kurzformen für Einheiten (wie im Wiki-Simulator: SK, BSK, RI, GSS, BSS …)
const ABBR={Recruit:'REK',Militia:'MIL',Soldier:'SOL',EliteSoldier:'ES',Swordsman:'SK',MountedSwordsman:'BSK',Knight:'RI',Cavalry:'REI',Bowman:'BS',Longbowman:'LB',Crossbowman:'AB',Marksman:'SS',ArmoredMarksman:'GSS',MountedMarksman:'BSS',Cannoneer:'KAN',Besieger:'BEL'};
const abbr=o=>Object.entries(o).filter(([u,n])=>n>0).map(([u,n])=>Math.round(n)+(ABBR[u]||u)).join(' ');
