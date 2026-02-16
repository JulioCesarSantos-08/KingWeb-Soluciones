import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getDatabase,ref,push,get,remove,update} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();

const PATH="demos/mecanico/inventario";

const tbody=document.getElementById("tbody");

window.agregar=async()=>{

const nombre=document.getElementById("nombre").value.trim();
const cantidad=Number(document.getElementById("cantidad").value);
const minimo=Number(document.getElementById("minimo").value);

if(!nombre || !cantidad || !minimo) return alert("Completa todos los campos");

await push(ref(db,PATH),{
nombre,
cantidad,
minimo,
createdAt:Date.now()
});

document.getElementById("nombre").value="";
document.getElementById("cantidad").value="";
document.getElementById("minimo").value="";

cargar();
};

async function cargar(){

const snap=await get(ref(db,PATH));

tbody.innerHTML="";

if(!snap.exists()){
tbody.innerHTML="<tr><td colspan='5'>Sin refacciones</td></tr>";
return;
}

snap.forEach(c=>{

const v=c.val();

const estado=v.cantidad>v.minimo
? "<span class='stock-ok'>Disponible</span>"
: "<span class='stock-low'>Bajo</span>";

tbody.innerHTML+=`
<tr>
<td>${v.nombre}</td>
<td>${v.cantidad}</td>
<td>${v.minimo}</td>
<td>${estado}</td>
<td>
<button class="action-btn" onclick="sumar('${c.key}',${v.cantidad})">+1</button>
<button class="action-btn" onclick="restar('${c.key}',${v.cantidad})">-1</button>
<button class="action-btn" onclick="eliminar('${c.key}')">Eliminar</button>
</td>
</tr>
`;

});
}

window.sumar=async(id,cant)=>{
await update(ref(db,PATH+"/"+id),{cantidad:cant+1});
cargar();
};

window.restar=async(id,cant)=>{
if(cant<=0) return;
await update(ref(db,PATH+"/"+id),{cantidad:cant-1});
cargar();
};

window.eliminar=async(id)=>{
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