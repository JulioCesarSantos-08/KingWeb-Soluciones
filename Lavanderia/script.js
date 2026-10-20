(() => {
  const CLAVE = "kingland.lavanderia.demo.v1";

  const SERVICIOS = {
    lavado: {
      nombre: "Lavado",
      tarifa: 2500,
      unidad: "kg"
    },
    completo: {
      nombre: "Lavado + secado",
      tarifa: 4000,
      unidad: "kg"
    },
    planchado: {
      nombre: "Planchado",
      tarifa: 1800,
      unidad: "piezas"
    }
  };

  const ESTADOS = [
    "Recibido",
    "En proceso",
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

  function dia(fecha = new Date()) {
    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, "0"),
      String(fecha.getDate()).padStart(2, "0")
    ].join("-");
  }

  function moverDia(cadena, dias) {
    const fecha = new Date(`${cadena}T12:00:00`);
    fecha.setDate(fecha.getDate() + dias);
    return dia(fecha);
  }

  function fechaValida(valor) {
    return (
      typeof valor === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
      !Number.isNaN(new Date(`${valor}T12:00:00`).getTime()) &&
      dia(new Date(`${valor}T12:00:00`)) === valor
    );
  }

  function fechaTexto(valor) {
    return new Date(`${valor}T12:00:00`).toLocaleDateString(
      "es-MX",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
  }

  function calcular(servicio, cantidad, urgente) {
    const configuracion = SERVICIOS[servicio];

    if (
      !configuracion ||
      !Number.isFinite(cantidad) ||
      cantidad <= 0 ||
      cantidad > 100
    ) {
      throw new Error("Revisa la cantidad del servicio.");
    }

    if (
      configuracion.unidad === "piezas" &&
      !Number.isInteger(cantidad)
    ) {
      throw new Error(
        "El planchado se cobra por piezas completas."
      );
    }

    if (
      Math.abs(
        cantidad * 10 - Math.round(cantidad * 10)
      ) > 0.000001
    ) {
      throw new Error(
        "Usa como máximo un decimal en los kilos."
      );
    }

    const subtotal = Math.round(
      configuracion.tarifa * cantidad
    );

    const extra = urgente
      ? Math.round(subtotal * 0.25)
      : 0;

    return {
      subtotal,
      extra,
      total: subtotal + extra
    };
  }

  const pagado = orden => {
    return orden.pagos.reduce(
      (suma, pago) => suma + pago.importe,
      0
    );
  };

  const saldo = orden => orden.total - pagado(orden);

  const vencido = orden => {
    return (
      orden.estado !== "Entregado" &&
      new Date(
        `${orden.entrega}T${orden.hora}:00`
      ).getTime() < Date.now()
    );
  };

  function ordenValida(orden) {
    try {
      if (
        !orden ||
        typeof orden.id !== "string" ||
        typeof orden.folio !== "string" ||
        typeof orden.cliente !== "string" ||
        !orden.cliente.trim() ||
        orden.cliente.length > 70 ||
        typeof orden.nota !== "string" ||
        orden.nota.length > 250
      ) {
        return false;
      }

      if (
        !fechaValida(orden.ingreso) ||
        !fechaValida(orden.entrega) ||
        orden.entrega < orden.ingreso ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(orden.hora)
      ) {
        return false;
      }

      if (
        typeof orden.urgente !== "boolean" ||
        !ESTADOS.includes(orden.estado) ||
        calcular(
          orden.servicio,
          orden.cantidad,
          orden.urgente
        ).total !== orden.total ||
        !Array.isArray(orden.pagos)
      ) {
        return false;
      }

      const pagosValidos = orden.pagos.every(pago =>
        pago &&
        typeof pago.id === "string" &&
        Number.isSafeInteger(pago.importe) &&
        pago.importe > 0 &&
        METODOS.includes(pago.metodo) &&
        typeof pago.fecha === "string" &&
        Number.isFinite(Date.parse(pago.fecha))
      );

      if (!pagosValidos) return false;

      return (
        pagado(orden) <= orden.total &&
        (
          orden.estado !== "Entregado" ||
          saldo(orden) === 0
        )
      );
    } catch {
      return false;
    }
  }

  function crearEjemplos() {
    const hoy = dia();

    const ejemplos = [
      ["completo", 6, false, -5, -3, "Entregado", 24000],
      ["lavado", 8, false, -3, -1, "En proceso", 10000],
      ["planchado", 10, false, -2, 0, "Listo", 18000],
      ["completo", 4.5, true, -1, 0, "Listo", 10000],
      ["lavado", 5, false, 0, 1, "Recibido", 0],
      ["completo", 7, false, 0, 2, "En proceso", 14000]
    ];

    return ejemplos.map((ejemplo, indice) => {
      const ingreso = moverDia(hoy, ejemplo[3]);

      return {
        id: `ejemplo-${indice + 1}`,
        folio: `BR-${String(indice + 1).padStart(4, "0")}`,
        cliente: `Cliente demo ${String(indice + 1).padStart(2, "0")}`,
        servicio: ejemplo[0],
        cantidad: ejemplo[1],
        urgente: ejemplo[2],
        ingreso,
        entrega: moverDia(hoy, ejemplo[4]),
        hora: "18:00",
        estado: ejemplo[5],
        total: calcular(
          ejemplo[0],
          ejemplo[1],
          ejemplo[2]
        ).total,
        nota: "Registro ficticio para explorar la demostración.",
        pagos: ejemplo[6]
          ? [{
              id: `pago-ejemplo-${indice}`,
              importe: ejemplo[6],
              metodo: METODOS[indice % METODOS.length],
              fecha: new Date(
                `${ingreso}T10:00:00`
              ).toISOString()
            }]
          : []
      };
    });
  }

  function resumen(ordenes, desde, hasta) {
    const rango = ordenes.filter(orden =>
      orden.ingreso >= desde &&
      orden.ingreso <= hasta
    );

    const cobros = ordenes
      .flatMap(orden => orden.pagos)
      .filter(pago => {
        const fecha = dia(new Date(pago.fecha));
        return fecha >= desde && fecha <= hasta;
      });

    const ventas = rango.reduce(
      (suma, orden) => suma + orden.total,
      0
    );

    return {
      cantidad: rango.length,
      ventas,
      cobrado: cobros.reduce(
        (suma, pago) => suma + pago.importe,
        0
      ),
      pendiente: rango.reduce(
        (suma, orden) => suma + saldo(orden),
        0
      ),
      ticket: rango.length
        ? Math.round(ventas / rango.length)
        : 0
    };
  }

  const app = document.getElementById("app");

  if (!app) return;

  const $ = selector => document.querySelector(selector);
  const vista = document.body.dataset.vista || "nuevo";

  let ordenes = [];
  let persistente = true;
  let ordenAbierta = null;
  let ultimoFoco = null;
  let temporizador;
  let busqueda = "";
  let filtroEstado = "Todos";
  let filtroPago = "Todos";
  let desde = moverDia(dia(), -6);
  let hasta = dia();

  function leer() {
    try {
      const guardado = localStorage.getItem(CLAVE);

      if (guardado === null) {
        ordenes = crearEjemplos();

        localStorage.setItem(
          CLAVE,
          JSON.stringify(ordenes)
        );
      } else {
        const datos = JSON.parse(guardado);

        if (
          !Array.isArray(datos) ||
          datos.length > 150 ||
          !datos.every(ordenValida) ||
          new Set(datos.map(orden => orden.id)).size !== datos.length
        ) {
          throw new Error("Datos no válidos");
        }

        ordenes = datos;
      }
    } catch {
      persistente = false;
      ordenes = crearEjemplos();
    }
  }

  function guardar() {
    try {
      localStorage.setItem(
        CLAVE,
        JSON.stringify(ordenes)
      );

      persistente = true;
    } catch {
      persistente = false;
    }

    $("#aviso-almacenamiento").hidden = persistente;
  }

  function avisar(texto) {
    const aviso = $("#notificacion");

    aviso.textContent = texto;
    aviso.classList.add("visible");

    clearTimeout(temporizador);

    temporizador = setTimeout(() => {
      aviso.classList.remove("visible");
    }, 4500);
  }

  const badge = orden => {
    return `
      <span class="badge estado-${ESTADOS.indexOf(orden.estado)}">
        ${orden.estado}
      </span>
    `;
  };

  const enlaceConsulta =
    "https://wa.me/522225354183?text=Hola%2C%20prob%C3%A9%20el%20demo%20de%20lavander%C3%ADa%20de%20King%20Land%20y%20me%20interesa%20un%20sistema%20para%20mi%20negocio.";

  function montar() {
    const enlaces = [
      ["nuevo", "lavanderia.html", "＋", "Nuevo servicio"],
      ["pedidos", "datos.html", "▤", "Pedidos y recibos"],
      ["analisis", "analisis.html", "▥", "Análisis del negocio"]
    ];

    app.innerHTML = `
      <div class="demo-barra">
        <p>DEMOSTRACIÓN · Usa datos ficticios · Sin cobros ni avisos reales</p>
        <a href="../index.html">Volver a King Land ↗</a>
      </div>

      <div class="layout">
        <aside class="sidebar">
          <a class="marca" href="lavanderia.html">
            <span class="marca-icono">b.</span>
            <span>
              BRISA
              <small>LAVANDERÍA DEMO</small>
            </span>
          </a>

          <p class="sidebar-label">TU ESPACIO DE TRABAJO</p>

          <nav aria-label="Navegación de lavandería">
            ${enlaces.map(([id, url, icono, nombre]) => `
              <a
                href="${url}"
                ${vista === id ? 'aria-current="page"' : ""}
              >
                <span aria-hidden="true">${icono}</span>
                ${nombre}
              </a>
            `).join("")}
          </nav>

          <div class="sidebar-nota">
            <span>✦</span>
            <b>Una solución a tu medida</b>
            <p>Clientes, servicios y cobros en un mismo lugar.</p>

            <a
              href="${enlaceConsulta}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Quiero un sistema así ↗
            </a>
          </div>

          <button
            class="reset"
            id="restaurar-demo"
            type="button"
          >
            Restaurar datos de ejemplo
          </button>
        </aside>

        <main class="main" id="contenido">
          <header class="titulo-pagina">
            <div>
              <p class="eyebrow">BRISA / PANEL DE DEMOSTRACIÓN</p>

              <h1 tabindex="-1">
                ${
                  vista === "nuevo"
                    ? "Todo empieza con un servicio."
                    : vista === "pedidos"
                      ? "Cada pedido, en orden."
                      : "Una visión más clara de tu negocio."
                }
              </h1>

              <p>
                ${
                  vista === "nuevo"
                    ? "Registra la recepción, calcula el servicio y entrega un recibo."
                    : vista === "pedidos"
                      ? "Consulta avances, registra abonos y prepara las entregas."
                      : "Distingue lo vendido de lo realmente cobrado."
                }
              </p>
            </div>

            <span class="hoy">${fechaTexto(dia())}</span>
          </header>

          <p
            id="aviso-almacenamiento"
            class="aviso"
            ${persistente ? "hidden" : ""}
          >
            No se pudieron recuperar o guardar los datos locales.
            Estás viendo ejemplos temporales; los cambios pueden no
            conservarse al cambiar de pantalla. Usa un navegador con
            almacenamiento disponible o restaura el demo.
          </p>

          <div id="estadisticas" class="estadisticas"></div>
          <div id="pantalla"></div>

          <footer class="pie">
            <span>
              Brisa es un negocio ficticio · Demo creado por King Land
            </span>
            <a href="../index.html">Explorar otras soluciones ↗</a>
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
        id="modal-recibo"
        class="modal"
        aria-labelledby="recibo-titulo"
      >
        <div class="modal-head">
          <div>
            <p class="eyebrow">COMPROBANTE DE DEMOSTRACIÓN</p>
            <h2 id="recibo-titulo" tabindex="-1">Detalle del pedido</h2>
          </div>

          <button
            type="button"
            class="cerrar"
            data-accion="cerrar"
            aria-label="Cerrar recibo"
          >×</button>
        </div>

        <div id="ticket"></div>
        <div id="detalle-acciones" class="detalle-acciones"></div>
      </dialog>

      <dialog
        id="modal-pago"
        class="modal modal-pequeno"
        aria-labelledby="pago-titulo"
      >
        <div class="modal-head">
          <h2 id="pago-titulo" tabindex="-1">Registrar abono</h2>

          <button
            type="button"
            class="cerrar"
            data-accion="cerrar"
            aria-label="Cerrar registro de pago"
          >×</button>
        </div>

        <p id="pago-pendiente" class="aviso"></p>

        <form id="form-pago">
          <label for="importe-pago">Importe del abono (MXN)</label>

          <input
            id="importe-pago"
            type="number"
            min="0.01"
            step="0.01"
            required
          >

          <label for="metodo-abono">Método de prueba</label>

          <select id="metodo-abono">
            ${METODOS.map(metodo => `
              <option>${metodo}</option>
            `).join("")}
          </select>

          <p class="nota">
            Solo se registra un movimiento ficticio.
            No se procesa ningún pago.
          </p>

          <button class="boton ancho" type="submit">
            Guardar abono simulado
          </button>
        </form>
      </dialog>
    `;
  }

  function pintarEstadisticas() {
    let datos;

    if (vista === "analisis") {
      const r = resumen(ordenes, desde, hasta);

      datos = [
        [
          "Servicios del periodo",
          r.cantidad,
          "Según fecha de ingreso"
        ],
        [
          "Venta registrada",
          dinero(r.ventas),
          "Valor de los pedidos del periodo"
        ],
        [
          "Cobrado en el periodo",
          dinero(r.cobrado),
          "Según la fecha de cada abono"
        ],
        [
          "Saldo de esos pedidos",
          dinero(r.pendiente),
          "Saldo actual de pedidos del periodo"
        ]
      ];
    } else {
      datos = [
        [
          "Pedidos activos",
          ordenes.filter(o => o.estado !== "Entregado").length,
          "Servicios aún por entregar"
        ],
        [
          "Listos para entregar",
          ordenes.filter(o => o.estado === "Listo").length,
          "Ropa terminada"
        ],
        [
          "Saldo por cobrar",
          dinero(
            ordenes.reduce((suma, orden) => suma + saldo(orden), 0)
          ),
          "Saldos actuales de todos los pedidos"
        ],
        [
          "Entregas atrasadas",
          ordenes.filter(vencido).length,
          "Según fecha y hora prometidas"
        ]
      ];
    }

    $("#estadisticas").innerHTML = datos.map(
      ([nombre, valor, nota], indice) => `
        <article class="stat stat-${indice}">
          <p>${nombre}</p>
          <strong>${valor}</strong>
          <small>${nota}</small>
        </article>
      `
    ).join("");
  }

  function siguienteFolio() {
    const maximo = ordenes.reduce((max, orden) => {
      const numero = Number(
        orden.folio.replace("BR-", "")
      ) || 0;

      return Math.max(max, numero);
    }, 0);

    return `BR-${String(maximo + 1).padStart(4, "0")}`;
  }

  function pantallaNuevo() {
    $("#pantalla").innerHTML = `
      <div class="nuevo-grid">
        <section class="panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">RECEPCIÓN</p>
              <h2>Nuevo servicio</h2>
            </div>

            <span class="badge" id="folio-nuevo">
              ${siguienteFolio()}
            </span>
          </div>

          <form id="form-servicio">
            <div class="campo">
              <label for="cliente">Nombre de prueba</label>
              <input
                id="cliente"
                maxlength="70"
                placeholder="Ej. Cliente de prueba"
                required
                autocomplete="off"
              >
              <small>
                Usa un nombre ficticio.
                No necesitas teléfono ni dirección.
              </small>
            </div>

            <div class="dos-columnas">
              <div class="campo">
                <label for="servicio">Tipo de servicio</label>

                <select id="servicio">
                  ${Object.entries(SERVICIOS).map(
                    ([id, servicio]) => `
                      <option value="${id}">
                        ${servicio.nombre} ·
                        ${dinero(servicio.tarifa)} / ${servicio.unidad}
                      </option>
                    `
                  ).join("")}
                </select>
              </div>

              <div class="campo">
                <label for="cantidad" id="cantidad-label">
                  Cantidad en kg
                </label>
                <input
                  id="cantidad"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value="5"
                  required
                >
              </div>

              <div class="campo">
                <label for="ingreso">Fecha de ingreso</label>
                <input
                  id="ingreso"
                  type="date"
                  required
                  value="${dia()}"
                >
              </div>

              <div class="campo">
                <label for="entrega">Fecha de entrega</label>
                <input
                  id="entrega"
                  type="date"
                  required
                  value="${moverDia(dia(), 1)}"
                >
              </div>

              <div class="campo">
                <label for="hora">Hora de entrega</label>
                <input
                  id="hora"
                  type="time"
                  value="18:00"
                  required
                >
              </div>

              <div class="campo">
                <label for="anticipo">Anticipo de prueba (MXN)</label>
                <input
                  id="anticipo"
                  type="number"
                  min="0"
                  step="0.01"
                  value="0"
                  required
                >
              </div>
            </div>

            <label class="check">
              <input id="urgente" type="checkbox">
              <span>
                Servicio exprés
                <small>Recargo ilustrativo del 25%</small>
              </span>
            </label>

            <div class="campo">
              <label for="metodo">Método del anticipo</label>

              <select id="metodo">
                ${METODOS.map(metodo => `
                  <option>${metodo}</option>
                `).join("")}
              </select>
            </div>

            <div class="campo">
              <label for="nota">Observaciones del servicio</label>
              <textarea
                id="nota"
                rows="2"
                maxlength="250"
                placeholder="Ej. Separar prendas delicadas"
              ></textarea>
            </div>

            <p id="error-form" class="error" role="alert"></p>

            <button class="boton ancho" type="submit">
              Registrar servicio y generar recibo ↗
            </button>
          </form>
        </section>

        <aside class="resumen-columna">
          <section class="panel resumen-pedido">
            <p class="eyebrow">ANTES DE REGISTRAR</p>
            <h2>Así queda tu servicio.</h2>
            <div id="resumen-vivo"></div>

            <p class="nota">
              Precios de ejemplo en MXN.
              El recibo es demostrativo y no tiene validez fiscal.
            </p>
          </section>

          <section class="ayuda-panel">
            <span>✦</span>
            <h3>Más claridad desde la recepción.</h3>
            <p>
              El estado del servicio y el estado del pago se consultan
              por separado. Un pedido puede estar listo y tener
              saldo pendiente.
            </p>
          </section>
        </aside>
      </div>

      <section class="panel recientes">
        <div class="panel-head">
          <h2>Últimos servicios</h2>
          <a href="datos.html" class="enlace">Ver todos ↗</a>
        </div>
        <div id="recientes"></div>
      </section>
    `;

    $("#form-servicio").addEventListener(
      "input",
      actualizarResumen
    );

    $("#servicio").addEventListener("change", () => {
      const piezas =
        SERVICIOS[$("#servicio").value].unidad === "piezas";

      $("#cantidad").step = piezas ? "1" : "0.1";
      $("#cantidad").min = piezas ? "1" : "0.1";

      if (piezas) {
        $("#cantidad").value = Math.max(
          1,
          Math.round(Number($("#cantidad").value) || 1)
        );
      }

      $("#cantidad-label").textContent = piezas
        ? "Cantidad de piezas"
        : "Cantidad en kg";

      actualizarResumen();
    });

    $("#form-servicio").addEventListener(
      "submit",
      crearOrden
    );

    actualizarResumen();
    pintarRecientes();
  }

  function datosFormulario() {
    const servicio = $("#servicio").value;
    const cantidad = Number($("#cantidad").value);

    const valores = calcular(
      servicio,
      cantidad,
      $("#urgente").checked
    );

    const anticipo = Math.round(
      Number($("#anticipo").value) * 100
    );

    if (
      !Number.isSafeInteger(anticipo) ||
      anticipo < 0 ||
      anticipo > valores.total
    ) {
      throw new Error(
        "El anticipo debe estar entre cero y el total del servicio."
      );
    }

    const ingreso = $("#ingreso").value;
    const entrega = $("#entrega").value;

    if (
      !fechaValida(ingreso) ||
      !fechaValida(entrega) ||
      entrega < ingreso
    ) {
      throw new Error(
        "La entrega no puede ser anterior al ingreso."
      );
    }

    return {
      servicio,
      cantidad,
      valores,
      anticipo,
      ingreso,
      entrega
    };
  }

  function actualizarResumen() {
    try {
      const total = calcular(
        $("#servicio").value,
        Number($("#cantidad").value),
        $("#urgente").checked
      );

      const anticipo = Math.round(
        Number($("#anticipo").value || 0) * 100
      );

      $("#anticipo").max = (total.total / 100).toFixed(2);
      $("#entrega").min = $("#ingreso").value;

      $("#resumen-vivo").innerHTML = `
        <p class="resumen-servicio">
          ${SERVICIOS[$("#servicio").value].nombre}
        </p>

        <div class="renglon">
          <span>Servicio base</span>
          <b>${dinero(total.subtotal)}</b>
        </div>

        <div class="renglon">
          <span>Exprés</span>
          <b>${dinero(total.extra)}</b>
        </div>

        <div class="renglon total">
          <span>Total del servicio</span>
          <strong>${dinero(total.total)}</strong>
        </div>

        <div class="renglon">
          <span>Anticipo</span>
          <b>${dinero(Math.max(0, anticipo || 0))}</b>
        </div>

        <div class="saldo-grande">
          <span>Saldo al entregar</span>
          <strong>
            ${
              dinero(
                Math.max(
                  0,
                  total.total - (anticipo || 0)
                )
              )
            }
          </strong>
        </div>
      `;
    } catch (error) {
      $("#resumen-vivo").textContent = error.message;
    }
  }

  function crearOrden(evento) {
    evento.preventDefault();
    $("#error-form").textContent = "";

    try {
      if (ordenes.length >= 150) {
        throw new Error(
          "Este demo permite 150 pedidos. Puedes restaurar los datos de ejemplo para comenzar otra prueba."
        );
      }

      const datos = datosFormulario();
      const cliente = $("#cliente").value.trim();

      if (!cliente) {
        throw new Error(
          "Escribe un nombre ficticio para identificar el pedido."
        );
      }

      const ahora = new Date();

      const orden = {
        id: `pedido-${ahora.getTime()}-${
          Math.random().toString(36).slice(2, 7)
        }`,
        folio: siguienteFolio(),
        cliente,
        servicio: datos.servicio,
        cantidad: datos.cantidad,
        urgente: $("#urgente").checked,
        ingreso: datos.ingreso,
        entrega: datos.entrega,
        hora: $("#hora").value,
        total: datos.valores.total,
        estado: "Recibido",
        nota: $("#nota").value.trim(),
        pagos: datos.anticipo
          ? [{
              id: `pago-${ahora.getTime()}`,
              importe: datos.anticipo,
              metodo: $("#metodo").value,
              fecha: ahora.toISOString()
            }]
          : []
      };

      if (!ordenValida(orden)) {
        throw new Error(
          "Revisa los datos del servicio antes de guardar."
        );
      }

      ordenes.unshift(orden);
      guardar();

      $("#form-servicio").reset();
      $("#ingreso").value = dia();
      $("#entrega").value = moverDia(dia(), 1);
      $("#cantidad-label").textContent = "Cantidad en kg";
      $("#cantidad").step = "0.1";
      $("#cantidad").min = "0.1";
      $("#folio-nuevo").textContent = siguienteFolio();

      actualizarResumen();
      actualizarPantalla();
      abrirRecibo(orden.id);

      avisar("Servicio registrado en esta demostración.");
    } catch (error) {
      $("#error-form").textContent = error.message;
    }
  }

  function filas(lista) {
    if (!lista.length) {
      return `
        <div class="vacio">
          <span>◌</span>
          <h3>No hay pedidos en esta vista</h3>
          <p>Prueba otros filtros o registra un servicio.</p>
          <a class="boton" href="lavanderia.html">
            Nuevo servicio
          </a>
        </div>
      `;
    }

    return `
      <div class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Pedido / cliente</th>
              <th>Servicio</th>
              <th>Entrega</th>
              <th>Estado</th>
              <th>Saldo</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${lista.map(orden => `
              <tr>
                <td>
                  <strong>${esc(orden.folio)}</strong>
                  <small>${esc(orden.cliente)}</small>
                </td>

                <td>
                  ${SERVICIOS[orden.servicio].nombre}
                  <small>
                    ${orden.cantidad}
                    ${SERVICIOS[orden.servicio].unidad}
                    ${orden.urgente ? " · Exprés" : ""}
                  </small>
                </td>

                <td>
                  ${fechaTexto(orden.entrega)}
                  <small>
                    ${orden.hora}
                    ${vencido(orden) ? " · Atrasado" : ""}
                  </small>
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
                    class="mini-boton"
                    type="button"
                    data-accion="recibo"
                    data-id="${esc(orden.id)}"
                    aria-label="Ver pedido ${esc(orden.folio)}"
                  >
                    Ver ↗
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function pintarRecientes() {
    const recientes = [...ordenes]
      .sort((a, b) =>
        b.ingreso.localeCompare(a.ingreso) ||
        b.folio.localeCompare(a.folio)
      )
      .slice(0, 5);

    $("#recientes").innerHTML = filas(recientes);
  }

  function pantallaPedidos() {
    $("#pantalla").innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">SEGUIMIENTO DE SERVICIOS</p>
            <h2>Pedidos y recibos</h2>
          </div>

          <button
            class="mini-boton"
            id="exportar"
            type="button"
          >
            Exportar vista CSV ↓
          </button>
        </div>

        <div class="filtros">
          <div class="campo">
            <label for="buscar">Buscar por folio o cliente</label>
            <input
              id="buscar"
              type="search"
              placeholder="Ej. BR-0001 o Cliente demo"
              maxlength="80"
            >
          </div>

          <div class="campo">
            <label for="filtrar-estado">Estado del servicio</label>
            <select id="filtrar-estado">
              <option>Todos</option>
              ${ESTADOS.map(estado => `
                <option>${estado}</option>
              `).join("")}
              <option>Atrasados</option>
            </select>
          </div>

          <div class="campo">
            <label for="filtrar-pago">Estado del pago</label>
            <select id="filtrar-pago">
              <option>Todos</option>
              <option>Con saldo</option>
              <option>Liquidados</option>
            </select>
          </div>
        </div>

        <p id="cuenta-pedidos" class="nota" role="status"></p>
        <div id="lista-pedidos"></div>
      </section>
    `;

    $("#buscar").addEventListener("input", evento => {
      busqueda = evento.target.value;
      pintarPedidos();
    });

    $("#filtrar-estado").addEventListener("change", evento => {
      filtroEstado = evento.target.value;
      pintarPedidos();
    });

    $("#filtrar-pago").addEventListener("change", evento => {
      filtroPago = evento.target.value;
      pintarPedidos();
    });

    $("#exportar").addEventListener("click", exportarCSV);

    pintarPedidos();
  }

  function filtrados() {
    return ordenes.filter(orden =>
      normalizar(
        `${orden.folio} ${orden.cliente}`
      ).includes(normalizar(busqueda)) &&

      (
        filtroEstado === "Todos" ||
        (
          filtroEstado === "Atrasados"
            ? vencido(orden)
            : orden.estado === filtroEstado
        )
      ) &&

      (
        filtroPago === "Todos" ||
        (
          filtroPago === "Con saldo"
            ? saldo(orden) > 0
            : saldo(orden) === 0
        )
      )
    );
  }

  function pintarPedidos() {
    const lista = filtrados();

    $("#cuenta-pedidos").textContent =
      `${lista.length} pedidos · Saldo de esta vista: ${
        dinero(
          lista.reduce(
            (suma, orden) => suma + saldo(orden),
            0
          )
        )
      }`;

    $("#lista-pedidos").innerHTML = filas(lista);
  }

  function pantallaAnalisis() {
    $("#pantalla").innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">MOVIMIENTOS DEL PERIODO</p>
            <h2>Ventas y cobros</h2>
          </div>
          <span class="badge">MXN · Datos ficticios</span>
        </div>

        <form id="rango" class="rango">
          <div class="campo">
            <label for="desde">Desde</label>
            <input
              id="desde"
              type="date"
              value="${desde}"
              required
            >
          </div>

          <div class="campo">
            <label for="hasta">Hasta</label>
            <input
              id="hasta"
              type="date"
              value="${hasta}"
              required
            >
          </div>

          <button class="boton" type="submit">
            Aplicar periodo
          </button>
        </form>

        <p id="error-rango" class="error" role="alert"></p>

        <p class="nota">
          Hasta 90 días por consulta.
          Las ventas se agrupan por ingreso del pedido;
          los cobros, por fecha del abono.
          Cobros no significa ganancias: este demo no registra gastos.
        </p>

        <div class="leyenda">
          <span><i></i>Venta registrada</span>
          <span><i></i>Cobrado</span>
        </div>

        <div id="grafica" class="grafica"></div>

        <details class="tabla-datos">
          <summary>Ver importes diarios en tabla</summary>
          <div id="tabla-analisis"></div>
        </details>
      </section>

      <section class="panel recientes">
        <div class="panel-head">
          <h2>Servicios del periodo</h2>
          <span id="ticket-medio" class="nota"></span>
        </div>

        <div
          id="servicios-analisis"
          class="servicios-analisis"
        ></div>
      </section>
    `;

    $("#rango").addEventListener("submit", evento => {
      evento.preventDefault();

      const inicio = $("#desde").value;
      const final = $("#hasta").value;

      const dias = Math.round(
        (
          new Date(`${final}T12:00:00`) -
          new Date(`${inicio}T12:00:00`)
        ) / 86400000
      ) + 1;

      if (
        !fechaValida(inicio) ||
        !fechaValida(final) ||
        final < inicio ||
        dias > 90
      ) {
        $("#error-rango").textContent =
          "Elige un periodo válido de hasta 90 días.";

        return;
      }

      desde = inicio;
      hasta = final;

      $("#error-rango").textContent = "";

      pintarEstadisticas();
      pintarAnalisis();
    });

    pintarAnalisis();
  }

  function pintarAnalisis() {
    const dias = [];

    for (
      let fecha = desde;
      fecha <= hasta;
      fecha = moverDia(fecha, 1)
    ) {
      const r = resumen(ordenes, fecha, fecha);

      dias.push({
        dia: fecha,
        ventas: r.ventas,
        cobrado: r.cobrado
      });
    }

    const maximo = Math.max(
      1,
      ...dias.flatMap(d => [d.ventas, d.cobrado])
    );

    $("#grafica").innerHTML = dias.map(d => `
      <div class="dia-grafica">
        <span>${fechaTexto(d.dia)}</span>

        <div>
          <div class="barra-linea">
            <div
              class="barra venta"
              style="width:${d.ventas / maximo * 100}%"
            ></div>
            <small>${dinero(d.ventas)}</small>
          </div>

          <div class="barra-linea">
            <div
              class="barra cobro"
              style="width:${d.cobrado / maximo * 100}%"
            ></div>
            <small>${dinero(d.cobrado)}</small>
          </div>
        </div>
      </div>
    `).join("");

    $("#tabla-analisis").innerHTML = `
      <div class="tabla-scroll">
        <table>
          <caption>
            Importes diarios del periodo seleccionado
          </caption>

          <thead>
            <tr>
              <th>Fecha</th>
              <th>Venta registrada</th>
              <th>Cobrado</th>
            </tr>
          </thead>

          <tbody>
            ${dias.map(d => `
              <tr>
                <td>${fechaTexto(d.dia)}</td>
                <td>${dinero(d.ventas)}</td>
                <td>${dinero(d.cobrado)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const r = resumen(ordenes, desde, hasta);

    $("#ticket-medio").textContent =
      `Ticket promedio: ${dinero(r.ticket)}`;

    $("#servicios-analisis").innerHTML =
      Object.entries(SERVICIOS).map(([id, servicio]) => {
        const lista = ordenes.filter(orden =>
          orden.servicio === id &&
          orden.ingreso >= desde &&
          orden.ingreso <= hasta
        );

        const total = lista.reduce(
          (suma, orden) => suma + orden.total,
          0
        );

        return `
          <article>
            <span>${servicio.nombre}</span>
            <strong>${lista.length} pedidos</strong>
            <small>${dinero(total)} registrados</small>
          </article>
        `;
      }).join("");
  }

  function actualizarPantalla() {
    pintarEstadisticas();

    if (vista === "nuevo") pintarRecientes();
    if (vista === "pedidos") pintarPedidos();
    if (vista === "analisis") pintarAnalisis();
  }

  function abrirModal(id) {
    if (!document.querySelector("dialog[open]")) {
      ultimoFoco = document.activeElement;
    }

    document.querySelectorAll("dialog[open]").forEach(modal => {
      modal.close();
    });

    const modal = document.getElementById(id);

    modal.showModal();

    modal.querySelector('[tabindex="-1"]')?.focus({
      preventScroll: true
    });
  }

  function abrirRecibo(id) {
    const orden = ordenes.find(item => item.id === id);

    if (!orden) return;

    ordenAbierta = id;

    const servicio = SERVICIOS[orden.servicio];

    const calculo = calcular(
      orden.servicio,
      orden.cantidad,
      orden.urgente
    );

    $("#ticket").innerHTML = `
      <div class="ticket-marca">
        <span class="ticket-icono">b.</span>
        <h3>BRISA</h3>
        <p>Lavandería de demostración</p>
        <small>DEMO · SIN VALIDEZ FISCAL · SIN COBRO REAL</small>
      </div>

      <div class="ticket-cabecera">
        <strong>${esc(orden.folio)}</strong>
        ${badge(orden)}
      </div>

      <dl class="ticket-datos">
        <div>
          <dt>Cliente de prueba</dt>
          <dd>${esc(orden.cliente)}</dd>
        </div>

        <div>
          <dt>Ingreso</dt>
          <dd>${fechaTexto(orden.ingreso)}</dd>
        </div>

        <div>
          <dt>Entrega estimada</dt>
          <dd>${fechaTexto(orden.entrega)} · ${orden.hora}</dd>
        </div>

        <div>
          <dt>Servicio</dt>
          <dd>${servicio.nombre}</dd>
        </div>

        <div>
          <dt>Cantidad</dt>
          <dd>${orden.cantidad} ${servicio.unidad}</dd>
        </div>
      </dl>

      <div class="renglon">
        <span>Servicio base</span>
        <b>${dinero(calculo.subtotal)}</b>
      </div>

      <div class="renglon">
        <span>Exprés</span>
        <b>${dinero(calculo.extra)}</b>
      </div>

      <div class="renglon total">
        <span>Total</span>
        <strong>${dinero(orden.total)}</strong>
      </div>

      <div class="renglon">
        <span>Abonos registrados</span>
        <b>${dinero(pagado(orden))}</b>
      </div>

      <div class="saldo-grande">
        <span>Saldo pendiente</span>
        <strong>${dinero(saldo(orden))}</strong>
      </div>

      ${
        orden.nota
          ? `<p class="ticket-nota">${esc(orden.nota)}</p>`
          : ""
      }

      <h4>Movimientos de pago de prueba</h4>

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
        Este documento solo demuestra el flujo de recepción y cobro.
        No representa un servicio contratado.
      </p>
    `;

    const indice = ESTADOS.indexOf(orden.estado);
    const siguiente = ESTADOS[indice + 1];

    $("#detalle-acciones").innerHTML = `
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
          ? `<p class="nota">
               Liquida el saldo para marcar el pedido como entregado.
             </p>`
          : ""
      }

      <button
        class="mini-boton"
        type="button"
        data-accion="descargar"
      >
        Descargar recibo TXT ↓
      </button>

      <button
        class="mini-boton"
        type="button"
        data-accion="imprimir"
      >
        Imprimir / PDF
      </button>
    `;

    abrirModal("modal-recibo");
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

  function exportarCSV() {
    const celda = valor => {
      let texto = String(valor);

      if (/^[\s]*[=+@-]/.test(texto)) {
        texto = `'${texto}`;
      }

      return `"${texto.replace(/"/g, '""')}"`;
    };

    const filasCSV = [
      [
        "Folio",
        "Cliente ficticio",
        "Servicio",
        "Cantidad",
        "Unidad",
        "Ingreso",
        "Entrega",
        "Hora",
        "Estado",
        "Total MXN",
        "Cobrado MXN",
        "Saldo MXN"
      ],
      ...filtrados().map(orden => [
        orden.folio,
        orden.cliente,
        SERVICIOS[orden.servicio].nombre,
        orden.cantidad,
        SERVICIOS[orden.servicio].unidad,
        orden.ingreso,
        orden.entrega,
        orden.hora,
        orden.estado,
        (orden.total / 100).toFixed(2),
        (pagado(orden) / 100).toFixed(2),
        (saldo(orden) / 100).toFixed(2)
      ])
    ];

    const texto = "\uFEFF" + filasCSV
      .map(fila => fila.map(celda).join(","))
      .join("\r\n");

    descargar(
      texto,
      "pedidos-demo-lavanderia.csv",
      "text/csv;charset=utf-8"
    );
  }

  leer();
  montar();
  pintarEstadisticas();

  if (vista === "nuevo") pantallaNuevo();
  if (vista === "pedidos") pantallaPedidos();
  if (vista === "analisis") pantallaAnalisis();

  document.querySelectorAll("dialog").forEach(modal => {
    modal.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) {
        const destino = ultimoFoco?.isConnected
          ? ultimoFoco
          : $("h1");

        destino.focus({ preventScroll: true });
      }
    });

    modal.addEventListener("click", evento => {
      if (evento.target !== modal) return;

      const rect = modal.getBoundingClientRect();

      if (
        evento.clientX < rect.left ||
        evento.clientX > rect.right ||
        evento.clientY < rect.top ||
        evento.clientY > rect.bottom
      ) {
        modal.close();
      }
    });
  });

  document.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-accion]");

    if (!boton || boton.disabled) return;

    const accion = boton.dataset.accion;

    if (accion === "cerrar") {
      boton.closest("dialog").close();
    }

    if (accion === "recibo") {
      abrirRecibo(boton.dataset.id);
    }

    const orden = ordenes.find(
      item => item.id === ordenAbierta
    );

    if (!orden) return;

    if (accion === "abonar") {
      $("#pago-pendiente").textContent =
        `${orden.folio} · Saldo pendiente: ${dinero(saldo(orden))}`;

      $("#importe-pago").value =
        (saldo(orden) / 100).toFixed(2);

      $("#importe-pago").max =
        (saldo(orden) / 100).toFixed(2);

      abrirModal("modal-pago");
    }

    if (accion === "avanzar") {
      const siguiente =
        ESTADOS[ESTADOS.indexOf(orden.estado) + 1];

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
      actualizarPantalla();
      abrirRecibo(orden.id);

      avisar(
        `Pedido marcado como ${siguiente.toLowerCase()}.`
      );
    }

    if (accion === "imprimir") {
      window.print();
    }

    if (accion === "descargar") {
      const texto = [
        "BRISA — LAVANDERÍA DEMO",
        "SIN VALIDEZ FISCAL · SIN COBRO REAL",
        `Folio: ${orden.folio}`,
        `Cliente ficticio: ${orden.cliente}`,
        `Servicio: ${SERVICIOS[orden.servicio].nombre}`,
        `Cantidad: ${orden.cantidad} ${
          SERVICIOS[orden.servicio].unidad
        }`,
        `Exprés: ${orden.urgente ? "Sí" : "No"}`,
        `Ingreso: ${orden.ingreso}`,
        `Entrega: ${orden.entrega} ${orden.hora}`,
        `Estado: ${orden.estado}`,
        `Total: ${dinero(orden.total)}`,
        `Abonado: ${dinero(pagado(orden))}`,
        `Saldo: ${dinero(saldo(orden))}`,
        `Observaciones: ${orden.nota || "Sin observaciones"}`,
        "",
        "ABONOS DE DEMOSTRACIÓN",
        ...orden.pagos.map(pago =>
          `${
            new Date(pago.fecha).toLocaleString("es-MX")
          } | ${pago.metodo} | ${dinero(pago.importe)}`
        )
      ].join("\n");

      descargar(
        texto,
        "recibo-demo-lavanderia.txt",
        "text/plain;charset=utf-8"
      );
    }
  });

  $("#form-pago").addEventListener("submit", evento => {
    evento.preventDefault();

    const orden = ordenes.find(
      item => item.id === ordenAbierta
    );

    const importe = Math.round(
      Number($("#importe-pago").value) * 100
    );

    const metodo = $("#metodo-abono").value;

    if (
      !orden ||
      !Number.isSafeInteger(importe) ||
      importe <= 0 ||
      importe > saldo(orden) ||
      !METODOS.includes(metodo)
    ) {
      avisar(
        "El abono debe ser mayor que cero y no superar el saldo."
      );

      return;
    }

    orden.pagos.push({
      id: `abono-${Date.now()}-${
        Math.random().toString(36).slice(2, 7)
      }`,
      importe,
      metodo,
      fecha: new Date().toISOString()
    });

    guardar();
    actualizarPantalla();
    abrirRecibo(orden.id);

    avisar("Abono simulado registrado.");
  });

  $("#restaurar-demo").addEventListener("click", () => {
    const confirmar = window.confirm(
      "¿Reemplazar los pedidos y abonos de prueba de este navegador por los ejemplos iniciales?"
    );

    if (!confirmar) return;

    ordenes = crearEjemplos();

    guardar();
    actualizarPantalla();

    if (vista === "nuevo") {
      $("#folio-nuevo").textContent = siguienteFolio();
    }

    avisar("Datos de demostración restaurados.");
  });
})();