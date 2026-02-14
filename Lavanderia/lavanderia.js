const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.database().ref("demos/lavanderia");

// limpiar >7 días
db.once("value",s=>{
s.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
db.child(c.key).remove();
}
});
});

const kilos=document.getElementById("kilos");
if(kilos){
kilos.addEventListener("input",()=>{
document.getElementById("total").value=(kilos.value*18)||0;
});
}

function crearRecibo(){
const cliente=document.getElementById("cliente").value.trim();
const kg=kilos.value;
const suc=document.getElementById("sucursal").value;
const total=document.getElementById("total").value;

if(!cliente||!kg)return alert("Completa datos");

db.once("value",snap=>{
const folio=snap.numChildren()+1;

const data={
folio,
cliente,
kilos:kg,
sucursal:suc,
total,
estado:"pendiente",
fecha:new Date().toLocaleString(),
createdAt:Date.now()
};

db.push(data);

document.getElementById("reciboVista").innerHTML=`
<div class="recibo" id="recibo">
<b>Folio ${folio}</b><br>
${cliente}<br>
${kg} kg — $${total}<br>
${suc}<br>
${data.fecha}
<button onclick="compartir()">Compartir</button>
</div>
`;

});
}

function compartir(){
html2canvas(document.getElementById("recibo")).then(c=>{
const a=document.createElement("a");
a.download="recibo.png";
a.href=c.toDataURL();
a.click();
});
}

const lista=document.getElementById("lista");
const ingresos=document.getElementById("ingresos");

function cargar(){
db.on("value",snap=>{
let total=0;
if(lista) lista.innerHTML="";
snap.forEach(c=>{
const r=c.val();
if(r.estado==="pagado") total+=parseFloat(r.total);

if(lista){
lista.innerHTML+=`
<div class="recibo">
<b>Folio ${r.folio}</b><br>
${r.cliente}<br>
$${r.total}<br>
<span class="estado ${r.estado}">${r.estado}</span><br>
<button onclick="toggle('${c.key}')">Cambiar estado</button>
</div>`;
}
});
if(ingresos) ingresos.innerHTML=`Ingresos pagados: $${total.toFixed(2)}`;
});
}

function toggle(id){
db.child(id).once("value",s=>{
db.child(id).update({
estado:s.val().estado==="pagado"?"pendiente":"pagado"
});
});
}

function filtrar(){
const f=document.getElementById("filtroEstado").value;
db.once("value",snap=>{
lista.innerHTML="";
snap.forEach(c=>{
const r=c.val();
if(!f||r.estado===f){
lista.innerHTML+=`
<div class="recibo">
Folio ${r.folio} - ${r.cliente}<br>
$${r.total} - ${r.estado}
</div>`;
}
});
});
}

if(lista||ingresos) cargar();