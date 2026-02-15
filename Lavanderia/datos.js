const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.database();

const lista=document.getElementById("lista");

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

function cargar(){

limpiar();

db.ref("demos/lavanderia").once("value",s=>{
if(!s.exists()){
lista.innerHTML="Sin recibos";
return;
}

let arr=[];
s.forEach(c=>arr.push({...c.val(),id:c.key}));

arr.sort((a,b)=>b.createdAt-a.createdAt);

lista.innerHTML=arr.map(r=>`
<div class="item">
<div><b>${r.cliente}</b></div>
<div>Servicio: ${r.servicio}</div>
<div>Kilos: ${r.kilos}</div>
<div>Folio: ${r.folio}</div>
<div>Total: $${r.total}</div>
<div>Estado: ${r.estado}</div>
</div>
`).join("");
});
}

cargar();