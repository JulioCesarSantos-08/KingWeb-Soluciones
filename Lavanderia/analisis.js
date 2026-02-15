const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.database();

const totalRecibos=document.getElementById("totalRecibos");
const totalIngresos=document.getElementById("totalIngresos");

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
totalRecibos.textContent="0";
totalIngresos.textContent="0";
return;
}

let total=0;
let count=0;

s.forEach(c=>{
count++;
total+=parseFloat(c.val().total)||0;
});

totalRecibos.textContent=count;
totalIngresos.textContent=total.toFixed(2);
});
}

cargar();