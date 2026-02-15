const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.database();

window.onload=()=>{
cargarUltimoFolio();
limpiar();
};

function limpiar(){
db.ref("demos/lavanderia").once("value",s=>{
const ahora=Date.now();
s.forEach(c=>{
if(c.val().createdAt&&ahora-c.val().createdAt>604800000){
db.ref("demos/lavanderia/"+c.key).remove();
}
});
});
}

function cargarUltimoFolio(){
db.ref("demos/lavanderia").once("value",s=>{
let max=0;
s.forEach(c=>{
const f=parseInt(c.val().folio);
if(!isNaN(f)&&f>max)max=f;
});
document.getElementById("folio").value=max+1;
document.getElementById("ultimoFolio").textContent="Último folio registrado: "+max;
});
}

function generarRecibo(){

const cliente=clienteInput().value;
const servicio=lavanderia.value;
const kilos=parseFloat(kilosInput().value)||0;
const folio=folioInput().value;
const fechaIngreso=fechaIngresoInput().value;
const fechaEntrega=fechaEntregaInput().value;
const horaEntrega=horaEntregaInput().value;
const total=totalInput().value;
const estado=estadoSelect().value;
const metodoPago=metodoPagoSelect().value;

if(!cliente||!total||!fechaIngreso){
alert("Completa los campos");
return;
}

const data={
cliente,
servicio,
kilos,
folio,
fechaIngreso,
fechaEntrega,
horaEntrega,
total,
estado,
metodoPago,
createdAt:Date.now()
};

db.ref("demos/lavanderia").push(data).then(()=>{
mostrarRecibo(data);
cargarUltimoFolio();
});
}

function mostrarRecibo(d){

const div=document.getElementById("recibo");
div.classList.remove("hidden");

div.innerHTML=`
<div style="text-align:center">
<img src="../imagenes/logo2.png" style="height:60px"><br>
<b>King Web Demo Lavandería</b>
</div>
<hr>
Cliente: ${d.cliente}<br>
Servicio: ${d.servicio}<br>
Kilos: ${d.kilos}<br>
Folio: ${d.folio}<br>
Ingreso: ${d.fechaIngreso}<br>
Entrega: ${d.fechaEntrega} ${d.horaEntrega}<br>
Total: $${d.total}<br>
Estado: ${d.estado}<br>
Pago: ${d.metodoPago}
`;

document.getElementById("accionesRecibo").classList.remove("hidden");
}

function clienteInput(){return document.getElementById("cliente")}
function kilosInput(){return document.getElementById("kilos")}
function folioInput(){return document.getElementById("folio")}
function fechaIngresoInput(){return document.getElementById("fechaIngreso")}
function fechaEntregaInput(){return document.getElementById("fechaEntrega")}
function horaEntregaInput(){return document.getElementById("horaEntrega")}
function totalInput(){return document.getElementById("total")}
function estadoSelect(){return document.getElementById("estado")}
function metodoPagoSelect(){return document.getElementById("metodoPago")}