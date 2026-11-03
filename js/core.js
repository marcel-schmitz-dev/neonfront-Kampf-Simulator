const $=s=>document.getElementById(s),U=D.u,I=D.i;
const ico=id=>I[id]?`<img class="ic" src="${I[id]}" alt="">`:`<span class="ic">${(id||'?')[0]}</span>`;
const nm=id=>(U[id]&&U[id].n)||id,sh=id=>nm(id).slice(0,9);
const SW=['Cavalry','Knight','MountedSwordsman','MountedMarksman'],HV=['Cannoneer','Besieger'],OF=['Bowman','Longbowman','Crossbowman','Marksman','ArmoredMarksman','MountedMarksman','Cavalry','Knight'];
