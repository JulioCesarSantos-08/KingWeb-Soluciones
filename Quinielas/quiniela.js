import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getDatabase,ref,push,get,remove} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();
const USER="Visitante-KingWeb";

const partidos=[
["tigres","santos"],
["necaxa","san-luis"],
["tijuana","puebla"],
["mazatlan","chivas"],
["barcelona","real-madrid"],
["queretaro","leon"],
["toluca","cruz-azul"],
["atlas","pumas"],
["pachuca","juarez"],
["america","monterrey"]
];

const lista=document.getElementById("lista");

partidos.forEach((p,i)=>{
lista.innerHTML+=`
<div class="partido">
<img src="../imagenes/${p[0]}.png">
<select id="p${i}">
<option value="">Selecciona</option>
<option value="${p[0]}">${p[0]}</option>
<option value="empate">Empate</option>
<option value="${p[1]}">${p[1]}</option>
</select>
<img src="../imagenes/${p[1]}.png">
</div>`;
});

window.enviar=async()=>{

let quiniela={};
let completo=true;

partidos.forEach((_,i)=>{
const v=document.getElementById("p"+i).value;
if(!v) completo=false;
quiniela["p"+i]=v;
});

if(!completo){
alert("Debes seleccionar resultado en los 10 partidos");
return;
}

await push(ref(db,"demos/quinielas"),{
usuario:USER,
fecha:Date.now(),
quiniela
});

alert("Quiniela enviada correctamente");
location.reload();
};

async function limpiar(){
const snap=await get(ref(db,"demos/quinielas"));
if(!snap.exists())return;
const ahora=Date.now();
snap.forEach(c=>{
if(ahora-c.val().fecha>604800000){
remove(ref(db,"demos/quinielas/"+c.key));
}
});
}
limpiar();