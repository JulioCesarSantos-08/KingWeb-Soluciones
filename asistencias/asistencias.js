import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, push, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

initializeApp(firebaseConfig);
const db=getDatabase();

const DEMO_USER="demo-user";
const NOMBRE="Visitante-KingWeb";

const txtEstado=document.getElementById("txtEstado");
const txtDistancia=document.getElementById("txtDistancia");
const txtAcceso=document.getElementById("txtAcceso");
const txtPrecision=document.getElementById("txtPrecision");
const msgRegistro=document.getElementById("msgRegistro");

const txtEntradaHoy=document.getElementById("txtEntradaHoy");
const txtSalidaHoy=document.getElementById("txtSalidaHoy");
const txtTiempoHoy=document.getElementById("txtTiempoHoy");

const btnUbicacion=document.getElementById("btnUbicacion");
const btnEntrada=document.getElementById("btnEntrada");
const btnSalida=document.getElementById("btnSalida");

const historialList=document.getElementById("historialList");
const btnRefrescarHistorial=document.getElementById("btnRefrescarHistorial");

const mapDiv=document.getElementById("map");

let ubicacionUsuario=null;
let map=null;
let markerUsuario=null;
let circleUsuario=null;

function pad2(n){return String(n).padStart(2,"0");}

function keyHoy(){
const d=new Date();
return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function hora(ts){
if(!ts)return "---";
const d=new Date(ts);
return pad2(d.getHours())+":"+pad2(d.getMinutes());
}

function minutosAHoras(min){
if(!min||min<0)return "---";
const h=Math.floor(min/60);
const m=min%60;
if(h<=0)return m+" min";
return h+" h "+m+" min";
}

async function limpiarAntiguos(){
const snap=await get(ref(db,`demos/asistencias/${DEMO_USER}`));
if(!snap.exists())return;
const ahora=Date.now();
snap.forEach(fecha=>{
fecha.forEach(reg=>{
const v=reg.val();
if(v.createdAt&&ahora-v.createdAt>604800000){
remove(ref(db,`demos/asistencias/${DEMO_USER}/${fecha.key}/${reg.key}`));
}
});
});
}
limpiarAntiguos();

function initMap(lat,lng){
if(map)return;
map=L.map(mapDiv).setView([lat,lng],16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);
}

function pintarUsuario(){
if(!map||!ubicacionUsuario)return;
if(markerUsuario)map.removeLayer(markerUsuario);
if(circleUsuario)map.removeLayer(circleUsuario);

markerUsuario=L.circleMarker([ubicacionUsuario.lat,ubicacionUsuario.lng],
{radius:7,color:"#2563eb",fillColor:"#2563eb",fillOpacity:1}).addTo(map);

circleUsuario=L.circle([ubicacionUsuario.lat,ubicacionUsuario.lng],
{radius:ubicacionUsuario.accuracy,color:"#2563eb",fillOpacity:.15}).addTo(map);
}

function obtenerUbicacion(){
txtEstado.textContent="Obteniendo ubicación...";
navigator.geolocation.getCurrentPosition(p=>{
ubicacionUsuario={
lat:p.coords.latitude,
lng:p.coords.longitude,
accuracy:p.coords.accuracy
};
initMap(ubicacionUsuario.lat,ubicacionUsuario.lng);
map.setView([ubicacionUsuario.lat,ubicacionUsuario.lng],16);
pintarUsuario();
txtPrecision.textContent=`±${Math.round(ubicacionUsuario.accuracy)} m`;
txtAcceso.textContent="Permitido";
txtEstado.textContent="Ubicación confirmada";
},()=>{
msgRegistro.textContent="Debes permitir la ubicación.";
},{enableHighAccuracy:true});
}

async function registrarEntrada(){
if(!ubicacionUsuario){
msgRegistro.textContent="Primero debes informar tu ubicación.";
return;
}

const now=Date.now();
const nuevo=push(ref(db,`demos/asistencias/${DEMO_USER}/${keyHoy()}`));

await update(nuevo,{
nombre:NOMBRE,
entradaTs:now,
entradaLat:ubicacionUsuario.lat,
entradaLng:ubicacionUsuario.lng,
estado:"abierta",
createdAt:now
});

await cargarHoy();
}

async function registrarSalida(){
if(!ubicacionUsuario)return;

const snap=await get(ref(db,`demos/asistencias/${DEMO_USER}/${keyHoy()}`));
if(!snap.exists())return;

let abierto=null;

snap.forEach(r=>{
if(r.val().estado==="abierta") abierto={...r.val(),id:r.key};
});

if(!abierto)return;

const now=Date.now();
const min=Math.round((now-abierto.entradaTs)/60000);

await update(ref(db,`demos/asistencias/${DEMO_USER}/${keyHoy()}/${abierto.id}`),{
salidaTs:now,
salidaLat:ubicacionUsuario.lat,
salidaLng:ubicacionUsuario.lng,
minutos:min,
estado:"cerrada"
});

await cargarHoy();
}

async function cargarHoy(){
const snap=await get(ref(db,`demos/asistencias/${DEMO_USER}/${keyHoy()}`));
if(!snap.exists()){
txtEntradaHoy.textContent="---";
txtSalidaHoy.textContent="---";
txtTiempoHoy.textContent="---";
return;
}

let arr=[];
snap.forEach(r=>arr.push(r.val()));
arr.sort((a,b)=>a.entradaTs-b.entradaTs);

let totalMin=0;

arr.forEach(r=>{
if(r.minutos) totalMin+=r.minutos;
if(r.estado==="abierta"){
totalMin+=Math.round((Date.now()-r.entradaTs)/60000);
}
});

txtEntradaHoy.textContent=hora(arr[arr.length-1].entradaTs);
txtSalidaHoy.textContent=hora(arr[arr.length-1].salidaTs);
txtTiempoHoy.textContent=minutosAHoras(totalMin);
}

async function cargarHistorial(){
const snap=await get(ref(db,`demos/asistencias/${DEMO_USER}`));
if(!snap.exists()){
historialList.innerHTML="Sin registros.";
return;
}

let arr=[];
snap.forEach(fecha=>{
fecha.forEach(reg=>{
arr.push({...reg.val(),fecha:fecha.key});
});
});

arr.sort((a,b)=>b.entradaTs-a.entradaTs);

historialList.innerHTML=arr.map(x=>`
<div class="item">
<div><strong>${x.nombre}</strong></div>
<div>${x.fecha}</div>
<div>Entrada: ${hora(x.entradaTs)} (${x.entradaLat?.toFixed(4)}, ${x.entradaLng?.toFixed(4)})</div>
<div>Salida: ${hora(x.salidaTs)} (${x.salidaLat?.toFixed(4)}, ${x.salidaLng?.toFixed(4)})</div>
<div>Tiempo: ${minutosAHoras(x.minutos)}</div>
</div>
`).join("");
}

btnUbicacion.onclick=obtenerUbicacion;
btnEntrada.onclick=registrarEntrada;
btnSalida.onclick=registrarSalida;
btnRefrescarHistorial.onclick=cargarHistorial;

cargarHoy();