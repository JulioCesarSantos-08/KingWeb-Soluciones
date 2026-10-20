(() => {
  const CLAVE = "kingland.asistencias.demo.v1";

  const PERSONAS = [
    {
      id: "p1",
      nombre: "Colaborador demo 01",
      area: "Atención",
      iniciales: "C1"
    },
    {
      id: "p2",
      nombre: "Colaborador demo 02",
      area: "Operación",
      iniciales: "C2"
    },
    {
      id: "p3",
      nombre: "Colaborador demo 03",
      area: "Administración",
      iniciales: "C3"
    }
  ];

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

  function limites(desde, hasta) {
    const final = new Date(`${hasta}T00:00:00`);
    final.setDate(final.getDate() + 1);

    return [
      new Date(`${desde}T00:00:00`).getTime(),
      final.getTime()
    ];
  }

  const hora = valor => {
    if (valor === null || valor === undefined) return "—";

    return new Date(valor).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const fechaTexto = valor => {
    return new Date(valor).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  function tiempo(milisegundos, segundos = false) {
    const total = Math.floor(
      Math.max(0, milisegundos) / 1000
    );

    const horas = Math.floor(total / 3600);
    const minutos = Math.floor(total % 3600 / 60);

    return (
      `${horas} h ${String(minutos).padStart(2, "0")} min` +
      (
        segundos
          ? ` ${String(total % 60).padStart(2, "0")} s`
          : ""
      )
    );
  }

  function solape(inicioA, finA, inicioB, finB) {
    return Math.max(
      0,
      Math.min(finA, finB) - Math.max(inicioA, inicioB)
    );
  }

  function duracion(
    registro,
    ahora = Date.now(),
    inicio = 0,
    fin = Infinity
  ) {
    const salida = registro.salida === null
      ? ahora
      : registro.salida;

    const bruto = solape(
      registro.entrada,
      salida,
      inicio,
      fin
    );

    const pausas = registro.pausas.reduce((suma, pausa) => {
      return suma + solape(
        pausa.inicio,
        pausa.fin === null ? salida : pausa.fin,
        Math.max(registro.entrada, inicio),
        Math.min(salida, fin)
      );
    }, 0);

    return Math.max(0, bruto - pausas);
  }

  function pausaTotal(
    registro,
    ahora = Date.now(),
    inicio = 0,
    fin = Infinity
  ) {
    const salida = registro.salida === null
      ? ahora
      : registro.salida;

    return registro.pausas.reduce((suma, pausa) => {
      return suma + solape(
        pausa.inicio,
        pausa.fin === null ? salida : pausa.fin,
        Math.max(registro.entrada, inicio),
        Math.min(salida, fin)
      );
    }, 0);
  }

  const estado = registro => {
    if (registro.salida !== null) return "Completada";

    return registro.pausas.some(pausa => pausa.fin === null)
      ? "En pausa"
      : "En curso";
  };

  function validar(lista) {
    if (
      !Array.isArray(lista) ||
      lista.length > 300 ||
      new Set(lista.map(r => r?.id)).size !== lista.length
    ) {
      return false;
    }

    const abiertas = new Set();

    return lista.every(registro => {
      if (
        !registro ||
        typeof registro.id !== "string" ||
        registro.id.length > 100 ||
        !PERSONAS.some(p => p.id === registro.persona) ||
        !Number.isSafeInteger(registro.entrada) ||
        registro.entrada <= 0 ||
        !["simulado", "real"].includes(registro.modoEntrada) ||
        !Array.isArray(registro.pausas)
      ) {
        return false;
      }

      if (
        registro.salida !== null &&
        (
          !Number.isSafeInteger(registro.salida) ||
          registro.salida < registro.entrada ||
          !["simulado", "real"].includes(registro.modoSalida)
        )
      ) {
        return false;
      }

      if (registro.salida === null) {
        if (abiertas.has(registro.persona)) return false;
        abiertas.add(registro.persona);
      }

      let ultimo = registro.entrada;

      for (let i = 0; i < registro.pausas.length; i++) {
        const pausa = registro.pausas[i];

        if (
          !pausa ||
          !Number.isSafeInteger(pausa.inicio) ||
          pausa.inicio < ultimo ||
          (
            registro.salida !== null &&
            pausa.inicio > registro.salida
          )
        ) {
          return false;
        }

        if (pausa.fin === null) {
          if (
            registro.salida !== null ||
            i !== registro.pausas.length - 1
          ) {
            return false;
          }
        } else if (
          !Number.isSafeInteger(pausa.fin) ||
          pausa.fin < pausa.inicio ||
          (
            registro.salida !== null &&
            pausa.fin > registro.salida
          )
        ) {
          return false;
        }

        ultimo = pausa.fin === null
          ? Infinity
          : pausa.fin;
      }

      return true;
    });
  }

  function crearEjemplos() {
    const lista = [];

    for (let i = 1; i <= 5; i++) {
      for (let j = 0; j < PERSONAS.length; j++) {
        const fecha = mover(dia(), -i);
        const minutos = (i + j) % 3 === 0 ? 18 : 0;

        lista.push({
          id: `ejemplo-${i}-${j}`,
          persona: PERSONAS[j].id,
          entrada: new Date(
            `${fecha}T09:${String(minutos).padStart(2, "0")}:00`
          ).getTime(),
          salida: new Date(`${fecha}T17:00:00`).getTime(),
          modoEntrada: "simulado",
          modoSalida: "simulado",
          pausas: [{
            inicio: new Date(`${fecha}T13:00:00`).getTime(),
            fin: new Date(`${fecha}T13:30:00`).getTime()
          }]
        });
      }
    }

    return lista.sort((a, b) => b.entrada - a.entrada);
  }

  function transicion(
    lista,
    persona,
    accion,
    modo,
    ahora = Date.now()
  ) {
    if (!PERSONAS.some(p => p.id === persona)) {
      throw new Error("Selecciona un colaborador de prueba.");
    }

    const abierta = lista.find(
      registro =>
        registro.persona === persona &&
        registro.salida === null
    );

    if (accion === "entrada") {
      if (abierta) {
        throw new Error(
          "Esta persona ya tiene una jornada abierta. Registra su salida primero."
        );
      }

      if (lista.length >= 300) {
        throw new Error(
          "Límite de 300 jornadas. Puedes restaurar los ejemplos para seguir probando."
        );
      }

      if (!["simulado", "real"].includes(modo)) {
        throw new Error("Selecciona un modo de registro.");
      }

      const ultima = Math.max(
        0,
        ...lista
          .filter(registro => registro.persona === persona)
          .map(registro => registro.salida || registro.entrada)
      );

      if (ahora < ultima) {
        throw new Error(
          "La hora del dispositivo es anterior al último registro. Revisa el reloj."
        );
      }

      const registro = {
        id: uid(),
        persona,
        entrada: ahora,
        salida: null,
        modoEntrada: modo,
        modoSalida: null,
        pausas: []
      };

      lista.unshift(registro);
      return registro;
    }

    if (!abierta) {
      throw new Error("Primero registra una entrada.");
    }

    const ultima = Math.max(
      abierta.entrada,
      ...abierta.pausas.map(
        pausa => pausa.fin || pausa.inicio
      )
    );

    if (ahora < ultima) {
      throw new Error(
        "El reloj del dispositivo retrocedió. Revisa la hora antes de continuar."
      );
    }

    const pausa = abierta.pausas.find(
      item => item.fin === null
    );

    if (accion === "pausa") {
      if (pausa) {
        throw new Error("La jornada ya está en pausa.");
      }

      abierta.pausas.push({
        inicio: ahora,
        fin: null
      });
    } else if (accion === "reanudar") {
      if (!pausa) {
        throw new Error("No hay una pausa abierta.");
      }

      pausa.fin = ahora;
    } else if (accion === "salida") {
      if (!["simulado", "real"].includes(modo)) {
        throw new Error("Selecciona un modo de registro.");
      }

      if (pausa) pausa.fin = ahora;

      abierta.salida = ahora;
      abierta.modoSalida = modo;
    } else {
      throw new Error("Acción no disponible.");
    }

    return abierta;
  }

  function retardos(lista) {
    const primeros = new Map();

    lista.forEach(registro => {
      const clave =
        `${registro.persona}-${dia(new Date(registro.entrada))}`;

      if (
        !primeros.has(clave) ||
        registro.entrada < primeros.get(clave)
      ) {
        primeros.set(clave, registro.entrada);
      }
    });

    return [...primeros.values()].filter(valor => {
      const limite = new Date(valor);
      limite.setHours(9, 10, 0, 0);
      return valor > limite.getTime();
    }).length;
  }

  const app = document.getElementById("app");

  if (!app) return;

  const $ = selector => document.querySelector(selector);
  const admin = document.body.dataset.vista === "admin";

  let registros = crearEjemplos();
  let persona = "p1";
  let modo = "simulado";
  let posicion = null;
  let solicitando = false;
  let tokenUbicacion = 0;
  let guardado = true;
  let desde = mover(dia(), -6);
  let hasta = dia();
  let filtroPersona = "Todos";
  let filtroEstado = "Todos";
  let temporizador;
  let focoAnterior;
  let jornadaDetalle = null;

  try {
    const guardadoLocal = localStorage.getItem(CLAVE);

    if (guardadoLocal !== null) {
      const lista = JSON.parse(guardadoLocal);

      if (!validar(lista)) {
        throw new Error("Datos inválidos");
      }

      registros = lista;
    } else {
      localStorage.setItem(CLAVE, JSON.stringify(registros));
    }
  } catch {
    guardado = false;
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(registros));
      guardado = true;
    } catch {
      guardado = false;
    }

    $("#aviso-local").hidden = guardado;
  }

  function avisar(texto) {
    $("#notificacion").textContent = texto;
    $("#notificacion").classList.add("visible");

    clearTimeout(temporizador);

    temporizador = setTimeout(() => {
      $("#notificacion").classList.remove("visible");
    }, 4500);
  }

  const colaborador = id => PERSONAS.find(p => p.id === id);

  const badge = registro => {
    const clase = registro.salida !== null
      ? "cerrada"
      : estado(registro) === "En pausa"
        ? "pausa"
        : "activa";

    return `
      <span class="badge ${clase}">
        ${estado(registro)}
      </span>
    `;
  };

  const whats =
    "https://wa.me/522225354183?text=Hola%2C%20prob%C3%A9%20el%20demo%20de%20asistencias%20de%20King%20Land%20y%20me%20interesa%20un%20sistema%20para%20mi%20equipo.";

  function montar() {
    app.innerHTML = `
      <div class="demo-barra">
        <p>
          DEMO INTERACTIVO · Personas ficticias ·
          Sin conexión con personal real
        </p>
        <a href="../index.html">Volver a King Land ↗</a>
      </div>

      <header class="cabecera">
        <a class="marca" href="asistencias.html">
          <span>p.</span>
          <div>PULSO<small>ASISTENCIAS DEMO</small></div>
        </a>

        <nav aria-label="Navegación de asistencias">
          <a
            href="asistencias.html"
            ${!admin ? 'aria-current="page"' : ""}
          >
            Registro de jornada
          </a>

          <a
            href="admin.html"
            ${admin ? 'aria-current="page"' : ""}
          >
            Panel administrativo
          </a>
        </nav>
      </header>

      <main class="contenedor" id="contenido">
        <div class="pagina-head">
          <div>
            <p class="eyebrow">PULSO / EQUIPOS MEJOR ORGANIZADOS</p>

            <h1 tabindex="-1">
              ${
                admin
                  ? "Cada jornada, con más claridad."
                  : "Tu jornada, en un solo lugar."
              }
            </h1>

            <p>
              ${
                admin
                  ? "Consulta jornadas, pausas y tiempo neto del periodo."
                  : "Registra tu entrada, toma una pausa y cierra tu día."
              }
            </p>
          </div>

          <div class="reloj">
            <strong id="reloj"></strong>
            <small id="fecha-reloj"></small>
          </div>
        </div>

        <p
          id="aviso-local"
          class="aviso"
          ${guardado ? "hidden" : ""}
        >
          El almacenamiento local no está disponible o sus datos
          no son válidos. Los cambios pueden no conservarse al
          recargar o cambiar de pantalla. Puedes restaurar el demo
          o usar un navegador con almacenamiento disponible.
        </p>

        <div id="pantalla"></div>

        <section class="cta">
          <div>
            <p class="eyebrow">UNA HERRAMIENTA PARA TU EQUIPO</p>
            <h2>Más orden.<br><em>Menos registros dispersos.</em></h2>
            <p>
              Los horarios, permisos y reglas de tu sistema
              se definen contigo.
            </p>
          </div>

          <a
            class="boton"
            href="${whats}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar mi proyecto ↗
          </a>
        </section>

        <footer class="pie">
          <span>
            Pulso es una identidad ficticia · Creado por King Land
          </span>

          <button type="button" id="restaurar">
            Restaurar datos de ejemplo
          </button>
        </footer>
      </main>

      <div
        id="notificacion"
        class="notificacion"
        role="status"
        aria-live="polite"
      ></div>

      <dialog
        id="detalle"
        class="modal"
        aria-labelledby="detalle-titulo"
      >
        <div class="modal-head">
          <div>
            <p class="eyebrow">REGISTRO DE DEMOSTRACIÓN</p>
            <h2 id="detalle-titulo" tabindex="-1">
              Detalle de jornada
            </h2>
          </div>

          <button
            class="cerrar"
            id="cerrar-detalle"
            type="button"
            aria-label="Cerrar detalle"
          >×</button>
        </div>

        <div id="detalle-cuerpo"></div>

        <button
          class="boton ancho"
          type="button"
          id="descargar-detalle"
        >
          Descargar comprobante TXT ↓
        </button>
      </dialog>
    `;
  }

  function tabla(lista, limiteInicio = 0, limiteFin = Infinity) {
    if (!lista.length) {
      return `
        <div class="vacio">
          <span>◷</span>
          <h3>No hay jornadas en esta vista</h3>
          <p>
            Prueba otro periodo o registra una entrada
            de demostración.
          </p>
        </div>
      `;
    }

    return `
      <div class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Persona / día de entrada</th>
              <th>Entrada / salida</th>
              <th>Pausas del periodo</th>
              <th>Tiempo neto del periodo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${
              [...lista]
                .sort((a, b) => b.entrada - a.entrada)
                .map(registro => `
                  <tr>
                    <td>
                      <strong>
                        ${colaborador(registro.persona).nombre}
                      </strong>
                      <small>${fechaTexto(registro.entrada)}</small>
                    </td>

                    <td>
                      ${hora(registro.entrada)} →
                      ${hora(registro.salida)}
                      <small>
                        ${
                          registro.salida !== null
                            ? fechaTexto(registro.salida)
                            : "Salida pendiente"
                        }
                      </small>
                    </td>

                    <td>
                      ${
                        tiempo(
                          pausaTotal(
                            registro,
                            Date.now(),
                            limiteInicio,
                            limiteFin
                          )
                        )
                      }
                    </td>

                    <td>
                      <strong>
                        ${
                          tiempo(
                            duracion(
                              registro,
                              Date.now(),
                              limiteInicio,
                              limiteFin
                            )
                          )
                        }
                      </strong>

                      <small>
                        ${
                          registro.salida === null
                            ? "Provisional"
                            : "Consolidado"
                        }
                      </small>
                    </td>

                    <td>${badge(registro)}</td>

                    <td>
                      <button
                        class="mini"
                        type="button"
                        data-detalle="${esc(registro.id)}"
                        aria-label="Ver jornada de ${
                          colaborador(registro.persona).nombre
                        }"
                      >
                        Ver ↗
                      </button>
                    </td>
                  </tr>
                `).join("")
            }
          </tbody>
        </table>
      </div>
    `;
  }

  function pantallaRegistro() {
    $("#pantalla").innerHTML = `
      <div class="registro-grid">
        <section class="panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">REGISTRO PERSONAL DE PRUEBA</p>
              <h2>¿Listo para comenzar?</h2>
            </div>
            <span class="badge">Demo local</span>
          </div>

          <label for="persona">Colaborador de demostración</label>

          <select id="persona">
            ${PERSONAS.map(p => `
              <option
                value="${p.id}"
                ${p.id === persona ? "selected" : ""}
              >
                ${p.nombre} · ${p.area}
              </option>
            `).join("")}
          </select>

          <div class="perfil">
            <span id="avatar"></span>

            <div>
              <strong id="nombre-persona"></strong>
              <small id="area-persona"></small>
            </div>

            <span id="estado-persona"></span>
          </div>

          <div class="jornada-hoy">
            <div>
              <small>Última entrada de hoy</small>
              <strong id="entrada-hoy">—</strong>
            </div>

            <div>
              <small>Última salida de hoy</small>
              <strong id="salida-hoy">—</strong>
            </div>

            <div class="tiempo-hoy">
              <small>Tiempo neto trabajado hoy</small>
              <strong id="tiempo-hoy">0 h 00 min</strong>
              <p>
                Descuenta pausas y cuenta solo el tiempo
                dentro de este día.
              </p>
            </div>
          </div>

          <p id="jornada-abierta" class="nota"></p>

          <div class="acciones-jornada">
            <button class="boton" id="entrada" type="button">
              Registrar entrada ↗
            </button>

            <button
              class="boton secundario"
              id="pausa"
              type="button"
            >
              Iniciar pausa
            </button>

            <button
              class="boton salida"
              id="salida"
              type="button"
            >
              Registrar salida
            </button>
          </div>

          <p class="nota">
            Horario ilustrativo: 09:00 a 17:00,
            con 10 minutos de tolerancia.
            No se calculan nóminas, descuentos ni horas extra.
          </p>
        </section>

        <aside class="panel ubicacion">
          <p class="eyebrow">TÚ ELIGES CÓMO EXPLORAR</p>
          <h2>Modo de registro</h2>

          <label for="modo">Ubicación al entrar o salir</label>

          <select id="modo">
            <option value="simulado">
              Modo de prueba · sin ubicación
            </option>

            <option value="real">
              Consultar ubicación real
            </option>
          </select>

          <div
            id="explicacion-modo"
            class="explicacion"
          ></div>

          <button
            class="boton secundario ancho"
            type="button"
            id="consultar-ubicacion"
            hidden
          >
            Consultar mi ubicación
          </button>

          <p
            id="estado-ubicacion"
            class="nota"
            role="status"
          ></p>

          <div id="datos-ubicacion"></div>

          <div class="privacidad">
            <span>◎</span>
            <h3>Solo una demostración.</h3>

            <p>
              Las coordenadas no se guardan en las jornadas
              ni se envían a un mapa externo.
              Consultar ubicación no valida que estés
              dentro de un centro de trabajo.
            </p>
          </div>
        </aside>
      </div>

      <section class="panel historial">
        <div class="panel-head">
          <div>
            <p class="eyebrow">CONTINUIDAD DE TU JORNADA</p>
            <h2>Historial del colaborador</h2>
          </div>

          <a href="admin.html" class="enlace">
            Ver todo el equipo ↗
          </a>
        </div>

        <div id="historial-personal"></div>
      </section>
    `;

    $("#persona").addEventListener("change", evento => {
      persona = evento.target.value;
      posicion = null;
      tokenUbicacion++;
      solicitando = false;

      actualizarPersona();
      pintarUbicacion();
    });

    $("#modo").value = modo;

    $("#modo").addEventListener("change", evento => {
      modo = evento.target.value;
      posicion = null;
      tokenUbicacion++;
      solicitando = false;

      pintarUbicacion();
    });

    $("#consultar-ubicacion").addEventListener(
      "click",
      consultarUbicacion
    );

    ["entrada", "pausa", "salida"].forEach(accion => {
      $("#" + accion).addEventListener(
        "click",
        () => registrar(accion)
      );
    });

    actualizarPersona();
    pintarUbicacion();
  }

  function actualizarPersona() {
    const seleccionado = colaborador(persona);
    const hoy = dia();

    const propias = registros.filter(
      registro => registro.persona === persona
    );

    const registrosHoy = propias
      .filter(registro =>
        dia(new Date(registro.entrada)) === hoy
      )
      .sort((a, b) => b.entrada - a.entrada);

    const abierta = propias.find(
      registro => registro.salida === null
    );

    $("#avatar").textContent = seleccionado.iniciales;
    $("#nombre-persona").textContent = seleccionado.nombre;
    $("#area-persona").textContent = seleccionado.area;

    $("#estado-persona").innerHTML = abierta
      ? badge(abierta)
      : '<span class="badge cerrada">Sin jornada abierta</span>';

    $("#entrada-hoy").textContent =
      hora(registrosHoy[0]?.entrada);

    $("#salida-hoy").textContent =
      hora(registrosHoy[0]?.salida);

    $("#entrada").disabled = Boolean(abierta);
    $("#salida").disabled = !abierta;
    $("#pausa").disabled = !abierta;

    $("#pausa").textContent =
      abierta && estado(abierta) === "En pausa"
        ? "Reanudar jornada"
        : "Iniciar pausa";

    $("#jornada-abierta").textContent = abierta
      ? (
          `Jornada abierta desde ${
            fechaTexto(abierta.entrada)
          } a las ${hora(abierta.entrada)}. ` +
          (
            dia(new Date(abierta.entrada)) !== hoy
              ? "Puedes cerrarla aunque haya comenzado otro día."
              : ""
          )
        )
      : "Puedes registrar una nueva entrada. No se permite abrir dos jornadas al mismo tiempo para la misma persona.";

    $("#historial-personal").innerHTML = tabla(
      propias
        .slice()
        .sort((a, b) => b.entrada - a.entrada)
        .slice(0, 20)
    );

    actualizarTiempo();
  }

  function actualizarTiempo() {
    if (admin) return;

    const [inicio, fin] = limites(dia(), dia());

    const total = registros
      .filter(registro => registro.persona === persona)
      .reduce((suma, registro) => {
        return suma + duracion(
          registro,
          Date.now(),
          inicio,
          fin
        );
      }, 0);

    $("#tiempo-hoy").textContent = tiempo(total, true);
  }

  function pintarUbicacion() {
    const real = modo === "real";

    $("#explicacion-modo").textContent = real
      ? "La consulta se hará solo al pulsar el botón y autorizar el permiso del navegador. Necesitarás una consulta reciente para registrar entrada o salida."
      : "Puedes probar entradas, pausas y salidas sin compartir tu ubicación. Los registros se identificarán como simulados.";

    $("#consultar-ubicacion").hidden = !real;
    $("#consultar-ubicacion").disabled = solicitando;

    $("#estado-ubicacion").textContent = solicitando
      ? "Consultando ubicación…"
      : real
        ? posicion
          ? "Ubicación consultada. Se descartará al registrar o cambiar de modo."
          : "No se ha consultado tu ubicación."
        : "Modo de prueba activo. No se solicita ubicación.";

    $("#datos-ubicacion").innerHTML = posicion
      ? `
        <dl class="coordenadas">
          <div>
            <dt>Latitud</dt>
            <dd>${posicion.lat.toFixed(5)}</dd>
          </div>

          <div>
            <dt>Longitud</dt>
            <dd>${posicion.lng.toFixed(5)}</dd>
          </div>

          <div>
            <dt>Precisión estimada</dt>
            <dd>±${Math.round(posicion.precision)} m</dd>
          </div>

          <div>
            <dt>Consultada</dt>
            <dd>${hora(posicion.ts)}</dd>
          </div>
        </dl>

        <p class="nota">
          Válida para este demo durante dos minutos.
          Sin validación de zona autorizada.
        </p>
      `
      : "";
  }

  function consultarUbicacion() {
    if (modo !== "real" || solicitando) return;

    if (
      !window.isSecureContext ||
      !navigator.geolocation
    ) {
      $("#estado-ubicacion").textContent =
        "La ubicación requiere un navegador compatible y HTTPS o localhost. Puedes usar el modo de prueba.";

      return;
    }

    solicitando = true;

    const token = ++tokenUbicacion;

    posicion = null;
    pintarUbicacion();

    navigator.geolocation.getCurrentPosition(
      resultado => {
        if (
          token !== tokenUbicacion ||
          modo !== "real"
        ) {
          return;
        }

        solicitando = false;

        const {
          latitude,
          longitude,
          accuracy
        } = resultado.coords;

        if (
          ![latitude, longitude, accuracy].every(Number.isFinite) ||
          Math.abs(latitude) > 90 ||
          Math.abs(longitude) > 180 ||
          accuracy < 0
        ) {
          pintarUbicacion();

          $("#estado-ubicacion").textContent =
            "No se recibió una ubicación válida. Prueba de nuevo o usa el modo de prueba.";

          return;
        }

        posicion = {
          lat: latitude,
          lng: longitude,
          precision: accuracy,
          ts: Date.now()
        };

        pintarUbicacion();
      },
      error => {
        if (token !== tokenUbicacion) return;

        solicitando = false;
        posicion = null;

        pintarUbicacion();

        $("#estado-ubicacion").textContent =
          error.code === 1
            ? "No se autorizó el permiso. Puedes continuar con el modo de prueba."
            : error.code === 3
              ? "La consulta tardó demasiado. Reintenta o usa el modo de prueba."
              : "No fue posible obtener la ubicación. Reintenta o usa el modo de prueba.";
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }

  function registrar(accion) {
    try {
      const abierta = registros.find(registro =>
        registro.persona === persona &&
        registro.salida === null
      );

      const evento =
        accion === "pausa" &&
        abierta &&
        estado(abierta) === "En pausa"
          ? "reanudar"
          : accion;

      if (
        ["entrada", "salida"].includes(evento) &&
        modo === "real" &&
        (
          !posicion ||
          Date.now() - posicion.ts > 120000
        )
      ) {
        throw new Error(
          "Consulta de nuevo tu ubicación o selecciona el modo de prueba."
        );
      }

      transicion(
        registros,
        persona,
        evento,
        modo
      );

      if (["entrada", "salida"].includes(evento)) {
        posicion = null;
        tokenUbicacion++;
        solicitando = false;
      }

      guardar();
      actualizarPersona();
      pintarUbicacion();

      avisar(
        evento === "entrada"
          ? "Entrada de demostración registrada."
          : evento === "salida"
            ? "Jornada cerrada. El tiempo de pausa se descontó."
            : evento === "pausa"
              ? "Pausa iniciada. Este tiempo no contará como trabajado."
              : "Jornada reanudada."
      );
    } catch (error) {
      avisar(error.message);
    }
  }

  function pantallaAdmin() {
    $("#pantalla").innerHTML = `
      <p class="aviso">
        Panel de demostración abierto, sin autenticación.
        Solo muestra los datos ficticios guardados en este navegador.
        No es un control de acceso para un sistema real.
      </p>

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">CONSULTA DEL EQUIPO</p>
            <h2>Jornadas y tiempo trabajado</h2>
          </div>

          <div class="botones">
            <button class="mini" type="button" id="actualizar">
              Actualizar
            </button>

            <button class="mini" type="button" id="exportar">
              Exportar vista CSV ↓
            </button>
          </div>
        </div>

        <form id="filtros" class="filtros">
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

          <div>
            <label for="filtro-persona">Colaborador</label>

            <select id="filtro-persona">
              <option value="Todos">Todo el equipo</option>

              ${PERSONAS.map(p => `
                <option value="${p.id}">${p.nombre}</option>
              `).join("")}
            </select>
          </div>

          <div>
            <label for="filtro-estado">Estado</label>

            <select id="filtro-estado">
              <option>Todos</option>
              <option>En curso</option>
              <option>En pausa</option>
              <option>Completada</option>
            </select>
          </div>

          <button class="boton" type="submit">
            Aplicar filtros
          </button>
        </form>

        <p id="error-filtro" class="error" role="alert"></p>

        <p class="nota">
          El periodo incluye jornadas que coinciden con esas fechas,
          aunque empiecen el día anterior.
          Los tiempos se recortan a ese periodo.
          Zona horaria del navegador:
          ${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)}.
        </p>
      </section>

      <div class="stats" id="stats"></div>

      <section class="panel">
        <div class="panel-head">
          <h2>Registros del periodo</h2>
          <span class="badge" id="contador"></span>
        </div>

        <div id="lista-jornadas"></div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">SOLO JORNADAS COMPLETADAS</p>
            <h2>Resumen por colaborador</h2>
          </div>
        </div>

        <div
          id="resumen-personas"
          class="resumen-personas"
        ></div>

        <p id="nota-retardos" class="nota"></p>
      </section>
    `;

    $("#filtros").addEventListener("submit", evento => {
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
        $("#error-filtro").textContent =
          "Elige un periodo válido de hasta 90 días.";

        return;
      }

      desde = inicio;
      hasta = final;
      filtroPersona = $("#filtro-persona").value;
      filtroEstado = $("#filtro-estado").value;

      $("#error-filtro").textContent = "";

      pintarAdmin();
    });

    $("#actualizar").addEventListener("click", () => {
      pintarAdmin();
      avisar("Vista actualizada.");
    });

    $("#exportar").addEventListener("click", exportar);

    pintarAdmin();
  }

  function seleccion() {
    const [inicio, fin] = limites(desde, hasta);
    const ahora = Date.now();

    return registros.filter(registro =>
      registro.entrada < fin &&
      (
        registro.salida === null
          ? ahora
          : registro.salida
      ) > inicio &&
      (
        filtroPersona === "Todos" ||
        registro.persona === filtroPersona
      ) &&
      (
        filtroEstado === "Todos" ||
        estado(registro) === filtroEstado
      )
    );
  }

  function pintarAdmin() {
    const lista = seleccion();
    const [inicio, fin] = limites(desde, hasta);
    const ahora = Date.now();

    const cerradas = lista.filter(
      registro => registro.salida !== null
    );

    const neto = cerradas.reduce((suma, registro) => {
      return suma + duracion(registro, ahora, inicio, fin);
    }, 0);

    const pausas = cerradas.reduce((suma, registro) => {
      return suma + pausaTotal(registro, ahora, inicio, fin);
    }, 0);

    const valores = [
      [
        "Jornadas en la vista",
        lista.length,
        "Coinciden con filtros y periodo"
      ],
      [
        "Tiempo neto completado",
        tiempo(neto),
        "No incluye jornadas abiertas"
      ],
      [
        "Pausas completadas",
        tiempo(pausas),
        "Dentro del periodo seleccionado"
      ],
      [
        "Jornadas abiertas",
        lista.length - cerradas.length,
        "Tiempo provisional, sin consolidar"
      ]
    ];

    $("#stats").innerHTML = valores.map(
      ([nombre, valor, descripcion], indice) => `
        <article class="stat stat-${indice}">
          <p>${nombre}</p>
          <strong>${valor}</strong>
          <small>${descripcion}</small>
        </article>
      `
    ).join("");

    $("#contador").textContent =
      `${lista.length} registros`;

    $("#lista-jornadas").innerHTML = tabla(
      lista,
      inicio,
      fin
    );

    $("#resumen-personas").innerHTML = PERSONAS
      .filter(p =>
        filtroPersona === "Todos" ||
        p.id === filtroPersona
      )
      .map(p => {
        const propias = cerradas.filter(
          registro => registro.persona === p.id
        );

        const total = propias.reduce((suma, registro) => {
          return suma + duracion(
            registro,
            ahora,
            inicio,
            fin
          );
        }, 0);

        return `
          <article>
            <span class="avatar">${p.iniciales}</span>
            <h3>${p.nombre}</h3>
            <p>${p.area}</p>
            <strong>${tiempo(total)}</strong>
            <small>
              ${propias.length} jornadas completadas en la vista
            </small>
          </article>
        `;
      }).join("");

    const entradas = registros.filter(registro =>
      registro.entrada >= inicio &&
      registro.entrada < fin &&
      (
        filtroPersona === "Todos" ||
        registro.persona === filtroPersona
      )
    );

    $("#nota-retardos").textContent =
      `Referencia de puntualidad: ${
        retardos(entradas)
      } primeras entradas del día posteriores a las 09:10. ` +
      "Este indicador usa persona y periodo; no depende del filtro de estado. " +
      "Horario ilustrativo de 09:00 a 17:00. No calcula sanciones ni nómina.";
  }

  function abrirDetalle(id) {
    const registro = registros.find(
      item => item.id === id
    );

    if (!registro) return;

    jornadaDetalle = id;
    focoAnterior = document.activeElement;

    $("#detalle-cuerpo").innerHTML = `
      <div class="detalle-perfil">
        <span class="avatar">
          ${colaborador(registro.persona).iniciales}
        </span>

        <h3>${colaborador(registro.persona).nombre}</h3>
        ${badge(registro)}
      </div>

      <dl class="detalle-datos">
        <div>
          <dt>Entrada</dt>
          <dd>
            ${fechaTexto(registro.entrada)} ·
            ${hora(registro.entrada)}
          </dd>
        </div>

        <div>
          <dt>Salida</dt>
          <dd>
            ${
              registro.salida === null
                ? "Pendiente"
                : `${fechaTexto(registro.salida)} · ${hora(registro.salida)}`
            }
          </dd>
        </div>

        <div>
          <dt>Modo de entrada</dt>
          <dd>
            ${
              registro.modoEntrada === "real"
                ? "Ubicación consultada"
                : "Simulado"
            }
          </dd>
        </div>

        <div>
          <dt>Modo de salida</dt>
          <dd>
            ${
              registro.salida === null
                ? "Pendiente"
                : registro.modoSalida === "real"
                  ? "Ubicación consultada"
                  : "Simulado"
            }
          </dd>
        </div>

        <div>
          <dt>Pausas</dt>
          <dd>${tiempo(pausaTotal(registro))}</dd>
        </div>
      </dl>

      <div class="total-detalle">
        <span>Tiempo neto de toda la jornada</span>
        <strong>${tiempo(duracion(registro))}</strong>

        <small>
          ${
            registro.salida === null
              ? "Provisional: la jornada continúa abierta."
              : "Jornada completada."
          }
        </small>
      </div>

      <h4>Pausas registradas</h4>

      ${
        registro.pausas.length
          ? registro.pausas.map(pausa => `
              <div class="movimiento">
                <span>
                  ${fechaTexto(pausa.inicio)} ·
                  ${hora(pausa.inicio)}
                </span>

                <b>
                  ${
                    pausa.fin === null
                      ? "En curso"
                      : hora(pausa.fin)
                  }
                </b>
              </div>
            `).join("")
          : '<p class="nota">Sin pausas registradas.</p>'
      }

      <p class="nota">
        Las coordenadas no se almacenan.
        La indicación de ubicación consultada no valida presencia
        en una zona autorizada.
        Datos y tiempos de demostración basados en el reloj
        del dispositivo.
      </p>
    `;

    $("#detalle").showModal();

    $("#detalle-titulo").focus({
      preventScroll: true
    });
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
    const [inicio, fin] = limites(desde, hasta);
    const ahora = Date.now();

    const celda = valor => {
      let texto = String(valor);

      if (/^\s*[=+@-]/.test(texto)) {
        texto = "'" + texto;
      }

      return `"${texto.replace(/"/g, '""')}"`;
    };

    const filas = [
      [
        "Persona ficticia",
        "Area",
        "Fecha entrada",
        "Hora entrada",
        "Fecha salida",
        "Hora salida",
        "Estado",
        "Minutos netos del periodo",
        "Minutos de pausa del periodo",
        "Modo entrada",
        "Modo salida"
      ],
      ...seleccion().map(registro => [
        colaborador(registro.persona).nombre,
        colaborador(registro.persona).area,
        dia(new Date(registro.entrada)),
        hora(registro.entrada),
        registro.salida === null
          ? "Pendiente"
          : dia(new Date(registro.salida)),
        hora(registro.salida),
        estado(registro),
        (
          duracion(registro, ahora, inicio, fin) / 60000
        ).toFixed(2),
        (
          pausaTotal(registro, ahora, inicio, fin) / 60000
        ).toFixed(2),
        registro.modoEntrada,
        registro.modoSalida || "Pendiente"
      ])
    ];

    descargar(
      "\uFEFF" + filas
        .map(fila => fila.map(celda).join(","))
        .join("\r\n"),
      "asistencias-demo.csv",
      "text/csv;charset=utf-8"
    );
  }

  montar();

  if (admin) {
    pantallaAdmin();
  } else {
    pantallaRegistro();
  }

  function reloj() {
    const ahora = new Date();

    $("#reloj").textContent = ahora.toLocaleTimeString(
      "es-MX",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    );

    $("#fecha-reloj").textContent =
      fechaTexto(ahora.getTime());

    if (!admin) {
      actualizarTiempo();

      if (
        posicion &&
        Date.now() - posicion.ts > 120000
      ) {
        posicion = null;
        pintarUbicacion();
      }
    }
  }

  reloj();
  setInterval(reloj, 1000);

  document.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-detalle]");

    if (boton) {
      abrirDetalle(boton.dataset.detalle);
    }
  });

  $("#cerrar-detalle").addEventListener("click", () => {
    $("#detalle").close();
  });

  $("#detalle").addEventListener("close", () => {
    if (focoAnterior?.isConnected) {
      focoAnterior.focus();
    }
  });

  $("#detalle").addEventListener("click", evento => {
    const dialogo = $("#detalle");

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

  $("#descargar-detalle").addEventListener("click", () => {
    const registro = registros.find(
      item => item.id === jornadaDetalle
    );

    if (!registro) return;

    const texto = [
      "PULSO — ASISTENCIAS DE DEMOSTRACIÓN",
      `Persona ficticia: ${colaborador(registro.persona).nombre}`,
      `Estado: ${estado(registro)}`,
      `Entrada: ${
        new Date(registro.entrada).toLocaleString("es-MX")
      }`,
      `Salida: ${
        registro.salida === null
          ? "Pendiente"
          : new Date(registro.salida).toLocaleString("es-MX")
      }`,
      `Pausas: ${tiempo(pausaTotal(registro))}`,
      `Tiempo neto: ${tiempo(duracion(registro))}`,
      `Modo entrada: ${registro.modoEntrada}`,
      `Modo salida: ${registro.modoSalida || "Pendiente"}`,
      "",
      "No incluye coordenadas. No acredita una asistencia laboral real.",
      "Los tiempos abiertos son provisionales y se basan en el reloj del dispositivo."
    ].join("\n");

    descargar(
      texto,
      "jornada-demo-pulso.txt",
      "text/plain;charset=utf-8"
    );
  });

  $("#restaurar").addEventListener("click", () => {
    const confirmar = window.confirm(
      "¿Reemplazar las jornadas y pausas de prueba de este navegador por los ejemplos iniciales?"
    );

    if (!confirmar) return;

    registros = crearEjemplos();
    guardar();

    if (admin) {
      pintarAdmin();
    } else {
      posicion = null;
      actualizarPersona();
      pintarUbicacion();
    }

    avisar("Datos de demostración restaurados.");
  });

  window.addEventListener("storage", evento => {
    if (evento.key !== CLAVE) return;

    try {
      const lista = JSON.parse(evento.newValue);

      if (!validar(lista)) return;

      registros = lista;
      guardado = true;

      $("#aviso-local").hidden = true;

      if ($("#detalle").open) {
        $("#detalle").close();
      }

      if (admin) {
        pintarAdmin();
      } else {
        actualizarPersona();
      }
    } catch {
      return;
    }
  });
})();