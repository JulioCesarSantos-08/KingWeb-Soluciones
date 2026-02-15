if (!firebase.apps.length) {
firebase.initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
});
}

const db=firebase.database();

const totalRecibos=document.getElementById("totalRecibos");
const totalIngresos=document.getElementById("totalIngresos");

let chart=null;

function limpiar(){
db.ref("demos/lavanderia").once("value",s=>{
const ahora=Date.now();
s.forEach(c=>{
if(c.val().createdAt && ahora-c.val().createdAt>604800000){
db.ref("demos/lavanderia/"+c.key).remove();
}
});
});
}

function cargar(){

limpiar();

db.ref("demos/lavanderia").once("value")
.then(s=>{

if(!s.exists()){
totalRecibos.textContent="0";
totalIngresos.textContent="0";
dibujarGrafica([],[]);
return;
}

let total=0;
let count=0;
let porDia={};

s.forEach(c=>{
const v=c.val();
count++;
const monto=parseFloat(v.total)||0;
total+=monto;

if(v.fechaIngreso){
if(!porDia[v.fechaIngreso]) porDia[v.fechaIngreso]=0;
porDia[v.fechaIngreso]+=monto;
}
});

totalRecibos.textContent=count;
totalIngresos.textContent=total.toFixed(2);

const labels=Object.keys(porDia);
const valores=Object.values(porDia);

dibujarGrafica(labels,valores);

})
.catch(err=>{
console.error("Error cargando análisis:",err);
});
}

function dibujarGrafica(labels,valores){

const ctx=document.getElementById("grafica");

if(!ctx) return;

if(chart) chart.destroy();

chart=new Chart(ctx,{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Ingresos por día",
data:valores,
backgroundColor:"#22c55e"
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{legend:{display:false}},
scales:{y:{beginAtZero:true}}
}
});
}

cargar();