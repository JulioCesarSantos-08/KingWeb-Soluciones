import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, get, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();

const USER="Visitante-KingWeb";

const kilos=document.getElementById("kilos");
const precio=document.getElementById("precio");
const modal=document.getElementById("modal");
const ticket=document.getElementById("ticket");
const ticketTotal=document.getElementById("ticketTotal");

function money(n){
return Number(n).toLocaleString("es-MX",{minimumFractionDigits:2});
}

window.registrar=async()=>{

if(!kilos.value || !precio.value) return alert("Completa los campos");

const k=Number(kilos.value);
const p=Number(precio.value);
const total=k*p;

const data={
usuario:USER,
kilos:k,
precio:p,
total:total,
fecha:Date.now(),
createdAt:Date.now()
};

await push(ref(db,"demos/tortilleria/ventas"),data);

ticket.innerHTML=`
Cliente: ${USER}<br>
Kilos: ${k}<br>
Precio/kg: $${money(p)}<br>
Fecha: ${new Date().toLocaleString()}
`;

ticketTotal.textContent="Total: $"+money(total);

modal.style.display="flex";

kilos.value="";
precio.value="";
};

window.cerrar=()=>modal.style.display="none";

async function limpiar(){

const snap=await get(ref(db,"demos/tortilleria/ventas"));
if(!snap.exists()) return;

snap.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
remove(ref(db,"demos/tortilleria/ventas/"+c.key));
}
});
}

limpiar();