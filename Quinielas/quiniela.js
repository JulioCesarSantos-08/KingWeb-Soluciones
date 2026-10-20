(() => {
  'use strict';

  const KEY = 'kingland.quinielas.demo.v1';
  const opciones = ['L', 'E', 'V'];

  const partidos = [
    ['Cóndores', 'Marineros'],
    ['Halcones', 'Venados'],
    ['Lobos', 'Centellas'],
    ['Pumas del Sur', 'Dragones'],
    ['Estrellas', 'Titanes'],
    ['Guerreros', 'Delfines'],
    ['Toros', 'Jaguares'],
    ['Zorros', 'Leones'],
    ['Atléticos', 'Mineros'],
    ['Náuticos', 'Soles']
  ];

  const esc = valor =>
    String(valor).replace(
      /[&<>"']/g,
      caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[caracter]
    );

  const puntos = (pronosticos, resultados) =>
    resultados.reduce(
      (total, resultado, indice) =>
        total + (
          resultado !== null &&
          pronosticos[indice] === resultado
            ? 1
            : 0
        ),
      0
    );

  const ordenados = estado =>
    estado.boletos
      .map(boleto => ({
        ...boleto,
        puntos: puntos(boleto.pronosticos, estado.resultados)
      }))
      .sort(
        (a, b) =>
          b.puntos - a.puntos ||
          a.fecha - b.fecha
      );

  function validar(estado) {
    return Boolean(
      estado &&
      typeof estado.cerrada === 'boolean' &&
      Array.isArray(estado.resultados) &&
      estado.resultados.length === 10 &&
      estado.resultados.every(
        resultado =>
          resultado === null ||
          opciones.includes(resultado)
      ) &&
      (
        !estado.resultados.some(resultado => resultado !== null) ||
        estado.cerrada
      ) &&
      Array.isArray(estado.boletos) &&
      estado.boletos.length <= 100 &&
      estado.boletos.every(
        boleto =>
          typeof boleto.id === 'string' &&
          /^Q-\d{4}$/.test(boleto.id) &&
          typeof boleto.alias === 'string' &&
          boleto.alias.trim().length > 0 &&
          boleto.alias.length <= 30 &&
          Number.isFinite(boleto.fecha) &&
          Array.isArray(boleto.pronosticos) &&
          boleto.pronosticos.length === 10 &&
          boleto.pronosticos.every(
            pronostico => opciones.includes(pronostico)
          )
      ) &&
      new Set(estado.boletos.map(boleto => boleto.id)).size ===
        estado.boletos.length
    );
  }

  function inicial() {
    return {
      cerrada: false,
      resultados: Array(10).fill(null),
      boletos: [
        'Equipo Aurora',
        'Visitante Norte',
        'Afición Verde'
      ].map((alias, indice) => ({
        id: `Q-000${indice + 1}`,
        alias,
        fecha: Date.now() - (3 - indice) * 60000,
        pronosticos: partidos.map(
          (_, partido) => opciones[(partido + indice) % 3]
        )
      }))
    };
  }

  function registrar(estado, alias, pronosticos) {
    alias = alias.trim();

    if (estado.cerrada) {
      throw Error('La jornada está cerrada.');
    }

    if (!alias || alias.length > 30) {
      throw Error('Escribe un alias de hasta 30 caracteres.');
    }

    if (
      pronosticos.length !== 10 ||
      pronosticos.some(
        pronostico => !opciones.includes(pronostico)
      )
    ) {
      throw Error('Selecciona los diez pronósticos.');
    }

    if (estado.boletos.length >= 100) {
      throw Error('La demo admite hasta 100 participaciones.');
    }

    const numero = Math.max(
      0,
      ...estado.boletos.map(
        boleto => Number(boleto.id.slice(2))
      )
    ) + 1;

    const boleto = {
      id: `Q-${String(numero).padStart(4, '0')}`,
      alias,
      fecha: Date.now(),
      pronosticos: [...pronosticos]
    };

    estado.boletos.push(boleto);

    return boleto;
  }

  const app = document.getElementById('app');

  let avisoCarga = '';
  let estado;

  try {
    const guardado = localStorage.getItem(KEY);

    estado = guardado
      ? JSON.parse(guardado)
      : inicial();

    if (!validar(estado)) {
      throw Error();
    }
  } catch {
    estado = inicial();

    avisoCarga =
      'No se pudieron recuperar los datos guardados. ' +
      'Se cargó una muestra ficticia.';
  }

  let borrador = Array(10).fill('');
  let temporal;

  const fecha = valor =>
    new Date(valor).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

  const resueltos = () =>
    estado.resultados.filter(
      resultado => resultado !== null
    ).length;

  function guardar() {
    try {
      localStorage.setItem(KEY, JSON.stringify(estado));
    } catch {
      avisar(
        'No se pudo guardar en el navegador. ' +
        'Los cambios durarán solo esta sesión.'
      );
    }
  }

  function avisar(texto) {
    document.getElementById('aviso').textContent = texto;
  }

  function botones(indice, valor, grupo) {
    return opciones.map((opcion, posicion) => `
      <label class="opcion">
        <input
          type="radio"
          name="${grupo}${indice}"
          value="${opcion}"
          ${valor === opcion ? 'checked' : ''}
          ${
            grupo === 'p' && estado.cerrada
              ? 'disabled'
              : ''
          }
        >
        <span>
          ${opcion}
          <small>
            ${['Local', 'Empate', 'Visita'][posicion]}
          </small>
        </span>
      </label>
    `).join('');
  }

  function marco() {
    const esTabla = document.body.dataset.vista === 'tabla';

    const mensajeWhatsApp = encodeURIComponent(
      'Hola, vi la demo de quinielas de King Land. ' +
      'Me interesa cotizar un sistema para organizar ' +
      'pronósticos deportivos.'
    );

    app.innerHTML = `
      <header>
        <a class="marca" href="../index.html">
          <img
            src="../imagenes/logo1.png"
            alt="King Land"
          >
          <span>
            Cancha
            <small>Quinielas · Demo interactiva</small>
          </span>
        </a>

        <nav aria-label="Principal">
          <a
            href="quiniela.html"
            ${!esTabla ? 'aria-current="page"' : ''}
          >
            Pronósticos
          </a>

          <a
            href="tabla.html"
            ${esTabla ? 'aria-current="page"' : ''}
          >
            Clasificación
          </a>

          <a href="../index.html">King Land ↗</a>
        </nav>
      </header>

      <main id="contenido">
        <section class="hero">
          <div>
            <p class="eyebrow">
              JORNADA DE EXHIBICIÓN · 10 ENCUENTROS
            </p>

            <h1>
              ${
                esTabla
                  ? 'Cada acierto cuenta.'
                  : 'Tu lectura del juego.'
              }
            </h1>

            <p>
              ${
                esTabla
                  ? 'Consulta participaciones, publica resultados ' +
                    'ficticios y observa cómo cambia la clasificación.'
                  : 'Elige local, empate o visitante. Una experiencia ' +
                    'sencilla para organizar pronósticos deportivos.'
              }
            </p>

            <span class="etiqueta" id="fase"></span>
          </div>

          <aside>
            <strong>100% demostración</strong>
            <p>
              Equipos y participantes ficticios. Sin cobros ni premios.
              Datos guardados únicamente en este navegador.
            </p>
          </aside>
        </section>

        <div
          id="aviso"
          role="status"
          aria-live="polite"
        ></div>

        <section
          class="metricas"
          aria-label="Resumen"
          id="metricas"
        ></section>

        <div id="vista"></div>

        <section class="contacto">
          <div>
            <h2>Tu torneo, con su propio sistema.</h2>
            <p>
              Podemos adaptar jornadas, reglas, usuarios y reportes
              a tu proyecto.
            </p>
          </div>

          <a
            class="boton"
            href="https://wa.me/522225354183?text=${mensajeWhatsApp}"
            target="_blank"
            rel="noopener"
          >
            Cotizar por WhatsApp ↗
          </a>
        </section>

        <footer>
          <span>
            Cancha · Una demostración de King Land
          </span>

          <button class="texto" id="reiniciar">
            Restablecer muestra
          </button>
        </footer>
      </main>

      <dialog
        id="comprobante"
        aria-labelledby="titulo-ticket"
      >
        <div id="ticket"></div>

        <div class="acciones no-imprimir">
          <button id="descargar">Descargar TXT</button>
          <button id="imprimir">Imprimir / PDF</button>
          <button id="cerrar">Cerrar</button>
        </div>
      </dialog>
    `;

    document.getElementById('reiniciar').onclick = () => {
      const confirmado = confirm(
        '¿Restablecer esta demo? Se eliminarán las ' +
        'participaciones y resultados guardados aquí.'
      );

      if (!confirmado) {
        return;
      }

      estado = inicial();
      borrador = Array(10).fill('');

      guardar();
      render();
      avisar('Muestra restablecida.');
    };

    document.getElementById('cerrar').onclick = () => {
      document.getElementById('comprobante').close();
    };

    document.getElementById('imprimir').onclick = () => {
      window.print();
    };

    document.getElementById('descargar').onclick = () => {
      descargar(
        temporal.texto,
        `${temporal.id}.txt`,
        'text/plain;charset=utf-8'
      );
    };
  }

  function resumen() {
    document.getElementById('fase').textContent =
      estado.cerrada
        ? resueltos() === 10
          ? 'Jornada finalizada'
          : 'Jornada cerrada · Resultados en captura'
        : 'Recepción abierta';

    const indicadores = [
      ['Participaciones', estado.boletos.length],
      ['Partidos resueltos', `${resueltos()} / 10`],
      ['Puntos por acierto', '1'],
      ['Costo de la demo', '$0']
    ];

    document.getElementById('metricas').innerHTML =
      indicadores.map(([titulo, valor]) => `
        <article>
          <span>${titulo}</span>
          <strong>${valor}</strong>
        </article>
      `).join('');
  }

  function render() {
    marco();
    resumen();

    if (document.body.dataset.vista === 'tabla') {
      tabla();
    } else {
      formulario();
    }

    if (avisoCarga) {
      avisar(avisoCarga);
      avisoCarga = '';
    }
  }

  function formulario() {
    document.getElementById('vista').innerHTML = `
      <div class="columnas">
        <form id="pronosticos" class="panel">
          <div class="cabecera">
            <div>
              <p class="eyebrow">ARMA TU PARTICIPACIÓN</p>
              <h2>¿Cómo termina cada partido?</h2>
            </div>

            <span id="contador" class="etiqueta"></span>
          </div>

          <p>
            L = gana local · E = empate · V = gana visitante.
          </p>

          <label class="campo">
            Alias ficticio

            <input
              id="alias"
              maxlength="30"
              required
              placeholder="Ej. Afición del Sur"
              autocomplete="off"
              ${estado.cerrada ? 'disabled' : ''}
            >
          </label>

          <div class="acciones">
            <button
              type="button"
              id="azar"
              ${estado.cerrada ? 'disabled' : ''}
            >
              Completar al azar
            </button>

            <button
              type="button"
              id="limpiar"
              ${estado.cerrada ? 'disabled' : ''}
            >
              Limpiar
            </button>
          </div>

          <div class="partidos">
            ${partidos.map((partido, indice) => `
              <fieldset>
                <legend>
                  <span class="numero">
                    ${String(indice + 1).padStart(2, '0')}
                  </span>

                  ${partido[0]}
                  <span class="vs">vs</span>
                  ${partido[1]}
                </legend>

                <div class="opciones">
                  ${botones(indice, borrador[indice], 'p')}
                </div>
              </fieldset>
            `).join('')}
          </div>

          <p id="error" role="alert"></p>

          <button
            class="boton ancho"
            ${estado.cerrada ? 'disabled' : ''}
          >
            ${
              estado.cerrada
                ? 'Recepción cerrada'
                : 'Registrar pronósticos'
            }
          </button>

          <p class="nota">
            Cada envío crea un folio distinto.
            No se aceptan cambios después de registrarlo.
          </p>
        </form>

        <aside class="lateral">
          <section class="panel verde">
            <p class="eyebrow">ASÍ FUNCIONA</p>
            <h2>Del pronóstico a la tabla.</h2>

            <ol>
              <li>Completa los diez encuentros.</li>
              <li>Registra y conserva tu comprobante.</li>
              <li>Cierra la recepción desde Clasificación.</li>
              <li>Captura resultados y consulta aciertos.</li>
            </ol>

            <a class="boton claro" href="tabla.html">
              Ver clasificación →
            </a>
          </section>

          <section class="panel">
            <h2>Reglas transparentes</h2>

            <p>
              Un punto por resultado acertado.
              Los pendientes todavía no suman ni se marcan como error.
            </p>

            <p>
              Los empates en puntos comparten posición.
              El orden de registro solo organiza su presentación.
            </p>

            <p class="nota">
              La demo no identifica personas ni limita participaciones
              por usuario. Una versión publicada puede incorporar
              cuentas y permisos.
            </p>
          </section>
        </aside>
      </div>
    `;

    const form = document.getElementById('pronosticos');

    const contar = () => {
      document.getElementById('contador').textContent =
        `${borrador.filter(Boolean).length} / 10 elegidos`;
    };

    contar();

    form.addEventListener('change', evento => {
      if (/^p\d+$/.test(evento.target.name)) {
        const indice = Number(evento.target.name.slice(1));

        borrador[indice] = evento.target.value;

        contar();
      }
    });

    document.getElementById('azar').onclick = () => {
      borrador = borrador.map(
        valor =>
          valor ||
          opciones[Math.floor(Math.random() * 3)]
      );

      form.querySelectorAll('input[type="radio"]')
        .forEach(elemento => {
          elemento.checked =
            borrador[Number(elemento.name.slice(1))] ===
            elemento.value;
        });

      contar();
    };

    document.getElementById('limpiar').onclick = () => {
      borrador.fill('');

      form.querySelectorAll('input[type="radio"]')
        .forEach(elemento => {
          elemento.checked = false;
        });

      contar();
    };

    form.onsubmit = evento => {
      evento.preventDefault();

      try {
        const boleto = registrar(
          estado,
          document.getElementById('alias').value,
          borrador
        );

        guardar();

        borrador = Array(10).fill('');

        formulario();
        resumen();
        mostrar(boleto);

        avisar(`Participación ${boleto.id} registrada.`);
      } catch (error) {
        document.getElementById('error').textContent =
          error.message;
      }
    };
  }

  function tabla() {
    document.getElementById('vista').innerHTML = `
      <section class="panel">
        <div class="cabecera">
          <div>
            <p class="eyebrow">CONCENTRADO DE PRONÓSTICOS</p>

            <h2>
              ${
                resueltos() === 10
                  ? 'Clasificación final'
                  : 'Clasificación provisional'
              }
            </h2>
          </div>

          <button id="csv">Exportar CSV</button>
        </div>

        <p id="explica">
          ${
            resueltos()
              ? `Puntuación calculada sobre ${resueltos()} ` +
                'partidos resueltos.'
              : 'Aún no hay resultados. Todas las participaciones ' +
                'están pendientes.'
          }
        </p>

        <label class="campo busqueda">
          Buscar por alias o folio

          <input
            type="search"
            id="buscar"
            placeholder="Buscar participación"
          >
        </label>

        <div class="tabla">
          <table>
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Participante / folio</th>
                <th>Aciertos</th>

                ${partidos.map((partido, indice) => `
                  <th title="${esc(partido.join(' vs '))}">
                    P${indice + 1}
                  </th>
                `).join('')}

                <th>Detalle</th>
              </tr>

              <tr>
                <th colspan="3">Resultado publicado</th>

                ${estado.resultados.map(resultado => `
                  <th>${resultado || '—'}</th>
                `).join('')}

                <th></th>
              </tr>
            </thead>

            <tbody id="filas"></tbody>
          </table>
        </div>

        <p class="leyenda">
          <span class="punto bien"></span> Acierto
          <span class="punto mal"></span> Sin acierto
          <span class="punto pendiente"></span> Pendiente
        </p>

        <details>
          <summary>Consultar encuentros P1–P10</summary>

          <ol>
            ${partidos.map(partido => `
              <li>${partido[0]} vs ${partido[1]}</li>
            `).join('')}
          </ol>
        </details>
      </section>

      <section class="panel administrador">
        <div class="cabecera">
          <div>
            <p class="eyebrow">CONTROLES DE DEMOSTRACIÓN</p>
            <h2>Gestionar jornada</h2>
          </div>

          <button id="cambiar-fase">
            ${
              estado.cerrada
                ? 'Reabrir recepción'
                : 'Cerrar recepción'
            }
          </button>
        </div>

        <p>
          Estos controles están abiertos para probar el sistema.
          En una implementación real se asignan a usuarios autorizados.
        </p>

        <p class="nota">
          Primero cierra la recepción. No se puede reabrir mientras
          existan resultados publicados; debes quitarlos y guardar antes.
        </p>

        <form id="resultados">
          <div class="resultados">
            ${partidos.map((partido, indice) => `
              <label class="campo">
                <span>
                  P${indice + 1} ·
                  ${partido[0]} vs ${partido[1]}
                </span>

                <select
                  name="r${indice}"
                  ${!estado.cerrada ? 'disabled' : ''}
                >
                  <option value="">Pendiente</option>

                  ${opciones.map((opcion, posicion) => `
                    <option
                      value="${opcion}"
                      ${
                        estado.resultados[indice] === opcion
                          ? 'selected'
                          : ''
                      }
                    >
                      ${opcion} ·
                      ${['Local', 'Empate', 'Visitante'][posicion]}
                    </option>
                  `).join('')}
                </select>
              </label>
            `).join('')}
          </div>

          <button
            class="boton"
            ${!estado.cerrada ? 'disabled' : ''}
          >
            Guardar resultados
          </button>
        </form>
      </section>
    `;

    pintarFilas('');

    document.getElementById('buscar').oninput = evento => {
      pintarFilas(evento.target.value);
    };

    document.getElementById('cambiar-fase').onclick = () => {
      if (estado.cerrada && resueltos()) {
        avisar(
          'Quita todos los resultados publicados y guarda ' +
          'antes de reabrir.'
        );

        return;
      }

      const confirmado = confirm(
        estado.cerrada
          ? '¿Reabrir la recepción de participaciones?'
          : '¿Cerrar la recepción? Ya no se podrán ' +
            'registrar pronósticos.'
      );

      if (!confirmado) {
        return;
      }

      estado.cerrada = !estado.cerrada;

      guardar();
      render();
    };

    document.getElementById('resultados').onsubmit = evento => {
      evento.preventDefault();

      if (!estado.cerrada) {
        return;
      }

      const datos = new FormData(evento.target);

      estado.resultados = partidos.map((_, indice) => {
        const valor = datos.get(`r${indice}`);

        return opciones.includes(valor)
          ? valor
          : null;
      });

      guardar();
      resumen();
      tabla();

      avisar('Resultados guardados. Clasificación actualizada.');
    };

    document.getElementById('csv').onclick = exportar;
  }

  function pintarFilas(busqueda) {
    const lista = ordenados(estado);
    const consulta = busqueda.trim().toLocaleLowerCase('es');

    let anterior = -1;
    let posicion = 0;

    const filas = lista
      .map((boleto, indice) => {
        if (boleto.puntos !== anterior) {
          posicion = indice + 1;
        }

        anterior = boleto.puntos;

        return {
          ...boleto,
          posicion
        };
      })
      .filter(boleto =>
        `${boleto.alias} ${boleto.id}`
          .toLocaleLowerCase('es')
          .includes(consulta)
      );

    document.getElementById('filas').innerHTML =
      filas.length
        ? filas.map(boleto => `
          <tr>
            <td>
              ${resueltos() ? boleto.posicion : '—'}
            </td>

            <td class="participante">
              <strong>${esc(boleto.alias)}</strong>
              <small>${boleto.id}</small>
            </td>

            <td>
              <strong>
                ${boleto.puntos} / ${resueltos()}
              </strong>
            </td>

            ${boleto.pronosticos.map((pronostico, indice) => {
              const resultado = estado.resultados[indice];

              const clase = resultado === null
                ? 'pendiente'
                : resultado === pronostico
                  ? 'bien'
                  : 'mal';

              const descripcion = resultado === null
                ? 'Pendiente'
                : resultado === pronostico
                  ? 'Acierto'
                  : 'Sin acierto';

              return `
                <td>
                  <span
                    class="pronostico ${clase}"
                    title="${descripcion}"
                  >
                    ${pronostico}
                  </span>
                </td>
              `;
            }).join('')}

            <td>
              <button data-ticket="${boleto.id}">
                Ver
              </button>
            </td>
          </tr>
        `).join('')
        : `
          <tr>
            <td colspan="14">Sin coincidencias.</td>
          </tr>
        `;

    document.querySelectorAll('[data-ticket]')
      .forEach(elemento => {
        elemento.onclick = () => {
          const boleto = estado.boletos.find(
            registro => registro.id === elemento.dataset.ticket
          );

          mostrar(boleto);
        };
      });
  }

  function mostrar(boleto) {
    const lineas = partidos.map(
      (partido, indice) =>
        `${indice + 1}. ${partido.join(' vs ')}: ` +
        boleto.pronosticos[indice]
    );

    temporal = {
      id: boleto.id,
      texto: [
        'CANCHA · DEMO KING LAND',
        boleto.id,
        boleto.alias,
        fecha(boleto.fecha),
        '',
        ...lineas,
        '',
        'L: local · E: empate · V: visitante',
        'Comprobante de pronósticos ficticios. Sin valor monetario.'
      ].join('\n')
    };

    document.getElementById('ticket').innerHTML = `
      <p class="eyebrow">CANCHA · COMPROBANTE DEMO</p>

      <h2 id="titulo-ticket">${boleto.id}</h2>

      <p>
        <strong>${esc(boleto.alias)}</strong>
        <br>
        ${fecha(boleto.fecha)}
      </p>

      <ol class="lista-ticket">
        ${partidos.map((partido, indice) => `
          <li>
            <span>${partido.join(' vs ')}</span>
            <strong>${boleto.pronosticos[indice]}</strong>
          </li>
        `).join('')}
      </ol>

      <p class="nota">
        L: local · E: empate · V: visitante.
        <br>
        Pronósticos ficticios. Sin valor monetario.
      </p>
    `;

    document.getElementById('comprobante').showModal();
  }

  function descargar(texto, nombre, tipo) {
    const archivo = new Blob([texto], {
      type: tipo
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

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

      if (/^[\s]*[=+@-]/.test(texto)) {
        texto = "'" + texto;
      }

      return '"' + texto.replace(/"/g, '""') + '"';
    };

    const filas = [
      [
        'Folio',
        'Alias',
        'Fecha',
        'Aciertos',
        'Partidos resueltos',
        ...partidos.map(
          (partido, indice) =>
            `P${indice + 1} ${partido.join(' vs ')}`
        )
      ],

      ...ordenados(estado).map(boleto => [
        boleto.id,
        boleto.alias,
        fecha(boleto.fecha),
        boleto.puntos,
        resueltos(),
        ...boleto.pronosticos
      ]),

      [
        '',
        'Resultados publicados',
        '',
        '',
        '',
        ...estado.resultados.map(
          resultado => resultado || 'Pendiente'
        )
      ]
    ];

    const contenido = '\uFEFF' + filas.map(
      fila => fila.map(celda).join(',')
    ).join('\r\n');

    descargar(
      contenido,
      'quiniela-demo.csv',
      'text/csv;charset=utf-8'
    );
  }

  render();
})();