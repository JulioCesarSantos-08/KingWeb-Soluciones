(() => {
  'use strict';

  const CLAVE = 'kingland.radio.demo.v1';

  const dias = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
  ];

  const bloques = [
    {
      id: 'madrugada',
      inicio: 0,
      fin: 360,
      nombre: 'Frecuencia tranquila',
      finSemana: 'Madrugada sin prisa',
      voz: 'Selección Nocturna',
      descripcion:
        'Un espacio ficticio de compañía durante la madrugada.'
    },
    {
      id: 'manana',
      inicio: 360,
      fin: 600,
      nombre: 'Despierta en sintonía',
      finSemana: 'Mañanas de pausa',
      voz: 'Voz Aurora',
      descripcion:
        'Conversación, ideas y música para comenzar el día.'
    },
    {
      id: 'dia',
      inicio: 600,
      fin: 840,
      nombre: 'En rotación',
      finSemana: 'Ruta de fin de semana',
      voz: 'Cabina Central',
      descripcion:
        'Una selección de muestra para acompañar tus actividades.'
    },
    {
      id: 'tarde',
      inicio: 840,
      fin: 1080,
      nombre: 'Conexión abierta',
      finSemana: 'Tardes compartidas',
      voz: 'Voz Aurora',
      descripcion:
        'El bloque de ejemplo para solicitudes y dedicatorias.'
    },
    {
      id: 'atardecer',
      inicio: 1080,
      fin: 1260,
      nombre: 'Después del día',
      finSemana: 'Horizonte sonoro',
      voz: 'Cabina Central',
      descripcion:
        'Una transición de muestra entre el ritmo del día y la noche.'
    },
    {
      id: 'noche',
      inicio: 1260,
      fin: 1440,
      nombre: 'Sesión nocturna',
      finSemana: 'Noches en órbita',
      voz: 'Selección Nocturna',
      descripcion:
        'Un cierre ficticio con sonidos suaves y nuevas conversaciones.'
    }
  ];

  const canciones = [
    'Horizonte de papel',
    'Luz de la tarde',
    'Camino de vuelta'
  ];

  const alias = [
    'Visitante Aurora',
    'Visitante Norte',
    'Visitante Sur'
  ];

  const mensajes = [
    'Sin dedicatoria',
    'Para quienes nos acompañan hoy.',
    'Para mi familia, con cariño.',
    'Para el equipo que sigue creando.'
  ];

  const estados = [
    'Pendiente',
    'Revisada',
    'Atendida'
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

  const hora = minutos =>
    minutos === 1440
      ? '24:00'
      : (
        `${String(Math.floor(minutos / 60)).padStart(2, '0')}:` +
        String(minutos % 60).padStart(2, '0')
      );

  function relojMexico(fecha = new Date()) {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Mexico_City',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(fecha);

    const valor = tipo =>
      partes.find(parte => parte.type === tipo).value;

    return {
      dia: [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun'
      ].indexOf(valor('weekday')),

      minutos:
        Number(valor('hour')) * 60 +
        Number(valor('minute'))
    };
  }

  function parrilla(dia) {
    return bloques.map(bloque => ({
      ...bloque,
      nombre:
        dia >= 5
          ? bloque.finSemana
          : bloque.nombre
    }));
  }

  function actual(dia, minutos) {
    return parrilla(dia).find(
      bloque =>
        minutos >= bloque.inicio &&
        minutos < bloque.fin
    );
  }

  function inicial() {
    return {
      volumen: 25,
      favoritos: [],
      solicitudes: []
    };
  }

  function validar(datos) {
    return Boolean(
      datos &&
      Number.isInteger(datos.volumen) &&
      datos.volumen >= 0 &&
      datos.volumen <= 100 &&
      Array.isArray(datos.favoritos) &&
      datos.favoritos.length <= 6 &&
      new Set(datos.favoritos).size === datos.favoritos.length &&
      datos.favoritos.every(id =>
        bloques.some(bloque => bloque.id === id)
      ) &&
      Array.isArray(datos.solicitudes) &&
      datos.solicitudes.length <= 50 &&
      new Set(
        datos.solicitudes.map(solicitud => solicitud?.id)
      ).size === datos.solicitudes.length &&
      datos.solicitudes.every(solicitud =>
        solicitud &&
        /^ON-\d{4}$/.test(solicitud.id) &&
        alias.includes(solicitud.alias) &&
        canciones.includes(solicitud.cancion) &&
        mensajes.includes(solicitud.mensaje) &&
        bloques.some(
          bloque => bloque.id === solicitud.programa
        ) &&
        estados.includes(solicitud.estado) &&
        Number.isFinite(solicitud.fecha)
      )
    );
  }

  function solicitar(estado, datos) {
    if (
      !alias.includes(datos.alias) ||
      !canciones.includes(datos.cancion) ||
      !mensajes.includes(datos.mensaje) ||
      !bloques.some(bloque => bloque.id === datos.programa)
    ) {
      throw Error(
        'Selecciona una opción válida en cada campo.'
      );
    }

    if (estado.solicitudes.length >= 50) {
      throw Error(
        'La demo admite 50 solicitudes. ' +
        'Restablece la muestra para comenzar de nuevo.'
      );
    }

    const siguiente = Math.max(
      0,
      ...estado.solicitudes.map(
        solicitud => Number(solicitud.id.slice(3))
      )
    ) + 1;

    const solicitud = {
      ...datos,
      id: `ON-${String(siguiente).padStart(4, '0')}`,
      fecha: Date.now(),
      estado: 'Pendiente'
    };

    estado.solicitudes.push(solicitud);

    return solicitud;
  }

  function avanzar(solicitud) {
    const indice = estados.indexOf(solicitud.estado);

    if (indice < 0 || indice >= estados.length - 1) {
      throw Error('Esta solicitud ya está atendida.');
    }

    solicitud.estado = estados[indice + 1];
  }

  let estado;
  let avisoInicial = '';

  try {
    const guardado = localStorage.getItem(CLAVE);

    estado = guardado
      ? JSON.parse(guardado)
      : inicial();

    if (!validar(estado)) {
      throw Error();
    }
  } catch {
    estado = inicial();

    avisoInicial =
      'No se recuperaron los datos guardados. ' +
      'Se inició una muestra nueva.';
  }

  let diaElegido = relojMexico().dia;
  let soloFavoritos = false;

  let contexto = null;
  let master = null;
  let reproduciendo = false;
  let ocupado = false;
  let temporizador = null;
  let siguiente = 0;
  let paso = 0;
  let inicioSesion = 0;
  let acumulado = 0;

  const voces = new Set();

  function avisar(texto) {
    $('#aviso').textContent = texto;
  }

  function guardar(mensaje = '') {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));

      if (mensaje) {
        avisar(mensaje);
      }
    } catch {
      avisar(
        (mensaje ? mensaje + ' ' : '') +
        'No se pudo guardar en el navegador. ' +
        'Los cambios durarán solo esta sesión.'
      );
    }
  }

  function fecha(valor) {
    return new Date(valor).toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function pintarParrilla() {
    const ahora = relojMexico();

    const lista = parrilla(diaElegido).filter(
      bloque =>
        !soloFavoritos ||
        estado.favoritos.includes(bloque.id)
    );

    $('#programas').innerHTML = lista.length
      ? lista.map(bloque => `
        <article class="programa">
          <div class="programa-hora">
            <strong>${hora(bloque.inicio)}</strong>
            <span>${hora(bloque.fin)}</span>
          </div>

          <div class="programa-texto">
            <div class="entre">
              <span class="eyebrow">
                ${esc(bloque.voz)}
              </span>

              ${
                diaElegido === ahora.dia &&
                ahora.minutos >= bloque.inicio &&
                ahora.minutos < bloque.fin
                  ? `
                    <span class="etiqueta">
                      En horario · Demo
                    </span>
                  `
                  : ''
              }
            </div>

            <h3>${bloque.nombre}</h3>
            <p>${bloque.descripcion}</p>
          </div>

          <button
            type="button"
            class="favorito"
            data-favorito="${bloque.id}"
            aria-pressed="${estado.favoritos.includes(bloque.id)}"
            aria-label="${
              estado.favoritos.includes(bloque.id)
                ? 'Quitar favorito'
                : 'Guardar favorito'
            }: ${bloque.nombre}"
          >
            ${
              estado.favoritos.includes(bloque.id)
                ? '♥'
                : '♡'
            }
          </button>
        </article>
      `).join('')
      : `
        <p class="vacio">
          Todavía no tienes programas favoritos.
          Desactiva el filtro y guarda alguno con el corazón.
        </p>
      `;

    $('#dia-elegido').textContent = dias[diaElegido];

    $('#contador-favoritos').textContent =
      estado.favoritos.length;

    document.querySelectorAll('[data-dia]')
      .forEach(boton => {
        boton.setAttribute(
          'aria-pressed',
          String(Number(boton.dataset.dia) === diaElegido)
        );
      });
  }

  function actualizarReloj() {
    const ahora = relojMexico();
    const bloque = actual(ahora.dia, ahora.minutos);

    $('#reloj').textContent =
      `${dias[ahora.dia]} · ${hora(ahora.minutos)} · ` +
      'Ciudad de México';

    $('#programa-actual').textContent = bloque.nombre;

    $('#horario-actual').textContent =
      `${hora(bloque.inicio)}–${hora(bloque.fin)} · ` +
      bloque.voz;

    pintarParrilla();
  }

  function actualizarPlayer() {
    $('#play').textContent = ocupado
      ? 'Preparando audio…'
      : reproduciendo
        ? 'Pausar muestra'
        : 'Reproducir muestra';

    $('#play').disabled = ocupado;

    $('#play').setAttribute(
      'aria-pressed',
      String(reproduciendo)
    );

    $('#estado-audio').textContent = reproduciendo
      ? 'Reproduciendo muestra instrumental'
      : 'Muestra en pausa';

    $('#disco').classList.toggle(
      'girando',
      reproduciendo
    );

    const segundos = Math.floor(
      acumulado +
      (
        reproduciendo && contexto
          ? contexto.currentTime - inicioSesion
          : 0
      )
    );

    $('#tiempo').textContent =
      `${String(Math.floor(segundos / 60)).padStart(2, '0')}:` +
      String(segundos % 60).padStart(2, '0');
  }

  function tono(
    frecuencia,
    inicio,
    duracion,
    intensidad,
    tipo = 'sine'
  ) {
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = tipo;
    oscilador.frequency.value = frecuencia;

    ganancia.gain.setValueAtTime(0, inicio);

    ganancia.gain.linearRampToValueAtTime(
      intensidad,
      inicio + 0.025
    );

    ganancia.gain.exponentialRampToValueAtTime(
      0.0001,
      inicio + duracion
    );

    oscilador.connect(ganancia);
    ganancia.connect(master);

    const voz = {
      oscilador,
      ganancia
    };

    voces.add(voz);

    oscilador.onended = () => {
      oscilador.disconnect();
      ganancia.disconnect();
      voces.delete(voz);
    };

    oscilador.start(inicio);
    oscilador.stop(inicio + duracion + 0.04);
  }

  function programarAudio() {
    if (!reproduciendo) {
      return;
    }

    if (contexto.state !== 'running') {
      pausar();

      avisar(
        'El navegador interrumpió el audio. ' +
        'Pulsa Reproducir para retomarlo.'
      );

      return;
    }

    if (siguiente < contexto.currentTime - 0.1) {
      siguiente = contexto.currentTime + 0.05;
    }

    const raices = [
      130.8128,
      110,
      174.6141,
      146.8324
    ];

    const melodia = [
      0, 7, 12, 7,
      4, 7, 12, 16,
      0, 7, 12, 19,
      16, 12, 7, 4
    ];

    while (siguiente < contexto.currentTime + 0.25) {
      const raiz = raices[
        Math.floor(paso / 16) % raices.length
      ];

      if (paso % 8 === 0) {
        [
          1,
          Math.pow(2, 4 / 12),
          Math.pow(2, 7 / 12)
        ].forEach(factor => {
          tono(
            raiz * factor,
            siguiente,
            2.2,
            0.035
          );
        });
      }

      if (paso % 4 === 0) {
        tono(
          raiz / 2,
          siguiente,
          0.75,
          0.09,
          'triangle'
        );
      }

      tono(
        raiz * 2 * Math.pow(
          2,
          melodia[paso % melodia.length] / 12
        ),
        siguiente,
        0.45,
        0.055
      );

      paso++;
      siguiente += 60 / 96 / 2;
    }
  }

  async function reproducir() {
    if (ocupado) {
      return;
    }

    if (reproduciendo) {
      pausar();
      return;
    }

    ocupado = true;
    actualizarPlayer();

    try {
      const Audio =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!Audio) {
        throw Error(
          'Este navegador no admite la muestra de audio. ' +
          'Puedes explorar las demás funciones.'
        );
      }

      if (!contexto) {
        contexto = new Audio();
        master = contexto.createGain();

        master.gain.value = estado.volumen / 100;
        master.connect(contexto.destination);
      }

      await contexto.resume();

      if (contexto.state !== 'running') {
        throw Error(
          'No se pudo iniciar el audio. ' +
          'Vuelve a pulsar Reproducir.'
        );
      }

      reproduciendo = true;
      inicioSesion = contexto.currentTime;
      siguiente = contexto.currentTime + 0.06;

      programarAudio();

      temporizador = setInterval(
        programarAudio,
        80
      );
    } catch (error) {
      pausar();
      avisar(error.message);
    } finally {
      ocupado = false;
      actualizarPlayer();
    }
  }

  function pausar() {
    if (reproduciendo && contexto) {
      acumulado += contexto.currentTime - inicioSesion;
    }

    reproduciendo = false;

    clearInterval(temporizador);
    temporizador = null;

    if (contexto) {
      for (const voz of voces) {
        try {
          voz.ganancia.gain.cancelScheduledValues(
            contexto.currentTime
          );

          voz.ganancia.gain.setTargetAtTime(
            0.0001,
            contexto.currentTime,
            0.01
          );

          voz.oscilador.stop(
            contexto.currentTime + 0.04
          );
        } catch {}
      }
    }

    actualizarPlayer();
  }

  function pintarSolicitudes() {
    const filtro = $('#filtro-solicitudes').value;

    const lista = [...estado.solicitudes]
      .reverse()
      .filter(solicitud =>
        !filtro ||
        solicitud.estado === filtro
      );

    $('#solicitudes').innerHTML = lista.length
      ? lista.map(solicitud => `
        <article class="solicitud">
          <div class="entre">
            <span class="etiqueta">
              ${solicitud.estado}
            </span>

            <small>${solicitud.id}</small>
          </div>

          <h3>${solicitud.cancion}</h3>

          <p>
            ${solicitud.alias} ·
            ${
              bloques.find(
                bloque => bloque.id === solicitud.programa
              ).nombre
            }
            <br>
            ${fecha(solicitud.fecha)}
          </p>

          <p class="dedicatoria">
            ${solicitud.mensaje}
          </p>

          ${
            solicitud.estado !== 'Atendida'
              ? `
                <button
                  type="button"
                  data-avanzar="${solicitud.id}"
                >
                  ${
                    solicitud.estado === 'Pendiente'
                      ? 'Marcar revisada'
                      : 'Marcar atendida'
                  }
                </button>
              `
              : `
                <small>
                  Recorrido completado en la simulación.
                </small>
              `
          }
        </article>
      `).join('')
      : `
        <p class="vacio">
          No hay solicitudes en esta selección.
          Crea una desde el formulario.
        </p>
      `;

    const pendientes = estado.solicitudes.filter(
      solicitud => solicitud.estado !== 'Atendida'
    ).length;

    $('#cantidad-solicitudes').textContent =
      `${estado.solicitudes.length} solicitudes locales · ` +
      `${pendientes} sin atender`;
  }

  function descargar(contenido, nombre, tipo) {
    const archivo = new Blob([contenido], {
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
        'Alias ficticio',
        'Canción ficticia',
        'Bloque de programación',
        'Dedicatoria',
        'Estado',
        'Fecha Ciudad de México'
      ],
      ...estado.solicitudes.map(solicitud => [
        solicitud.id,
        solicitud.alias,
        solicitud.cancion,
        bloques.find(
          bloque => bloque.id === solicitud.programa
        ).nombre,
        solicitud.mensaje,
        solicitud.estado,
        fecha(solicitud.fecha)
      ])
    ];

    descargar(
      '\uFEFF' + filas.map(
        fila => fila.map(celda).join(',')
      ).join('\r\n'),
      'radio-solicitudes-demo.csv',
      'text/csv;charset=utf-8'
    );
  }

  const notas = {
    programacion: {
      titulo:
        'Una programación que se entiende de un vistazo',
      texto:
        'Esta sección ejemplifica cómo presentar bloques, ' +
        'horarios y voces de una estación. Puedes cambiar de día ' +
        'y guardar programas favoritos. La parrilla es ficticia ' +
        'y la muestra de audio funciona de manera independiente.'
    },
    audiencia: {
      titulo:
        'Un espacio para escuchar a tu audiencia',
      texto:
        'Las solicitudes de esta demo recorren tres etapas: ' +
        'Pendiente, Revisada y Atendida. No se envían a ninguna ' +
        'cabina. Una implementación real puede conectar el ' +
        'formulario con un panel de moderación y permisos ' +
        'para el equipo.'
    },
    identidad: {
      titulo:
        'La identidad de tu estación, también en internet',
      texto:
        'Colores, programación, perfiles, publicaciones y ' +
        'reproductor pueden adaptarse a cada estación. Para una ' +
        'transmisión real se necesita una fuente de streaming ' +
        'compatible y las autorizaciones correspondientes ' +
        'del contenido que se transmita.'
    }
  };

  $('#dias').innerHTML = dias.map((dia, indice) => `
    <button
      type="button"
      data-dia="${indice}"
      aria-pressed="${indice === diaElegido}"
    >
      ${dia}
    </button>
  `).join('');

  $('#alias').innerHTML = alias.map(nombre => `
    <option>${nombre}</option>
  `).join('');

  $('#cancion').innerHTML = canciones.map(cancion => `
    <option>${cancion}</option>
  `).join('');

  $('#mensaje').innerHTML = mensajes.map(mensaje => `
    <option>${mensaje}</option>
  `).join('');

  $('#programa').innerHTML = bloques.map(bloque => `
    <option value="${bloque.id}">
      ${bloque.nombre} ·
      ${hora(bloque.inicio)}–${hora(bloque.fin)}
    </option>
  `).join('');

  $('#volumen').value = estado.volumen;

  $('#valor-volumen').textContent =
    `${estado.volumen}%`;

  $('#volumen').oninput = () => {
    estado.volumen = Math.max(
      0,
      Math.min(100, Number($('#volumen').value))
    );

    if (master) {
      master.gain.setTargetAtTime(
        estado.volumen / 100,
        contexto.currentTime,
        0.03
      );
    }

    $('#valor-volumen').textContent =
      `${estado.volumen}%`;
  };

  $('#volumen').onchange = () => guardar();

  $('#play').onclick = reproducir;

  $('#favoritos').onchange = () => {
    soloFavoritos = $('#favoritos').checked;
    pintarParrilla();
  };

  $('#hoy').onclick = () => {
    diaElegido = relojMexico().dia;
    actualizarReloj();
  };

  $('#filtro-solicitudes').onchange =
    pintarSolicitudes;

  $('#exportar').onclick = exportar;

  $('#form-solicitud').onsubmit = evento => {
    evento.preventDefault();

    $('#error-solicitud').textContent = '';

    try {
      const solicitud = solicitar(estado, {
        alias: $('#alias').value,
        cancion: $('#cancion').value,
        mensaje: $('#mensaje').value,
        programa: $('#programa').value
      });

      guardar(
        `${solicitud.id} creada solo en este navegador. ` +
        'No se envió a una estación real.'
      );

      pintarSolicitudes();

      $('#confirmacion').textContent =
        `${solicitud.id} · ${solicitud.cancion} · ` +
        'Pendiente de revisión en la demo.';
    } catch (error) {
      $('#error-solicitud').textContent =
        error.message;
    }
  };

  $('#cerrar-nota').onclick = () => {
    $('#modal-nota').close();
  };

  $('#restablecer').onclick = () => {
    if (!confirm(
      '¿Borrar las solicitudes y favoritos de esta demo ' +
      'y restablecer el volumen?'
    )) {
      return;
    }

    if (ocupado) {
      avisar(
        'Espera a que termine de iniciar el audio ' +
        'y vuelve a intentarlo.'
      );

      return;
    }

    pausar();

    estado = inicial();
    acumulado = 0;
    paso = 0;
    soloFavoritos = false;

    $('#favoritos').checked = false;
    $('#volumen').value = estado.volumen;

    $('#valor-volumen').textContent =
      `${estado.volumen}%`;

    if (master) {
      master.gain.value = estado.volumen / 100;
    }

    $('#confirmacion').textContent = '';
    $('#error-solicitud').textContent = '';

    guardar('Demo restablecida.');

    pintarParrilla();
    pintarSolicitudes();
    actualizarPlayer();
  };

  document.addEventListener('click', evento => {
    const boton = evento.target.closest('button');

    if (!boton) {
      return;
    }

    if (boton.dataset.dia !== undefined) {
      diaElegido = Number(boton.dataset.dia);
      pintarParrilla();
    }

    if (boton.dataset.favorito) {
      const id = boton.dataset.favorito;

      estado.favoritos = estado.favoritos.includes(id)
        ? estado.favoritos.filter(favorito => favorito !== id)
        : [...estado.favoritos, id];

      guardar(
        'Favoritos actualizados en este navegador.'
      );

      pintarParrilla();

      document.querySelector(
        `[data-favorito="${id}"]`
      )?.focus({
        preventScroll: true
      });
    }

    if (boton.dataset.avanzar) {
      const solicitud = estado.solicitudes.find(
        registro => registro.id === boton.dataset.avanzar
      );

      try {
        avanzar(solicitud);

        guardar(
          `${solicitud.id}: ${solicitud.estado}. ` +
          'Simulación local.'
        );

        pintarSolicitudes();
      } catch (error) {
        avisar(error.message);
      }
    }

    if (
      boton.dataset.nota &&
      notas[boton.dataset.nota]
    ) {
      const nota = notas[boton.dataset.nota];

      $('#contenido-nota').innerHTML = `
        <p class="eyebrow">
          CONTENIDO DE DEMOSTRACIÓN
        </p>

        <h2 id="titulo-nota">${nota.titulo}</h2>
        <p>${nota.texto}</p>
      `;

      $('#modal-nota').showModal();
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

  window.addEventListener('pagehide', pausar);

  $('#cotizar').href =
    'https://wa.me/522225354183?text=' +
    encodeURIComponent(
      'Hola, probé la demo Onda de King Land. ' +
      'Me interesa una página para radio con reproductor, ' +
      'programación, perfiles y solicitudes de canciones.'
    );

  actualizarReloj();
  actualizarPlayer();
  pintarSolicitudes();

  setInterval(actualizarReloj, 30000);

  setInterval(() => {
    if (reproduciendo) {
      actualizarPlayer();
    }
  }, 1000);

  if (avisoInicial) {
    avisar(avisoInicial);
  }
})();