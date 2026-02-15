import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getDatabase,ref,push,get,remove} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();

const USER="Visitante-KingWeb";

const productos=[
{n:"Mochila",i:"mochila.png",p:900},
{n:"Aceite",i:"aceite.png",p:120},
{n:"Zapatos",i:"zapatos.png",p:1100},
{n:"Laptop",i:"laptop.png",p:15000},
{n:"Ventilador",i:"ventilador.png",p:800},
{n:"Coca Cola",i:"coca-cola.png",p:35},
{n:"Playeras",i:"playeras.png",p:250},
{n:"Sarten",i:"sarten.png",p:400},
{n:"Audifonos",i:"audifonos.png",p:500},
{n:"Celular",i:"celular.png",p:7000}
];

productos.forEach(p=>{
p.desc=Math.floor(Math.random()*30)+10;
p.final=Math.round(p.p*(1-p.desc/100));
});

const cont=document.getElementById("productos");
const lista=document.getElementById("listaCarrito");
const total=document.getElementById("total");
const modal=document.getElementById("modal");
const recibo=document.getElementById("recibo");

let carrito=[];

productos.forEach((p,i)=>{
cont.innerHTML+=`
<div class="card">
<img src="../imagenes/${p.i}">
<div class="nombre">${p.n}</div>
<div class="desc">Producto demo</div>
<div class="badge">-${p.desc}%</div>
<div class="precioOld">$${p.p}</div>
<div class="precioNew">$${p.final}</div>
<button class="btn" onclick="agregar(${i})">Agregar</button>
</div>`;
});

window.agregar=i=>{
carrito.push(productos[i]);
render();
};

function render(){
lista.innerHTML="";
let t=0;
carrito.forEach(p=>{
lista.innerHTML+=`${p.n} $${p.final}<br>`;
t+=p.final;
});
total.textContent="Total: $"+t;
}

window.comprar=async()=>{
if(!carrito.length)return;

const data={
usuario:USER,
fecha:Date.now(),
productos:carrito,
total:carrito.reduce((a,b)=>a+b.final,0),
createdAt:Date.now()
};

await push(ref(db,"demos/tienda/recibos"),data);

recibo.innerHTML=`
Cliente: ${USER}<br>
Total: $${data.total}<br>
Productos:<br>${carrito.map(p=>p.n).join("<br>")}
`;

modal.style.display="flex";
carrito=[];
render();
};

window.cerrar=()=>modal.style.display="none";

async function limpiar(){
const snap=await get(ref(db,"demos/tienda/recibos"));
if(!snap.exists())return;
snap.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
remove(ref(db,"demos/tienda/recibos/"+c.key));
}
});
}
limpiar();