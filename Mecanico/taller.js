(() => {
  const CLAVE = "kingland.taller.demo.v1";

  const ESTADOS = [
    "Diagnóstico",
    "En reparación",
    "Listo",
    "Entregado"
  ];

  const METODOS = [
    "Efectivo simulado",
    "Transferencia simulada",
    "Tarjeta simulada"
  ];

  const dinero = n => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(n / 100);
  };

  const esc = texto => {
    return String(texto).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  };

  const normalizar = texto => {
    return String(texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const uid = () => {
    return `${Date.now().toString(36)}-${
      Math.random().toString(36).slice(2, 9)
    }`;
  };

  function dia(fecha = new Date()) {
    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, "0"),
      String(fecha.getDate()).padStart(2, "0")
    ].join("-");
  }

  function mover(fecha, cantidad) {
    const resultado = new Date(`${fecha}T12:00:00`);
    resultado.setDate(resultado.getDate() + cantidad);
    return dia(resultado);
  }

  function fechaValida(valor) {
    return (
      typeof valor === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
      Number.isFinite(Date.parse(`${valor}T12:00:00`)) &&
      dia(new Date(`${valor}T12:00:00`)) === valor
    );
  }

  const fechaTexto = valor => {
    return new Date(`${valor}T12:00:00`).toLocaleDateString(
      "es-MX",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
  };

  function centavos(valor) {
    const texto = String(valor).trim();

    if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
      throw new Error(
        "Usa importes positivos con hasta dos decimales."
      );
    }

    const total = Math.round(Number(texto) * 100);

    if (
      !Number.isSafeInteger(total) ||
      total > 100000000
    ) {
      throw new Error(
        "El importe supera el límite del demo."
      );
    }

    return total;
  }

  function totalOrden(mano, precio, cantidad) {
    if (
      ![mano, precio, cantidad].every(Number.isSafeInteger) ||
      mano < 0 ||
      precio < 0 ||
      cantidad < 0 ||
      cantidad > 1000
    ) {
      throw new Error("Revisa los importes y cantidades.");
    }

    const total = mano + precio * cantidad;

    if (
      !Number.isSafeInteger(total) ||
      total <= 0 ||
      total > 100000000
    ) {
      throw new Error(
        "El total debe ser mayor que cero y estar dentro del límite del demo."
      );
    }

    return total;
  }

  const abonado = orden => {
    return orden.pagos.reduce(
      (suma, pago) => suma + pago.importe,
      0
    );
  };

  const saldo = orden => orden.total - abonado(orden);

  function comprobarExistencia(stock, cantidad) {
    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0 ||
      cantidad > 1000 ||
      cantidad > stock
    ) {
      throw new Error(
        "No hay suficientes unidades disponibles para esta orden."
      );
    }

    return stock - cantidad;
  }

  function ejemplos() {
    const hoy = dia();

    const vehiculos = [
      {
        id: "v1",
        cliente: "Cliente demo 01",
        modelo: "Sedán de muestra 2021",
        placas: "DEMO-101"
      },
      {
        id: "v2",
        cliente: "Cliente demo 02",
        modelo: "SUV de muestra 2020",
        placas: "DEMO-202"
      },
      {
        id: "v3",
        cliente: "Cliente demo 03",
        modelo: "Compacto de muestra 2022",
        placas: "DEMO-303"
      }
    ];

    const piezas = [
      {
        id: "r1",
        nombre: "Filtro de aceite",
        stock: 8,
        minimo: 3,
        precio: 18000
      },
      {
        id: "r2",
        nombre: "Aceite para motor · unidad demo",
        stock: 12,
        minimo: 5,
        precio: 22000
      },
      {
        id: "r3",
        nombre: "Juego de balatas",
        stock: 2,
        minimo: 3,
        precio: 85000
      },
      {
        id: "r4",
        nombre: "Bujía de muestra",
        stock: 0,
        minimo: 4,
        precio: 12500
      }
    ];

    const ordenes = [
      {
        id: "o3",
        folio: "OT-0003",
        vehiculo: "v3",
        servicio: "Cambio de aceite",
        detalle: "Orden ficticia para explorar la recepción.",
        ingreso: hoy,
        entrega: mover(hoy, 1),
        proxima: mover(hoy, 90),
        km: 45000,
        mano: 35000,
        pieza: {
          id: "r2",
          nombre: piezas[1].nombre,
          cantidad: 4,
          precio: 22000
        },
        total: 123000,
        estado: "Diagnóstico",
        pagos: [{
          id: "p3",
          importe: 40000,
          metodo: METODOS[0],
          fecha: new Date(`${hoy}T10:00:00`).toISOString()
        }]
      },
      {
        id: "o2",
        folio: "OT-0002",
        vehiculo: "v2",
        servicio: "Revisión de frenos",
        detalle: "Mantenimiento de demostración.",
        ingreso: mover(hoy, -1),
        entrega: hoy,
        proxima: mover(hoy, 120),
        km: 78000,
        mano: 55000,
        pieza: {
          id: "r3",
          nombre: piezas[2].nombre,
          cantidad: 1,
          precio: 85000
        },
        total: 140000,
        estado: "Listo",
        pagos: [{
          id: "p2",
          importe: 140000,
          metodo: METODOS[1],
          fecha: new Date(`${hoy}T11:00:00`).toISOString()
        }]
      },
      {
        id: "o1",
        folio: "OT-0001",
        vehiculo: "v1",
        servicio: "Diagnóstico general",
        detalle: "Servicio de ejemplo, sin vehículo real.",
        ingreso: mover(hoy, -3),
        entrega: mover(hoy, -2),
        proxima: mover(hoy, 60),
        km: 62000,
        mano: 45000,
        pieza: null,
        total: 45000,
        estado: "Entregado",
        pagos: [{
          id: "p1",
          importe: 45000,
          metodo: METODOS[0],
          fecha: new Date(
            `${mover(hoy, -2)}T12:00:00`
          ).toISOString()
        }]
      }
    ];

    return { vehiculos, piezas, ordenes };
  }

  function estadoValido(datos) {
    try {
      if (
        !datos ||
        !Array.isArray(datos.vehiculos) ||
        !Array.isArray(datos.piezas) ||
        !Array.isArray(datos.ordenes) ||
        datos.vehiculos.length > 150 ||
        datos.piezas.length > 150 ||
        datos.ordenes.length > 150
      ) {
        return false;
      }

      const texto = (valor, maximo) => {
        return (
          typeof valor === "string" &&
          valor.trim().length > 0 &&
          valor.length <= maximo
        );
      };

      const entero = (valor, maximo) => {
        return (
          Number.isSafeInteger(valor) &&
          valor >= 0 &&
          valor <= maximo
        );
      };

      if (!datos.vehiculos.every(v =>
        texto(v.id, 100) &&
        texto(v.cliente, 70) &&
        texto(v.modelo, 80) &&
        texto(v.placas, 15)
      )) {
        return false;
      }

      if (!datos.piezas.every(p =>
        texto(p.id, 100) &&
        texto(p.nombre, 80) &&
        entero(p.stock, 100000) &&
        entero(p.minimo, 100000) &&
        entero(p.precio, 100000000)
      )) {
        return false;
      }

      for (const lista of [
        datos.vehiculos,
        datos.piezas,
        datos.ordenes
      ]) {
        if (
          new Set(lista.map(item => item.id)).size !==
          lista.length
        ) {
          return false;
        }
      }

      if (
        new Set(
          datos.vehiculos.map(v => v.placas.toUpperCase())
        ).size !== datos.vehiculos.length
      ) {
        return false;
      }

      return datos.ordenes.every(orden => {
        if (
          !texto(orden.id, 100) ||
          !texto(orden.folio, 30) ||
          !datos.vehiculos.some(v => v.id === orden.vehiculo) ||
          !texto(orden.servicio, 100) ||
          typeof orden.detalle !== "string" ||
          orden.detalle.length > 400 ||
          !fechaValida(orden.ingreso) ||
          !fechaValida(orden.entrega) ||
          orden.entrega < orden.ingreso ||
          (
            orden.proxima &&
            (
              !fechaValida(orden.proxima) ||
              orden.proxima < orden.ingreso
            )
          ) ||
          !entero(orden.km, 9999999) ||
          !ESTADOS.includes(orden.estado) ||
          !Array.isArray(orden.pagos)
        ) {
          return false;
        }

        if (
          orden.pieza &&
          (
            !datos.piezas.some(p => p.id === orden.pieza.id) ||
            !texto(orden.pieza.nombre, 80) ||
            !entero(orden.pieza.precio, 100000000) ||
            !entero(orden.pieza.cantidad, 1000) ||
            orden.pieza.cantidad < 1
          )
        ) {
          return false;
        }

        if (
          totalOrden(
            orden.mano,
            orden.pieza?.precio || 0,
            orden.pieza?.cantidad || 0
          ) !== orden.total
        ) {
          return false;
        }

        if (!orden.pagos.every(pago =>
          texto(pago.id, 100) &&
          entero(pago.importe, orden.total) &&
          pago.importe > 0 &&
          METODOS.includes(pago.metodo) &&
          typeof pago.fecha === "string" &&
          Number.isFinite(Date.parse(pago.fecha))
        )) {
          return false;
        }

        return (
          abonado(orden) <= orden.total &&
          (
            orden.estado !== "Entregado" ||
            saldo(orden) === 0
          )
        );
      });
    } catch {
      return false;
    }
  }

  const app = document.getElementById("app");

  if (!app) return;

  const $ = selector => document.querySelector(selector);
  const vista = document.body.dataset.vista || "panel";

  let datos = ejemplos();
  let almacenamiento = true;
  let consulta = "";
  let filtro = "Todos";
  let ordenActiva = null;
  let focoAnterior;
  let temporizador;

  try {
    const guardado = localStorage.getItem(CLAVE);

    if (guardado !== null) {
      const leido = JSON.parse(guardado);

      if (!estadoValido(leido)) {
        throw new Error("Datos inválidos");
      }

      datos = leido;
    } else {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    }
  } catch {
    almacenamiento = false;
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      almacenamiento = true;
    } catch {
      almacenamiento = false;
    }

    $("#aviso-local").hidden = almacenamiento;
  }

  function avisar(texto) {
    $("#notificacion").textContent = texto;
    $("#notificacion").classList.add("visible");

    clearTimeout(temporizador);

    temporizador = setTimeout(() => {
      $("#notificacion").classList.remove("visible");
    }, 4500);
  }

  const vehiculo = orden => {
    return datos.vehiculos.find(
      v => v.id === orden.vehiculo
    );
  };

  const badge = orden => {
    return `
      <span class="badge estado-${ESTADOS.indexOf(orden.estado)}">
        ${orden.estado}
      </span>
    `;
  };

  const consultaWhats =
    "https://wa.me/522225354183?text=Hola%2C%20prob%C3%A9%20el%20demo%20de%20taller%20de%20King%20Land%20y%20me%20interesa%20cotizar%20un%20sistema%20para%20mi%20negocio.";

  function montar() {
    const navegacion = [
      ["panel", "taller.html", "◈", "Resumen del taller"],
      ["ordenes", "recibos.html", "▤", "Órdenes y recibos"],
      ["clientes", "clientes.html", "◎", "Clientes y vehículos"],
      ["inventario", "inventario.html", "▦", "Refacciones"]
    ];

    const titulos = {
      panel: [
        "Tu taller, bajo control.",
        "Un vistazo a los trabajos, cobros y refacciones de tu negocio."
      ],
      ordenes: [
        "Cada trabajo tiene su historia.",
        "Abre órdenes, registra abonos y prepara la entrega."
      ],
      clientes: [
        "Conoce cada vehículo.",
        "Organiza clientes de prueba y consulta sus servicios."
      ],
      inventario: [
        "La pieza correcta, a tiempo.",
        "Consulta existencias y anticipa lo que hace falta."
      ]
    };

    app.innerHTML = `
      <div class="demo-barra">
        <p>
          DEMO INTERACTIVO · Datos ficticios ·
          Sin servicios ni cobros reales
        </p>
        <a href="../index.html">Volver a King Land ↗</a>
      </div>

      <div class="layout">
        <aside class="sidebar">
          <a class="marca" href="taller.html">
            <span>m.</span>
            <div>MOTOR<small>TALLER DEMO</small></div>
          </a>

          <p class="nav-label">ESPACIO DE TRABAJO</p>

          <nav aria-label="Navegación del taller">
            ${navegacion.map(([id, url, icono, nombre]) => `
              <a
                href="${url}"
                ${id === vista ? 'aria-current="page"' : ""}
              >
                <span aria-hidden="true">${icono}</span>
                ${nombre}
              </a>
            `).join("")}
          </nav>

          <div class="sidebar-cta">
            <span>↗</span>
            <h3>Hecho para tu taller.</h3>
            <p>
              Podemos adaptar las funciones a tu forma de trabajar.
            </p>
            <a
              href="${consultaWhats}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar mi proyecto ↗
            </a>
          </div>

          <button type="button" class="reset" id="reset-demo">
            Restaurar demostración
          </button>
        </aside>

        <main id="contenido" class="main">
          <header class="pagina-head">
            <div>
              <p class="eyebrow">MOTOR / PANEL DE DEMOSTRACIÓN</p>
              <h1 tabindex="-1">${titulos[vista][0]}</h1>
              <p>${titulos[vista][1]}</p>
            </div>

            <button
              class="boton"
              type="button"
              data-accion="nueva"
            >
              ＋ Nueva orden
            </button>
          </header>

          <p
            class="aviso"
            id="aviso-local"
            ${almacenamiento ? "hidden" : ""}
          >
            No se pudieron recuperar o guardar los datos locales.
            Los ejemplos funcionan en esta pantalla, pero los cambios
            pueden perderse al navegar. Usa un navegador con
            almacenamiento disponible o restaura el demo.
          </p>

          <div class="stats" id="stats"></div>
          <div id="pantalla"></div>

          <footer class="pie">
            <span>Motor es un taller ficticio · Creado por King Land</span>
            <a href="../index.html">Ver más soluciones ↗</a>
          </footer>
        </main>
      </div>

      <div
        id="notificacion"
        class="notificacion"
        role="status"
        aria-live="polite"
      ></div>

      <dialog
        id="modal-orden"
        class="modal modal-ancha"
        aria-labelledby="titulo-nueva"
      >
        <div class="modal-head">
          <div>
            <p class="eyebrow">RECEPCIÓN DEL VEHÍCULO</p>
            <h2 id="titulo-nueva" tabindex="-1">
              Nueva orden de trabajo
            </h2>
          </div>

          <button
            class="cerrar"
            type="button"
            data-accion="cerrar"
            aria-label="Cerrar nueva orden"
          >×</button>
        </div>

        <div id="form-orden-contenedor"></div>
      </dialog>

      <dialog
        id="modal-recibo"
        class="modal"
        aria-labelledby="titulo-recibo"
      >
        <div class="modal-head">
          <h2 id="titulo-recibo" tabindex="-1">
            Orden y recibo
          </h2>

          <button
            class="cerrar"
            type="button"
            data-accion="cerrar"
            aria-label="Cerrar recibo"
          >×</button>
        </div>

        <div id="ticket"></div>
        <div id="acciones-recibo" class="acciones-recibo"></div>
      </dialog>

      <dialog
        id="modal-pago"
        class="modal modal-pequena"
        aria-labelledby="titulo-pago"
      >
        <div class="modal-head">
          <h2 id="titulo-pago" tabindex="-1">Registrar abono</h2>

          <button
            class="cerrar"
            type="button"
            data-accion="cerrar"
            aria-label="Cerrar abono"
          >×</button>
        </div>

        <p id="saldo-pago" class="aviso"></p>

        <form id="form-pago">
          <label for="importe-pago">Importe de prueba (MXN)</label>
          <input
            id="importe-pago"
            type="number"
            min="0.01"
            step="0.01"
            required
          >

          <label for="metodo-pago">Método</label>
          <select id="metodo-pago">
            ${METODOS.map(m => `<option>${m}</option>`).join("")}
          </select>

          <p class="nota">
            Solo se registra un abono ficticio.
            No se procesa ningún pago.
          </p>

          <p id="error-pago" class="error" role="alert"></p>

          <button class="boton ancho" type="submit">
            Registrar abono simulado
          </button>
        </form>
      </dialog>

      <dialog
        id="modal-historial"
        class="modal modal-ancha"
        aria-labelledby="titulo-historial"
      >
        <div class="modal-head">
          <h2 id="titulo-historial" tabindex="-1">
            Historial del vehículo
          </h2>

          <button
            class="cerrar"
            type="button"
            data-accion="cerrar"
            aria-label="Cerrar historial"
          >×</button>
        </div>

        <div id="historial-cuerpo"></div>
      </dialog>
    `;
  }

  function stats() {
    const valores = [
      [
        "Órdenes activas",
        datos.ordenes.filter(
          o => o.estado !== "Entregado"
        ).length,
        "Vehículos pendientes de entregar"
      ],
      [
        "Listos para entrega",
        datos.ordenes.filter(
          o => o.estado === "Listo"
        ).length,
        "Trabajos terminados"
      ],
      [
        "Saldo por cobrar",
        dinero(
          datos.ordenes.reduce(
            (suma, orden) => suma + saldo(orden),
            0
          )
        ),
        "Saldo actual de todas las órdenes"
      ],
      [
        "Stock bajo o agotado",
        datos.piezas.filter(
          pieza => pieza.stock <= pieza.minimo
        ).length,
        "Refacciones que requieren atención"
      ]
    ];

    $("#stats").innerHTML = valores.map(
      ([nombre, valor, nota], indice) => `
        <article class="stat stat-${indice}">
          <p>${nombre}</p>
          <strong>${valor}</strong>
          <small>${nota}</small>
        </article>
      `
    ).join("");
  }

  function tablaOrdenes(lista) {
    if (!lista.length) {
      return `
        <div class="vacio">
          <span>◌</span>
          <h3>No hay órdenes en esta vista</h3>
          <p>Prueba otra búsqueda o registra un trabajo.</p>
        </div>
      `;
    }

    return `
      <div class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Orden / cliente</th>
              <th>Vehículo</th>
              <th>Servicio / entrega</th>
              <th>Estado</th>
              <th>Saldo</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${lista.map(orden => {
              const v = vehiculo(orden);

              return `
                <tr>
                  <td>
                    <strong>${esc(orden.folio)}</strong>
                    <small>${esc(v.cliente)}</small>
                  </td>

                  <td>
                    ${esc(v.modelo)}
                    <small>${esc(v.placas)}</small>
                  </td>

                  <td>
                    ${esc(orden.servicio)}
                    <small>${fechaTexto(orden.entrega)}</small>
                  </td>

                  <td>${badge(orden)}</td>

                  <td>
                    <strong>${dinero(saldo(orden))}</strong>
                    <small>
                      ${saldo(orden) ? "Pendiente" : "Liquidado"}
                    </small>
                  </td>

                  <td>
                    <button
                      class="mini"
                      type="button"
                      data-accion="recibo"
                      data-id="${esc(orden.id)}"
                      aria-label="Ver orden ${esc(orden.folio)}"
                    >
                      Ver ↗
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function panel() {
    const total = datos.ordenes.reduce(
      (suma, orden) => suma + orden.total,
      0
    );

    const cobrado = datos.ordenes.reduce(
      (suma, orden) => suma + abonado(orden),
      0
    );

    $("#pantalla").innerHTML = `
      <section class="bienvenida">
        <div>
          <p class="eyebrow">MENOS PENDIENTES. MÁS CLARIDAD.</p>
          <h2>Del diagnóstico<br><em>a la entrega.</em></h2>

          <p>
            El cliente, su vehículo y el trabajo realizado
            permanecen conectados en una misma orden.
          </p>

          <button
            class="boton naranja"
            type="button"
            data-accion="nueva"
          >
            Registrar un trabajo ↗
          </button>
        </div>

        <div class="flujo">
          ${ESTADOS.map((estado, indice) => `
            <div>
              <span>0${indice + 1}</span>
              <strong>${estado}</strong>
              <small>
                ${
                  datos.ordenes.filter(
                    orden => orden.estado === estado
                  ).length
                } órdenes
              </small>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Últimas órdenes</h2>
          <a class="enlace" href="recibos.html">Ver todas ↗</a>
        </div>

        ${tablaOrdenes(datos.ordenes.slice(0, 5))}
      </section>

      <div class="resumen-grid">
        <section class="panel">
          <p class="eyebrow">COBROS DE DEMOSTRACIÓN</p>
          <h2>Una cuenta más clara.</h2>

          <div class="renglon">
            <span>Valor de todas las órdenes</span>
            <b>${dinero(total)}</b>
          </div>

          <div class="renglon">
            <span>Abonos registrados</span>
            <b>${dinero(cobrado)}</b>
          </div>

          <div class="renglon total">
            <span>Por cobrar</span>
            <strong>${dinero(total - cobrado)}</strong>
          </div>

          <p class="nota">
            Son importes de venta y cobros acumulados.
            No representan ganancias ni incluyen un cálculo de gastos.
          </p>
        </section>

        <section class="panel alerta-stock">
          <p class="eyebrow">ANTES DEL PRÓXIMO TRABAJO</p>
          <h2>Revisa tus refacciones.</h2>

          ${
            datos.piezas
              .filter(pieza => pieza.stock <= pieza.minimo)
              .map(pieza => `
                <div class="renglon">
                  <span>${esc(pieza.nombre)}</span>
                  <b>${pieza.stock} disponibles</b>
                </div>
              `).join("") ||
            '<p class="nota">Todas las refacciones están por encima del mínimo.</p>'
          }

          <a href="inventario.html" class="enlace">
            Abrir inventario ↗
          </a>
        </section>
      </div>
    `;
  }

  function ordenesPagina() {
    $("#pantalla").innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h2>Órdenes y recibos</h2>

          <button class="mini" type="button" id="exportar">
            Exportar vista CSV ↓
          </button>
        </div>

        <div class="filtros">
          <div>
            <label for="buscar">
              Buscar orden, cliente o placas
            </label>

            <input
              id="buscar"
              type="search"
              maxlength="80"
              placeholder="Ej. OT-0001 o DEMO-101"
            >
          </div>

          <div>
            <label for="filtro">Filtrar por estado</label>

            <select id="filtro">
              <option>Todos</option>
              ${ESTADOS.map(s => `<option>${s}</option>`).join("")}
              <option>Con saldo</option>
            </select>
          </div>
        </div>

        <p class="nota" id="contador" role="status"></p>
        <div id="lista-ordenes"></div>
      </section>
    `;

    $("#buscar").addEventListener("input", evento => {
      consulta = evento.target.value;
      pintarOrdenes();
    });

    $("#filtro").addEventListener("change", evento => {
      filtro = evento.target.value;
      pintarOrdenes();
    });

    $("#exportar").addEventListener("click", exportar);
    pintarOrdenes();
  }

  function filtradas() {
    return datos.ordenes.filter(orden => {
      const v = vehiculo(orden);

      const coincide = normalizar(
        `${orden.folio} ${v.cliente} ${v.placas} ${orden.servicio}`
      ).includes(normalizar(consulta));

      const estado = (
        filtro === "Todos" ||
        (
          filtro === "Con saldo"
            ? saldo(orden) > 0
            : orden.estado === filtro
        )
      );

      return coincide && estado;
    });
  }

  function pintarOrdenes() {
    const lista = filtradas();

    $("#contador").textContent =
      `${lista.length} órdenes · Saldo de esta vista: ${
        dinero(
          lista.reduce(
            (suma, orden) => suma + saldo(orden),
            0
          )
        )
      }`;

    $("#lista-ordenes").innerHTML = tablaOrdenes(lista);
  }

  function clientesPagina() {
    $("#pantalla").innerHTML = `
      <div class="resumen-grid">
        <section class="panel">
          <p class="eyebrow">NUEVO REGISTRO</p>
          <h2>Cliente y vehículo</h2>

          <p class="nota">
            Usa nombres y placas ficticias.
            No se solicitan teléfonos ni domicilios.
          </p>

          <form id="form-cliente">
            <label for="cliente">Cliente de prueba</label>
            <input
              id="cliente"
              maxlength="70"
              required
              placeholder="Cliente demo"
            >

            <label for="modelo">Modelo del vehículo</label>
            <input
              id="modelo"
              maxlength="80"
              required
              placeholder="Sedán de muestra 2021"
            >

            <label for="placas">Placas ficticias</label>
            <input
              id="placas"
              maxlength="15"
              required
              placeholder="DEMO-404"
              pattern="[A-Za-z0-9 -]{3,15}"
            >

            <p class="error" id="error-cliente" role="alert"></p>

            <button class="boton ancho" type="submit">
              Guardar vehículo de prueba
            </button>
          </form>
        </section>

        <section class="panel consejo">
          <span>◎</span>
          <h2>Un historial por vehículo.</h2>

          <p>
            Cada orden conserva el servicio, kilometraje,
            refacciones, abonos y la fecha sugerida del
            próximo mantenimiento.
          </p>

          <p class="nota">
            En esta versión, cada registro corresponde a un
            vehículo y su cliente. Un mismo cliente puede
            registrar varios vehículos.
          </p>
        </section>
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>Vehículos registrados</h2>
          <span class="nota">
            ${datos.vehiculos.length} registros
          </span>
        </div>

        <div class="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Placas demo</th>
                <th>Órdenes</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              ${datos.vehiculos.map(v => `
                <tr>
                  <td>${esc(v.cliente)}</td>
                  <td>${esc(v.modelo)}</td>
                  <td>${esc(v.placas)}</td>

                  <td>
                    ${
                      datos.ordenes.filter(
                        orden => orden.vehiculo === v.id
                      ).length
                    }
                  </td>

                  <td>
                    <button
                      class="mini"
                      type="button"
                      data-accion="historial"
                      data-id="${esc(v.id)}"
                    >
                      Historial ↗
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;

    $("#form-cliente").addEventListener("submit", evento => {
      evento.preventDefault();

      try {
        if (datos.vehiculos.length >= 150) {
          throw new Error(
            "Límite de 150 vehículos. Restaura el demo para comenzar otra prueba."
          );
        }

        const cliente = $("#cliente").value.trim();
        const modelo = $("#modelo").value.trim();
        const placas = $("#placas").value.trim().toUpperCase();

        if (
          !cliente ||
          !modelo ||
          !/^[A-Z0-9 -]{3,15}$/.test(placas)
        ) {
          throw new Error(
            "Completa el nombre, modelo y placas ficticias."
          );
        }

        if (
          datos.vehiculos.some(v => v.placas === placas)
        ) {
          throw new Error(
            "Esas placas ya están registradas en este demo."
          );
        }

        datos.vehiculos.push({
          id: uid(),
          cliente,
          modelo,
          placas
        });

        guardar();
        clientesPagina();

        avisar("Vehículo de prueba registrado.");
      } catch (error) {
        $("#error-cliente").textContent = error.message;
      }
    });
  }

  function inventarioPagina() {
    $("#pantalla").innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">CATÁLOGO DEL TALLER</p>
            <h2>Agregar una refacción</h2>
          </div>
        </div>

        <form id="form-pieza" class="form-inventario">
          <div>
            <label for="nombre-pieza">Nombre</label>
            <input
              id="nombre-pieza"
              maxlength="80"
              required
              placeholder="Refacción de muestra"
            >
          </div>

          <div>
            <label for="stock-pieza">Existencias</label>
            <input
              id="stock-pieza"
              type="number"
              min="0"
              max="100000"
              step="1"
              required
              value="0"
            >
          </div>

          <div>
            <label for="minimo-pieza">Stock mínimo</label>
            <input
              id="minimo-pieza"
              type="number"
              min="0"
              max="100000"
              step="1"
              required
              value="3"
            >
          </div>

          <div>
            <label for="precio-pieza">
              Precio de venta (MXN)
            </label>

            <input
              id="precio-pieza"
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              required
            >
          </div>

          <button class="boton" type="submit">
            Agregar refacción
          </button>
        </form>

        <p id="error-pieza" class="error" role="alert"></p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Existencias disponibles</h2>
          <span class="badge">Inventario ficticio</span>
        </div>

        <p class="nota">
          Las refacciones se descuentan al registrar una orden.
          Los botones +1 y −1 permiten simular ajustes manuales
          de existencias.
        </p>

        <div class="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Refacción</th>
                <th>Precio</th>
                <th>Disponible</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th>Ajustar</th>
              </tr>
            </thead>

            <tbody>
              ${datos.piezas.map(pieza => `
                <tr>
                  <td><strong>${esc(pieza.nombre)}</strong></td>
                  <td>${dinero(pieza.precio)}</td>
                  <td>${pieza.stock}</td>
                  <td>${pieza.minimo}</td>

                  <td>
                    <span
                      class="badge ${
                        pieza.stock <= pieza.minimo
                          ? "advertencia"
                          : ""
                      }"
                    >
                      ${
                        pieza.stock === 0
                          ? "Agotado"
                          : pieza.stock <= pieza.minimo
                            ? "Stock bajo"
                            : "Disponible"
                      }
                    </span>
                  </td>

                  <td>
                    <div class="ajustes">
                      <button
                        class="mini"
                        type="button"
                        data-accion="menos-stock"
                        data-id="${esc(pieza.id)}"
                        aria-label="Restar una unidad de ${esc(pieza.nombre)}"
                        ${pieza.stock === 0 ? "disabled" : ""}
                      >−1</button>

                      <button
                        class="mini"
                        type="button"
                        data-accion="mas-stock"
                        data-id="${esc(pieza.id)}"
                        aria-label="Sumar una unidad de ${esc(pieza.nombre)}"
                        ${pieza.stock >= 100000 ? "disabled" : ""}
                      >+1</button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;

    $("#form-pieza").addEventListener("submit", evento => {
      evento.preventDefault();

      try {
        if (datos.piezas.length >= 150) {
          throw new Error(
            "Límite de 150 refacciones en este demo."
          );
        }

        const nombre = $("#nombre-pieza").value.trim();
        const stock = Number($("#stock-pieza").value);
        const minimo = Number($("#minimo-pieza").value);
        const precio = centavos($("#precio-pieza").value);

        if (
          !nombre ||
          ![stock, minimo].every(n =>
            Number.isInteger(n) &&
            n >= 0 &&
            n <= 100000
          ) ||
          precio <= 0
        ) {
          throw new Error(
            "Revisa los datos de la refacción."
          );
        }

        if (
          datos.piezas.some(
            pieza =>
              normalizar(pieza.nombre) === normalizar(nombre)
          )
        ) {
          throw new Error(
            "Ya existe una refacción con ese nombre."
          );
        }

        datos.piezas.push({
          id: uid(),
          nombre,
          stock,
          minimo,
          precio
        });

        guardar();
        stats();
        inventarioPagina();

        avisar("Refacción de prueba agregada.");
      } catch (error) {
        $("#error-pieza").textContent = error.message;
      }
    });
  }

  function abrir(id) {
    if (!document.querySelector("dialog[open]")) {
      focoAnterior = document.activeElement;
    }

    document.querySelectorAll("dialog[open]").forEach(dialogo => {
      dialogo.close();
    });

    const dialogo = document.getElementById(id);

    dialogo.showModal();

    dialogo.querySelector('[tabindex="-1"]')?.focus({
      preventScroll: true
    });
  }

  function nuevaOrden() {
    if (!datos.vehiculos.length) {
      avisar(
        "Primero registra un vehículo en Clientes y vehículos."
      );
      return;
    }

    $("#form-orden-contenedor").innerHTML = `
      <form id="form-orden">
        <div class="dos-columnas">
          <div class="campo completa">
            <label for="orden-vehiculo">Cliente y vehículo</label>

            <select id="orden-vehiculo">
              ${datos.vehiculos.map(v => `
                <option value="${esc(v.id)}">
                  ${esc(v.cliente)} ·
                  ${esc(v.modelo)} ·
                  ${esc(v.placas)}
                </option>
              `).join("")}
            </select>

            <small>
              ¿Es un vehículo nuevo?
              Regístralo primero en
              <a href="clientes.html">Clientes y vehículos</a>.
            </small>
          </div>

          <div class="campo completa">
            <label for="orden-servicio">Servicio o trabajo</label>
            <input
              id="orden-servicio"
              maxlength="100"
              required
              placeholder="Ej. Cambio de aceite"
            >
          </div>

          <div class="campo">
            <label for="orden-ingreso">Ingreso</label>
            <input
              id="orden-ingreso"
              type="date"
              value="${dia()}"
              required
            >
          </div>

          <div class="campo">
            <label for="orden-entrega">Entrega estimada</label>
            <input
              id="orden-entrega"
              type="date"
              value="${mover(dia(), 1)}"
              required
            >
          </div>

          <div class="campo">
            <label for="orden-km">Kilometraje de prueba</label>
            <input
              id="orden-km"
              type="number"
              min="0"
              max="9999999"
              step="1"
              value="50000"
              required
            >
          </div>

          <div class="campo">
            <label for="orden-proxima">
              Próximo mantenimiento (opcional)
            </label>
            <input id="orden-proxima" type="date">
          </div>

          <div class="campo">
            <label for="orden-mano">Mano de obra (MXN)</label>
            <input
              id="orden-mano"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value="350"
              required
            >
          </div>

          <div class="campo">
            <label for="orden-anticipo">Anticipo (MXN)</label>
            <input
              id="orden-anticipo"
              type="number"
              min="0"
              step="0.01"
              value="0"
              required
            >
          </div>

          <div class="campo">
            <label for="orden-pieza">Refacción (opcional)</label>

            <select id="orden-pieza">
              <option value="">Sin refacción</option>

              ${datos.piezas.map(pieza => `
                <option
                  value="${esc(pieza.id)}"
                  ${pieza.stock === 0 ? "disabled" : ""}
                >
                  ${esc(pieza.nombre)} ·
                  ${dinero(pieza.precio)} ·
                  ${pieza.stock} disponibles
                </option>
              `).join("")}
            </select>
          </div>

          <div class="campo">
            <label for="orden-cantidad">
              Unidades de refacción
            </label>
            <input
              id="orden-cantidad"
              type="number"
              min="1"
              max="1000"
              step="1"
              value="1"
              disabled
              required
            >
          </div>

          <div class="campo completa">
            <label for="orden-metodo">Método del anticipo</label>

            <select id="orden-metodo">
              ${METODOS.map(m => `<option>${m}</option>`).join("")}
            </select>
          </div>

          <div class="campo completa">
            <label for="orden-detalle">Detalle del trabajo</label>
            <textarea
              id="orden-detalle"
              rows="2"
              maxlength="400"
              placeholder="Observaciones ficticias del servicio"
            ></textarea>
          </div>
        </div>

        <div
          id="resumen-orden"
          class="resumen-orden"
          role="status"
        ></div>

        <p class="nota">
          Esta versión permite una refacción por orden, con varias
          unidades. El inventario se descuenta al guardar.
          Todo es una simulación.
        </p>

        <p id="error-orden" class="error" role="alert"></p>

        <button class="boton ancho" type="submit">
          Crear orden y generar recibo ↗
        </button>
      </form>
    `;

    $("#orden-pieza").addEventListener("change", () => {
      const pieza = datos.piezas.find(
        item => item.id === $("#orden-pieza").value
      );

      $("#orden-cantidad").disabled = !pieza;

      $("#orden-cantidad").max = pieza
        ? Math.min(1000, pieza.stock)
        : 1000;

      $("#orden-cantidad").value = 1;

      calcularVista();
    });

    $("#form-orden").addEventListener(
      "input",
      calcularVista
    );

    $("#form-orden").addEventListener(
      "submit",
      crearOrden
    );

    calcularVista();
    abrir("modal-orden");
  }

  function leerOrden() {
    const mano = centavos($("#orden-mano").value);
    const anticipo = centavos($("#orden-anticipo").value);

    const pieza = datos.piezas.find(
      item => item.id === $("#orden-pieza").value
    );

    const cantidad = pieza
      ? Number($("#orden-cantidad").value)
      : 0;

    if (pieza) {
      comprobarExistencia(pieza.stock, cantidad);
    }

    const total = totalOrden(
      mano,
      pieza?.precio || 0,
      cantidad
    );

    if (anticipo > total) {
      throw new Error(
        "El anticipo no puede superar el total."
      );
    }

    return {
      mano,
      anticipo,
      pieza,
      cantidad,
      total
    };
  }

  function calcularVista() {
    try {
      const calculo = leerOrden();

      $("#orden-anticipo").max =
        (calculo.total / 100).toFixed(2);

      $("#orden-entrega").min = $("#orden-ingreso").value;
      $("#orden-proxima").min = $("#orden-ingreso").value;

      $("#resumen-orden").innerHTML = `
        <div>
          <span>Mano de obra</span>
          <b>${dinero(calculo.mano)}</b>
        </div>

        <div>
          <span>Refacciones</span>
          <b>
            ${
              dinero(
                (calculo.pieza?.precio || 0) * calculo.cantidad
              )
            }
          </b>
        </div>

        <div>
          <span>Total simulado</span>
          <strong>${dinero(calculo.total)}</strong>
        </div>

        <div>
          <span>Saldo pendiente</span>
          <b>${dinero(calculo.total - calculo.anticipo)}</b>
        </div>
      `;
    } catch (error) {
      $("#resumen-orden").textContent = error.message;
    }
  }

  function crearOrden(evento) {
    evento.preventDefault();
    $("#error-orden").textContent = "";

    try {
      if (datos.ordenes.length >= 150) {
        throw new Error(
          "Límite de 150 órdenes. Restaura el demo para comenzar otra prueba."
        );
      }

      const calculo = leerOrden();
      const ingreso = $("#orden-ingreso").value;
      const entrega = $("#orden-entrega").value;
      const proxima = $("#orden-proxima").value;
      const servicio = $("#orden-servicio").value.trim();
      const km = Number($("#orden-km").value);

      const seleccionado = datos.vehiculos.find(
        item => item.id === $("#orden-vehiculo").value
      );

      if (
        !seleccionado ||
        !servicio ||
        !fechaValida(ingreso) ||
        !fechaValida(entrega) ||
        entrega < ingreso ||
        (
          proxima &&
          (
            !fechaValida(proxima) ||
            proxima < ingreso
          )
        ) ||
        !Number.isInteger(km) ||
        km < 0 ||
        km > 9999999
      ) {
        throw new Error(
          "Revisa el servicio, las fechas y el kilometraje."
        );
      }

      const metodo = $("#orden-metodo").value;

      if (!METODOS.includes(metodo)) {
        throw new Error(
          "Selecciona un método de pago de prueba."
        );
      }

      const numero = Math.max(
        0,
        ...datos.ordenes.map(orden =>
          Number(orden.folio.replace("OT-", "")) || 0
        )
      ) + 1;

      const orden = {
        id: uid(),
        folio: `OT-${String(numero).padStart(4, "0")}`,
        vehiculo: seleccionado.id,
        servicio,
        detalle: $("#orden-detalle").value.trim(),
        ingreso,
        entrega,
        proxima,
        km,
        mano: calculo.mano,
        pieza: calculo.pieza
          ? {
              id: calculo.pieza.id,
              nombre: calculo.pieza.nombre,
              cantidad: calculo.cantidad,
              precio: calculo.pieza.precio
            }
          : null,
        total: calculo.total,
        estado: "Diagnóstico",
        pagos: calculo.anticipo
          ? [{
              id: uid(),
              importe: calculo.anticipo,
              metodo,
              fecha: new Date().toISOString()
            }]
          : []
      };

      if (calculo.pieza) {
        calculo.pieza.stock = comprobarExistencia(
          calculo.pieza.stock,
          calculo.cantidad
        );
      }

      datos.ordenes.unshift(orden);

      guardar();
      actualizar();
      recibo(orden.id);

      avisar("Orden de prueba registrada.");
    } catch (error) {
      $("#error-orden").textContent = error.message;
    }
  }

  function recibo(id) {
    const orden = datos.ordenes.find(
      item => item.id === id
    );

    if (!orden) return;

    ordenActiva = id;

    const v = vehiculo(orden);

    $("#ticket").innerHTML = `
      <div class="ticket-marca">
        <span>m.</span>
        <h3>MOTOR</h3>
        <p>Taller mecánico de demostración</p>
        <small>SIN VALIDEZ FISCAL · SIN COBRO REAL</small>
      </div>

      <div class="ticket-folio">
        <strong>${esc(orden.folio)}</strong>
        ${badge(orden)}
      </div>

      <dl class="ticket-datos">
        <div>
          <dt>Cliente ficticio</dt>
          <dd>${esc(v.cliente)}</dd>
        </div>

        <div>
          <dt>Vehículo</dt>
          <dd>${esc(v.modelo)}</dd>
        </div>

        <div>
          <dt>Placas de prueba</dt>
          <dd>${esc(v.placas)}</dd>
        </div>

        <div>
          <dt>Kilometraje</dt>
          <dd>${orden.km.toLocaleString("es-MX")} km</dd>
        </div>

        <div>
          <dt>Ingreso</dt>
          <dd>${fechaTexto(orden.ingreso)}</dd>
        </div>

        <div>
          <dt>Entrega estimada</dt>
          <dd>${fechaTexto(orden.entrega)}</dd>
        </div>
      </dl>

      <h4>${esc(orden.servicio)}</h4>

      <p class="ticket-nota">
        ${esc(orden.detalle || "Sin observaciones adicionales.")}
      </p>

      <div class="renglon">
        <span>Mano de obra</span>
        <b>${dinero(orden.mano)}</b>
      </div>

      ${
        orden.pieza
          ? `
            <div class="renglon">
              <span>
                ${esc(orden.pieza.nombre)}
                <small>
                  ${orden.pieza.cantidad} ×
                  ${dinero(orden.pieza.precio)}
                </small>
              </span>
              <b>
                ${
                  dinero(
                    orden.pieza.cantidad * orden.pieza.precio
                  )
                }
              </b>
            </div>
          `
          : ""
      }

      <div class="renglon total">
        <span>Total simulado</span>
        <strong>${dinero(orden.total)}</strong>
      </div>

      <div class="renglon">
        <span>Abonado</span>
        <b>${dinero(abonado(orden))}</b>
      </div>

      <div class="saldo">
        <span>Saldo pendiente</span>
        <strong>${dinero(saldo(orden))}</strong>
      </div>

      ${
        orden.proxima
          ? `
            <p class="proxima">
              Próximo mantenimiento sugerido:
              <b>${fechaTexto(orden.proxima)}</b>
            </p>
          `
          : ""
      }

      <h4>Abonos de prueba</h4>

      ${
        orden.pagos.length
          ? orden.pagos.map(pago => `
              <div class="movimiento">
                <span>
                  ${esc(pago.metodo)}
                  <small>
                    ${
                      esc(
                        new Date(pago.fecha).toLocaleString("es-MX")
                      )
                    }
                  </small>
                </span>
                <b>${dinero(pago.importe)}</b>
              </div>
            `).join("")
          : '<p class="nota">Sin abonos registrados.</p>'
      }

      <p class="nota">
        Este recibo demuestra el funcionamiento de un sistema.
        No representa un trabajo contratado ni un pago real.
      </p>
    `;

    const siguiente = ESTADOS[
      ESTADOS.indexOf(orden.estado) + 1
    ];

    $("#acciones-recibo").innerHTML = `
      ${
        saldo(orden)
          ? `<button
               class="boton"
               type="button"
               data-accion="abonar"
             >Registrar abono</button>`
          : ""
      }

      ${
        siguiente
          ? `<button
               class="boton secundario"
               type="button"
               data-accion="avanzar"
               ${
                 siguiente === "Entregado" && saldo(orden) > 0
                   ? "disabled"
                   : ""
               }
             >Marcar: ${siguiente}</button>`
          : ""
      }

      ${
        siguiente === "Entregado" && saldo(orden) > 0
          ? '<p class="nota">Liquida el saldo antes de marcar la entrega.</p>'
          : ""
      }

      <button
        class="mini"
        type="button"
        data-accion="descargar"
      >
        Descargar TXT ↓
      </button>

      <button
        class="mini"
        type="button"
        data-accion="imprimir"
      >
        Imprimir / PDF
      </button>
    `;

    abrir("modal-recibo");
  }

  function actualizar() {
    stats();

    if (vista === "panel") panel();
    if (vista === "ordenes") pintarOrdenes();
    if (vista === "inventario") inventarioPagina();
    if (vista === "clientes") clientesPagina();
  }

  function descargar(texto, nombre, tipo) {
    const url = URL.createObjectURL(
      new Blob([texto], { type: tipo })
    );

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombre;

    document.body.append(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function exportar() {
    const celda = valor => {
      let texto = String(valor);

      if (/^\s*[=+@-]/.test(texto)) {
        texto = "'" + texto;
      }

      return `"${texto.replace(/"/g, '""')}"`;
    };

    const filas = [
      [
        "Folio",
        "Cliente ficticio",
        "Vehículo",
        "Placas demo",
        "Servicio",
        "Estado",
        "Ingreso",
        "Entrega",
        "Total MXN",
        "Abonado MXN",
        "Saldo MXN"
      ],
      ...filtradas().map(orden => {
        const v = vehiculo(orden);

        return [
          orden.folio,
          v.cliente,
          v.modelo,
          v.placas,
          orden.servicio,
          orden.estado,
          orden.ingreso,
          orden.entrega,
          (orden.total / 100).toFixed(2),
          (abonado(orden) / 100).toFixed(2),
          (saldo(orden) / 100).toFixed(2)
        ];
      })
    ];

    descargar(
      "\uFEFF" + filas
        .map(fila => fila.map(celda).join(","))
        .join("\r\n"),
      "ordenes-demo-taller.csv",
      "text/csv;charset=utf-8"
    );
  }

  montar();
  stats();

  if (vista === "panel") panel();
  if (vista === "ordenes") ordenesPagina();
  if (vista === "clientes") clientesPagina();
  if (vista === "inventario") inventarioPagina();

  document.querySelectorAll("dialog").forEach(dialogo => {
    dialogo.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) {
        const destino = focoAnterior?.isConnected
          ? focoAnterior
          : $("h1");

        destino.focus({ preventScroll: true });
      }
    });

    dialogo.addEventListener("click", evento => {
      if (evento.target !== dialogo) return;

      const rect = dialogo.getBoundingClientRect();

      if (
        evento.clientX < rect.left ||
        evento.clientX > rect.right ||
        evento.clientY < rect.top ||
        evento.clientY > rect.bottom
      ) {
        dialogo.close();
      }
    });
  });

  document.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-accion]");

    if (!boton || boton.disabled) return;

    const { accion, id } = boton.dataset;

    if (accion === "cerrar") {
      boton.closest("dialog").close();
    }

    if (accion === "nueva") {
      nuevaOrden();
    }

    if (accion === "recibo") {
      recibo(id);
    }

    if (accion === "historial") {
      const v = datos.vehiculos.find(
        item => item.id === id
      );

      if (v) {
        $("#titulo-historial").textContent =
          `Historial · ${v.placas}`;

        $("#historial-cuerpo").innerHTML = `
          <p class="nota">
            ${esc(v.cliente)} · ${esc(v.modelo)}
          </p>

          ${
            tablaOrdenes(
              datos.ordenes.filter(
                orden => orden.vehiculo === id
              )
            )
          }
        `;

        abrir("modal-historial");
      }
    }

    if (
      ["mas-stock", "menos-stock"].includes(accion)
    ) {
      const pieza = datos.piezas.find(
        item => item.id === id
      );

      if (!pieza) return;

      pieza.stock = Math.max(
        0,
        Math.min(
          100000,
          pieza.stock + (accion === "mas-stock" ? 1 : -1)
        )
      );

      guardar();
      stats();
      inventarioPagina();

      const destino = $("#pantalla").querySelector(
        `[data-accion="${accion}"][data-id="${id}"]:not(:disabled)`
      );

      (destino || $("h1")).focus({
        preventScroll: true
      });
    }

    const orden = datos.ordenes.find(
      item => item.id === ordenActiva
    );

    if (!orden) return;

    if (accion === "abonar") {
      $("#error-pago").textContent = "";

      $("#saldo-pago").textContent =
        `${orden.folio} · Pendiente: ${dinero(saldo(orden))}`;

      $("#importe-pago").value =
        (saldo(orden) / 100).toFixed(2);

      $("#importe-pago").max =
        (saldo(orden) / 100).toFixed(2);

      abrir("modal-pago");
    }

    if (accion === "avanzar") {
      const siguiente = ESTADOS[
        ESTADOS.indexOf(orden.estado) + 1
      ];

      if (
        !siguiente ||
        (
          siguiente === "Entregado" &&
          saldo(orden) > 0
        )
      ) {
        return;
      }

      orden.estado = siguiente;

      guardar();
      actualizar();
      recibo(orden.id);

      avisar(
        `Orden marcada como ${siguiente.toLowerCase()}.`
      );
    }

    if (accion === "imprimir") {
      window.print();
    }

    if (accion === "descargar") {
      const v = vehiculo(orden);

      const texto = [
        "MOTOR — TALLER DEMO",
        "SIN VALIDEZ FISCAL · SIN COBRO REAL",
        `Folio: ${orden.folio}`,
        `Cliente ficticio: ${v.cliente}`,
        `Vehículo: ${v.modelo}`,
        `Placas demo: ${v.placas}`,
        `Kilometraje: ${orden.km}`,
        `Servicio: ${orden.servicio}`,
        `Detalle: ${orden.detalle}`,
        `Ingreso: ${orden.ingreso}`,
        `Entrega estimada: ${orden.entrega}`,
        `Estado: ${orden.estado}`,
        `Mano de obra: ${dinero(orden.mano)}`,
        orden.pieza
          ? `Refacción: ${orden.pieza.nombre} | ${
              orden.pieza.cantidad
            } × ${dinero(orden.pieza.precio)}`
          : "Sin refacciones",
        `TOTAL: ${dinero(orden.total)}`,
        `Abonado: ${dinero(abonado(orden))}`,
        `Saldo: ${dinero(saldo(orden))}`,
        `Próximo mantenimiento: ${orden.proxima || "No definido"}`,
        "",
        "ABONOS",
        ...orden.pagos.map(pago =>
          `${
            new Date(pago.fecha).toLocaleString("es-MX")
          } | ${pago.metodo} | ${dinero(pago.importe)}`
        )
      ].join("\n");

      descargar(
        texto,
        "recibo-demo-taller.txt",
        "text/plain;charset=utf-8"
      );
    }
  });

  $("#form-pago").addEventListener("submit", evento => {
    evento.preventDefault();

    try {
      const orden = datos.ordenes.find(
        item => item.id === ordenActiva
      );

      const importe = centavos(
        $("#importe-pago").value
      );

      const metodo = $("#metodo-pago").value;

      if (
        !orden ||
        importe <= 0 ||
        importe > saldo(orden) ||
        !METODOS.includes(metodo)
      ) {
        throw new Error(
          "El abono debe ser mayor que cero y no superar el saldo."
        );
      }

      orden.pagos.push({
        id: uid(),
        importe,
        metodo,
        fecha: new Date().toISOString()
      });

      guardar();
      actualizar();
      recibo(orden.id);

      avisar("Abono de prueba registrado.");
    } catch (error) {
      $("#error-pago").textContent = error.message;
    }
  });

  $("#reset-demo").addEventListener("click", () => {
    const confirmar = window.confirm(
      "¿Reemplazar los vehículos, las órdenes y las refacciones de este navegador por los ejemplos iniciales?"
    );

    if (!confirmar) return;

    datos = ejemplos();

    guardar();
    stats();

    if (vista === "panel") panel();
    if (vista === "ordenes") pintarOrdenes();
    if (vista === "clientes") clientesPagina();
    if (vista === "inventario") inventarioPagina();

    avisar("Demostración restaurada.");
  });
})();