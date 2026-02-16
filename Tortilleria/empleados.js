import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, get, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();

const nombre=document.getElementById("nombre");
const puesto=document.getElementById("puesto");
const sueldo=document.getElementById("sueldo");
const tbody=document.getElementById("tbody");

function money(n){
return Number(n).toLocaleString("es-MX",{minimumFractionDigits:2});
}

window.guardar=async()=>{

if(!nombre.value || !puesto.value || !sueldo.value) return alert("Completa todos los campos");

await push(ref(db,"demos/tortilleria/empleados"),{
nombre:nombre.value,
puesto:puesto.value,
sueldo:Number(sueldo.value),
createdAt:Date.now()
});

nombre.value="";
puesto.value="";
sueldo.value="";

cargar();
};

async function cargar(){

const snap=await get(ref(db,"demos/tortilleria/empleados"));
tbody.innerHTML="";

if(!snap.exists()) return;

snap.forEach(c=>{
const v=c.val();

tbody.innerHTML+=`
<tr>
<td>${v.nombre}</td>
<td>${v.puesto}</td>
<td>$${money(v.sueldo)}</td>
<td><button class="del" onclick="borrar('${c.key}')">X</button></td>
</tr>
`;
});
}

window.borrar=async(id)=>{
await remove(ref(db,"demos/tortilleria/empleados/"+id));
cargar();
};

async function limpiar(){

const snap=await get(ref(db,"demos/tortilleria/empleados"));
if(!snap.exists()) return;

snap.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
remove(ref(db,"demos/tortilleria/empleados/"+c.key));
}
});
}

limpiar();
cargar();