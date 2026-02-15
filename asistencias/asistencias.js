import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

initializeApp(firebaseConfig);
const db=getDatabase();

const DEMO_USER="demo-user";

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
let jornadaHoy=null;
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
if(!Number.isFinite(min)||min<0)return "---";
const h=Math.floor(min/60);
const m=min%60;
if(h<=0)return m+" min";
return h+" h "+m+" min";
}

function distanciaMetros(lat1,lon1,lat2,lon2){
const R=6371000;
const toRad=v=>(v*Math.PI)/180;
const dLat=toRad(lat2-lat1);
const dLon=toRad(lon2-lon1);
const a=Math.sin(dLat/2)**2+
Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*
Math.sin(dLon/2)**2;
const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
return R*c;
}

async function limpiarAntiguos(){
const snap=await get(ref(db,`demos/asistencias/${DEMO_USER}`));
if(!snap.exists())return;
const ahora=Date.now();
snap.forEach(c=>{
const v=c.val();
if(v.createdAt&&ahora-v.createdAt>604800000){
remove(ref(db,`demos/asistencias/${DEMO_USER}/${c.key}`));
}
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

markerUsuario=L.circleMarker(
[ubicacionUsuario.lat,ubicacionUsuario.lng],
{radius:7,color:"#2563eb",fillColor:"#2563eb",fillOpacity:1}
).addTo(map);

circleUsuario=L.circle(
[ubicacionUsuario.lat,ubicacionUsuario.lng],
{radius:ubicacionUsuario.accuracy,color:"#2563eb",fillOpacity:.15}
).addTo(map);
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
evaluarAcceso();
txtEstado.textContent="Ubicación actualizada";
},()=>{
msgRegistro.textContent="No se pudo obtener ubicación.";
},{enableHighAccuracy:true});
}

function evaluarAcceso(){
if(!ubicacionUsuario)return;
txtDistancia.textContent="---";
txtPrecision.textContent=`±${Math.round(ubicacionUsuario.accuracy)} m`;
txtAcceso.textContent="Permitido";
return true;
}

async function cargarJornadaHoy(){
const snap=await get(ref(db,`demos/asistencias/${DEMO_USER}/${keyHoy()}`));
jornadaHoy=snap.exists()?snap.val():null;
pintarJornada();
}

function pintarJornada(){
txtEntradaHoy.textContent=jornadaHoy?.entradaTs?hora(jornadaHoy.entradaTs):"---";
txtSalidaHoy.textContent=jornadaHoy?.salidaTs?hora(jornadaHoy.salidaTs):"---";
if(jornadaHoy?.entradaTs&&jornadaHoy?.salidaTs){
const min=Math.round((jornadaHoy.salidaTs-jornadaHoy.entradaTs)/60000);
txtTiempoHoy.textContent=minutosAHoras(min);
}else{
txtTiempoHoy.textContent="---";
}
}

async function registrarEntrada(){
const now=Date.now();
await set(ref(db,`demos/asistencias/${DEMO_USER}/${keyHoy()}`),{
nombre:"Visitante-KingWeb",
entradaTs:now,
salidaTs:null,
estado:"abierta",
createdAt:now
});
await cargarJornadaHoy();
}

async function registrarSalida(){
if(!jornadaHoy?.entradaTs)return;
const now=Date.now();
const min=Math.round((now-jornadaHoy.entradaTs)/60000);
await update(ref(db,`demos/asistencias/${DEMO_USER}/${keyHoy()}`),{
salidaTs:now,
minutos:min,
estado:"cerrada"
});
await cargarJornadaHoy();
}

async function cargarHistorial(){
const snap=await get(ref(db,`demos/asistencias/${DEMO_USER}`));
if(!snap.exists()){
historialList.innerHTML="Sin registros.";
return;
}
const arr=Object.entries(snap.val()).map(([k,v])=>({...v,fechaKey:k}));
arr.sort((a,b)=>b.fechaKey.localeCompare(a.fechaKey));
historialList.innerHTML=arr.map(x=>`
<div class="item">
<div>${x.fechaKey}</div>
<div>Entrada: ${hora(x.entradaTs)}</div>
<div>Salida: ${hora(x.salidaTs)}</div>
<div>Tiempo: ${minutosAHoras(x.minutos)}</div>
</div>
`).join("");
}

btnUbicacion.onclick=obtenerUbicacion;
btnEntrada.onclick=registrarEntrada;
btnSalida.onclick=registrarSalida;
btnRefrescarHistorial.onclick=cargarHistorial;

cargarJornadaHoy();