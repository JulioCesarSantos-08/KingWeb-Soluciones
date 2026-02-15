const firebaseConfig={
apiKey:"AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
authDomain:"king-web-soluciones-08.firebaseapp.com",
databaseURL:"https://king-web-soluciones-08-default-rtdb.firebaseio.com",
projectId:"king-web-soluciones-08"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.database().ref("demos/quinielas");

const tabla=document.getElementById("tabla");

db.on("value",snap=>{
tabla.innerHTML="";
snap.forEach(c=>{
const r=c.val();
tabla.innerHTML+=`
<div class="reg">
${r.nombre} — ${r.puntos} pts
</div>`;
});
});