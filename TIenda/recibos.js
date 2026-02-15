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

function fecha(ts){
const d=new Date(ts);
return d.toLocaleDateString()+" "+d.toLocaleTimeString();
}

async function cargar(){

const snap=await get(ref(db,"demos/tienda/recibos"));

if(!snap.exists()){
tbody.innerHTML="<tr><td colspan='4'>Sin ventas</td></tr>";
return;
}

let arr=[];
snap.forEach(c=>arr.push(c.val()));

arr.sort((a,b)=>b.fecha-a.fecha);

let total=0;

tbody.innerHTML="";

arr.forEach(r=>{

total+=r.total;

tbody.innerHTML+=`
<tr>
<td>${fecha(r.fecha)}</td>
<td>${r.usuario}</td>
<td>$${r.total}</td>
<td>${r.productos.map(p=>p.n).join(", ")}</td>
</tr>
`;

});

stVentas.textContent=arr.length;
stTotal.textContent="$"+total;

}

cargar();