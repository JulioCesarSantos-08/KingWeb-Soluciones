import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getDatabase,ref,get} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();

const tbody=document.getElementById("tbody");
const stVentas=document.getElementById("stVentas");
const stTotal=document.getElementById("stTotal");

function dinero(n){
return Number(n).toLocaleString("es-MX",{minimumFractionDigits:2});
}

function fecha(ts){
const d=new Date(ts);
return d.toLocaleDateString()+" "+d.toLocaleTimeString();
}

async function cargar(){

const snap=await get(ref(db,"tienda/recibos"));

if(!snap.exists()){
tbody.innerHTML="<tr><td colspan='4'>Sin ventas</td></tr>";
stVentas.textContent=0;
stTotal.textContent="$0.00";
return;
}

let arr=[];

snap.forEach(c=>{
const v=c.val();
arr.push({
fecha:v.fecha,
usuario:v.usuario,
total:v.total,
productos:v.productos||[]
});
});

arr.sort((a,b)=>b.fecha-a.fecha);

let suma=0;
tbody.innerHTML="";

arr.forEach(r=>{

suma+=Number(r.total);

tbody.innerHTML+=`
<tr>
<td>${fecha(r.fecha)}</td>
<td>${r.usuario}</td>
<td>$${dinero(r.total)}</td>
<td>${r.productos.map(p=>p.n).join(", ")}</td>
</tr>
`;

});

stVentas.textContent=arr.length;
stTotal.textContent="$"+dinero(suma);

}

cargar();