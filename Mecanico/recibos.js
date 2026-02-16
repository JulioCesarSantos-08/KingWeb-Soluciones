import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getDatabase,ref,push,get,remove} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();
const PATH="demos/mecanico/recibos";
const USER="Visitante-KingWeb";

const tbody=document.getElementById("tbody");
const stTotal=document.getElementById("stTotal");
const stMonto=document.getElementById("stMonto");

function dinero(n){
return Number(n).toLocaleString("es-MX",{minimumFractionDigits:2});
}

function fecha(ts){
const d=new Date(ts);
return d.toLocaleDateString()+" "+d.toLocaleTimeString();
}

window.guardar=async()=>{

const descripcion=document.getElementById("descripcion").value.trim();
const monto=Number(document.getElementById("monto").value);
const detalle=document.getElementById("detalle").value.trim();

if(!descripcion||!monto){
alert("Completa servicio y monto");
return;
}

await push(ref(db,PATH),{
cliente:USER,
descripcion,
detalle,
total:monto,
fecha:Date.now(),
createdAt:Date.now()
});

document.querySelectorAll("input,textarea").forEach(x=>x.value="");

cargar();
};

async function cargar(){

const snap=await get(ref(db,PATH));
tbody.innerHTML="";

if(!snap.exists()){
tbody.innerHTML="<tr><td colspan='5'>Sin recibos</td></tr>";
stTotal.textContent=0;
stMonto.textContent="$0.00";
return;
}

let arr=[];
snap.forEach(c=>arr.push(c.val()));
arr.sort((a,b)=>b.fecha-a.fecha);

let suma=0;

arr.forEach(r=>{

suma+=Number(r.total);

tbody.innerHTML+=`
<tr>
<td>${fecha(r.fecha)}</td>
<td>${r.cliente}</td>
<td>${r.descripcion}</td>
<td>$${dinero(r.total)}</td>
<td>${r.detalle||"-"}</td>
</tr>
`;

});

stTotal.textContent=arr.length;
stMonto.textContent="$"+dinero(suma);
}

async function limpiar(){

const snap=await get(ref(db,PATH));
if(!snap.exists()) return;

snap.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
remove(ref(db,PATH+"/"+c.key));
}
});
}

limpiar();
cargar();