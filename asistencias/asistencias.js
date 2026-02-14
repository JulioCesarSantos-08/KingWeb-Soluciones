const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.database().ref("demos/asistencias");

// limpieza 7 días
db.once("value",s=>{
s.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
db.child(c.key).remove();
}
});
});

function marcar(){

const nombre=document.getElementById("nombre").value.trim();
if(!nombre) return alert("Escribe tu nombre");

navigator.geolocation.getCurrentPosition(pos=>{

const data={
nombre,
lat:pos.coords.latitude,
lng:pos.coords.longitude,
fecha:new Date().toLocaleString(),
createdAt:Date.now()
};

db.push(data);

document.getElementById("status").innerHTML=`
<div class="reg">
✔ Asistencia registrada<br>
${data.fecha}
</div>
`;

document.getElementById("nombre").value="";

});
}

const lista=document.getElementById("lista");

if(lista){
db.on("value",snap=>{
lista.innerHTML="";
snap.forEach(c=>{
const r=c.val();
lista.innerHTML+=`
<div class="reg">
<b>${r.nombre}</b><br>
${r.fecha}<br>
Lat:${r.lat.toFixed(4)} Lng:${r.lng.toFixed(4)}
</div>
`;
});
});
}