import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, get, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();

const categoria=document.getElementById("categoria");
const concepto=document.getElementById("concepto");
const monto=document.getElementById("monto");
const tbody=document.getElementById("tbody");

function money(n){
return Number(n).toLocaleString("es-MX",{minimumFractionDigits:2});
}

window.guardar=async()=>{

if(!categoria.value || !concepto.value || !monto.value) return alert("Completa todos los campos");

await push(ref(db,"demos/tortilleria/gastos"),{
categoria:categoria.value,
concepto:concepto.value,
monto:Number(monto.value),
createdAt:Date.now()
});

categoria.value="";
concepto.value="";
monto.value="";

cargar();
};

async function cargar(){

const snap=await get(ref(db,"demos/tortilleria/gastos"));
tbody.innerHTML="";

if(!snap.exists()) return;

snap.forEach(c=>{
const v=c.val();

tbody.innerHTML+=`
<tr>
<td>${v.categoria}</td>
<td>${v.concepto}</td>
<td>$${money(v.monto)}</td>
<td><button class="del" onclick="borrar('${c.key}')">X</button></td>
</tr>
`;
});
}

window.borrar=async(id)=>{
await remove(ref(db,"demos/tortilleria/gastos/"+id));
cargar();
};

async function limpiar(){

const snap=await get(ref(db,"demos/tortilleria/gastos"));
if(!snap.exists()) return;

snap.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
remove(ref(db,"demos/tortilleria/gastos/"+c.key));
}
});
}

limpiar();
cargar();