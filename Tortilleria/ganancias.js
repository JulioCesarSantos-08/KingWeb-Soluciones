import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();

const stVentas=document.getElementById("stVentas");
const stGastos=document.getElementById("stGastos");
const stGanancia=document.getElementById("stGanancia");
const tbody=document.getElementById("tbody");

function money(n){
return Number(n).toLocaleString("es-MX",{minimumFractionDigits:2});
}

async function limpiar(ruta){
const snap=await get(ref(db,ruta));
if(!snap.exists()) return;

snap.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
remove(ref(db,`${ruta}/${c.key}`));
}
});
}

async function cargar(){

await limpiar("demos/tortilleria/ventas");
await limpiar("demos/tortilleria/gastos");

const vSnap=await get(ref(db,"demos/tortilleria/ventas"));
const gSnap=await get(ref(db,"demos/tortilleria/gastos"));

let ventas=[];
let gastos=[];

if(vSnap.exists()) vSnap.forEach(c=>ventas.push(c.val()));
if(gSnap.exists()) gSnap.forEach(c=>gastos.push(c.val()));

let totalVentas=ventas.reduce((a,b)=>a+Number(b.total||0),0);
let totalGastos=gastos.reduce((a,b)=>a+Number(b.monto||0),0);
let ganancia=totalVentas-totalGastos;

stVentas.textContent="$"+money(totalVentas);
stGastos.textContent="$"+money(totalGastos);
stGanancia.textContent="$"+money(ganancia);

tbody.innerHTML="";

ventas.forEach(v=>{
tbody.innerHTML+=`
<tr>
<td>Venta</td>
<td>${v.kilos||""} kg</td>
<td>$${money(v.total)}</td>
</tr>
`;
});

gastos.forEach(g=>{
tbody.innerHTML+=`
<tr>
<td>Gasto</td>
<td>${g.concepto}</td>
<td>-$${money(g.monto)}</td>
</tr>
`;
});

new Chart(document.getElementById("grafica"),{
type:"bar",
data:{
labels:["Ventas","Gastos"],
datasets:[{
data:[totalVentas,totalGastos]
}]
},
options:{
responsive:true,
plugins:{legend:{display:false}}
}
});

}

cargar();