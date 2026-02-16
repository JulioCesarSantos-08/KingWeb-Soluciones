import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

initializeApp({
  apiKey: "AIzaSyBF4xiYBLDGyMWcLo1fhrnsq1EqoUQV4Rk",
  databaseURL: "https://king-web-soluciones-08-default-rtdb.firebaseio.com"
});

const db = getDatabase();

const stVentas = document.getElementById("stVentas");
const stGastos = document.getElementById("stGastos");
const stGanancia = document.getElementById("stGanancia");

function dinero(n) {
  return Number(n).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

async function limpiarAntiguos(ruta) {
  const snap = await get(ref(db, ruta));
  if (!snap.exists()) return;

  const ahora = Date.now();

  snap.forEach(c => {
    const v = c.val();
    if (v.createdAt && ahora - v.createdAt > 604800000) {
      remove(ref(db, `${ruta}/${c.key}`));
    }
  });
}

async function cargarResumen() {

  await limpiarAntiguos("demos/tortilleria/ventas");
  await limpiarAntiguos("demos/tortilleria/gastos");

  const snapVentas = await get(ref(db, "demos/tortilleria/ventas"));
  const snapGastos = await get(ref(db, "demos/tortilleria/gastos"));

  let totalVentas = 0;
  let totalGastos = 0;

  if (snapVentas.exists()) {
    snapVentas.forEach(c => {
      const v = c.val();
      totalVentas += Number(v.total || 0);
    });
  }

  if (snapGastos.exists()) {
    snapGastos.forEach(c => {
      const v = c.val();
      totalGastos += Number(v.monto || 0);
    });
  }

  const ganancia = totalVentas - totalGastos;

  stVentas.textContent = "$" + dinero(totalVentas);
  stGastos.textContent = "$" + dinero(totalGastos);
  stGanancia.textContent = "$" + dinero(ganancia);
}

cargarResumen();