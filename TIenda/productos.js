import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getDatabase,ref,push,get,remove} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();

function dinero(n){
return Number(n).toLocaleString("es-MX",{minimumFractionDigits:2});
}

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
const ticketItems=document.getElementById("ticketItems");
const ticketTotales=document.getElementById("ticketTotales");

let carrito=[];

productos.forEach((p,i)=>{
cont.innerHTML+=`
<div class="card">
<img src="../imagenes/${p.i}">
<div class="nombre">${p.n}</div>
<div class="desc">Producto demo</div>
<div class="badge">-${p.desc}%</div>
<div class="precioOld">$${dinero(p.p)}</div>
<div class="precioNew">$${dinero(p.final)}</div>
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
lista.innerHTML+=`${p.n} $${dinero(p.final)}<br>`;
t+=p.final;
});
total.textContent="$"+dinero(t);
}

window.comprar=()=>{
if(!carrito.length) return;

ticketItems.innerHTML=carrito.map(p=>`
<div style="display:flex;justify-content:space-between">
<span>${p.n}</span>
<span>$${dinero(p.final)}</span>
</div>
`).join("");

const subtotal=carrito.reduce((a,b)=>a+b.final,0);
const descuento=Math.round(subtotal*0.1);
const totalFinal=subtotal-descuento;

ticketTotales.innerHTML=`
<hr>
<div style="display:flex;justify-content:space-between">
<span>Subtotal</span>
<span>$${dinero(subtotal)}</span>
</div>
<div style="display:flex;justify-content:space-between;color:#dc2626">
<span>Descuento</span>
<span>-$${dinero(descuento)}</span>
</div>
<div style="display:flex;justify-content:space-between;font-weight:600;font-size:18px;margin-top:8px">
<span>Total</span>
<span>$${dinero(totalFinal)}</span>
</div>
<br>
<div style="text-align:center;font-size:12px;color:#666">
Gracias por su compra<br>
King Web Soluciones
</div>
`;

window.ticketData={subtotal,descuento,totalFinal};

modal.style.display="flex";
};

window.cerrarModal=()=>{
modal.style.display="none";
};

window.confirmarCompra=async()=>{

await push(ref(db,"tienda/recibos"),{
usuario:USER,
productos:carrito,
subtotal:ticketData.subtotal,
descuento:ticketData.descuento,
total:ticketData.totalFinal,
fecha:Date.now(),
createdAt:Date.now()
});

carrito=[];
render();
cerrarModal();
alert("Compra registrada correctamente");
};

async function limpiar(){
const snap=await get(ref(db,"tienda/recibos"));
if(!snap.exists()) return;

snap.forEach(c=>{
if(Date.now()-c.val().createdAt>604800000){
remove(ref(db,"tienda/recibos/"+c.key));
}
});
}

limpiar();