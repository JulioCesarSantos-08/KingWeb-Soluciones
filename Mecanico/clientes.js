import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getDatabase,ref,push,get,remove} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();
const PATH="demos/mecanico/clientes";

const tbody=document.getElementById("tbody");

window.guardar=async()=>{

const cliente=document.getElementById("cliente").value.trim();
const placas=document.getElementById("placas").value.trim();
const modelo=document.getElementById("modelo").value.trim();
const fecha=document.getElementById("fecha").value;
const proxima=document.getElementById("proxima").value;
const servicio=document.getElementById("servicio").value.trim();

if(!cliente||!placas||!modelo||!fecha||!servicio){
alert("Completa todos los campos");
return;
}

await push(ref(db,PATH),{
cliente,
placas,
modelo,
fecha,
proxima,
servicio,
createdAt:Date.now()
});

document.querySelectorAll("input,textarea").forEach(x=>x.value="");

cargar();
};

async function cargar(){

const snap=await get(ref(db,PATH));

tbody.innerHTML="";

if(!snap.exists()){
tbody.innerHTML="<tr><td colspan='7'>Sin registros</td></tr>";
return;
}

snap.forEach(c=>{
const v=c.val();

tbody.innerHTML+=`
<tr>
<td>${v.cliente}</td>
<td>${v.placas}</td>
<td>${v.modelo}</td>
<td>${v.servicio}</td>
<td>${v.fecha}</td>
<td>${v.proxima||"-"}</td>
<td><button class="action" onclick="borrar('${c.key}')">Eliminar</button></td>
</tr>
`;
});
}

window.borrar=async(id)=>{
await remove(ref(db,PATH+"/"+id));
cargar();
};

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