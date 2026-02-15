import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

initializeApp(firebaseConfig);
const db=getDatabase();

const DEMO="demo-user";

const lista=document.getElementById("listaJornadas");
const stTotal=document.getElementById("stTotal");
const stMin=document.getElementById("stMin");
const stHoras=document.getElementById("stHoras");

function pad(n){return String(n).padStart(2,"0");}

function hora(ts){
if(!ts)return "---";
const d=new Date(ts);
return pad(d.getHours())+":"+pad(d.getMinutes());
}

function minutosAHoras(m){
if(!m)return "0";
const h=Math.floor(m/60);
const mm=m%60;
if(h<=0)return mm+" min";
return h+" h "+mm+" min";
}

async function cargar(){
const snap=await get(ref(db,`demos/asistencias/${DEMO}`));
if(!snap.exists()){
lista.innerHTML="Sin registros";
return;
}

let arr=[];
snap.forEach(c=>{
arr.push({...c.val(),fecha:c.key});
});

arr.sort((a,b)=>b.fecha.localeCompare(a.fecha));

let totalMin=0;

arr.forEach(x=>{
if(x.minutos) totalMin+=x.minutos;
});

stTotal.textContent=arr.length;
stMin.textContent=totalMin;
stHoras.textContent=minutosAHoras(totalMin);

lista.innerHTML=arr.map(j=>`
<div class="item">
<div class="item-title">${j.fecha}</div>
<div class="item-sub">Entrada: ${hora(j.entradaTs)}</div>
<div class="item-sub">Salida: ${hora(j.salidaTs)}</div>
<div class="item-sub">Tiempo: ${minutosAHoras(j.minutos)}</div>
</div>
`).join("");
}

cargar();