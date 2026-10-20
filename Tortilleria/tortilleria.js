(() => {
  const CLAVE = "kingland.tortilleria.demo.v1";

  const PRODUCTOS = [
    { id: "maiz", nombre: "Tortilla de maíz", precio: 2200 },
    { id: "masa", nombre: "Masa de maíz", precio: 1800 },
    { id: "azul", nombre: "Tortilla de maíz azul", precio: 2800 }
  ];

  const CATEGORIAS = [
    "Insumos",
    "Luz",
    "Agua",
    "Gas",
    "Mantenimiento",
    "Otros"
  ];

  const METODOS = ["Efectivo", "Transferencia"];

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

  const uid = () => {
    return `${Date.now().toString(36)}-${
      Math.random().toString(36).slice(2, 8)
    }`;
  };

  function dia(fecha = new Date()) {
    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, "0"),
      String(fecha.getDate()).padStart(2, "0")
    ].join("-");
  }

  function mover(valor, cantidad) {
    const fecha = new Date(`${valor}T12:00:00`);
    fecha.setDate(fecha.getDate() + cantidad);
    return dia(fecha);
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

  function decimal(valor, precision, maximo) {
    const texto = String(valor).trim();
    const patron = new RegExp(
      `^\\d+(\\.\\d{1,${precision}})?$`
    );

    if (!patron.test(texto)) {
      throw new Error(
        `Usa un valor positivo con hasta ${precision} decimales.`
      );
    }

    const numero = Math.round(
      Number(texto) * 10 ** precision
    );

    if (
      !Number.isSafeInteger(numero) ||
      numero < 0 ||
      numero > maximo
    ) {
      throw new Error(
        "El valor supera el límite de esta demostración."
      );
    }

    return numero;
  }

  const centavos = valor => decimal(valor, 2, 100000000);
  const gramos = valor => decimal(valor, 3, 1000000);

  const kilos = peso => {
    return (peso / 1000).toLocaleString(
      "es-MX",
      { maximumFractionDigits: 3 }
    );
  };

  function importeVenta(peso, precio) {
    if (
      !Number.isSafeInteger(peso) ||
      peso <= 0 ||
      peso > 1000000 ||
      !Number.isSafeInteger(precio) ||
      precio <= 0 ||
      precio > 1000000
    ) {
      throw new Error(
        "Revisa los kilos y el precio por kilo."
      );
    }

    const total = Math.round(peso * precio / 1000);

    if (total <= 0) {
      throw new Error(
        "La cantidad es demasiado pequeña para generar un importe."
      );
    }

    return total;
  }

  function resumen(datos, desde, hasta) {
    const ventas = datos.ventas.filter(venta =>
      !venta.anulada &&
      venta.fecha >= desde &&
      venta.fecha <= hasta
    );

    const gastos = datos.gastos.filter(gasto =>
      !gasto.anulado &&
      gasto.fecha >= desde &&
      gasto.fecha <= hasta
    );

    const ingresos = ventas.reduce(
      (suma, venta) => suma + venta.total,
      0
    );

    const egresos = gastos.reduce(
      (suma, gasto) => suma + gasto.monto,
      0
    );

    return {
      ventas,
      gastos,
      ingresos,
      egresos,
      resultado: ingresos - egresos,
      peso: ventas.reduce(
        (suma, venta) => suma + venta.gramos,
        0
      ),
      efectivo: ventas
        .filter(venta => venta.metodo === "Efectivo")
        .reduce((suma, venta) => suma + venta.total, 0),
      transferencia: ventas
        .filter(venta => venta.metodo === "Transferencia")
        .reduce((suma, venta) => suma + venta.total, 0)
    };
  }

  function puedePagar(datos, empleado, fecha) {
    return !datos.gastos.some(gasto =>
      !gasto.anulado &&
      gasto.empleado === empleado &&
      gasto.fecha === fecha
    );
  }

  function ejemplos() {
    const empleados = [
      {
        id: "e1",
        nombre: "Colaborador demo 01",
        puesto: "Producción",
        diario: 30000,
        activo: true
      },
      {
        id: "e2",
        nombre: "Colaborador demo 02",
        puesto: "Mostrador",
        diario: 28000,
        activo: true
      },
      {
        id: "e3",
        nombre: "Colaborador demo 03",
        puesto: "Apoyo general",
        diario: 26000,
        activo: true
      }
    ];

    const ventas = [];
    const gastos = [];

    let folio = 1;

    for (let i = 6; i >= 0; i--) {
      const fecha = mover(dia(), -i);

      [12500 + i * 1000, 8000 + i * 500, 6500].forEach(
        (peso, indice) => {
          const producto = PRODUCTOS[indice];
          const total = importeVenta(peso, producto.precio);

          ventas.push({
            id: `v-${i}-${indice}`,
            folio: `VT-${String(folio++).padStart(4, "0")}`,
            producto: producto.id,
            nombre: producto.nombre,
            gramos: peso,
            precio: producto.precio,
            total,
            fecha,
            metodo: indice === 1
              ? "Transferencia"
              : "Efectivo",
            recibido: indice === 1 ? null : total,
            cambio: 0,
            anulada: false
          });
        }
      );

      gastos.push({
        id: `g-${i}`,
        fecha,
        categoria: i % 2 ? "Gas" : "Insumos",
        concepto: i % 2
          ? "Recarga de gas de muestra"
          : "Materia prima de muestra",
        monto: i % 2 ? 16000 : 21000,
        metodo: "Efectivo",
        anulado: false,
        empleado: null,
        jornadas: 0,
        tarifa: 0
      });
    }

    gastos.push({
      id: "g-personal",
      fecha: mover(dia(), -1),
      categoria: "Personal",
      concepto: "Pago de prueba · Colaborador demo 01 · 1 jornada",
      monto: 30000,
      metodo: "Transferencia",
      anulado: false,
      empleado: "e1",
      jornadas: 1,
      tarifa: 30000
    });

    return {
      ventas: ventas.reverse(),
      gastos: gastos.reverse(),
      empleados
    };
  }

  function validar(datos) {
    try {
      if (
        !datos ||
        !Array.isArray(datos.ventas) ||
        !Array.isArray(datos.gastos) ||
        !Array.isArray(datos.empleados) ||
        datos.ventas.length > 300 ||
        datos.gastos.length > 300 ||
        datos.empleados.length > 50
      ) {
        return false;
      }

      const texto = (valor, maximo) => (
        typeof valor === "string" &&
        valor.trim().length > 0 &&
        valor.length <= maximo
      );

      const entero = (valor, maximo) => (
        Number.isSafeInteger(valor) &&
        valor >= 0 &&
        valor <= maximo
      );

      for (const lista of [
        datos.ventas,
        datos.gastos,
        datos.empleados
      ]) {
        if (
          new Set(lista.map(item => item?.id)).size !==
          lista.length
        ) {
          return false;
        }
      }

      if (!datos.empleados.every(empleado =>
        texto(empleado.id, 100) &&
        texto(empleado.nombre, 70) &&
        texto(empleado.puesto, 70) &&
        entero(empleado.diario, 100000000) &&
        empleado.diario > 0 &&
        typeof empleado.activo === "boolean"
      )) {
        return false;
      }

      if (!datos.ventas.every(venta =>
        texto(venta.id, 100) &&
        texto(venta.folio, 30) &&
        PRODUCTOS.some(p => p.id === venta.producto) &&
        texto(venta.nombre, 80) &&
        fechaValida(venta.fecha) &&
        METODOS.includes(venta.metodo) &&
        typeof venta.anulada === "boolean" &&
        importeVenta(venta.gramos, venta.precio) === venta.total &&
        (
          venta.metodo === "Efectivo"
            ? (
                entero(venta.recibido, 100000000) &&
                venta.recibido >= venta.total &&
                venta.cambio === venta.recibido - venta.total
              )
            : venta.recibido === null && venta.cambio === 0
        )
      )) {
        return false;
      }

      if (!datos.gastos.every(gasto => {
        if (
          !texto(gasto.id, 100) ||
          !fechaValida(gasto.fecha) ||
          !texto(gasto.concepto, 150) ||
          !entero(gasto.monto, 100000000) ||
          gasto.monto <= 0 ||
          !METODOS.includes(gasto.metodo) ||
          typeof gasto.anulado !== "boolean"
        ) {
          return false;
        }

        if (gasto.empleado === null) {
          return (
            CATEGORIAS.includes(gasto.categoria) &&
            gasto.jornadas === 0 &&
            gasto.tarifa === 0
          );
        }

        return (
          gasto.categoria === "Personal" &&
          datos.empleados.some(
            empleado => empleado.id === gasto.empleado
          ) &&
          Number.isInteger(gasto.jornadas) &&
          gasto.jornadas >= 1 &&
          gasto.jornadas <= 30 &&
          entero(gasto.tarifa, 100000000) &&
          gasto.tarifa > 0 &&
          gasto.tarifa * gasto.jornadas === gasto.monto
        );
      })) {
        return false;
      }

      const pagos = datos.gastos
        .filter(gasto =>
          !gasto.anulado &&
          gasto.empleado !== null
        )
        .map(gasto => `${gasto.empleado}-${gasto.fecha}`);

      return new Set(pagos).size === pagos.length;
    } catch {
      return false;
    }
  }

  const app = document.getElementById("app");

  if (!app) return;

  const $ = selector => document.querySelector(selector);
  const vista = document.body.dataset.vista || "panel";

  let datos = ejemplos();
  let persistente = true;

  let desde = vista === "ganancias"
    ? mover(dia(), -6)
    : dia();

  let hasta = dia();
  let mostrarAnuladas = false;
  let ventaAbierta = null;
  let pagoEmpleado = null;
  let focoAnterior;
  let temporizador;

  try {
    const guardado = localStorage.getItem(CLAVE);

    if (guardado !== null) {
      const leido = JSON.parse(guardado);

      if (!validar(leido)) {
        throw new Error("Datos inválidos");
      }

      datos = leido;
    } else {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    }
  } catch {
    persistente = false;
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      persistente = true;
    } catch {
      persistente = false;
    }

    $("#aviso-local").hidden = persistente;
  }

  function avisar(texto) {
    $("#notificacion").textContent = texto;
    $("#notificacion").classList.add("visible");

    clearTimeout(temporizador);

    temporizador = setTimeout(() => {
      $("#notificacion").classList.remove("visible");
    }, 4000);
  }

  const consulta =
    "https://wa.me/522225354183?text=Hola%2C%20prob%C3%A9%20el%20demo%20de%20tortiller%C3%ADa%20de%20King%20Land%20y%20me%20interesa%20un%20sistema%20para%20mi%20negocio.";

  const navegacion = [
    ["panel", "tortilleria.html", "◈", "Resumen"],
    ["ventas", "ventas.html", "＋", "Ventas"],
    ["gastos", "gastos.html", "↘", "Gastos"],
    ["empleados", "empleados.html", "◎", "Personal"],
    ["ganancias", "ganancias.html", "▥", "Resultados"]
  ];

  function montar() {
    const titulos = {
      panel: [
        "Tu negocio, más claro.",
        "Ventas, gastos y personal conectados en una misma herramienta."
      ],
      ventas: [
        "Cada kilo cuenta.",
        "Registra una venta, calcula el cambio y entrega un recibo."
      ],
      gastos: [
        "Conoce en qué se va.",
        "Clasifica los egresos y consulta los movimientos registrados."
      ],
      empleados: [
        "Tu equipo también cuenta.",
        "Organiza al personal y registra pagos de prueba."
      ],
      ganancias: [
        "Los números, en contexto.",
        "Compara ventas y gastos del periodo sin perder de vista qué se registró."
      ]
    };

    app.innerHTML = `
      <div class="demo-barra">
        <p>
          DEMO INTERACTIVO · Datos ficticios ·
          Sin ventas ni pagos reales
        </p>
        <a href="../index.html">Volver a King Land ↗</a>
      </div>

      <div class="layout">
        <aside class="sidebar">
          <a class="marca" href="tortilleria.html">
            <span>m.</span>
            <div>MILPA<small>TORTILLERÍA DEMO</small></div>
          </a>

          <p class="nav-label">TU OPERACIÓN, EN ORDEN</p>

          <nav aria-label="Navegación de tortillería">
            ${
              navegacion.map(([id, url, icono, nombre]) => `
                <a
                  href="${url}"
                  ${id === vista ? 'aria-current="page"' : ""}
                >
                  <span aria-hidden="true">${icono}</span>
                  ${nombre}
                </a>
              `).join("")
            }
          </nav>

          <div class="sidebar-cta">
            <span>✦</span>
            <h3>Hecho para tu negocio.</h3>
            <p>
              El diseño y las funciones se pueden definir a tu medida.
            </p>

            <a
              href="${consulta}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Quiero un sistema así ↗
            </a>
          </div>

          <button class="reset" id="restaurar" type="button">
            Restaurar demostración
          </button>
        </aside>

        <main class="main" id="contenido">
          <header class="pagina-head">
            <div>
              <p class="eyebrow">
                MILPA / ADMINISTRACIÓN DE DEMOSTRACIÓN
              </p>

              <h1 tabindex="-1">${titulos[vista][0]}</h1>
              <p>${titulos[vista][1]}</p>
            </div>

            <a class="boton" href="ventas.html">
              ＋ Registrar venta
            </a>
          </header>

          <p
            id="aviso-local"
            class="aviso"
            ${persistente ? "hidden" : ""}
          >
            No se pudieron recuperar o guardar los datos locales.
            Estás usando ejemplos temporales y los cambios pueden
            no conservarse al navegar. Puedes restaurar el demo
            o usar un navegador con almacenamiento disponible.
          </p>

          <section class="periodo">
            <form id="form-periodo">
              <div>
                <label for="desde">Desde</label>
                <input
                  id="desde"
                  type="date"
                  value="${desde}"
                  required
                >
              </div>

              <div>
                <label for="hasta">Hasta</label>
                <input
                  id="hasta"
                  type="date"
                  value="${hasta}"
                  required
                >
              </div>

              <button class="mini" type="submit">
                Aplicar periodo
              </button>
            </form>

            <p id="texto-periodo" class="nota"></p>
            <p id="error-periodo" class="error" role="alert"></p>
          </section>

          <div class="stats" id="stats"></div>
          <div id="pantalla"></div>

          <footer class="pie">
            <span>
              Milpa es una identidad ficticia · Creado por King Land
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
        class="modal"
        id="modal-ticket"
        aria-labelledby="ticket-titulo"
      >
        <div class="modal-head">
          <div>
            <p class="eyebrow">COMPROBANTE DE DEMOSTRACIÓN</p>
            <h2 id="ticket-titulo" tabindex="-1">
              Recibo de venta
            </h2>
          </div>

          <button
            class="cerrar"
            type="button"
            data-accion="cerrar"
            aria-label="Cerrar recibo"
          >×</button>
        </div>

        <div id="ticket"></div>

        <div class="acciones-ticket">
          <button class="boton" id="descargar-ticket" type="button">
            Descargar TXT ↓
          </button>

          <button class="mini" type="button" id="imprimir-ticket">
            Imprimir / PDF
          </button>
        </div>
      </dialog>

      <dialog
        class="modal modal-pequena"
        id="modal-personal"
        aria-labelledby="pago-titulo"
      >
        <div class="modal-head">
          <h2 id="pago-titulo" tabindex="-1">Pago de personal</h2>

          <button
            class="cerrar"
            type="button"
            data-accion="cerrar"
            aria-label="Cerrar pago"
          >×</button>
        </div>

        <div id="form-personal-contenedor"></div>
      </dialog>
    `;

    $("#form-periodo").addEventListener("submit", evento => {
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
        $("#error-periodo").textContent =
          "Selecciona un periodo válido de hasta 90 días.";

        return;
      }

      desde = inicio;
      hasta = final;
      $("#error-periodo").textContent = "";

      actualizar();
    });
  }

  function stats() {
    const r = resumen(datos, desde, hasta);

    $("#texto-periodo").textContent =
      `Vista: ${fechaTexto(desde)} al ${fechaTexto(hasta)}. ` +
      "Los formularios permiten elegir la fecha de cada movimiento.";

    const lista = [
      [
        "Ventas registradas",
        dinero(r.ingresos),
        `${r.ventas.length} ventas activas del periodo`
      ],
      [
        "Gastos registrados",
        dinero(r.egresos),
        "Incluye pagos de personal capturados"
      ],
      [
        "Resultado registrado",
        dinero(r.resultado),
        "Ventas menos gastos capturados"
      ],
      [
        "Kilos vendidos",
        `${kilos(r.peso)} kg`,
        "De los productos vendidos en la vista"
      ]
    ];

    $("#stats").innerHTML = lista.map(
      ([nombre, valor, descripcion], indice) => `
        <article class="stat stat-${indice}">
          <p>${nombre}</p>
          <strong>${valor}</strong>
          <small>${descripcion}</small>
        </article>
      `
    ).join("");
  }

  function dentro(fecha) {
    return fecha >= desde && fecha <= hasta;
  }

  function ventasVista() {
    return datos.ventas.filter(venta =>
      dentro(venta.fecha) &&
      (mostrarAnuladas || !venta.anulada)
    );
  }

  function gastosVista() {
    return datos.gastos.filter(gasto =>
      dentro(gasto.fecha) &&
      (mostrarAnuladas || !gasto.anulado)
    );
  }

  function tablaVentas(lista) {
    if (!lista.length) {
      return `
        <div class="vacio">
          <span>◌</span>
          <h3>No hay ventas en esta vista</h3>
          <p>Registra una venta o selecciona otro periodo.</p>
        </div>
      `;
    }

    return `
      <div class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Folio / fecha</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Pago / estado</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${lista.map(venta => `
              <tr>
                <td>
                  <strong>${esc(venta.folio)}</strong>
                  <small>${fechaTexto(venta.fecha)}</small>
                </td>

                <td>${esc(venta.nombre)}</td>
                <td>${kilos(venta.gramos)} kg</td>
                <td><strong>${dinero(venta.total)}</strong></td>

                <td>
                  ${venta.metodo}
                  <small>
                    ${venta.anulada ? "Anulada" : "Registrada"}
                  </small>
                </td>

                <td>
                  <div class="botones">
                    <button
                      class="mini"
                      type="button"
                      data-accion="ticket"
                      data-id="${esc(venta.id)}"
                    >
                      Recibo ↗
                    </button>

                    ${
                      !venta.anulada
                        ? `<button
                             class="texto-boton"
                             type="button"
                             data-accion="anular-venta"
                             data-id="${esc(venta.id)}"
                           >Anular</button>`
                        : ""
                    }
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function tablaGastos(lista) {
    if (!lista.length) {
      return `
        <div class="vacio">
          <span>↘</span>
          <h3>No hay gastos en esta vista</h3>
          <p>Registra un gasto o cambia el periodo.</p>
        </div>
      `;
    }

    return `
      <div class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Concepto</th>
              <th>Importe</th>
              <th>Pago / estado</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${lista.map(gasto => `
              <tr>
                <td>${fechaTexto(gasto.fecha)}</td>

                <td>
                  <span class="badge ${gasto.empleado ? "personal" : ""}">
                    ${esc(gasto.categoria)}
                  </span>
                </td>

                <td>${esc(gasto.concepto)}</td>
                <td><strong>${dinero(gasto.monto)}</strong></td>

                <td>
                  ${gasto.metodo}
                  <small>
                    ${gasto.anulado ? "Anulado" : "Registrado"}
                  </small>
                </td>

                <td>
                  ${
                    !gasto.anulado
                      ? `<button
                           class="texto-boton"
                           type="button"
                           data-accion="anular-gasto"
                           data-id="${esc(gasto.id)}"
                         >Anular</button>`
                      : ""
                  }
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function panel() {
    const r = resumen(datos, desde, hasta);

    $("#pantalla").innerHTML = `
      <section class="bienvenida">
        <div>
          <p class="eyebrow">DEL MOSTRADOR A LA ADMINISTRACIÓN</p>

          <h2>
            El trabajo de cada día,<br>
            <em>mejor organizado.</em>
          </h2>

          <p>
            Registra tus ventas, revisa tus gastos y conoce
            el resultado de los movimientos que has capturado.
          </p>

          <a class="boton naranja" href="ventas.html">
            Probar una venta ↗
          </a>
        </div>

        <div class="seleccion-productos">
          ${PRODUCTOS.map((producto, indice) => `
            <div>
              <span>0${indice + 1}</span>
              <strong>${producto.nombre}</strong>
              <small>
                ${dinero(producto.precio)} / kg de ejemplo
              </small>
            </div>
          `).join("")}
        </div>
      </section>

      <div class="resumen-grid">
        <section class="panel">
          <p class="eyebrow">FORMAS DE COBRO</p>
          <h2>Así entraron las ventas.</h2>

          <div class="renglon">
            <span>Efectivo simulado</span>
            <b>${dinero(r.efectivo)}</b>
          </div>

          <div class="renglon">
            <span>Transferencia simulada</span>
            <b>${dinero(r.transferencia)}</b>
          </div>

          <div class="renglon total">
            <span>Total del periodo</span>
            <strong>${dinero(r.ingresos)}</strong>
          </div>

          <p class="nota">
            El cambio entregado al cliente no se cuenta
            como venta adicional.
          </p>
        </section>

        <section class="panel ayuda">
          <p class="eyebrow">DATOS QUE SE ENTIENDEN</p>
          <h2>Un resultado con contexto.</h2>

          <p>
            La diferencia entre ventas y gastos solo contempla
            lo que se ha registrado. Los sueldos de referencia
            no se descuentan hasta capturar un pago de personal.
          </p>

          <a class="enlace" href="ganancias.html">
            Explorar resultados ↗
          </a>
        </section>
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>Ventas recientes del periodo</h2>
          <a class="enlace" href="ventas.html">Abrir ventas ↗</a>
        </div>

        ${tablaVentas(r.ventas.slice(0, 5))}
      </section>
    `;
  }

  function pantallaVentas() {
    $("#pantalla").innerHTML = `
      <div class="venta-grid">
        <section class="panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">MOSTRADOR</p>
              <h2>Nueva venta</h2>
            </div>
            <span class="badge">Simulación</span>
          </div>

          <form id="form-venta">
            <label for="producto">Producto de muestra</label>

            <select id="producto">
              ${PRODUCTOS.map(producto => `
                <option value="${producto.id}">
                  ${producto.nombre}
                </option>
              `).join("")}
            </select>

            <div class="dos-columnas">
              <div>
                <label for="kilos">Kilos vendidos</label>
                <input
                  id="kilos"
                  type="number"
                  min="0.001"
                  max="1000"
                  step="0.001"
                  value="1"
                  required
                >
              </div>

              <div>
                <label for="precio">Precio por kilo (MXN)</label>
                <input
                  id="precio"
                  type="number"
                  min="0.01"
                  max="10000"
                  step="0.01"
                  value="22"
                  required
                >
              </div>
            </div>

            <div
              class="cantidades"
              role="group"
              aria-label="Cantidades rápidas"
            >
              <button type="button" data-kilos="0.5">½ kg</button>
              <button type="button" data-kilos="1">1 kg</button>
              <button type="button" data-kilos="2">2 kg</button>
              <button type="button" data-kilos="5">5 kg</button>
            </div>

            <div class="dos-columnas">
              <div>
                <label for="fecha-venta">Fecha de venta</label>
                <input
                  id="fecha-venta"
                  type="date"
                  value="${dia()}"
                  max="${dia()}"
                  required
                >
              </div>

              <div>
                <label for="metodo-venta">Método de cobro</label>
                <select id="metodo-venta">
                  ${METODOS.map(m => `<option>${m}</option>`).join("")}
                </select>
              </div>
            </div>

            <label for="recibido">
              Efectivo recibido de prueba (MXN)
            </label>

            <input
              id="recibido"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value="50"
              required
            >

            <p class="nota">
              El recibo usa un cliente de demostración.
              No se solicitan datos personales.
            </p>

            <p id="error-venta" class="error" role="alert"></p>

            <button class="boton ancho" type="submit">
              Registrar venta y generar recibo ↗
            </button>
          </form>
        </section>

        <aside class="panel resumen-venta">
          <p class="eyebrow">CÁLCULO AL MOMENTO</p>
          <h2>Una venta.<br>Todo claro.</h2>
          <div id="calculo-venta"></div>

          <p class="nota">
            Precios de ejemplo en MXN.
            El total se redondea a centavos.
          </p>
        </aside>
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>Ventas del periodo</h2>

          <label class="check">
            <input
              id="ver-anuladas"
              type="checkbox"
              ${mostrarAnuladas ? "checked" : ""}
            >
            Ver anuladas
          </label>
        </div>

        <div id="lista-ventas"></div>
      </section>
    `;

    $("#producto").addEventListener("change", () => {
      const producto = PRODUCTOS.find(
        item => item.id === $("#producto").value
      );

      $("#precio").value =
        (producto.precio / 100).toFixed(2);

      calculoVenta();
    });

    $("#metodo-venta").addEventListener("change", () => {
      $("#recibido").disabled =
        $("#metodo-venta").value !== "Efectivo";

      calculoVenta();
    });

    $("#form-venta").addEventListener(
      "input",
      calculoVenta
    );

    document.querySelectorAll("[data-kilos]").forEach(boton => {
      boton.addEventListener("click", () => {
        $("#kilos").value = boton.dataset.kilos;
        calculoVenta();
      });
    });

    $("#ver-anuladas").addEventListener("change", evento => {
      mostrarAnuladas = evento.target.checked;
      pintarVentas();
    });

    $("#form-venta").addEventListener("submit", evento => {
      evento.preventDefault();

      try {
        if (datos.ventas.length >= 300) {
          throw new Error(
            "Límite de 300 ventas. Puedes restaurar el demo para continuar."
          );
        }

        const producto = PRODUCTOS.find(
          item => item.id === $("#producto").value
        );

        const peso = gramos($("#kilos").value);
        const precio = centavos($("#precio").value);
        const total = importeVenta(peso, precio);
        const fecha = $("#fecha-venta").value;
        const metodo = $("#metodo-venta").value;

        if (
          !producto ||
          !fechaValida(fecha) ||
          fecha > dia() ||
          !METODOS.includes(metodo)
        ) {
          throw new Error(
            "Revisa el producto, la fecha y el método de cobro."
          );
        }

        const recibido = metodo === "Efectivo"
          ? centavos($("#recibido").value)
          : null;

        if (recibido !== null && recibido < total) {
          throw new Error(
            "El efectivo recibido no puede ser menor al total."
          );
        }

        const siguiente = Math.max(
          0,
          ...datos.ventas.map(venta =>
            Number(venta.folio.replace("VT-", "")) || 0
          )
        ) + 1;

        const venta = {
          id: uid(),
          folio: `VT-${String(siguiente).padStart(4, "0")}`,
          producto: producto.id,
          nombre: producto.nombre,
          gramos: peso,
          precio,
          total,
          fecha,
          metodo,
          recibido,
          cambio: recibido === null ? 0 : recibido - total,
          anulada: false
        };

        datos.ventas.unshift(venta);

        guardar();
        stats();
        pintarVentas();

        $("#error-venta").textContent = "";

        abrirTicket(venta.id);

        avisar(
          dentro(fecha)
            ? "Venta de prueba registrada."
            : "Venta registrada. Cambia el periodo para verla en la tabla."
        );
      } catch (error) {
        $("#error-venta").textContent = error.message;
      }
    });

    calculoVenta();
    pintarVentas();
  }

  function calculoVenta() {
    try {
      const total = importeVenta(
        gramos($("#kilos").value),
        centavos($("#precio").value)
      );

      const efectivo =
        $("#metodo-venta").value === "Efectivo";

      let recibido = 0;

      if (efectivo && $("#recibido").value !== "") {
        recibido = centavos($("#recibido").value);
      }

      $("#calculo-venta").innerHTML = `
        <div class="renglon">
          <span>Cantidad</span>
          <b>${kilos(gramos($("#kilos").value))} kg</b>
        </div>

        <div class="renglon">
          <span>Precio por kilo</span>
          <b>${dinero(centavos($("#precio").value))}</b>
        </div>

        <div class="importe-grande">
          <span>Total simulado</span>
          <strong>${dinero(total)}</strong>
        </div>

        <div class="renglon">
          <span>
            ${efectivo ? "Efectivo recibido" : "Transferencia de prueba"}
          </span>
          <b>${dinero(efectivo ? recibido : total)}</b>
        </div>

        <div class="renglon">
          <span>
            ${efectivo && recibido < total ? "Falta recibir" : "Cambio"}
          </span>

          <b>
            ${dinero(efectivo ? Math.abs(recibido - total) : 0)}
          </b>
        </div>
      `;
    } catch (error) {
      $("#calculo-venta").textContent = error.message;
    }
  }

  function pintarVentas() {
    $("#lista-ventas").innerHTML = tablaVentas(ventasVista());
  }

  function pantallaGastos() {
    $("#pantalla").innerHTML = `
      <div class="resumen-grid">
        <section class="panel">
          <p class="eyebrow">CONTROL DE EGRESOS</p>
          <h2>Registrar gasto</h2>

          <form id="form-gasto">
            <div class="dos-columnas">
              <div>
                <label for="categoria">Categoría</label>
                <select id="categoria">
                  ${CATEGORIAS.map(c => `<option>${c}</option>`).join("")}
                </select>
              </div>

              <div>
                <label for="fecha-gasto">Fecha del gasto</label>
                <input
                  id="fecha-gasto"
                  type="date"
                  value="${dia()}"
                  max="${dia()}"
                  required
                >
              </div>
            </div>

            <label for="concepto">Concepto</label>
            <input
              id="concepto"
              maxlength="150"
              required
              placeholder="Ej. Compra de materia prima de muestra"
            >

            <div class="dos-columnas">
              <div>
                <label for="monto">Importe (MXN)</label>
                <input
                  id="monto"
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  required
                >
              </div>

              <div>
                <label for="metodo-gasto">Método de pago</label>
                <select id="metodo-gasto">
                  ${METODOS.map(m => `<option>${m}</option>`).join("")}
                </select>
              </div>
            </div>

            <p id="error-gasto" class="error" role="alert"></p>

            <button class="boton ancho" type="submit">
              Registrar gasto de prueba
            </button>
          </form>
        </section>

        <section class="panel ayuda">
          <p class="eyebrow">EVITA REGISTRAR DOS VECES</p>
          <h2>El personal tiene su propio flujo.</h2>

          <p>
            Los pagos de colaboradores se capturan desde Personal
            y aparecen aquí automáticamente. El sueldo de referencia
            no genera gastos por sí solo.
          </p>

          <a class="enlace" href="empleados.html">
            Abrir personal ↗
          </a>
        </section>
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>Gastos del periodo</h2>

          <label class="check">
            <input
              id="ver-anuladas"
              type="checkbox"
              ${mostrarAnuladas ? "checked" : ""}
            >
            Ver anulados
          </label>
        </div>

        <div id="lista-gastos"></div>
      </section>
    `;

    $("#ver-anuladas").addEventListener("change", evento => {
      mostrarAnuladas = evento.target.checked;
      pintarGastos();
    });

    $("#form-gasto").addEventListener("submit", evento => {
      evento.preventDefault();

      try {
        if (datos.gastos.length >= 300) {
          throw new Error(
            "Límite de 300 gastos en esta demostración."
          );
        }

        const categoria = $("#categoria").value;
        const fecha = $("#fecha-gasto").value;
        const concepto = $("#concepto").value.trim();
        const monto = centavos($("#monto").value);
        const metodo = $("#metodo-gasto").value;

        if (
          !CATEGORIAS.includes(categoria) ||
          !fechaValida(fecha) ||
          fecha > dia() ||
          !concepto ||
          monto <= 0 ||
          !METODOS.includes(metodo)
        ) {
          throw new Error(
            "Completa correctamente los datos del gasto."
          );
        }

        datos.gastos.unshift({
          id: uid(),
          fecha,
          categoria,
          concepto,
          monto,
          metodo,
          anulado: false,
          empleado: null,
          jornadas: 0,
          tarifa: 0
        });

        guardar();
        stats();
        pintarGastos();

        $("#form-gasto").reset();
        $("#fecha-gasto").value = dia();
        $("#error-gasto").textContent = "";

        avisar(
          dentro(fecha)
            ? "Gasto de prueba registrado."
            : "Gasto registrado. Cambia el periodo para verlo."
        );
      } catch (error) {
        $("#error-gasto").textContent = error.message;
      }
    });

    pintarGastos();
  }

  function pintarGastos() {
    $("#lista-gastos").innerHTML = tablaGastos(gastosVista());
  }

  function pantallaPersonal() {
    $("#pantalla").innerHTML = `
      <div class="resumen-grid">
        <section class="panel">
          <p class="eyebrow">EQUIPO DE DEMOSTRACIÓN</p>
          <h2>Agregar colaborador</h2>

          <form id="form-empleado">
            <label for="nombre">Nombre ficticio</label>
            <input
              id="nombre"
              maxlength="70"
              required
              placeholder="Colaborador de prueba"
            >

            <label for="puesto">Puesto</label>
            <input
              id="puesto"
              maxlength="70"
              required
              placeholder="Ej. Atención de mostrador"
            >

            <label for="diario">
              Pago diario de referencia (MXN)
            </label>

            <input
              id="diario"
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              required
            >

            <p class="nota">
              No se solicitan datos bancarios ni personales reales.
            </p>

            <p class="error" id="error-empleado" role="alert"></p>

            <button class="boton ancho" type="submit">
              Agregar colaborador de prueba
            </button>
          </form>
        </section>

        <section class="panel ayuda">
          <p class="eyebrow">CAPTURA EXPLÍCITA</p>
          <h2>La referencia no es un pago.</h2>

          <p>
            Para reflejar un egreso, selecciona Registrar pago
            en el colaborador. Se calculará el importe según
            las jornadas declaradas y se agregará una sola vez
            a Gastos.
          </p>

          <p class="nota">
            Es una simulación de registro de egresos:
            no calcula nómina, prestaciones, impuestos
            ni obligaciones laborales.
          </p>
        </section>
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>Colaboradores registrados</h2>

          <span class="badge">
            ${datos.empleados.filter(e => e.activo).length} activos
          </span>
        </div>

        <div class="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Colaborador / puesto</th>
                <th>Referencia diaria</th>
                <th>Pagado en el periodo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              ${datos.empleados.map(empleado => `
                <tr>
                  <td>
                    <strong>${esc(empleado.nombre)}</strong>
                    <small>${esc(empleado.puesto)}</small>
                  </td>

                  <td>${dinero(empleado.diario)}</td>

                  <td>
                    ${
                      dinero(
                        datos.gastos
                          .filter(gasto =>
                            !gasto.anulado &&
                            gasto.empleado === empleado.id &&
                            dentro(gasto.fecha)
                          )
                          .reduce(
                            (suma, gasto) => suma + gasto.monto,
                            0
                          )
                      )
                    }
                  </td>

                  <td>
                    <span class="badge ${empleado.activo ? "" : "anulada"}">
                      ${empleado.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td>
                    <div class="botones">
                      ${
                        empleado.activo
                          ? `<button
                               class="mini"
                               type="button"
                               data-accion="pagar"
                               data-id="${esc(empleado.id)}"
                             >Registrar pago</button>`
                          : ""
                      }

                      <button
                        class="texto-boton"
                        type="button"
                        data-accion="estado-empleado"
                        data-id="${esc(empleado.id)}"
                      >
                        ${empleado.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;

    $("#form-empleado").addEventListener("submit", evento => {
      evento.preventDefault();

      try {
        if (datos.empleados.length >= 50) {
          throw new Error(
            "Límite de 50 colaboradores en el demo."
          );
        }

        const nombre = $("#nombre").value.trim();
        const puesto = $("#puesto").value.trim();
        const diario = centavos($("#diario").value);

        if (!nombre || !puesto || diario <= 0) {
          throw new Error(
            "Completa el nombre ficticio, puesto y referencia diaria."
          );
        }

        datos.empleados.push({
          id: uid(),
          nombre,
          puesto,
          diario,
          activo: true
        });

        guardar();
        pantallaPersonal();

        avisar("Colaborador de prueba agregado.");
      } catch (error) {
        $("#error-empleado").textContent = error.message;
      }
    });
  }

  function pantallaResultados() {
    const r = resumen(datos, desde, hasta);
    const dias = [];

    for (
      let fecha = desde;
      fecha <= hasta;
      fecha = mover(fecha, 1)
    ) {
      const diario = resumen(datos, fecha, fecha);

      dias.push({
        fecha,
        ventas: diario.ingresos,
        gastos: diario.egresos,
        resultado: diario.resultado
      });
    }

    const maximo = Math.max(
      1,
      ...dias.flatMap(d => [d.ventas, d.gastos])
    );

    const categorias = [...CATEGORIAS, "Personal"];

    $("#pantalla").innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">MOVIMIENTOS DEL PERIODO</p>
            <h2>Ventas y gastos registrados</h2>
          </div>

          <button id="exportar" class="mini" type="button">
            Exportar movimientos CSV ↓
          </button>
        </div>

        <p class="nota">
          Resultado registrado = ventas activas menos gastos activos.
          No equivale a utilidad contable ni considera costos
          que no se hayan capturado.
          Los movimientos anulados quedan excluidos.
        </p>

        <div class="leyenda">
          <span><i></i>Ventas</span>
          <span><i></i>Gastos</span>
        </div>

        <div class="grafica">
          ${dias.map(d => `
            <div class="dia-grafica">
              <span>${fechaTexto(d.fecha)}</span>

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
                    class="barra gasto"
                    style="width:${d.gastos / maximo * 100}%"
                  ></div>
                  <small>${dinero(d.gastos)}</small>
                </div>
              </div>
            </div>
          `).join("")}
        </div>

        <details class="tabla-datos">
          <summary>Ver importes diarios en tabla</summary>

          <div class="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ventas</th>
                  <th>Gastos</th>
                  <th>Resultado registrado</th>
                </tr>
              </thead>

              <tbody>
                ${dias.map(d => `
                  <tr>
                    <td>${fechaTexto(d.fecha)}</td>
                    <td>${dinero(d.ventas)}</td>
                    <td>${dinero(d.gastos)}</td>
                    <td>${dinero(d.resultado)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div class="resumen-grid">
        <section class="panel">
          <p class="eyebrow">DISTRIBUCIÓN DE EGRESOS</p>
          <h2>Gastos por categoría</h2>

          ${categorias.map(categoria => {
            const total = r.gastos
              .filter(gasto => gasto.categoria === categoria)
              .reduce((suma, gasto) => suma + gasto.monto, 0);

            return `
              <div class="renglon">
                <span>${categoria}</span>
                <b>${dinero(total)}</b>
              </div>
            `;
          }).join("")}
        </section>

        <section class="panel ayuda">
          <p class="eyebrow">CONTEXTO DE LA VENTA</p>
          <h2>Más allá del total.</h2>

          <div class="renglon">
            <span>Ventas del periodo</span>
            <b>${r.ventas.length}</b>
          </div>

          <div class="renglon">
            <span>Importe promedio por venta</span>
            <b>
              ${
                dinero(
                  r.ventas.length
                    ? Math.round(r.ingresos / r.ventas.length)
                    : 0
                )
              }
            </b>
          </div>

          <div class="renglon">
            <span>Personal registrado como gasto</span>
            <b>
              ${
                dinero(
                  r.gastos
                    .filter(gasto => gasto.empleado)
                    .reduce((suma, gasto) => suma + gasto.monto, 0)
                )
              }
            </b>
          </div>

          <p class="nota">
            Los kilos suman los tres productos de demostración.
            Las existencias y la producción física no se controlan
            en esta versión.
          </p>
        </section>
      </div>
    `;

    $("#exportar").addEventListener("click", exportar);
  }

  function actualizar() {
    stats();

    if (vista === "panel") panel();

    if (vista === "ventas") {
      if ($("#lista-ventas")) pintarVentas();
      else pantallaVentas();
    }

    if (vista === "gastos") {
      if ($("#lista-gastos")) pintarGastos();
      else pantallaGastos();
    }

    if (vista === "empleados") pantallaPersonal();
    if (vista === "ganancias") pantallaResultados();
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

  function abrirTicket(id) {
    const venta = datos.ventas.find(
      item => item.id === id
    );

    if (!venta) return;

    ventaAbierta = id;

    $("#ticket").innerHTML = `
      <div class="ticket-marca">
        <span>m.</span>
        <h3>MILPA</h3>
        <p>Tortillería de demostración</p>
        <small>SIN VALIDEZ FISCAL · SIN COBRO REAL</small>
      </div>

      <div class="ticket-folio">
        <strong>${esc(venta.folio)}</strong>

        <span class="badge ${venta.anulada ? "anulada" : ""}">
          ${venta.anulada ? "Venta anulada" : "Venta de prueba"}
        </span>
      </div>

      <dl class="ticket-datos">
        <div>
          <dt>Fecha</dt>
          <dd>${fechaTexto(venta.fecha)}</dd>
        </div>

        <div>
          <dt>Cliente</dt>
          <dd>Visitante de demostración</dd>
        </div>

        <div>
          <dt>Producto</dt>
          <dd>${esc(venta.nombre)}</dd>
        </div>

        <div>
          <dt>Cantidad</dt>
          <dd>${kilos(venta.gramos)} kg</dd>
        </div>

        <div>
          <dt>Precio por kilo</dt>
          <dd>${dinero(venta.precio)}</dd>
        </div>

        <div>
          <dt>Método</dt>
          <dd>${venta.metodo} simulado</dd>
        </div>
      </dl>

      <div class="importe-grande">
        <span>Total de la venta</span>
        <strong>${dinero(venta.total)}</strong>
      </div>

      ${
        venta.metodo === "Efectivo"
          ? `
            <div class="renglon">
              <span>Recibido</span>
              <b>${dinero(venta.recibido)}</b>
            </div>

            <div class="renglon">
              <span>Cambio</span>
              <b>${dinero(venta.cambio)}</b>
            </div>
          `
          : '<p class="nota">Transferencia simulada, sin verificar ni recibir dinero.</p>'
      }

      <p class="nota">
        ${
          venta.anulada
            ? "Este movimiento está anulado y no se incluye en los resultados."
            : "Este documento demuestra una compra. No representa una venta real."
        }
      </p>
    `;

    abrir("modal-ticket");
  }

  function abrirPago(id) {
    const empleado = datos.empleados.find(
      item => item.id === id
    );

    if (!empleado || !empleado.activo) return;

    pagoEmpleado = id;

    $("#form-personal-contenedor").innerHTML = `
      <p class="aviso">
        ${esc(empleado.nombre)} ·
        Referencia diaria: ${dinero(empleado.diario)}
      </p>

      <form id="form-personal">
        <label for="fecha-personal">
          Fecha del pago de prueba
        </label>

        <input
          id="fecha-personal"
          type="date"
          value="${dia()}"
          max="${dia()}"
          required
        >

        <label for="jornadas">
          Jornadas declaradas a pagar
        </label>

        <input
          id="jornadas"
          type="number"
          min="1"
          max="30"
          step="1"
          value="1"
          required
        >

        <label for="metodo-personal">Método</label>
        <select id="metodo-personal">
          ${METODOS.map(m => `<option>${m}</option>`).join("")}
        </select>

        <div class="importe-grande">
          <span>Total del pago simulado</span>
          <strong id="total-personal">
            ${dinero(empleado.diario)}
          </strong>
        </div>

        <p class="nota">
          Se agregará un solo gasto de categoría Personal.
          Se permite un pago activo por persona y fecha
          para evitar duplicados. Las jornadas son declaradas;
          no se validan asistencias ni periodos de nómina.
        </p>

        <p class="error" id="error-personal" role="alert"></p>

        <button class="boton ancho" type="submit">
          Registrar pago como gasto
        </button>
      </form>
    `;

    $("#jornadas").addEventListener("input", () => {
      const cantidad = Number($("#jornadas").value);

      $("#total-personal").textContent =
        Number.isInteger(cantidad) &&
        cantidad >= 1 &&
        cantidad <= 30
          ? dinero(empleado.diario * cantidad)
          : "Revisa las jornadas";
    });

    $("#form-personal").addEventListener("submit", evento => {
      evento.preventDefault();

      try {
        const seleccionado = datos.empleados.find(
          item => item.id === pagoEmpleado
        );

        const fecha = $("#fecha-personal").value;
        const jornadas = Number($("#jornadas").value);
        const metodo = $("#metodo-personal").value;

        if (
          !seleccionado ||
          !seleccionado.activo ||
          !fechaValida(fecha) ||
          fecha > dia() ||
          !Number.isInteger(jornadas) ||
          jornadas < 1 ||
          jornadas > 30 ||
          !METODOS.includes(metodo)
        ) {
          throw new Error("Revisa los datos del pago.");
        }

        if (!puedePagar(datos, seleccionado.id, fecha)) {
          throw new Error(
            "Ya existe un pago activo para esa persona y fecha. Revisa Gastos antes de registrar otro."
          );
        }

        const monto = seleccionado.diario * jornadas;

        if (
          datos.gastos.length >= 300 ||
          monto > 100000000
        ) {
          throw new Error(
            "Se superó un límite de esta demostración."
          );
        }

        datos.gastos.unshift({
          id: uid(),
          fecha,
          categoria: "Personal",
          concepto:
            `Pago de prueba · ${seleccionado.nombre} · ${jornadas} jornadas`,
          monto,
          metodo,
          anulado: false,
          empleado: seleccionado.id,
          jornadas,
          tarifa: seleccionado.diario
        });

        guardar();
        actualizar();

        $("#modal-personal").close();

        avisar("Pago registrado una sola vez en Gastos.");
      } catch (error) {
        $("#error-personal").textContent = error.message;
      }
    });

    abrir("modal-personal");
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
    const r = resumen(datos, desde, hasta);

    const celda = valor => {
      let texto = String(valor);

      if (/^\s*[=+@-]/.test(texto)) {
        texto = "'" + texto;
      }

      return `"${texto.replace(/"/g, '""')}"`;
    };

    const filas = [
      [
        "Fecha",
        "Tipo",
        "Concepto",
        "Metodo",
        "Ingreso MXN",
        "Egreso MXN"
      ],
      ...r.ventas.map(venta => [
        venta.fecha,
        "Venta",
        `${venta.folio} · ${venta.nombre} · ${kilos(venta.gramos)} kg`,
        venta.metodo,
        (venta.total / 100).toFixed(2),
        ""
      ]),
      ...r.gastos.map(gasto => [
        gasto.fecha,
        gasto.categoria,
        gasto.concepto,
        gasto.metodo,
        "",
        (gasto.monto / 100).toFixed(2)
      ])
    ];

    descargar(
      "\uFEFF" + filas
        .map(fila => fila.map(celda).join(","))
        .join("\r\n"),
      "movimientos-demo-milpa.csv",
      "text/csv;charset=utf-8"
    );
  }

  montar();
  stats();

  if (vista === "panel") panel();
  if (vista === "ventas") pantallaVentas();
  if (vista === "gastos") pantallaGastos();
  if (vista === "empleados") pantallaPersonal();
  if (vista === "ganancias") pantallaResultados();

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

    if (accion === "ticket") {
      abrirTicket(id);
    }

    if (accion === "pagar") {
      abrirPago(id);
    }

    if (accion === "estado-empleado") {
      const empleado = datos.empleados.find(
        item => item.id === id
      );

      if (!empleado) return;

      empleado.activo = !empleado.activo;

      guardar();
      pantallaPersonal();

      avisar(
        empleado.activo
          ? "Colaborador activado."
          : "Colaborador desactivado; su historial se conserva."
      );
    }

    if (accion === "anular-venta") {
      const venta = datos.ventas.find(
        item => item.id === id
      );

      if (
        !venta ||
        venta.anulada ||
        !window.confirm(
          `¿Anular ${venta.folio}? Se conservará en el historial, pero no sumará a los resultados.`
        )
      ) {
        return;
      }

      venta.anulada = true;

      guardar();
      actualizar();

      avisar("Venta de prueba anulada.");
    }

    if (accion === "anular-gasto") {
      const gasto = datos.gastos.find(
        item => item.id === id
      );

      if (
        !gasto ||
        gasto.anulado ||
        !window.confirm(
          "¿Anular este gasto? Permanecerá en el historial y dejará de descontarse del resultado."
        )
      ) {
        return;
      }

      gasto.anulado = true;

      guardar();
      actualizar();

      avisar("Gasto de prueba anulado.");
    }
  });

  $("#descargar-ticket").addEventListener("click", () => {
    const venta = datos.ventas.find(
      item => item.id === ventaAbierta
    );

    if (!venta) return;

    const texto = [
      "MILPA — TORTILLERÍA DEMO",
      "SIN VALIDEZ FISCAL · SIN COBRO REAL",
      `Folio: ${venta.folio}`,
      `Estado: ${venta.anulada ? "ANULADA" : "Registrada"}`,
      `Fecha: ${venta.fecha}`,
      "Cliente: Visitante de demostración",
      `Producto: ${venta.nombre}`,
      `Cantidad: ${kilos(venta.gramos)} kg`,
      `Precio/kg: ${dinero(venta.precio)}`,
      `Total: ${dinero(venta.total)}`,
      `Método: ${venta.metodo} simulado`,
      venta.recibido === null
        ? "Sin movimiento de dinero real"
        : `Recibido: ${dinero(venta.recibido)} | Cambio: ${dinero(venta.cambio)}`
    ].join("\n");

    descargar(
      texto,
      "recibo-demo-milpa.txt",
      "text/plain;charset=utf-8"
    );
  });

  $("#imprimir-ticket").addEventListener("click", () => {
    window.print();
  });

  $("#restaurar").addEventListener("click", () => {
    const confirmar = window.confirm(
      "¿Reemplazar ventas, gastos y personal de este navegador por los ejemplos iniciales?"
    );

    if (!confirmar) return;

    datos = ejemplos();

    guardar();
    actualizar();

    avisar("Demostración restaurada.");
  });
})();