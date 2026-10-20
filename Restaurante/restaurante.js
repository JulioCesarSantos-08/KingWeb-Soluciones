(() => {
  'use strict';

  const CLAVE = 'kingland.restaurante.demo.v1';

  const menu = [
    {
      id: 'pastor',
      nombre: 'Taco al pastor',
      categoria: 'Tacos',
      precio: 2200,
      imagen: 'restaurante-pastor.png',
      descripcion: 'Ordena por pieza y asígnalo a cada comensal.'
    },
    {
      id: 'asada',
      nombre: 'Taco de asada',
      categoria: 'Tacos',
      precio: 2600,
      imagen: 'restaurante-asada.png',
      descripcion: 'Una opción clásica para acompañar la mesa.'
    },
    {
      id: 'quesadilla',
      nombre: 'Quesadilla',
      categoria: 'Especialidades',
      precio: 4500,
      imagen: 'restaurante-quesadilla.png',
      descripcion: 'Un antojo individual o para compartir.'
    },
    {
      id: 'nachos',
      nombre: 'Nachos de la casa',
      categoria: 'Especialidades',
      precio: 9500,
      imagen: 'restaurante-nachos.png',
      descripcion: 'Perfectos para probar los consumos compartidos.'
    },
    {
      id: 'agua',
      nombre: 'Agua fresca',
      categoria: 'Bebidas',
      precio: 3000,
      imagen: 'restaurante-agua.png',
      descripcion: 'Vaso individual de sabor de temporada.'
    },
    {
      id: 'limonada',
      nombre: 'Limonada',
      categoria: 'Bebidas',
      precio: 3800,
      imagen: 'restaurante-limonada.png',
      descripcion: 'Una bebida fresca para completar el pedido.'
    }
  ];

  const fases = ['Recibida', 'Preparando', 'Lista', 'Servida'];

  const $ = selector => document.querySelector(selector);

  const esc = valor => String(valor).replace(
    /[&<>"']/g,
    caracter => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[caracter]
  );

  const moneda = centavos =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(centavos / 100);

  const fecha = valor =>
    new Date(valor).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

  const dia = valor => {
    const fechaLocal = new Date(valor);

    return (
      `${fechaLocal.getFullYear()}-` +
      `${String(fechaLocal.getMonth() + 1).padStart(2, '0')}-` +
      String(fechaLocal.getDate()).padStart(2, '0')
    );
  };

  const totalLineas = lineas =>
    lineas.reduce(
      (total, linea) => total + linea.precio * linea.cantidad,
      0
    );

  const lineasPedido = pedido =>
    pedido.comandas.flatMap(comanda => comanda.lineas);

  const totalPedido = pedido =>
    totalLineas(lineasPedido(pedido));

  const listoCobrar = pedido =>
    pedido.estado === 'Abierto' &&
    pedido.comandas.length > 0 &&
    pedido.comandas.every(
      comanda => comanda.estado === 'Servida'
    );

  function reparto(pedido) {
    const lineas = lineasPedido(pedido);

    const compartido = totalLineas(
      lineas.filter(linea => linea.persona === 0)
    );

    const base = Math.floor(compartido / pedido.personas);
    const resto = compartido % pedido.personas;

    return Array.from(
      { length: pedido.personas },
      (_, indice) => ({
        persona: indice + 1,
        individual: totalLineas(
          lineas.filter(
            linea => linea.persona === indice + 1
          )
        ),
        compartido: base + (indice < resto ? 1 : 0)
      })
    ).map(persona => ({
      ...persona,
      total: persona.individual + persona.compartido
    }));
  }

  function centavos(valor) {
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(String(valor))) {
      throw Error(
        'Escribe un importe válido con máximo dos decimales.'
      );
    }

    return Math.round(Number(valor) * 100);
  }

  function cobrar(pedido, metodo, recibido) {
    if (!listoCobrar(pedido)) {
      throw Error('Primero sirve todas las comandas.');
    }

    if (!['Efectivo', 'Transferencia'].includes(metodo)) {
      throw Error('Selecciona un método válido.');
    }

    const total = totalPedido(pedido);

    const efectivo = metodo === 'Efectivo'
      ? centavos(recibido)
      : null;

    if (efectivo !== null && efectivo < total) {
      throw Error('El efectivo recibido no cubre la cuenta.');
    }

    pedido.pago = {
      metodo,
      recibido: efectivo,
      cambio: efectivo === null ? 0 : efectivo - total,
      fecha: Date.now()
    };

    pedido.estado = 'Pagado';
  }

  function avanzar(pedido, id) {
    if (pedido.estado !== 'Abierto') {
      throw Error('Esta cuenta ya está cerrada.');
    }

    const comanda = pedido.comandas.find(
      registro => registro.id === id
    );

    if (
      !comanda ||
      !fases.includes(comanda.estado) ||
      comanda.estado === 'Servida'
    ) {
      throw Error('No hay una etapa siguiente.');
    }

    comanda.estado = fases[
      fases.indexOf(comanda.estado) + 1
    ];
  }

  function linea(id, cantidad, persona) {
    const producto = menu.find(
      registro => registro.id === id
    );

    return {
      producto: id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
      persona
    };
  }

  function muestra() {
    const ahora = Date.now();

    return {
      pedidos: [
        {
          id: 'BR-0001',
          mesa: 2,
          personas: 2,
          fecha: ahora - 18 * 60000,
          estado: 'Abierto',
          pago: null,
          comandas: [
            {
              id: 'C1',
              fecha: ahora - 18 * 60000,
              estado: 'Recibida',
              nota: 'Comanda ficticia de ejemplo.',
              lineas: [
                linea('pastor', 3, 1),
                linea('asada', 2, 2),
                linea('agua', 2, 0)
              ]
            }
          ]
        },
        {
          id: 'BR-0002',
          mesa: 4,
          personas: 3,
          fecha: ahora - 35 * 60000,
          estado: 'Abierto',
          pago: null,
          comandas: [
            {
              id: 'C1',
              fecha: ahora - 35 * 60000,
              estado: 'Preparando',
              nota: '',
              lineas: [
                linea('nachos', 1, 0),
                linea('quesadilla', 2, 1),
                linea('limonada', 3, 0)
              ]
            }
          ]
        },
        {
          id: 'BR-0003',
          mesa: 6,
          personas: 2,
          fecha: ahora - 80 * 60000,
          estado: 'Pagado',
          pago: {
            metodo: 'Efectivo',
            recibido: 30000,
            cambio: 9200,
            fecha: ahora - 50 * 60000
          },
          comandas: [
            {
              id: 'C1',
              fecha: ahora - 80 * 60000,
              estado: 'Servida',
              nota: '',
              lineas: [
                linea('pastor', 4, 1),
                linea('asada', 2, 2),
                linea('limonada', 1, 0),
                linea('agua', 1, 2)
              ]
            }
          ]
        }
      ]
    };
  }

  function valido(datos) {
    if (
      !datos ||
      !Array.isArray(datos.pedidos) ||
      datos.pedidos.length > 100
    ) {
      return false;
    }

    const ids = new Set();
    const mesas = new Set();

    return datos.pedidos.every(pedido => {
      if (
        !pedido ||
        !/^BR-\d{4}$/.test(pedido.id) ||
        ids.has(pedido.id) ||
        !Number.isInteger(pedido.mesa) ||
        pedido.mesa < 1 ||
        pedido.mesa > 12 ||
        !Number.isInteger(pedido.personas) ||
        pedido.personas < 1 ||
        pedido.personas > 6 ||
        !Number.isFinite(pedido.fecha) ||
        !['Abierto', 'Pagado', 'Cancelado'].includes(pedido.estado) ||
        !Array.isArray(pedido.comandas) ||
        !pedido.comandas.length ||
        pedido.comandas.length > 20
      ) {
        return false;
      }

      ids.add(pedido.id);

      if (pedido.estado === 'Abierto') {
        if (mesas.has(pedido.mesa)) {
          return false;
        }

        mesas.add(pedido.mesa);
      }

      const idsComandas = new Set();

      const comandasValidas = pedido.comandas.every(comanda => {
        if (
          !comanda ||
          typeof comanda.id !== 'string' ||
          !/^C\d{1,2}$/.test(comanda.id) ||
          idsComandas.has(comanda.id) ||
          !fases.includes(comanda.estado) ||
          !Number.isFinite(comanda.fecha) ||
          typeof comanda.nota !== 'string' ||
          comanda.nota.length > 180 ||
          !Array.isArray(comanda.lineas) ||
          !comanda.lineas.length ||
          comanda.lineas.length > 40
        ) {
          return false;
        }

        idsComandas.add(comanda.id);

        return comanda.lineas.every(registro => {
          const producto = menu.find(
            elemento => elemento.id === registro.producto
          );

          return (
            producto &&
            registro.nombre === producto.nombre &&
            registro.precio === producto.precio &&
            Number.isInteger(registro.cantidad) &&
            registro.cantidad >= 1 &&
            registro.cantidad <= 20 &&
            Number.isInteger(registro.persona) &&
            registro.persona >= 0 &&
            registro.persona <= pedido.personas
          );
        });
      });

      if (!comandasValidas) {
        return false;
      }

      if (pedido.estado !== 'Pagado') {
        return (
          pedido.pago === null &&
          (
            pedido.estado !== 'Cancelado' ||
            (
              Number.isFinite(pedido.cierre) &&
              pedido.cierre >= pedido.fecha
            )
          )
        );
      }

      const pago = pedido.pago;

      return (
        pedido.comandas.every(
          comanda => comanda.estado === 'Servida'
        ) &&
        pago &&
        Number.isFinite(pago.fecha) &&
        pago.fecha >= pedido.fecha &&
        ['Efectivo', 'Transferencia'].includes(pago.metodo) &&
        (
          pago.metodo === 'Transferencia'
            ? pago.recibido === null && pago.cambio === 0
            : (
              Number.isSafeInteger(pago.recibido) &&
              pago.recibido >= totalPedido(pedido) &&
              pago.cambio === pago.recibido - totalPedido(pedido)
            )
        )
      );
    });
  }

  let estado;
  let avisoCarga = '';

  try {
    const guardado = localStorage.getItem(CLAVE);

    estado = guardado
      ? JSON.parse(guardado)
      : muestra();

    if (!valido(estado)) {
      throw Error();
    }
  } catch {
    estado = muestra();

    avisoCarga =
      'No fue posible recuperar los datos guardados. ' +
      'Se cargó una muestra ficticia.';
  }

  let borrador = [];
  let categoria = 'Todos';
  let pedidoModal = null;
  let ticketActual = '';

  function avisar(texto) {
    $('#aviso').textContent = texto;
  }

  function guardar(mensaje) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
      avisar(mensaje);
    } catch {
      avisar(
        mensaje +
        ' No se pudo guardar: el cambio durará solo esta sesión.'
      );
    }
  }

  function destino() {
    return estado.pedidos.find(
      pedido =>
        pedido.id === $('#destino').value &&
        pedido.estado === 'Abierto'
    );
  }

  function personasActuales() {
    return destino()?.personas ||
      Number($('#personas').value);
  }

  function actualizarDestino() {
    const anterior = $('#destino').value;

    $('#destino').innerHTML =
      '<option value="">Abrir cuenta nueva</option>' +
      estado.pedidos
        .filter(pedido => pedido.estado === 'Abierto')
        .map(pedido => `
          <option value="${pedido.id}">
            ${pedido.id} · Mesa ${pedido.mesa}
          </option>
        `).join('');

    if (
      [...$('#destino').options].some(
        opcion => opcion.value === anterior
      )
    ) {
      $('#destino').value = anterior;
    }

    const pedido = destino();

    $('#destino').dataset.previo = $('#destino').value;

    $('#mesa').disabled = Boolean(pedido);
    $('#personas').disabled = Boolean(pedido);

    if (pedido) {
      $('#mesa').value = pedido.mesa;
      $('#personas').value = pedido.personas;
    }

    $('#asignar').innerHTML =
      '<option value="0">Para compartir</option>' +
      Array.from(
        { length: personasActuales() },
        (_, indice) => `
          <option value="${indice + 1}">
            Persona ${indice + 1}
          </option>
        `
      ).join('');
  }

  function pintarMenu() {
    const consulta = $('#buscar-menu').value
      .trim()
      .toLocaleLowerCase('es');

    const lista = menu.filter(producto =>
      (
        categoria === 'Todos' ||
        producto.categoria === categoria
      ) &&
      producto.nombre
        .toLocaleLowerCase('es')
        .includes(consulta)
    );

    $('#menu').innerHTML = lista.length
      ? lista.map(producto => `
        <article class="producto">
          <div class="foto">
            <span>${esc(producto.nombre)}</span>

            <img
              src="../imagenes/${producto.imagen}"
              alt="Imagen ilustrativa de ${esc(producto.nombre)}"
              loading="lazy"
            >
          </div>

          <div class="producto-cuerpo">
            <small>${producto.categoria}</small>
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>

            <div class="producto-pie">
              <strong>${moneda(producto.precio)}</strong>

              <button
                type="button"
                data-agregar="${producto.id}"
                aria-label="Agregar ${producto.nombre}"
              >
                Agregar +
              </button>
            </div>
          </div>
        </article>
      `).join('')
      : '<p class="vacio">No encontramos productos con esa búsqueda.</p>';
  }

  function pintarBorrador() {
    $('#carrito').innerHTML = borrador.length
      ? borrador.map((registro, indice) => `
        <article class="linea-carrito">
          <div>
            <strong>${registro.nombre}</strong>

            <small>
              ${
                registro.persona
                  ? `Persona ${registro.persona}`
                  : 'Para compartir'
              }
              · ${moneda(registro.precio)} c/u
            </small>

            <div class="cantidad">
              <button
                type="button"
                data-cantidad="${indice}"
                data-delta="-1"
                aria-label="Restar ${registro.nombre}"
              >
                −
              </button>

              <span>${registro.cantidad}</span>

              <button
                type="button"
                data-cantidad="${indice}"
                data-delta="1"
                aria-label="Sumar ${registro.nombre}"
              >
                +
              </button>

              <button
                type="button"
                class="texto"
                data-quitar="${indice}"
              >
                Quitar
              </button>
            </div>
          </div>

          <strong>
            ${moneda(registro.precio * registro.cantidad)}
          </strong>
        </article>
      `).join('')
      : `
        <div class="carrito-vacio">
          <strong>La mesa está por comenzar.</strong>
          <p>
            Elige un comensal y agrega productos del menú.
          </p>
        </div>
      `;

    $('#total-borrador').textContent =
      moneda(totalLineas(borrador));

    $('#unidades').textContent = borrador.reduce(
      (total, registro) => total + registro.cantidad,
      0
    );
  }

  function agregar(id) {
    const persona = Number($('#asignar').value);

    const existente = borrador.find(
      registro =>
        registro.producto === id &&
        registro.persona === persona
    );

    if (existente && existente.cantidad >= 20) {
      avisar(
        'Máximo 20 unidades del mismo producto ' +
        'por persona y comanda.'
      );

      return;
    }

    if (existente) {
      existente.cantidad++;
    } else {
      if (borrador.length >= 40) {
        avisar('La comanda admite hasta 40 renglones.');
        return;
      }

      borrador.push(linea(id, 1, persona));
    }

    pintarBorrador();
  }

  function enviar(evento) {
    evento.preventDefault();

    $('#error-pedido').textContent = '';

    try {
      if (!borrador.length) {
        throw Error('Agrega al menos un producto.');
      }

      let pedido = destino();
      const nota = $('#nota').value.trim();

      if (pedido && pedido.comandas.length >= 20) {
        throw Error(
          'Esta cuenta alcanzó las 20 comandas de la demo.'
        );
      }

      if (!pedido) {
        if (estado.pedidos.length >= 100) {
          throw Error(
            'La demo admite hasta 100 cuentas. ' +
            'Restablece la muestra para empezar de nuevo.'
          );
        }

        const mesa = Number($('#mesa').value);
        const personas = Number($('#personas').value);

        if (estado.pedidos.some(
          registro =>
            registro.estado === 'Abierto' &&
            registro.mesa === mesa
        )) {
          throw Error(
            'Esa mesa ya tiene una cuenta abierta. ' +
            'Selecciónala en Destino.'
          );
        }

        if (
          !Number.isInteger(mesa) ||
          mesa < 1 ||
          mesa > 12 ||
          !Number.isInteger(personas) ||
          personas < 1 ||
          personas > 6
        ) {
          throw Error('Revisa la mesa y los comensales.');
        }

        const siguiente = Math.max(
          0,
          ...estado.pedidos.map(
            registro => Number(registro.id.slice(3))
          )
        ) + 1;

        pedido = {
          id: `BR-${String(siguiente).padStart(4, '0')}`,
          mesa,
          personas,
          fecha: Date.now(),
          estado: 'Abierto',
          pago: null,
          comandas: []
        };

        estado.pedidos.push(pedido);
      }

      pedido.comandas.push({
        id: `C${pedido.comandas.length + 1}`,
        fecha: Date.now(),
        estado: 'Recibida',
        nota,
        lineas: borrador.map(
          registro => ({ ...registro })
        )
      });

      borrador = [];
      $('#nota').value = '';

      actualizarDestino();

      $('#destino').value = pedido.id;

      actualizarDestino();

      guardar(
        `Comanda enviada a cocina: ${pedido.id}, ` +
        `mesa ${pedido.mesa}.`
      );

      refrescar();
    } catch (error) {
      $('#error-pedido').textContent = error.message;
    }
  }

  function grupoHTML(comanda) {
    return `
      <ul class="lista-productos">
        ${comanda.lineas.map(registro => `
          <li>
            <span>
              ${registro.cantidad} × ${registro.nombre}

              <small>
                ${
                  registro.persona
                    ? `Persona ${registro.persona}`
                    : 'Compartido'
                }
              </small>
            </span>

            <strong>
              ${moneda(registro.precio * registro.cantidad)}
            </strong>
          </li>
        `).join('')}
      </ul>

      ${
        comanda.nota
          ? `<p class="nota-cocina">Nota: ${esc(comanda.nota)}</p>`
          : ''
      }
    `;
  }

  function pintarCocina() {
    const filtro = $('#filtro-cocina').value;

    const cuentas = estado.pedidos.filter(
      pedido => pedido.estado === 'Abierto'
    );

    const lista = cuentas
      .flatMap(pedido =>
        pedido.comandas.map(comanda => ({
          pedido,
          comanda
        }))
      )
      .filter(({ comanda }) =>
        filtro
          ? comanda.estado === filtro
          : comanda.estado !== 'Servida'
      );

    const siguienteAccion = {
      Recibida: 'Comenzar preparación',
      Preparando: 'Marcar lista',
      Lista: 'Marcar servida'
    };

    $('#cocina').innerHTML = lista.length
      ? lista.map(({ pedido, comanda }) => `
        <article class="panel comanda">
          <div class="entre">
            <span class="etiqueta">${comanda.estado}</span>

            <span class="muted">
              ${pedido.id} · ${comanda.id}
            </span>
          </div>

          <h3>Mesa ${pedido.mesa}</h3>

          <p class="muted">
            ${fecha(comanda.fecha)} ·
            ${pedido.personas} comensales
          </p>

          ${grupoHTML(comanda)}

          ${
            comanda.estado !== 'Servida'
              ? `
                <button
                  type="button"
                  class="boton ancho"
                  data-avanzar="${pedido.id}"
                  data-comanda="${comanda.id}"
                >
                  ${siguienteAccion[comanda.estado]}
                </button>
              `
              : '<p class="muted">Comanda entregada en mesa.</p>'
          }
        </article>
      `).join('')
      : '<div class="vacio">No hay comandas en esta etapa.</div>';

    $('#cuentas').innerHTML = cuentas.length
      ? cuentas.map(pedido => `
        <article class="cuenta">
          <div>
            <h3>
              Mesa ${pedido.mesa}
              <small>${pedido.id}</small>
            </h3>

            <p>
              ${pedido.personas} comensales ·
              ${pedido.comandas.length} comandas ·
              ${
                listoCobrar(pedido)
                  ? 'Lista para cobrar'
                  : 'Servicio en curso'
              }
            </p>
          </div>

          <strong>${moneda(totalPedido(pedido))}</strong>

          <div class="acciones">
            <button type="button" data-ver="${pedido.id}">
              ${listoCobrar(pedido) ? 'Ver y cobrar' : 'Ver cuenta'}
            </button>

            <button type="button" data-ampliar="${pedido.id}">
              Agregar consumo
            </button>

            <button
              type="button"
              class="texto peligro"
              data-cancelar="${pedido.id}"
            >
              Cancelar cuenta
            </button>
          </div>
        </article>
      `).join('')
      : '<p class="vacio">Todas las mesas están libres.</p>';
  }

  function historialFiltrado() {
    const consulta = $('#buscar-historial').value
      .trim()
      .toLowerCase();

    const periodo = $('#periodo').value;
    const inicio = new Date();

    inicio.setHours(0, 0, 0, 0);

    if (periodo === '7') {
      inicio.setDate(inicio.getDate() - 6);
    }

    if (periodo === '30') {
      inicio.setDate(inicio.getDate() - 29);
    }

    return estado.pedidos
      .filter(pedido =>
        pedido.estado !== 'Abierto' &&
        (
          !periodo ||
          (pedido.pago?.fecha || pedido.cierre) >= inicio.getTime()
        ) &&
        `${pedido.id} mesa ${pedido.mesa} ${pedido.estado}`
          .toLowerCase()
          .includes(consulta)
      )
      .sort((a, b) =>
        (b.pago?.fecha || b.cierre || b.fecha) -
        (a.pago?.fecha || a.cierre || a.fecha)
      );
  }

  function pintarHistorial() {
    const lista = historialFiltrado();

    $('#filas-historial').innerHTML = lista.length
      ? lista.map(pedido => `
        <tr>
          <td>${pedido.id}</td>
          <td>Mesa ${pedido.mesa}</td>
          <td>
            ${fecha(
              pedido.pago?.fecha ||
              pedido.cierre ||
              pedido.fecha
            )}
          </td>
          <td>${pedido.estado}</td>
          <td>${pedido.pago?.metodo || '—'}</td>
          <td>${moneda(totalPedido(pedido))}</td>
          <td>
            <button type="button" data-ver="${pedido.id}">
              Ver detalle
            </button>
          </td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="7">
            Sin registros para estos filtros.
          </td>
        </tr>
      `;

    const cobrado = lista
      .filter(pedido => pedido.estado === 'Pagado')
      .reduce(
        (total, pedido) => total + totalPedido(pedido),
        0
      );

    $('#total-historial').textContent =
      `${lista.length} cuentas · ` +
      `Cobrado en esta selección: ${moneda(cobrado)}`;
  }

  function refrescar() {
    const pagados = estado.pedidos.filter(
      pedido =>
        pedido.estado === 'Pagado' &&
        dia(pedido.pago.fecha) === dia(Date.now())
    );

    const abiertos = estado.pedidos.filter(
      pedido => pedido.estado === 'Abierto'
    );

    const datos = [
      [
        'Cobrado hoy · demo',
        moneda(pagados.reduce(
          (total, pedido) => total + totalPedido(pedido),
          0
        ))
      ],
      ['Mesas abiertas', abiertos.length],
      [
        'Comandas sin servir',
        abiertos.reduce(
          (total, pedido) =>
            total + pedido.comandas.filter(
              comanda => comanda.estado !== 'Servida'
            ).length,
          0
        )
      ],
      [
        'Consumo pendiente de cobro',
        moneda(abiertos.reduce(
          (total, pedido) => total + totalPedido(pedido),
          0
        ))
      ]
    ];

    $('#metricas').innerHTML = datos.map(([titulo, valor]) => `
      <article>
        <span>${titulo}</span>
        <strong>${valor}</strong>
      </article>
    `).join('');

    pintarBorrador();
    pintarCocina();
    pintarHistorial();
  }

  function vista(nombre) {
    document.querySelectorAll('[data-panel]').forEach(elemento => {
      elemento.hidden = elemento.dataset.panel !== nombre;
    });

    document.querySelectorAll('[data-vista]').forEach(elemento => {
      if (elemento.dataset.vista === nombre) {
        elemento.setAttribute('aria-current', 'page');
      } else {
        elemento.removeAttribute('aria-current');
      }
    });
  }

  function ticketLineas(pedido) {
    const resultado = [
      'BRASA · RESTAURANTE DEMO',
      `${pedido.id} · Mesa ${pedido.mesa}`,
      `Estado: ${pedido.estado}`,
      `Apertura: ${fecha(pedido.fecha)}`,
      ''
    ];

    pedido.comandas.forEach(comanda => {
      resultado.push(`${comanda.id} · ${comanda.estado}`);

      comanda.lineas.forEach(registro => {
        resultado.push(
          `${registro.cantidad} x ${registro.nombre} · ` +
          (
            registro.persona
              ? `Persona ${registro.persona}`
              : 'Compartido'
          ) +
          ` · ${moneda(registro.precio * registro.cantidad)}`
        );
      });

      if (comanda.nota) {
        resultado.push('Nota: ' + comanda.nota);
      }

      resultado.push('');
    });

    resultado.push(
      'TOTAL CONSUMO: ' + moneda(totalPedido(pedido)),
      '',
      'DESGLOSE ORIENTATIVO POR PERSONA'
    );

    reparto(pedido).forEach(persona => {
      resultado.push(
        `Persona ${persona.persona}: ` +
        `individual ${moneda(persona.individual)} + ` +
        `compartido ${moneda(persona.compartido)} = ` +
        moneda(persona.total)
      );
    });

    if (pedido.pago) {
      resultado.push(
        '',
        'Pago simulado: ' + pedido.pago.metodo,
        'Fecha de cobro: ' + fecha(pedido.pago.fecha)
      );

      if (pedido.pago.recibido !== null) {
        resultado.push(
          'Recibido: ' + moneda(pedido.pago.recibido),
          'Cambio: ' + moneda(pedido.pago.cambio)
        );
      }
    }

    resultado.push(
      '',
      'Propina no incluida. No es comprobante fiscal.',
      'Simulación sin pagos reales. King Land.'
    );

    return resultado;
  }

  function mostrarPedido(id, abrir = true) {
    const pedido = estado.pedidos.find(
      registro => registro.id === id
    );

    if (!pedido) {
      return;
    }

    pedidoModal = id;
    ticketActual = ticketLineas(pedido).join('\n');

    let seccionCobro = '';

    if (pedido.pago) {
      seccionCobro = `
        <p class="pago-confirmado">
          Pago simulado registrado: ${pedido.pago.metodo} ·
          ${fecha(pedido.pago.fecha)}

          ${
            pedido.pago.recibido !== null
              ? `
                <br>
                Recibido: ${moneda(pedido.pago.recibido)} ·
                Cambio: ${moneda(pedido.pago.cambio)}
              `
              : ''
          }
        </p>
      `;
    } else if (pedido.estado === 'Cancelado') {
      seccionCobro = `
        <p class="pago-confirmado">
          Cuenta cancelada. No suma a lo cobrado.
        </p>
      `;
    } else if (listoCobrar(pedido)) {
      seccionCobro = `
        <form id="form-cobro" class="form-cobro">
          <h3>Cerrar cuenta · Simulación</h3>

          <label class="campo">
            Método
            <select id="metodo">
              <option>Efectivo</option>
              <option>Transferencia</option>
            </select>
          </label>

          <label class="campo" id="campo-efectivo">
            Efectivo recibido

            <input
              id="recibido"
              type="number"
              step="0.01"
              min="0"
              max="9999999.99"
              placeholder="${(totalPedido(pedido) / 100).toFixed(2)}"
            >
          </label>

          <p id="error-cobro" class="error" role="alert"></p>

          <button class="boton ancho">
            Confirmar cobro simulado
          </button>
        </form>
      `;
    } else {
      seccionCobro = `
        <p class="pago-confirmado">
          Sirve todas las comandas desde Cocina antes de cobrar.
        </p>
      `;
    }

    $('#detalle').innerHTML = `
      <p class="eyebrow">BRASA · CUENTA DE DEMOSTRACIÓN</p>

      <h2 id="titulo-detalle">
        ${pedido.id} · Mesa ${pedido.mesa}
      </h2>

      <p class="muted">
        ${fecha(pedido.fecha)} ·
        ${pedido.personas} comensales ·
        ${pedido.estado}
      </p>

      ${pedido.comandas.map(comanda => `
        <section class="bloque-ticket">
          <h3>${comanda.id} · ${comanda.estado}</h3>
          ${grupoHTML(comanda)}
        </section>
      `).join('')}

      <div class="total-ticket">
        <span>Total del consumo</span>
        <strong>${moneda(totalPedido(pedido))}</strong>
      </div>

      <h3>Desglose por comensal</h3>

      <p class="muted">
        Los compartidos se reparten por igual.
        Los centavos sobrantes se asignan desde la persona 1.
        El cobro se realiza por la cuenta completa.
      </p>

      <div class="tabla">
        <table>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Individual</th>
              <th>Compartido</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${reparto(pedido).map(persona => `
              <tr>
                <td>${persona.persona}</td>
                <td>${moneda(persona.individual)}</td>
                <td>${moneda(persona.compartido)}</td>
                <td>${moneda(persona.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${seccionCobro}

      <p class="muted">
        Propina no incluida. Sin pagos reales.
        No es comprobante fiscal.
      </p>
    `;

    if ($('#metodo')) {
      $('#metodo').onchange = () => {
        $('#campo-efectivo').hidden =
          $('#metodo').value !== 'Efectivo';
      };
    }

    if ($('#form-cobro')) {
      $('#form-cobro').onsubmit = evento => {
        evento.preventDefault();

        try {
          cobrar(
            pedido,
            $('#metodo').value,
            $('#recibido').value
          );

          guardar(
            `Cuenta ${pedido.id} cerrada con pago simulado.`
          );

          actualizarDestino();
          refrescar();
          mostrarPedido(pedido.id, false);
        } catch (error) {
          $('#error-cobro').textContent = error.message;
        }
      };
    }

    if (abrir) {
      $('#modal').showModal();
    }
  }

  function descargar(texto, nombre, tipo) {
    const archivo = new Blob([texto], { type: tipo });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = nombre;

    document.body.append(enlace);

    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportar() {
    const celda = valor => {
      let texto = String(valor);

      if (/^\s*[=+@-]/.test(texto)) {
        texto = "'" + texto;
      }

      return '"' + texto.replace(/"/g, '""') + '"';
    };

    const filas = [
      [
        'Folio',
        'Mesa',
        'Estado',
        'Fecha cierre',
        'Consumo MXN',
        'Cobrado MXN',
        'Método'
      ],
      ...historialFiltrado().map(pedido => [
        pedido.id,
        pedido.mesa,
        pedido.estado,
        fecha(
          pedido.pago?.fecha ||
          pedido.cierre ||
          pedido.fecha
        ),
        (totalPedido(pedido) / 100).toFixed(2),
        pedido.estado === 'Pagado'
          ? (totalPedido(pedido) / 100).toFixed(2)
          : '0.00',
        pedido.pago?.metodo || ''
      ])
    ];

    descargar(
      '\uFEFF' + filas.map(
        fila => fila.map(celda).join(',')
      ).join('\r\n'),
      'restaurante-demo.csv',
      'text/csv;charset=utf-8'
    );
  }

  $('#mesa').innerHTML = Array.from(
    { length: 12 },
    (_, indice) => `
      <option value="${indice + 1}">
        Mesa ${indice + 1}
      </option>
    `
  ).join('');

  $('#personas').innerHTML = Array.from(
    { length: 6 },
    (_, indice) => `
      <option value="${indice + 1}">
        ${indice + 1} ${indice ? 'personas' : 'persona'}
      </option>
    `
  ).join('');

  $('#personas').value = '2';

  $('#destino').onchange = () => {
    if (
      borrador.length &&
      !confirm(
        '¿Cambiar de cuenta? Se vaciará la comanda ' +
        'que todavía no envías.'
      )
    ) {
      $('#destino').value =
        $('#destino').dataset.previo || '';

      return;
    }

    borrador = [];

    $('#destino').dataset.previo = $('#destino').value;

    actualizarDestino();
    pintarBorrador();
  };

  $('#personas').onchange = () => {
    const cantidad = Number($('#personas').value);

    if (borrador.some(
      registro => registro.persona > cantidad
    )) {
      $('#personas').value = String(
        Math.max(...borrador.map(
          registro => registro.persona
        ))
      );

      avisar(
        'Quita primero los productos asignados a las ' +
        'personas que deseas retirar.'
      );
    }

    actualizarDestino();
  };

  $('#buscar-menu').oninput = pintarMenu;
  $('#form-pedido').onsubmit = enviar;

  $('#vaciar').onclick = () => {
    if (
      borrador.length &&
      confirm('¿Vaciar esta comanda sin enviar?')
    ) {
      borrador = [];
      pintarBorrador();
    }
  };

  $('#filtro-cocina').onchange = pintarCocina;
  $('#buscar-historial').oninput = pintarHistorial;
  $('#periodo').onchange = pintarHistorial;
  $('#exportar').onclick = exportar;

  $('#cerrar-modal').onclick = () => {
    $('#modal').close();
  };

  $('#txt').onclick = () => {
    descargar(
      ticketActual,
      `${pedidoModal}.txt`,
      'text/plain;charset=utf-8'
    );
  };

  $('#imprimir').onclick = () => {
    window.print();
  };

  $('#restablecer').onclick = () => {
    if (!confirm(
      '¿Restablecer la demo? Se eliminarán las cuentas ' +
      'guardadas y la comanda sin enviar.'
    )) {
      return;
    }

    estado = muestra();
    borrador = [];

    $('#destino').value = '';
    $('#destino').dataset.previo = '';

    $('#form-pedido').reset();
    $('#personas').value = '2';

    actualizarDestino();
    guardar('Muestra restablecida.');
    refrescar();
  };

  document.addEventListener('click', evento => {
    const boton = evento.target.closest('button');

    if (!boton) {
      return;
    }

    try {
      if (boton.dataset.vista) {
        vista(boton.dataset.vista);
      }

      if (boton.dataset.categoria) {
        categoria = boton.dataset.categoria;

        document.querySelectorAll('[data-categoria]')
          .forEach(elemento => {
            elemento.setAttribute(
              'aria-pressed',
              String(elemento === boton)
            );
          });

        pintarMenu();
      }

      if (boton.dataset.agregar) {
        agregar(boton.dataset.agregar);
      }

      if (boton.dataset.cantidad !== undefined) {
        const registro = borrador[
          Number(boton.dataset.cantidad)
        ];

        if (!registro) {
          return;
        }

        registro.cantidad = Math.min(
          20,
          registro.cantidad + Number(boton.dataset.delta)
        );

        borrador = borrador.filter(
          elemento => elemento.cantidad > 0
        );

        pintarBorrador();
      }

      if (boton.dataset.quitar !== undefined) {
        borrador.splice(Number(boton.dataset.quitar), 1);
        pintarBorrador();
      }

      if (boton.dataset.ver) {
        mostrarPedido(boton.dataset.ver);
      }

      if (boton.dataset.avanzar) {
        const pedido = estado.pedidos.find(
          registro => registro.id === boton.dataset.avanzar
        );

        avanzar(pedido, boton.dataset.comanda);

        guardar(
          `Etapa actualizada: ${pedido.id} · ` +
          boton.dataset.comanda + '.'
        );

        refrescar();
      }

      if (boton.dataset.ampliar) {
        if (
          borrador.length &&
          !confirm(
            '¿Descartar la comanda sin enviar y ' +
            'agregar consumo a esta cuenta?'
          )
        ) {
          return;
        }

        borrador = [];

        $('#destino').value = boton.dataset.ampliar;
        $('#destino').dataset.previo = boton.dataset.ampliar;

        actualizarDestino();
        pintarBorrador();
        vista('menu');

        $('#destino').focus();
      }

      if (boton.dataset.cancelar) {
        const pedido = estado.pedidos.find(
          registro => registro.id === boton.dataset.cancelar
        );

        if (!pedido || pedido.estado !== 'Abierto') {
          return;
        }

        if (!confirm(
          `¿Cancelar ${pedido.id}? Se conservará ` +
          'en el historial y no sumará ventas.'
        )) {
          return;
        }

        pedido.estado = 'Cancelado';
        pedido.cierre = Date.now();

        guardar('Cuenta cancelada.');

        actualizarDestino();
        refrescar();
      }
    } catch (error) {
      avisar(error.message);
    }
  });

  document.addEventListener('error', evento => {
    if (evento.target instanceof HTMLImageElement) {
      evento.target.hidden = true;
    }
  }, true);

  document.querySelectorAll('img').forEach(imagen => {
    if (imagen.complete && !imagen.naturalWidth) {
      imagen.hidden = true;
    }
  });

  $('#cotizar').href =
    'https://wa.me/522225354183?text=' +
    encodeURIComponent(
      'Hola, probé la demo Brasa de King Land. ' +
      'Me interesa cotizar un sistema para restaurante ' +
      'con pedidos por mesa, comandas de cocina y cierre de cuentas.'
    );

  actualizarDestino();
  pintarMenu();
  refrescar();

  if (avisoCarga) {
    avisar(avisoCarga);
  }
})();