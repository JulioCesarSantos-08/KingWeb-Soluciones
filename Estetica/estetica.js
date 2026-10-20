(() => {
  'use strict';

  const CLAVE = 'kingland.estetica.demo.v1';

  const servicios = [
    {
      id: 'lavado',
      nombre: 'Lavado de mantenimiento',
      categoria: 'Cuidado exterior',
      minutos: 60,
      precio: 28000,
      imagen: 'estetica-lavado.png',
      texto: 'Lavado exterior, rines, cristales y aspirado ligero.',
      incluye: [
        'Lavado de carrocería',
        'Limpieza de rines y cristales',
        'Aspirado ligero'
      ]
    },
    {
      id: 'interior',
      nombre: 'Limpieza de interiores',
      categoria: 'Cabina',
      minutos: 120,
      precio: 95000,
      imagen: 'estetica-interior.png',
      texto:
        'Un proceso de muestra para recuperar la presentación de la cabina.',
      incluye: [
        'Aspirado detallado',
        'Limpieza de tapicería de muestra',
        'Limpieza de plásticos interiores'
      ]
    },
    {
      id: 'pulido',
      nombre: 'Pulido y brillo',
      categoria: 'Pintura',
      minutos: 180,
      precio: 240000,
      imagen: 'estetica-pulido.png',
      texto:
        'Preparación y abrillantado para demostrar un servicio de pintura.',
      incluye: [
        'Lavado previo',
        'Descontaminación superficial',
        'Pulido de demostración'
      ]
    },
    {
      id: 'proteccion',
      nombre: 'Protección de pintura',
      categoria: 'Protección',
      minutos: 180,
      precio: 390000,
      imagen: 'estetica-proteccion.png',
      texto:
        'Una ficha de ejemplo para presentar servicios de protección exterior.',
      incluye: [
        'Preparación exterior',
        'Aplicación protectora de muestra',
        'Recomendaciones de cuidado'
      ]
    }
  ];

  const tipos = ['Sedán', 'SUV', 'Pick-up'];

  const clientes = [
    'Visitante Aurora',
    'Visitante Norte',
    'Visitante Sur'
  ];

  const encargados = [
    'Sin asignar',
    'Técnico A',
    'Técnico B'
  ];

  const etapas = [
    'Agendada',
    'Recibido',
    'En proceso',
    'Listo',
    'Entregado'
  ];

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

  const dinero = centavos =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(centavos / 100);

  const fechaLocal = fecha =>
    `${fecha.getFullYear()}-` +
    `${String(fecha.getMonth() + 1).padStart(2, '0')}-` +
    String(fecha.getDate()).padStart(2, '0');

  const diaMas = cantidad => {
    const fecha = new Date();

    fecha.setDate(fecha.getDate() + cantidad);

    return fechaLocal(fecha);
  };

  const hora = minutos =>
    `${String(Math.floor(minutos / 60)).padStart(2, '0')}:` +
    String(minutos % 60).padStart(2, '0');

  const fechaHora = valor =>
    new Date(valor).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

  const precio = (servicio, tipo) =>
    Math.round(
      servicio.precio *
      [100, 125, 150][tipos.indexOf(tipo)] /
      100
    );

  const pagado = cita =>
    cita.pagos.reduce(
      (total, pago) => total + pago.importe,
      0
    );

  const saldo = cita => cita.total - pagado(cita);

  function centavos(valor) {
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(String(valor))) {
      throw Error(
        'Escribe un importe con máximo dos decimales.'
      );
    }

    const cantidad = Math.round(Number(valor) * 100);

    if (cantidad <= 0) {
      throw Error('El importe debe ser mayor que cero.');
    }

    return cantidad;
  }

  function fechaValida(valor) {
    if (
      typeof valor !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
      return false;
    }

    const fecha = new Date(valor + 'T12:00:00');

    return (
      Number.isFinite(fecha.getTime()) &&
      fechaLocal(fecha) === valor
    );
  }

  function disponibles(lista, fecha, minutos) {
    const ocupadas = lista.filter(
      cita =>
        cita.fecha === fecha &&
        cita.etapa !== 'Cancelada'
    );

    return Array.from(
      { length: 9 },
      (_, indice) => 540 + indice * 60
    ).filter(inicio =>
      inicio + minutos <= 1080 &&
      !ocupadas.some(cita =>
        inicio < cita.inicio + cita.minutos &&
        inicio + minutos > cita.inicio
      )
    );
  }

  function reservar(lista, datos) {
    const servicio = servicios.find(
      registro => registro.id === datos.servicio
    );

    if (
      !servicio ||
      !tipos.includes(datos.tipo) ||
      !clientes.includes(datos.cliente)
    ) {
      throw Error(
        'Revisa el servicio, vehículo y visitante.'
      );
    }

    if (
      !fechaValida(datos.fecha) ||
      datos.fecha < diaMas(1) ||
      datos.fecha > diaMas(30)
    ) {
      throw Error(
        'Elige una fecha entre mañana y los próximos 30 días.'
      );
    }

    if (
      !Number.isInteger(datos.inicio) ||
      !disponibles(
        lista,
        datos.fecha,
        servicio.minutos
      ).includes(datos.inicio)
    ) {
      throw Error(
        'Ese horario ya no está disponible. Elige otro.'
      );
    }

    const vehiculo = String(datos.vehiculo).trim();

    if (vehiculo.length < 2 || vehiculo.length > 40) {
      throw Error(
        'Escribe un modelo ficticio de 2 a 40 caracteres.'
      );
    }

    if (lista.length >= 100) {
      throw Error(
        'La demo admite hasta 100 citas. ' +
        'Restablece la muestra para comenzar de nuevo.'
      );
    }

    const siguiente = Math.max(
      0,
      ...lista.map(cita => Number(cita.id.slice(3)))
    ) + 1;

    const cita = {
      id: `LU-${String(siguiente).padStart(4, '0')}`,
      cliente: datos.cliente,
      vehiculo,
      tipo: datos.tipo,
      servicio: servicio.id,
      fecha: datos.fecha,
      inicio: datos.inicio,
      minutos: servicio.minutos,
      total: precio(servicio, datos.tipo),
      etapa: 'Agendada',
      encargado: 'Sin asignar',
      notas: '',
      pagos: []
    };

    lista.push(cita);

    return cita;
  }

  function avanzar(cita) {
    const indice = etapas.indexOf(cita.etapa);

    if (indice < 0 || indice >= etapas.length - 1) {
      throw Error('Esta orden no puede avanzar.');
    }

    if (cita.etapa === 'Listo' && saldo(cita) > 0) {
      throw Error(
        'Liquida el saldo antes de entregar el vehículo.'
      );
    }

    cita.etapa = etapas[indice + 1];
  }

  function abonar(cita, importe, metodo) {
    if (cita.etapa === 'Cancelada') {
      throw Error('La cita está cancelada.');
    }

    if (
      !['Efectivo', 'Transferencia', 'Tarjeta'].includes(metodo)
    ) {
      throw Error('Método no válido.');
    }

    const cantidad = centavos(importe);

    if (cantidad > saldo(cita)) {
      throw Error('El abono supera el saldo pendiente.');
    }

    cita.pagos.push({
      importe: cantidad,
      metodo,
      fecha: Date.now()
    });
  }

  function cancelar(cita) {
    if (
      cita.etapa !== 'Agendada' ||
      pagado(cita) !== 0
    ) {
      throw Error(
        'Solo puedes cancelar citas agendadas que no tengan pagos.'
      );
    }

    cita.etapa = 'Cancelada';
  }

  function muestra() {
    const crear = (
      numero,
      cliente,
      servicioId,
      tipo,
      fecha,
      inicio,
      etapa,
      pagos = []
    ) => {
      const servicio = servicios.find(
        registro => registro.id === servicioId
      );

      return {
        id: `LU-000${numero}`,
        cliente,
        vehiculo: [
          'Sedán de muestra',
          'Camioneta demo',
          'Auto azul',
          'Vehículo de exhibición'
        ][numero - 1],
        tipo,
        servicio: servicioId,
        fecha,
        inicio,
        minutos: servicio.minutos,
        total: precio(servicio, tipo),
        etapa,
        encargado:
          numero === 1 ? 'Sin asignar' : 'Técnico A',
        notas: 'Registro ficticio para explorar el sistema.',
        pagos
      };
    };

    return {
      citas: [
        crear(
          1,
          clientes[0],
          'lavado',
          'Sedán',
          diaMas(1),
          540,
          'Agendada'
        ),
        crear(
          2,
          clientes[1],
          'interior',
          'SUV',
          diaMas(0),
          540,
          'En proceso',
          [
            {
              importe: 50000,
              metodo: 'Efectivo',
              fecha: Date.now()
            }
          ]
        ),
        crear(
          3,
          clientes[2],
          'pulido',
          'Sedán',
          diaMas(0),
          660,
          'Listo'
        ),
        crear(
          4,
          clientes[0],
          'lavado',
          'Sedán',
          diaMas(-1),
          540,
          'Entregado',
          [
            {
              importe: 28000,
              metodo: 'Tarjeta',
              fecha: Date.now() - 86400000
            }
          ]
        )
      ]
    };
  }

  function validar(datos) {
    if (
      !datos ||
      !Array.isArray(datos.citas) ||
      datos.citas.length > 100
    ) {
      return false;
    }

    const ids = new Set();

    const registrosValidos = datos.citas.every(cita => {
      if (!cita) {
        return false;
      }

      const servicio = servicios.find(
        registro => registro.id === cita.servicio
      );

      if (
        !servicio ||
        !/^LU-\d{4}$/.test(cita.id) ||
        ids.has(cita.id) ||
        !clientes.includes(cita.cliente) ||
        !tipos.includes(cita.tipo) ||
        typeof cita.vehiculo !== 'string' ||
        cita.vehiculo.length < 2 ||
        cita.vehiculo.length > 40 ||
        !fechaValida(cita.fecha) ||
        !Number.isInteger(cita.inicio) ||
        cita.inicio < 540 ||
        cita.inicio % 60 !== 0 ||
        cita.inicio + cita.minutos > 1080 ||
        cita.minutos !== servicio.minutos ||
        cita.total !== precio(servicio, cita.tipo) ||
        ![...etapas, 'Cancelada'].includes(cita.etapa) ||
        !encargados.includes(cita.encargado) ||
        typeof cita.notas !== 'string' ||
        cita.notas.length > 240 ||
        !Array.isArray(cita.pagos) ||
        cita.pagos.length > 200
      ) {
        return false;
      }

      ids.add(cita.id);

      if (!cita.pagos.every(pago =>
        Number.isSafeInteger(pago.importe) &&
        pago.importe > 0 &&
        ['Efectivo', 'Transferencia', 'Tarjeta'].includes(pago.metodo) &&
        Number.isFinite(pago.fecha)
      )) {
        return false;
      }

      return (
        saldo(cita) >= 0 &&
        (
          cita.etapa !== 'Entregado' ||
          saldo(cita) === 0
        ) &&
        (
          cita.etapa !== 'Cancelada' ||
          pagado(cita) === 0
        )
      );
    });

    if (!registrosValidos) {
      return false;
    }

    return datos.citas.every((cita, indice) =>
      cita.etapa === 'Cancelada' ||
      !datos.citas.slice(indice + 1).some(otra =>
        otra.etapa !== 'Cancelada' &&
        otra.fecha === cita.fecha &&
        cita.inicio < otra.inicio + otra.minutos &&
        cita.inicio + cita.minutos > otra.inicio
      )
    );
  }

  let estado;
  let avisoCarga = '';

  try {
    const guardado = localStorage.getItem(CLAVE);

    estado = guardado
      ? JSON.parse(guardado)
      : muestra();

    if (!validar(estado)) {
      throw Error();
    }
  } catch {
    estado = muestra();

    avisoCarga =
      'No se recuperaron los datos guardados. ' +
      'Se cargó una muestra ficticia.';
  }

  let vistaActual = 'servicios';
  let citaActual = null;

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
        ' No se pudo guardar: este cambio durará solo esta sesión.'
      );
    }
  }

  function servicioDe(cita) {
    return servicios.find(
      servicio => servicio.id === cita.servicio
    );
  }

  function mostrarVista(nombre) {
    vistaActual = nombre;

    document.querySelectorAll('[data-panel]')
      .forEach(elemento => {
        elemento.hidden =
          elemento.dataset.panel !== nombre;
      });

    document.querySelectorAll('[data-vista]')
      .forEach(elemento => {
        if (elemento.dataset.vista === nombre) {
          elemento.setAttribute('aria-current', 'page');
        } else {
          elemento.removeAttribute('aria-current');
        }
      });

    pintarListas();
  }

  function pintarCatalogo() {
    const tipo = $('#tipo-catalogo').value;

    $('#catalogo').innerHTML = servicios.map(servicio => `
      <article class="servicio">
        <div class="foto">
          <span>${servicio.categoria}</span>

          <img
            src="../imagenes/${servicio.imagen}"
            alt="Imagen ilustrativa de ${servicio.nombre}"
            loading="lazy"
          >
        </div>

        <div class="servicio-cuerpo">
          <p class="eyebrow">${servicio.categoria}</p>
          <h3>${servicio.nombre}</h3>
          <p>${servicio.texto}</p>

          <ul>
            ${servicio.incluye.map(texto => `
              <li>${texto}</li>
            `).join('')}
          </ul>

          <div class="precio">
            <strong>
              ${dinero(precio(servicio, tipo))}
            </strong>

            <span>
              ${tipo} · ${servicio.minutos} min · Demo
            </span>
          </div>

          <button
            type="button"
            class="boton ancho"
            data-elegir="${servicio.id}"
          >
            Probar agenda →
          </button>
        </div>
      </article>
    `).join('');
  }

  function actualizarHorarios() {
    const servicio = servicios.find(
      registro => registro.id === $('#servicio').value
    );

    const fecha = $('#fecha').value;
    const anterior = $('#hora').value;

    const horarios = (
      servicio &&
      fechaValida(fecha) &&
      fecha >= diaMas(1) &&
      fecha <= diaMas(30)
    )
      ? disponibles(estado.citas, fecha, servicio.minutos)
      : [];

    $('#hora').innerHTML = horarios.length
      ? horarios.map(inicio => `
        <option value="${inicio}">
          ${hora(inicio)} —
          ${hora(inicio + servicio.minutos)}
        </option>
      `).join('')
      : '<option value="">Sin horarios disponibles</option>';

    if (
      anterior !== '' &&
      horarios.includes(Number(anterior))
    ) {
      $('#hora').value = anterior;
    }

    $('#resumen-agenda').textContent = servicio
      ? (
        `${servicio.nombre} · ${servicio.minutos} minutos · ` +
        `Total ficticio: ${dinero(
          precio(servicio, $('#tipo').value)
        )}. Una bahía de servicio, de 09:00 a 18:00.`
      )
      : '';
  }

  function tarjeta(cita) {
    const servicio = servicioDe(cita);
    const indice = etapas.indexOf(cita.etapa);

    return `
      <article class="orden panel">
        <div class="entre">
          <span
            class="etiqueta ${
              cita.etapa === 'Cancelada' ? 'gris' : ''
            }"
          >
            ${cita.etapa}
          </span>

          <small>${cita.id}</small>
        </div>

        <h3>${servicio.nombre}</h3>

        <p class="vehiculo">
          ${esc(cita.vehiculo)} · ${cita.tipo}
        </p>

        <p class="muted">
          ${cita.cliente}
          <br>
          ${cita.fecha} ·
          ${hora(cita.inicio)}–${hora(cita.inicio + cita.minutos)}
          <br>
          Responsable: ${cita.encargado}
        </p>

        <div class="pasos" aria-label="Estado de la orden">
          ${etapas.map((etapa, posicion) => `
            <span
              class="${indice >= posicion ? 'hecho' : ''}"
              title="${etapa}"
            >
              ${posicion + 1}
            </span>
          `).join('')}
        </div>

        <div class="importes">
          <span>
            Total
            <strong>${dinero(cita.total)}</strong>
          </span>

          <span>
            Saldo
            <strong>
              ${
                cita.etapa === 'Cancelada'
                  ? 'No aplica'
                  : dinero(saldo(cita))
              }
            </strong>
          </span>
        </div>

        <button
          type="button"
          class="ancho"
          data-detalle="${cita.id}"
        >
          ${
            vistaActual === 'operacion'
              ? 'Gestionar orden'
              : 'Ver seguimiento y recibo'
          }
        </button>
      </article>
    `;
  }

  function listaFiltrada() {
    const consulta = $('#buscar-orden').value
      .trim()
      .toLocaleLowerCase('es');

    const etapa = $('#filtro-etapa').value;
    const fecha = $('#filtro-fecha').value;

    return estado.citas
      .filter(cita =>
        (!etapa || cita.etapa === etapa) &&
        (!fecha || cita.fecha === fecha) &&
        (
          `${cita.id} ${cita.cliente} ` +
          `${cita.vehiculo} ${servicioDe(cita).nombre}`
        ).toLocaleLowerCase('es').includes(consulta)
      )
      .sort((a, b) =>
        a.fecha.localeCompare(b.fecha) ||
        a.inicio - b.inicio
      );
  }

  function pintarListas() {
    const cliente = $('#visitante').value;

    const propias = estado.citas
      .filter(cita => cita.cliente === cliente)
      .sort((a, b) =>
        b.fecha.localeCompare(a.fecha) ||
        b.inicio - a.inicio
      );

    $('#mis-citas').innerHTML = propias.length
      ? propias.map(tarjeta).join('')
      : '<p class="vacio">Este visitante todavía no tiene citas.</p>';

    const lista = listaFiltrada();

    $('#ordenes').innerHTML = lista.length
      ? lista.map(tarjeta).join('')
      : '<p class="vacio">Sin órdenes con esos filtros.</p>';

    $('#conteo').textContent =
      `${lista.length} órdenes encontradas`;

    const hoy = diaMas(0);

    const cobrado = estado.citas
      .flatMap(cita => cita.pagos)
      .filter(pago =>
        fechaLocal(new Date(pago.fecha)) === hoy
      )
      .reduce(
        (total, pago) => total + pago.importe,
        0
      );

    const activas = estado.citas.filter(
      cita => !['Cancelada', 'Entregado'].includes(cita.etapa)
    );

    const indicadores = [
      [
        'Citas para hoy',
        estado.citas.filter(cita =>
          cita.fecha === hoy &&
          cita.etapa !== 'Cancelada'
        ).length
      ],
      ['Órdenes activas', activas.length],
      ['Cobrado hoy · demo', dinero(cobrado)],
      [
        'Saldo de órdenes activas',
        dinero(activas.reduce(
          (total, cita) => total + saldo(cita),
          0
        ))
      ]
    ];

    $('#metricas').innerHTML = indicadores
      .map(([titulo, valor]) => `
        <article>
          <span>${titulo}</span>
          <strong>${valor}</strong>
        </article>
      `).join('');
  }

  function recibo(cita) {
    return [
      'LUSTRE · ESTÉTICA AUTOMOTRIZ DEMO',
      cita.id,
      `Visitante: ${cita.cliente}`,
      `Vehículo ficticio: ${cita.vehiculo} · ${cita.tipo}`,
      `Servicio: ${servicioDe(cita).nombre}`,
      (
        `Cita: ${cita.fecha} ` +
        `${hora(cita.inicio)}–${hora(cita.inicio + cita.minutos)}`
      ),
      `Estado: ${cita.etapa}`,
      `Responsable ficticio: ${cita.encargado}`,
      '',
      `Total de muestra: ${dinero(cita.total)}`,
      `Pagado simulado: ${dinero(pagado(cita))}`,
      (
        'Saldo: ' +
        (
          cita.etapa === 'Cancelada'
            ? 'No aplica'
            : dinero(saldo(cita))
        )
      ),
      '',
      'MOVIMIENTOS SIMULADOS',
      ...cita.pagos.map(pago =>
        `${fechaHora(pago.fecha)} · ` +
        `${pago.metodo} · ${dinero(pago.importe)}`
      ),
      '',
      'Sin pagos reales. No es comprobante fiscal.',
      'King Land · +52 222 535 4183'
    ].join('\n');
  }

  function abrirDetalle(id, abrir = true) {
    const cita = estado.citas.find(
      registro => registro.id === id
    );

    if (!cita) {
      return;
    }

    citaActual = id;

    const puedeOperar =
      vistaActual === 'operacion' &&
      !['Cancelada', 'Entregado'].includes(cita.etapa);

    let gestion = '';

    if (puedeOperar) {
      const acciones = {
        Agendada: 'Recibir vehículo',
        Recibido: 'Iniciar trabajo',
        'En proceso': 'Marcar listo',
        Listo: 'Entregar vehículo'
      };

      gestion = `
        <section class="gestion">
          <p class="eyebrow">CONTROLES ABIERTOS DE DEMO</p>

          <form id="form-notas">
            <label class="campo">
              Responsable

              <select id="encargado">
                ${encargados.map(encargado => `
                  <option
                    ${encargado === cita.encargado ? 'selected' : ''}
                  >
                    ${encargado}
                  </option>
                `).join('')}
              </select>
            </label>

            <label class="campo">
              Notas de trabajo

              <textarea
                id="notas"
                maxlength="240"
                rows="3"
              >${esc(cita.notas)}</textarea>
            </label>

            <button>
              Guardar responsable y notas
            </button>
          </form>

          ${
            saldo(cita) > 0
              ? `
                <form id="form-pago">
                  <h3>Registrar abono simulado</h3>

                  <div class="dos-columnas">
                    <label class="campo">
                      Importe MXN

                      <input
                        id="importe"
                        type="number"
                        min="0.01"
                        max="${(saldo(cita) / 100).toFixed(2)}"
                        step="0.01"
                        required
                      >
                    </label>

                    <label class="campo">
                      Método

                      <select id="metodo">
                        <option>Efectivo</option>
                        <option>Transferencia</option>
                        <option>Tarjeta</option>
                      </select>
                    </label>
                  </div>

                  <button class="boton">
                    Registrar abono
                  </button>
                </form>
              `
              : '<p class="nota">Cuenta liquidada en la simulación.</p>'
          }

          <div class="acciones">
            <button type="button" id="avanzar" class="boton">
              ${acciones[cita.etapa]}
            </button>

            ${
              cita.etapa === 'Agendada' && pagado(cita) === 0
                ? `
                  <button type="button" id="cancelar">
                    Cancelar cita
                  </button>
                `
                : ''
            }
          </div>
        </section>
      `;
    }

    $('#detalle').innerHTML = `
      <p class="eyebrow">
        LUSTRE · SEGUIMIENTO DE DEMOSTRACIÓN
      </p>

      <h2 id="titulo-detalle">${cita.id}</h2>

      <span class="etiqueta">${cita.etapa}</span>

      <h3>${servicioDe(cita).nombre}</h3>

      <p>
        ${esc(cita.vehiculo)} · ${cita.tipo}
        <br>
        ${cita.cliente}
        <br>
        ${cita.fecha} ·
        ${hora(cita.inicio)}–${hora(cita.inicio + cita.minutos)}
      </p>

      <div class="resumen-pago">
        <div>
          <span>Total</span>
          <strong>${dinero(cita.total)}</strong>
        </div>

        <div>
          <span>Pagado</span>
          <strong>${dinero(pagado(cita))}</strong>
        </div>

        <div>
          <span>Saldo</span>
          <strong>
            ${
              cita.etapa === 'Cancelada'
                ? 'No aplica'
                : dinero(saldo(cita))
            }
          </strong>
        </div>
      </div>

      <h3>Movimientos simulados</h3>

      <ul class="movimientos">
        ${
          cita.pagos.length
            ? cita.pagos.map(pago => `
              <li>
                <span>
                  ${fechaHora(pago.fecha)}
                  <small>${pago.metodo}</small>
                </span>

                <strong>${dinero(pago.importe)}</strong>
              </li>
            `).join('')
            : '<li>Sin pagos registrados.</li>'
        }
      </ul>

      <p class="muted">
        Responsable: ${cita.encargado}
      </p>

      ${
        cita.notas
          ? `<p class="nota">${esc(cita.notas)}</p>`
          : ''
      }

      ${gestion}

      <p id="error-modal" class="error" role="alert"></p>

      <p class="muted">
        Precios y pagos ficticios.
        Este recibo no tiene valor fiscal.
      </p>
    `;

    const ejecutar = accion => {
      try {
        accion();

        guardar(`Orden ${cita.id} actualizada.`);

        pintarListas();
        actualizarHorarios();
        abrirDetalle(cita.id, false);
      } catch (error) {
        $('#error-modal').textContent = error.message;
      }
    };

    if ($('#form-notas')) {
      $('#form-notas').onsubmit = evento => {
        evento.preventDefault();

        ejecutar(() => {
          const encargado = $('#encargado').value;

          if (!encargados.includes(encargado)) {
            throw Error('Responsable no válido.');
          }

          cita.encargado = encargado;

          cita.notas = $('#notas').value
            .trim()
            .slice(0, 240);
        });
      };
    }

    if ($('#form-pago')) {
      $('#form-pago').onsubmit = evento => {
        evento.preventDefault();

        ejecutar(() => {
          if (cita.pagos.length >= 200) {
            throw Error(
              'Se alcanzó el límite de movimientos de esta demo.'
            );
          }

          abonar(
            cita,
            $('#importe').value,
            $('#metodo').value
          );
        });
      };
    }

    if ($('#avanzar')) {
      $('#avanzar').onclick = () => {
        ejecutar(() => avanzar(cita));
      };
    }

    if ($('#cancelar')) {
      $('#cancelar').onclick = () => {
        if (confirm(
          '¿Cancelar esta cita ficticia y liberar su horario?'
        )) {
          ejecutar(() => cancelar(cita));
        }
      };
    }

    if (abrir) {
      $('#modal').showModal();
    }
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
        'Visitante ficticio',
        'Vehículo',
        'Servicio',
        'Fecha cita',
        'Hora',
        'Etapa',
        'Total MXN',
        'Pagado MXN',
        'Saldo MXN',
        'Responsable'
      ],
      ...listaFiltrada().map(cita => [
        cita.id,
        cita.cliente,
        cita.vehiculo,
        servicioDe(cita).nombre,
        cita.fecha,
        hora(cita.inicio),
        cita.etapa,
        (cita.total / 100).toFixed(2),
        (pagado(cita) / 100).toFixed(2),
        cita.etapa === 'Cancelada'
          ? 'No aplica'
          : (saldo(cita) / 100).toFixed(2),
        cita.encargado
      ])
    ];

    descargar(
      '\uFEFF' + filas.map(
        fila => fila.map(celda).join(',')
      ).join('\r\n'),
      'estetica-demo.csv',
      'text/csv;charset=utf-8'
    );
  }

  $('#tipo-catalogo').innerHTML = tipos.map(tipo => `
    <option>${tipo}</option>
  `).join('');

  $('#tipo').innerHTML =
    $('#tipo-catalogo').innerHTML;

  $('#cliente').innerHTML = clientes.map(cliente => `
    <option>${cliente}</option>
  `).join('');

  $('#visitante').innerHTML =
    $('#cliente').innerHTML;

  $('#servicio').innerHTML = servicios.map(servicio => `
    <option value="${servicio.id}">
      ${servicio.nombre}
    </option>
  `).join('');

  $('#filtro-etapa').innerHTML =
    '<option value="">Todas las etapas</option>' +
    [...etapas, 'Cancelada'].map(etapa => `
      <option>${etapa}</option>
    `).join('');

  $('#fecha').min = diaMas(1);
  $('#fecha').max = diaMas(30);
  $('#fecha').value = diaMas(1);

  $('#tipo-catalogo').onchange = pintarCatalogo;

  ['#servicio', '#tipo', '#fecha'].forEach(selector => {
    $(selector).onchange = actualizarHorarios;
  });

  $('#visitante').onchange = pintarListas;
  $('#buscar-orden').oninput = pintarListas;
  $('#filtro-etapa').onchange = pintarListas;
  $('#filtro-fecha').onchange = pintarListas;

  $('#limpiar-filtros').onclick = () => {
    $('#buscar-orden').value = '';
    $('#filtro-etapa').value = '';
    $('#filtro-fecha').value = '';

    pintarListas();
  };

  $('#form-agenda').onsubmit = evento => {
    evento.preventDefault();

    $('#error-agenda').textContent = '';

    try {
      if ($('#hora').value === '') {
        throw Error('No hay un horario seleccionado.');
      }

      const cita = reservar(estado.citas, {
        cliente: $('#cliente').value,
        vehiculo: $('#vehiculo').value,
        tipo: $('#tipo').value,
        servicio: $('#servicio').value,
        fecha: $('#fecha').value,
        inicio: Number($('#hora').value)
      });

      guardar(
        `Cita ${cita.id} creada. No es una reservación real.`
      );

      $('#visitante').value = cita.cliente;

      actualizarHorarios();
      mostrarVista('cliente');
      abrirDetalle(cita.id);
    } catch (error) {
      $('#error-agenda').textContent = error.message;
    }
  };

  document.addEventListener('click', evento => {
    const boton = evento.target.closest('button');

    if (!boton) {
      return;
    }

    if (boton.dataset.vista) {
      mostrarVista(boton.dataset.vista);
    }

    if (boton.dataset.elegir) {
      $('#servicio').value = boton.dataset.elegir;

      $('#tipo').value =
        $('#tipo-catalogo').value;

      actualizarHorarios();
      mostrarVista('agenda');

      $('#vehiculo').focus();
    }

    if (boton.dataset.detalle) {
      abrirDetalle(boton.dataset.detalle);
    }
  });

  $('#cerrar-modal').onclick = () => {
    $('#modal').close();
  };

  $('#imprimir').onclick = () => {
    window.print();
  };

  $('#descargar').onclick = () => {
    const cita = estado.citas.find(
      registro => registro.id === citaActual
    );

    if (cita) {
      descargar(
        recibo(cita),
        `${cita.id}-demo.txt`,
        'text/plain;charset=utf-8'
      );
    }
  };

  $('#exportar').onclick = exportar;

  $('#restablecer').onclick = () => {
    if (!confirm(
      '¿Restablecer las citas, órdenes y pagos ficticios de esta demo?'
    )) {
      return;
    }

    estado = muestra();

    guardar('Muestra restablecida.');
    pintarListas();
    actualizarHorarios();
  };

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
      'Hola, probé la demo Lustre de King Land. ' +
      'Me interesa un sistema para estética automotriz ' +
      'con servicios, agenda, seguimiento de órdenes y recibos.'
    );

  pintarCatalogo();
  actualizarHorarios();
  pintarListas();

  if (avisoCarga) {
    avisar(avisoCarga);
  }
})();