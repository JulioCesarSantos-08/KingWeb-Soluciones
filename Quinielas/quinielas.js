const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.database().ref("demos/quinielas");

const juegos=[
["tigres","santos"],
["necaxa","san-luis"],
["tijuana","puebla"],
["mazatlan","chivas"],
["barcelona","real-madrid"],
["queretaro","leon"],
["toluca","cruz-azul"],
["atlas","pumas"],
["pachuca","juarez"],
["america","monterrey"]
];

const cont=document.getElementById("partidos");

juegos.forEach((p,i)=>{
cont.innerHTML+=`
<div class="partido">
<img src="../imagenes/${p[0]}.png">
<select id="r${i}">
<option value="L">Local</option>
<option value="E">Empate</option>
<option value="V">Visita</option>
</select>
<img src="../imagenes/${p[1]}.png">
</div>`;
});

function guardar(){
const nombre=document.getElementById("nombre").value;
if(!nombre)return alert("Nombre");

let res=[];
juegos.forEach((p,i)=>{
res.push(document.getElementById("r"+i).value);
});

db.push({
nombre,
res,
puntos:Math.floor(Math.random()*10),
createdAt:Date.now()
});

alert("Quiniela guardada");
}