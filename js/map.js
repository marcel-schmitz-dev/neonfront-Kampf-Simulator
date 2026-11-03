let cur=null,sc=null,RES={};
function pickMap(){cur=D.m[$('map').value];RES={};busy=-1;$('mapimg').src=cur.img;drawMarks();pickCamp(0)}
let busy=-1,rqMode=false,zl=1;const REQ={};const lab=(c,i)=>/^\d{4,}$/.test(c.n)?String(i+1):c.n;
try{const o=JSON.parse(localStorage.getItem('nf_req')||'{}');for(const k in o)REQ[k]=new Set(o[k])}catch(e){}
const saveReq=()=>{try{const o={};for(const k in REQ)o[k]=[...REQ[k]];localStorage.setItem('nf_req',JSON.stringify(o))}catch(e){}};
function reqSet(){const k=cur.n;if(!REQ[k]){const q=new Set();cur.c.forEach((c,i)=>{if(Object.keys(c.j).some(x=>/Boss|Leader/.test(x)))q.add(i)});if(!q.size)cur.c.forEach((c,i)=>q.add(i));REQ[k]=q}return REQ[k]}
function drawMarks(){document.querySelectorAll('.mk').forEach(e=>e.remove());const rq=reqSet();cur.c.forEach((c,i)=>{if(c.x==null)return;const b=document.createElement('button'),r=RES[i];b.className='mk'+(i==sc?' sel':'')+(i===busy?' run':'')+(rq.has(i)?' rq':'');b.textContent=lab(c,i);b.style.left=c.x/cur.w*100+'%';b.style.top=c.y/cur.h*100+'%';b.style.setProperty('--c',r?(r.p>=80?'#39ff88':r.p>=40?'#ffd23f':'#ff4d6d'):'#00f0ff');b.title='Lager '+lab(c,i)+' (ID '+c.n+')'+(r?' – '+r.p.toFixed(0)+'%':'');b.onclick=()=>{if(rqMode){rq.has(i)?rq.delete(i):rq.add(i);saveReq();drawMarks()}else pickCamp(i)};$('mapin').append(b)})}
function pickCamp(i){sc=i;const c=cur.c[i];$('enemy').innerHTML=`<b style="width:100%">Lager ${lab(c,i)}</b>`+Object.entries(c.j).map(([id,n])=>`<span class="chip">${ico(id)}${n}× ${nm(id)} <small>${U[id].h} HP · ${Math.round(U[id].mn)}–${Math.round(U[id].mx)}</small></span>`).join('');drawMarks()}
D.m.forEach((m,i)=>$('map').add(new Option(m.n,i)));$('map').onchange=pickMap;
