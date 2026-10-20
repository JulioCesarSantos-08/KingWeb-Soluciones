(() => {
  'use strict';

  const CLAVE = 'kingland.inmobiliaria.demo.v1';

  const zonas = ['Costa', 'Valle', 'Sierra'];
  const tipos = ['Residencial', 'Campestre', 'Comercial'];
  const estados = ['Disponible', 'Reservado', 'Vendido'];

  const imagenes = [
    {
      archivo: 'inmobiliaria-costa.png',
      titulo: 'Paisaje costero'
    },
    {
      archivo: 'inmobiliaria-residencial.png',
      titulo: 'Zona residencial'
    },
    {
      archivo: 'inmobiliaria-campestre.png',
      titulo: 'Terreno campestre'
    },
    {
      archivo: 'inmobiliaria-panoramica.png',
      titulo: 'Vista panorámica'
    },
    {
      archivo: 'inmobiliaria-comercial.png',
      titulo: 'Zona comercial'
    },
    {
      archivo: 'inmobiliaria-jardin.png',
      titulo: 'Terreno arbolado'
    }
  ];

  const $ = selector => document.querySelector(selector);

  const escapar = valor =>
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

  const moneda = centavos =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(centavos / 100);

  const numero = valor =>
    new Intl.NumberFormat('es-MX', {
      maximumFractionDigits: 2
    }).format(valor);

  function dinero(valor) {
    const texto = String(valor);

    if (!/^\d{1,9}(\.\d{1,2})?$/.test(texto)) {
      throw Error('Escribe un precio válido con máximo dos decimales.');
    }

    const centavos = Math.round(Number(texto) * 100);

    if (centavos <= 0 || centavos > 99999999900) {
      throw Error('El precio debe ser mayor que cero y estar dentro del límite.');
    }

    return centavos;
  }

  function superficie(valor) {
    const texto = String(valor);
    const cantidad = Number(texto);

    if (
      !/^\d+(\.\d{1,2})?$/.test(texto) ||
      !Number.isFinite(cantidad) ||
      cantidad <= 0 ||
      cantidad > 1000000
    ) {
      throw Error(
        'Escribe una superficie mayor que cero, ' +
        'de hasta 1,000,000 m² y máximo dos decimales.'
      );
    }

    return cantidad;
  }

  function crearMuestra() {
    const propiedades = [
      {
        id: 'T001',
        nombre: 'Brisa del Horizonte',
        zona: 'Costa',
        tipo: 'Residencial',
        precio: 68000000,
        metros: 300,
        estado: 'Disponible',
        imagen: 'inmobiliaria-costa.png',
        descripcion:
          'Terreno ficticio de ambiente costero, pensado para mostrar ' +
          'cómo presentar una propiedad con información clara. ' +
          'Su superficie permite ilustrar un proyecto residencial ' +
          'con áreas abiertas y jardín.',
        publicado: true
      },
      {
        id: 'T002',
        nombre: 'Jardines del Valle',
        zona: 'Valle',
        tipo: 'Residencial',
        precio: 45000000,
        metros: 200,
        estado: 'Disponible',
        imagen: 'inmobiliaria-residencial.png',
        descripcion:
          'Lote residencial de muestra en una zona ficticia del valle. ' +
          'Esta ficha ejemplifica la presentación de un espacio ' +
          'para vivienda con dimensiones accesibles y entorno urbano.',
        publicado: true
      },
      {
        id: 'T003',
        nombre: 'Sendero Campestre',
        zona: 'Valle',
        tipo: 'Campestre',
        precio: 125000000,
        metros: 1200,
        estado: 'Disponible',
        imagen: 'inmobiliaria-campestre.png',
        descripcion:
          'Predio campestre ficticio con una superficie amplia. ' +
          'La descripción permite comunicar posibilidades de uso, ' +
          'entorno y características generales sin saturar el catálogo.',
        publicado: true
      },
      {
        id: 'T004',
        nombre: 'Mirador de la Sierra',
        zona: 'Sierra',
        tipo: 'Campestre',
        precio: 89000000,
        metros: 650,
        estado: 'Reservado',
        imagen: 'inmobiliaria-panoramica.png',
        descripcion:
          'Terreno ilustrativo de ambiente serrano. ' +
          'Este registro muestra cómo distinguir una propiedad reservada ' +
          'sin eliminarla del catálogo ni perder su información.',
        publicado: true
      },
      {
        id: 'T005',
        nombre: 'Punto Comercial',
        zona: 'Costa',
        tipo: 'Comercial',
        precio: 240000000,
        metros: 800,
        estado: 'Disponible',
        imagen: 'inmobiliaria-comercial.png',
        descripcion:
          'Espacio comercial ficticio para demostrar la presentación ' +
          'de terrenos orientados a negocios. El precio y las ' +
          'características son exclusivamente ilustrativos.',
        publicado: true
      },
      {
        id: 'T006',
        nombre: 'Rincón de los Árboles',
        zona: 'Sierra',
        tipo: 'Residencial',
        precio: 52000000,
        metros: 280,
        estado: 'Vendido',
        imagen: 'inmobiliaria-jardin.png',
        descripcion:
          'Lote de muestra rodeado de vegetación. Su estado vendido ' +
          'ejemplifica cómo conservar referencias del catálogo ' +
          'y comunicar su disponibilidad de forma transparente.',
        publicado: true
      }
    ];

    return {
      propiedades,
      favoritos: []
    };
  }

  function propiedadValida(propiedad) {
    return Boolean(
      propiedad &&
      typeof propiedad.id === 'string' &&
      /^T[a-zA-Z0-9-]{1,60}$/.test(propiedad.id) &&
      typeof propiedad.nombre === 'string' &&
      propiedad.nombre.trim().length > 0 &&
      propiedad.nombre.length <= 60 &&
      zonas.includes(propiedad.zona) &&
      tipos.includes(propiedad.tipo) &&
      estados.includes(propiedad.estado) &&
      Number.isSafeInteger(propiedad.precio) &&
      propiedad.precio > 0 &&
      propiedad.precio <= 99999999900 &&
      Number.isFinite(propiedad.metros) &&
      propiedad.metros > 0 &&
      propiedad.metros <= 1000000 &&
      Math.abs(
        propiedad.metros * 100 -
        Math.round(propiedad.metros * 100)
      ) < 0.00001 &&
      imagenes.some(
        imagen => imagen.archivo === propiedad.imagen
      ) &&
      typeof propiedad.descripcion === 'string' &&
      propiedad.descripcion.trim().length >= 10 &&
      propiedad.descripcion.length <= 700 &&
      typeof propiedad.publicado === 'boolean'
    );
  }

  function estadoValido(datos) {
    return Boolean(
      datos &&
      Array.isArray(datos.propiedades) &&
      datos.propiedades.length <= 30 &&
      datos.propiedades.every(propiedadValida) &&
      new Set(
        datos.propiedades.map(propiedad => propiedad.id)
      ).size === datos.propiedades.length &&
      Array.isArray(datos.favoritos) &&
      datos.favoritos.length <= 30 &&
      new Set(datos.favoritos).size === datos.favoritos.length &&
      datos.favoritos.every(
        id => datos.propiedades.some(
          propiedad => propiedad.id === id
        )
      )
    );
  }

  let estado;
  let avisoInicial = '';
  let propiedadAbierta = null;

  try {
    const guardado = localStorage.getItem(CLAVE);

    estado = guardado
      ? JSON.parse(guardado)
      : crearMuestra();

    if (!estadoValido(estado)) {
      throw Error();
    }
  } catch {
    estado = crearMuestra();

    avisoInicial =
      'No se pudieron recuperar los datos guardados. ' +
      'Se cargó el catálogo ficticio de muestra.';
  }

  function avisar(mensaje) {
    $('#aviso').textContent = mensaje;
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
      return true;
    } catch {
      return false;
    }
  }

  function confirmarCambio(mensaje) {
    const guardado = guardar();

    avisar(
      mensaje +
      (
        guardado
          ? ''
          : ' No se pudo guardar en el navegador. ' +
            'Este cambio durará solo esta sesión.'
      )
    );
  }

  function claseEstado(valor) {
    return valor === 'Reservado'
      ? 'reservado'
      : valor === 'Vendido'
        ? 'vendido'
        : '';
  }

  function imagenHTML(propiedad, clase = '') {
    return `
      <div class="media ${clase}">
        <span class="respaldo">${escapar(propiedad.nombre)}</span>

        <img
          src="../imagenes/${propiedad.imagen}"
          alt="Imagen ilustrativa de ${escapar(propiedad.nombre)}"
          loading="lazy"
        >
      </div>
    `;
  }

  function filtrarPropiedades() {
    const datos = new FormData($('#filtros'));

    const consulta = String(datos.get('buscar') || '')
      .trim()
      .toLocaleLowerCase('es');

    const zona = datos.get('zona');
    const maximo = Number(datos.get('maximo')) * 100;
    const metros = Number(datos.get('superficie'));
    const disponibilidad = datos.get('estado');
    const soloFavoritos = datos.has('favoritos');
    const orden = datos.get('orden');

    let lista = estado.propiedades.filter(propiedad => {
      const coincideTexto =
        `${propiedad.nombre} ${propiedad.zona}`
          .toLocaleLowerCase('es')
          .includes(consulta);

      return (
        propiedad.publicado &&
        coincideTexto &&
        (!zona || propiedad.zona === zona) &&
        (!maximo || propiedad.precio <= maximo) &&
        (!metros || propiedad.metros >= metros) &&
        (
          !disponibilidad ||
          propiedad.estado === disponibilidad
        ) &&
        (
          !soloFavoritos ||
          estado.favoritos.includes(propiedad.id)
        )
      );
    });

    if (orden === 'menor') {
      lista.sort((a, b) => a.precio - b.precio);
    }

    if (orden === 'mayor') {
      lista.sort((a, b) => b.precio - a.precio);
    }

    if (orden === 'amplio') {
      lista.sort((a, b) => b.metros - a.metros);
    }

    return lista;
  }

  function pintarCatalogo() {
    const lista = filtrarPropiedades();

    const favoritosPublicados = estado.propiedades.filter(
      propiedad =>
        propiedad.publicado &&
        estado.favoritos.includes(propiedad.id)
    ).length;

    $('#cantidad-favoritos').textContent = favoritosPublicados;

    $('#hero-total').textContent = estado.propiedades.filter(
      propiedad => propiedad.publicado
    ).length;

    $('#cantidad-resultados').textContent =
      `${lista.length} ` +
      (
        lista.length === 1
          ? 'propiedad encontrada'
          : 'propiedades encontradas'
      );

    if (!lista.length) {
      $('#propiedades').innerHTML = `
        <div class="vacio">
          <h3>No encontramos propiedades con esos filtros.</h3>
          <p>
            Prueba otra zona, amplía tu presupuesto
            o utiliza “Limpiar filtros”.
          </p>
        </div>
      `;

      return;
    }

    $('#propiedades').innerHTML = lista.map(propiedad => {
      const favorito = estado.favoritos.includes(propiedad.id);

      return `
        <article class="tarjeta">
          <div class="media">
            <span class="respaldo">
              ${escapar(propiedad.nombre)}
            </span>

            <img
              src="../imagenes/${propiedad.imagen}"
              alt="Imagen ilustrativa de ${escapar(propiedad.nombre)}"
              loading="lazy"
            >

            <span class="etiqueta ${claseEstado(propiedad.estado)}">
              ${propiedad.estado}
            </span>

            <button
              type="button"
              class="favorito"
              data-favorito="${propiedad.id}"
              aria-pressed="${favorito}"
              aria-label="${
                favorito ? 'Quitar de favoritos:' : 'Guardar favorito:'
              } ${escapar(propiedad.nombre)}"
            >
              ${favorito ? '♥' : '♡'}
            </button>
          </div>

          <div class="tarjeta-contenido">
            <span class="zona">
              ZONA ${propiedad.zona.toLocaleUpperCase('es')} · DEMO
            </span>

            <h3>${escapar(propiedad.nombre)}</h3>

            <div class="datos">
              <span>${numero(propiedad.metros)} m²</span>
              <span>${propiedad.tipo}</span>
              <span>${propiedad.id}</span>
            </div>

            <strong class="precio">
              ${moneda(propiedad.precio)}
              <small>MXN</small>
            </strong>

            <p class="precio-metro">
              ${moneda(Math.round(
                propiedad.precio / propiedad.metros
              ))} por m² · Precio de muestra
            </p>

            <button
              type="button"
              class="boton"
              data-detalle="${propiedad.id}"
            >
              Explorar propiedad ↗
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function alternarFavorito(id) {
    const propiedad = estado.propiedades.find(
      registro => registro.id === id
    );

    if (!propiedad || !propiedad.publicado) {
      return;
    }

    const existe = estado.favoritos.includes(id);

    estado.favoritos = existe
      ? estado.favoritos.filter(favorito => favorito !== id)
      : [...estado.favoritos, id];

    confirmarCambio(
      existe
        ? 'Propiedad retirada de favoritos.'
        : 'Propiedad guardada en favoritos.'
    );

    pintarCatalogo();

    const boton = document.querySelector(
      `[data-favorito="${id}"]`
    );

    if (boton) {
      boton.focus({ preventScroll: true });
    }
  }

  function enlaceWhatsApp(propiedad = null) {
    let mensaje =
      'Hola, vi la demo inmobiliaria Horizonte de King Land. ' +
      'Me interesa cotizar un catálogo inmobiliario para mi negocio.';

    if (propiedad) {
      mensaje +=
        '\n\nLa ficha de ejemplo que estaba explorando es:' +
        `\n${propiedad.nombre} (${propiedad.id})` +
        `\nZona ficticia: ${propiedad.zona}` +
        `\nSuperficie de muestra: ${numero(propiedad.metros)} m²` +
        '\n\nEntiendo que la propiedad es ficticia. ' +
        'Quiero información sobre el desarrollo del sistema.';
    }

    return 'https://wa.me/522225354183?text=' +
      encodeURIComponent(mensaje);
  }

  function abrirDetalle(id) {
    const propiedad = estado.propiedades.find(
      registro => registro.id === id && registro.publicado
    );

    if (!propiedad) {
      avisar('La propiedad ya no está publicada.');
      return;
    }

    propiedadAbierta = propiedad;

    $('#detalle').innerHTML = `
      ${imagenHTML(propiedad, 'detalle-imagen')}

      <div class="detalle-cuerpo">
        <span class="etiqueta ${claseEstado(propiedad.estado)}">
          ${propiedad.estado}
        </span>

        <h2 id="titulo-detalle">
          ${escapar(propiedad.nombre)}
        </h2>

        <p class="zona">
          Zona ${propiedad.zona} · Referencia ${propiedad.id}
        </p>

        <div class="detalle-numeros">
          <div>
            <span>Precio total ficticio</span>
            <strong>${moneda(propiedad.precio)}</strong>
          </div>

          <div>
            <span>Superficie</span>
            <strong>${numero(propiedad.metros)} m²</strong>
          </div>

          <div>
            <span>Tipo de propiedad</span>
            <strong>${propiedad.tipo}</strong>
          </div>
        </div>

        <h3>Un vistazo a sus posibilidades</h3>

        <p class="descripcion">${escapar(propiedad.descripcion)}</p>

        <div class="ubicacion-demo">
          <strong>Ubicación de demostración: zona ${propiedad.zona}</strong>
          <p>
            Esta propiedad es ficticia y no tiene una dirección real.
            Una implementación para tu negocio puede incorporar
            mapas y ubicaciones de tus propiedades.
          </p>
        </div>

        <p class="letra-pequena">
          Imagen ilustrativa. Esta ficha no es una oferta de venta,
          avalúo ni comprobante de propiedad.
        </p>

        <a
          class="boton contactar-detalle"
          href="${enlaceWhatsApp(propiedad)}"
          target="_blank"
          rel="noopener"
          style="margin-top: 22px"
        >
          Quiero un sistema como este ↗
        </a>
      </div>
    `;

    $('#modal-propiedad').showModal();
  }

  function fichaTexto(propiedad) {
    return [
      'HORIZONTE · DEMO INMOBILIARIA DE KING LAND',
      '',
      `${propiedad.nombre} · ${propiedad.id}`,
      `Estado: ${propiedad.estado}`,
      `Zona ficticia: ${propiedad.zona}`,
      `Tipo: ${propiedad.tipo}`,
      `Superficie: ${numero(propiedad.metros)} m²`,
      `Precio total de muestra: ${moneda(propiedad.precio)} MXN`,
      '',
      propiedad.descripcion,
      '',
      'Propiedad y ubicación ficticias.',
      'Esta ficha no representa una oferta de venta.',
      '',
      '¿Quieres un catálogo inmobiliario para tu negocio?',
      'King Land · WhatsApp: +52 222 535 4183'
    ].join('\n');
  }

  function descargar(contenido, nombre, tipo) {
    const archivo = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = nombre;

    document.body.append(enlace);

    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function mostrarAdmin(mostrar = true) {
    $('#administracion').hidden = !mostrar;

    if (mostrar) {
      pintarAdmin();

      $('#administracion').scrollIntoView({
        block: 'start'
      });
    } else {
      $('#catalogo').scrollIntoView({
        block: 'start'
      });
    }
  }

  function pintarAdmin() {
    const propiedades = estado.propiedades;

    const datos = [
      ['Registradas', propiedades.length],
      [
        'Publicadas',
        propiedades.filter(propiedad => propiedad.publicado).length
      ],
      [
        'Disponibles publicadas',
        propiedades.filter(
          propiedad =>
            propiedad.publicado &&
            propiedad.estado === 'Disponible'
        ).length
      ],
      [
        'Ocultas',
        propiedades.filter(propiedad => !propiedad.publicado).length
      ]
    ];

    $('#estadisticas').innerHTML = datos.map(([titulo, valor]) => `
      <article>
        <span>${titulo}</span>
        <strong>${valor}</strong>
      </article>
    `).join('');

    $('#lista-admin').innerHTML = propiedades.length
      ? propiedades.map(propiedad => `
        <article class="item-admin">
          <h4>${escapar(propiedad.nombre)}</h4>

          <p>
            ${propiedad.id} · ${propiedad.zona} ·
            ${numero(propiedad.metros)} m² ·
            ${moneda(propiedad.precio)}
          </p>

          <span class="etiqueta ${claseEstado(propiedad.estado)}">
            ${propiedad.estado}
          </span>

          <span class="etiqueta">
            ${propiedad.publicado ? 'Publicada' : 'Oculta'}
          </span>

          <div class="acciones">
            <button
              type="button"
              data-editar="${propiedad.id}"
            >
              Editar
            </button>

            <button
              type="button"
              data-publicar="${propiedad.id}"
            >
              ${propiedad.publicado ? 'Ocultar' : 'Publicar'}
            </button>

            <button
              type="button"
              class="eliminar"
              data-eliminar="${propiedad.id}"
            >
              Eliminar
            </button>
          </div>
        </article>
      `).join('')
      : '<p>No hay propiedades. Agrega una desde el editor.</p>';
  }

  function limpiarEditor() {
    $('#form-propiedad').reset();

    $('#form-propiedad').elements.namedItem('id').value = '';

    $('#titulo-editor').textContent =
      'Agregar propiedad ficticia';

    $('#error-editor').textContent = '';
  }

  function editarPropiedad(id) {
    const propiedad = estado.propiedades.find(
      registro => registro.id === id
    );

    if (!propiedad) {
      return;
    }

    const form = $('#form-propiedad');

    for (const campo of [
      'id',
      'nombre',
      'zona',
      'tipo',
      'estado',
      'imagen',
      'descripcion'
    ]) {
      form.elements.namedItem(campo).value = propiedad[campo];
    }

    form.elements.namedItem('precio').value =
      (propiedad.precio / 100).toFixed(2);

    form.elements.namedItem('metros').value =
      propiedad.metros;

    form.elements.namedItem('publicado').checked =
      propiedad.publicado;

    $('#titulo-editor').textContent =
      `Editar ${propiedad.id}`;

    $('#error-editor').textContent = '';

    form.scrollIntoView({ block: 'start' });
    form.elements.namedItem('nombre').focus({
      preventScroll: true
    });
  }

  function guardarPropiedad(evento) {
    evento.preventDefault();

    const form = evento.currentTarget;
    const datos = new FormData(form);

    try {
      const idExistente = String(datos.get('id') || '');

      if (
        idExistente &&
        !estado.propiedades.some(
          propiedad => propiedad.id === idExistente
        )
      ) {
        throw Error(
          'La propiedad ya no existe. Limpia el editor e inténtalo de nuevo.'
        );
      }

      if (!idExistente && estado.propiedades.length >= 30) {
        throw Error('La demo admite hasta 30 propiedades.');
      }

      const propiedad = {
        id: idExistente || (
          'T' +
          Date.now().toString(36) +
          Math.random().toString(36).slice(2, 8)
        ),
        nombre: String(datos.get('nombre') || '').trim(),
        zona: String(datos.get('zona') || ''),
        tipo: String(datos.get('tipo') || ''),
        precio: dinero(datos.get('precio')),
        metros: superficie(datos.get('metros')),
        estado: String(datos.get('estado') || ''),
        imagen: String(datos.get('imagen') || ''),
        descripcion: String(
          datos.get('descripcion') || ''
        ).trim(),
        publicado: datos.has('publicado')
      };

      if (!propiedadValida(propiedad)) {
        throw Error(
          'Revisa el nombre, la descripción y los valores seleccionados.'
        );
      }

      if (idExistente) {
        estado.propiedades = estado.propiedades.map(
          registro =>
            registro.id === idExistente
              ? propiedad
              : registro
        );
      } else {
        estado.propiedades.push(propiedad);
      }

      confirmarCambio(
        idExistente
          ? 'Propiedad actualizada.'
          : 'Propiedad ficticia agregada.'
      );

      limpiarEditor();
      pintarAdmin();
      pintarCatalogo();
    } catch (error) {
      $('#error-editor').textContent = error.message;
    }
  }

  function publicarPropiedad(id) {
    const propiedad = estado.propiedades.find(
      registro => registro.id === id
    );

    if (!propiedad) {
      return;
    }

    propiedad.publicado = !propiedad.publicado;

    confirmarCambio(
      propiedad.publicado
        ? 'Propiedad publicada en el catálogo.'
        : 'Propiedad oculta del catálogo.'
    );

    if (
      $('#form-propiedad').elements.namedItem('id').value === id
    ) {
      $('#form-propiedad')
        .elements.namedItem('publicado').checked =
          propiedad.publicado;
    }

    pintarAdmin();
    pintarCatalogo();
  }

  function eliminarPropiedad(id) {
    const propiedad = estado.propiedades.find(
      registro => registro.id === id
    );

    if (!propiedad) {
      return;
    }

    if (!confirm(
      `¿Eliminar "${propiedad.nombre}" de esta demostración?`
    )) {
      return;
    }

    estado.propiedades = estado.propiedades.filter(
      registro => registro.id !== id
    );

    estado.favoritos = estado.favoritos.filter(
      favorito => favorito !== id
    );

    if (
      $('#form-propiedad').elements.namedItem('id').value === id
    ) {
      limpiarEditor();
    }

    confirmarCambio('Propiedad eliminada de la demo.');

    pintarAdmin();
    pintarCatalogo();
  }

  function exportarCSV() {
    const celda = valor => {
      let texto = String(valor);

      if (/^\s*[=+@-]/.test(texto)) {
        texto = "'" + texto;
      }

      return '"' + texto.replace(/"/g, '""') + '"';
    };

    const filas = [
      [
        'Referencia',
        'Nombre ficticio',
        'Zona ficticia',
        'Tipo',
        'Superficie m2',
        'Precio MXN',
        'Estado',
        'Publicada',
        'Descripción'
      ],
      ...estado.propiedades.map(propiedad => [
        propiedad.id,
        propiedad.nombre,
        propiedad.zona,
        propiedad.tipo,
        propiedad.metros,
        (propiedad.precio / 100).toFixed(2),
        propiedad.estado,
        propiedad.publicado ? 'Sí' : 'No',
        propiedad.descripcion
      ])
    ];

    const contenido = '\uFEFF' + filas.map(
      fila => fila.map(celda).join(',')
    ).join('\r\n');

    descargar(
      contenido,
      'catalogo-inmobiliario-demo.csv',
      'text/csv;charset=utf-8'
    );
  }

  document.addEventListener('error', evento => {
    if (evento.target instanceof HTMLImageElement) {
      evento.target.hidden = true;
    }
  }, true);

  document.querySelectorAll('img').forEach(imagen => {
    if (imagen.complete && imagen.naturalWidth === 0) {
      imagen.hidden = true;
    }
  });

  $('#selector-imagen').innerHTML = imagenes.map(imagen => `
    <option value="${imagen.archivo}">
      ${imagen.titulo}
    </option>
  `).join('');

  $('#cotizar').href = enlaceWhatsApp();

  $('#filtros').addEventListener('submit', evento => {
    evento.preventDefault();
  });

  $('#filtros').addEventListener('input', pintarCatalogo);
  $('#filtros').addEventListener('change', pintarCatalogo);

  $('#filtros').addEventListener('reset', () => {
    setTimeout(pintarCatalogo, 0);
  });

  $('#propiedades').addEventListener('click', evento => {
    const favorito = evento.target.closest('[data-favorito]');
    const detalle = evento.target.closest('[data-detalle]');

    if (favorito) {
      alternarFavorito(favorito.dataset.favorito);
    }

    if (detalle) {
      abrirDetalle(detalle.dataset.detalle);
    }
  });

  $('#lista-admin').addEventListener('click', evento => {
    const editar = evento.target.closest('[data-editar]');
    const publicar = evento.target.closest('[data-publicar]');
    const eliminar = evento.target.closest('[data-eliminar]');

    if (editar) {
      editarPropiedad(editar.dataset.editar);
    }

    if (publicar) {
      publicarPropiedad(publicar.dataset.publicar);
    }

    if (eliminar) {
      eliminarPropiedad(eliminar.dataset.eliminar);
    }
  });

  $('#ir-admin').addEventListener('click', () => {
    mostrarAdmin(true);
  });

  $('#cerrar-admin').addEventListener('click', () => {
    mostrarAdmin(false);
  });

  $('#form-propiedad').addEventListener(
    'submit',
    guardarPropiedad
  );

  $('#cancelar-edicion').addEventListener(
    'click',
    limpiarEditor
  );

  $('#exportar').addEventListener('click', exportarCSV);

  $('#cerrar-modal').addEventListener('click', () => {
    $('#modal-propiedad').close();
  });

  $('#descargar-ficha').addEventListener('click', () => {
    if (!propiedadAbierta) {
      return;
    }

    descargar(
      fichaTexto(propiedadAbierta),
      `ficha-${propiedadAbierta.id}.txt`,
      'text/plain;charset=utf-8'
    );
  });

  $('#imprimir-ficha').addEventListener('click', () => {
    window.print();
  });

  $('#restablecer').addEventListener('click', () => {
    const confirmado = confirm(
      '¿Restablecer la demostración? Se eliminarán tus cambios ' +
      'y favoritos de este navegador.'
    );

    if (!confirmado) {
      return;
    }

    estado = crearMuestra();

    $('#filtros').reset();

    limpiarEditor();
    pintarAdmin();
    pintarCatalogo();

    confirmarCambio('Catálogo de muestra restablecido.');
  });

  pintarCatalogo();
  pintarAdmin();

  if (avisoInicial) {
    avisar(avisoInicial);
  }
})();