import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getDatabase,ref,get} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db=getDatabase();
const tbody=document.getElementById("tbody");

function fecha(ts){
const d=new Date(ts);
return d.toLocaleDateString()+" "+d.toLocaleTimeString();
}

async function cargar(){

const snap=await get(ref(db,"demos/quinielas"));

if(!snap.exists()){
tbody.innerHTML="<tr><td colspan='11'>Sin registros</td></tr>";
return;
}

let arr=[];
snap.forEach(c=>{
arr.push(c.val());
});

arr.sort((a,b)=>b.fecha-a.fecha);

tbody.innerHTML="";

arr.forEach(q=>{

const fila=document.createElement("tr");

fila.innerHTML=`
<td>
<div class="usuario">${q.usuario}</div>
<div class="fecha">${fecha(q.fecha)}</div>
</td>
<td>${q.quiniela.p0}</td>
<td>${q.quiniela.p1}</td>
<td>${q.quiniela.p2}</td>
<td>${q.quiniela.p3}</td>
<td>${q.quiniela.p4}</td>
<td>${q.quiniela.p5}</td>
<td>${q.quiniela.p6}</td>
<td>${q.quiniela.p7}</td>
<td>${q.quiniela.p8}</td>
<td>${q.quiniela.p9}</td>
`;

tbody.appendChild(fila);

});

}

cargar();