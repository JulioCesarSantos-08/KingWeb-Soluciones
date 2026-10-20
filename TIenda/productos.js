(() => {
  const CLAVE = "kingland.tienda.demo.v2";

  const PRODUCTOS = [
    {
      id: "mochila",
      nombre: "Mochila urbana",
      categoria: "Accesorios",
      imagen: "mochila.png",
      precio: 90000,
      rebaja: 20,
      limite: 8,
      etiqueta: "Para todos los días",
      descripcion: "Una propuesta práctica para acompañar tu rutina. Explora cómo mostrar fotografías, descripción, precio y disponibilidad en tu tienda.",
      detalles: [
        "Compartimentos para organizar tus objetos",
        "Diseño para uso cotidiano",
        "Características ilustrativas del demo"
      ]
    },
    {
      id: "aceite",
      nombre: "Aceite de cocina",
      categoria: "Despensa",
      imagen: "aceite.png",
      precio: 12000,
      rebaja: 10,
      limite: 12,
      etiqueta: "Básicos del hogar",
      descripcion: "Un ejemplo de producto de consumo diario. Tu catálogo puede reunir diferentes categorías y promociones.",
      detalles: [
        "Presentación de ejemplo",
        "Venta por unidad",
        "Información ilustrativa"
      ]
    },
    {
      id: "zapatos",
      nombre: "Calzado casual",
      categoria: "Moda",
      imagen: "zapatos.png",
      precio: 110000,
      rebaja: 15,
      limite: 6,
      etiqueta: "Tu próximo favorito",
      descripcion: "Presenta tus colecciones con información clara. Las tallas, colores y variantes se pueden evaluar para un proyecto personalizado.",
      detalles: [
        "Modelo de muestra",
        "Precio por par",
        "Sin selección de tallas en este demo"
      ]
    },
    {
      id: "laptop",
      nombre: "Laptop de trabajo",
      categoria: "Tecnología",
      imagen: "laptop.png",
      precio: 1500000,
      rebaja: 12,
      limite: 3,
      etiqueta: "Selección destacada",
      descripcion: "Un producto de tecnología para mostrar cómo organizar fichas de artículos de mayor valor. Las especificaciones reales las define cada negocio.",
      detalles: [
        "Equipo ilustrativo",
        "Sin especificaciones comerciales verificadas",
        "Producto para compra simulada"
      ]
    },
    {
      id: "ventilador",
      nombre: "Ventilador de mesa",
      categoria: "Hogar",
      imagen: "ventilador.png",
      precio: 80000,
      rebaja: 0,
      limite: 0,
      etiqueta: "No disponible",
      descripcion: "Este artículo muestra cómo se presenta un producto agotado. Puedes guardarlo en favoritos mientras exploras el catálogo.",
      detalles: [
        "Ejemplo de producto agotado",
        "No se puede agregar al carrito",
        "Disponibilidad ficticia"
      ]
    },
    {
      id: "refresco",
      nombre: "Refresco",
      categoria: "Despensa",
      imagen: "coca-cola.png",
      precio: 3500,
      rebaja: 0,
      limite: 12,
      etiqueta: "Algo para acompañar",
      descripcion: "Ejemplo de una bebida dentro de un catálogo de despensa. Todos los importes de esta tienda son demostrativos.",
      detalles: [
        "Venta por unidad",
        "Presentación ilustrativa",
        "Sin entrega real"
      ]
    },
    {
      id: "playeras",
      nombre: "Playera casual",
      categoria: "Moda",
      imagen: "playeras.png",
      precio: 25000,
      rebaja: 20,
      limite: 10,
      etiqueta: "Estilo diario",
      descripcion: "Muestra tu línea de ropa con una presentación visual y fácil de recorrer desde el celular.",
      detalles: [
        "Una unidad por artículo",
        "Modelo de demostración",
        "Sin selección de tallas en este demo"
      ]
    },
    {
      id: "sarten",
      nombre: "Sartén para cocina",
      categoria: "Hogar",
      imagen: "sarten.png",
      precio: 40000,
      rebaja: 15,
      limite: 7,
      etiqueta: "Esenciales de cocina",
      descripcion: "Un ejemplo de artículo para el hogar con promoción visible, detalle y acceso directo al carrito.",
      detalles: [
        "Imagen de referencia",
        "Venta por unidad",
        "Características ilustrativas"
      ]
    },
    {
      id: "audifonos",
      nombre: "Audífonos",
      categoria: "Tecnología",
      imagen: "audifonos.png",
      precio: 50000,
      rebaja: 20,
      limite: 9,
      etiqueta: "Dale play a tu día",
      descripcion: "Una ficha de producto que permite consultar su información, guardarlo y comparar su precio antes de elegir.",
      detalles: [
        "Modelo de muestra",
        "Especificaciones por definir en un catálogo real",
        "Compra únicamente simulada"
      ]
    },
    {
      id: "celular",
      nombre: "Smartphone",
      categoria: "Tecnología",
      imagen: "celular.png",
      precio: 700000,
      rebaja: 10,
      limite: 4,
      etiqueta: "Conecta con lo que importa",
      descripcion: "Explora una experiencia de compra sencilla. Esta ficha no representa una oferta comercial de una marca o modelo específico.",
      detalles: [
        "Dispositivo ilustrativo",
        "Sin especificaciones técnicas verificadas",
        "Precio de demostración"
      ]
    }
  ];

  const porId = new Map(PRODUCTOS.map(p => [p.id, p]));

  const dinero = valor => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(valor / 100);
  };

  const precioFinal = p => {
    return Math.round(p.precio * (100 - p.rebaja) / 100);
  };

  const normalizar = texto => {
    return String(texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const escapar = texto => {
    return String(texto).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  };

  function normalizarCarrito(valor) {
    const limpio = {};

    if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
      return limpio;
    }

    for (const p of PRODUCTOS) {
      const cantidad = Number(valor[p.id]);

      if (
        Number.isInteger(cantidad) &&
        cantidad > 0 &&
        p.limite > 0
      ) {
        limpio[p.id] = Math.min(cantidad, p.limite);
      }
    }

    return limpio;
  }

  function calcular(lineas, cupon, entrega) {
    const original = lineas.reduce(
      (suma, linea) => suma + linea.original * linea.cantidad,
      0
    );

    const subtotal = lineas.reduce(
      (suma, linea) => suma + linea.precio * linea.cantidad,
      0
    );

    const descuento = cupon === "KING10"
      ? Math.round(subtotal * 0.10)
      : 0;

    const base = subtotal - descuento;

    const envio =
      lineas.length &&
      entrega === "envio" &&
      base < 150000
        ? 9900
        : 0;

    return {
      original,
      subtotal,
      ahorro: original - subtotal,
      descuento,
      envio,
      total: base + envio
    };
  }

  const $ = selector => document.querySelector(selector);

  let estado = {
    carrito: {},
    favoritos: [],
    recibos: []
  };

  let categoria = "Todas";
  let soloFavoritos = false;
  let cupon = "";
  let ultimoFoco = null;
  let reciboActual = null;
  let temporizador;
  let almacenamientoDisponible = true;

  try {
    const guardado = JSON.parse(
      localStorage.getItem(CLAVE) || "null"
    );

    if (guardado && typeof guardado === "object") {
      estado.carrito = normalizarCarrito(guardado.carrito);

      estado.favoritos = Array.isArray(guardado.favoritos)
        ? [...new Set(guardado.favoritos.filter(id => porId.has(id)))]
        : [];

      estado.recibos = Array.isArray(guardado.recibos)
        ? guardado.recibos.filter(reciboValido).slice(0, 20)
        : [];
    }
  } catch {
    almacenamientoDisponible = false;
  }

  function reciboValido(r) {
    if (
      !r ||
      typeof r.id !== "string" ||
      !Number.isFinite(r.fecha) ||
      !["retiro", "envio"].includes(r.entrega) ||
      ![
        "Tarjeta simulada",
        "Transferencia simulada",
        "Efectivo simulado"
      ].includes(r.pago)
    ) {
      return false;
    }

    if (
      !Array.isArray(r.lineas) ||
      !r.lineas.length ||
      r.lineas.length > PRODUCTOS.length
    ) {
      return false;
    }

    const lineasValidas = r.lineas.every(l =>
      l &&
      porId.has(l.id) &&
      typeof l.nombre === "string" &&
      Number.isInteger(l.cantidad) &&
      l.cantidad > 0 &&
      l.cantidad <= 12 &&
      Number.isInteger(l.precio) &&
      l.precio >= 0 &&
      Number.isInteger(l.original) &&
      l.original >= l.precio
    );

    if (!lineasValidas) return false;
    if (r.cupon !== "" && r.cupon !== "KING10") return false;

    const t = calcular(r.lineas, r.cupon, r.entrega);

    return r.totales &&
      Object.keys(t).every(k => r.totales[k] === t[k]);
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
      almacenamientoDisponible = true;
    } catch {
      almacenamientoDisponible = false;
    }

    $("#aviso-local").hidden = almacenamientoDisponible;
  }

  function avisar(texto) {
    const aviso = $("#notificacion");

    aviso.textContent = texto;
    aviso.classList.add("visible");

    clearTimeout(temporizador);

    temporizador = setTimeout(() => {
      aviso.classList.remove("visible");
    }, 3200);
  }

  function lineasCarrito() {
    return Object.entries(estado.carrito).map(([id, cantidad]) => {
      const p = porId.get(id);

      return {
        id,
        nombre: p.nombre,
        cantidad,
        precio: precioFinal(p),
        original: p.precio
      };
    });
  }

  function imagen(p, clase = "") {
    return `
      <img
        class="${clase}"
        src="../imagenes/${p.imagen}"
        alt="${escapar(p.nombre)}"
        loading="lazy"
        width="300"
        height="260"
      >
    `;
  }

  function renderCatalogo() {
    const consulta = normalizar($("#buscar").value.trim());

    let lista = PRODUCTOS.filter(p =>
      (categoria === "Todas" || p.categoria === categoria) &&
      (!soloFavoritos || estado.favoritos.includes(p.id)) &&
      (!$("#solo-ofertas").checked || p.rebaja > 0) &&
      normalizar(
        `${p.nombre} ${p.categoria} ${p.descripcion}`
      ).includes(consulta)
    );

    const orden = $("#ordenar").value;

    if (orden === "menor") {
      lista.sort((a, b) => precioFinal(a) - precioFinal(b));
    }

    if (orden === "mayor") {
      lista.sort((a, b) => precioFinal(b) - precioFinal(a));
    }

    if (orden === "nombre") {
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }

    if (orden === "descuento") {
      lista.sort((a, b) => b.rebaja - a.rebaja);
    }

    $("#resultado").textContent =
      `${lista.length} ${
        lista.length === 1 ? "producto" : "productos"
      }${soloFavoritos ? " en favoritos" : " para explorar"}`;

    $("#sin-resultados").hidden = lista.length > 0;

    $("#productos").innerHTML = lista.map(p => {
      const favorito = estado.favoritos.includes(p.id);
      const llena = (estado.carrito[p.id] || 0) >= p.limite;

      return `
        <article class="producto">
          <div class="producto-imagen">
            <button
              class="ver-imagen"
              data-accion="detalle"
              data-id="${p.id}"
              aria-label="Ver detalles de ${escapar(p.nombre)}"
            >
              ${imagen(p)}
            </button>

            <span class="insignia ${!p.limite ? "agotado" : ""}">
              ${
                !p.limite
                  ? "Agotado"
                  : p.rebaja
                    ? `−${p.rebaja}%`
                    : "Selección"
              }
            </span>

            <button
              class="favorito ${favorito ? "activo" : ""}"
              data-accion="favorito"
              data-id="${p.id}"
              aria-pressed="${favorito}"
              aria-label="${
                favorito ? "Quitar de" : "Guardar en"
              } favoritos: ${escapar(p.nombre)}"
            >
              ${favorito ? "♥" : "♡"}
            </button>
          </div>

          <div class="producto-info">
            <small>${p.categoria}</small>

            <h3>
              <button data-accion="detalle" data-id="${p.id}">
                ${p.nombre}
              </button>
            </h3>

            <p>${p.etiqueta}</p>

            <div class="precio">
              <strong>${dinero(precioFinal(p))}</strong>
              ${p.rebaja ? `<del>${dinero(p.precio)}</del>` : ""}
            </div>

            <button
              class="boton agregar"
              data-accion="agregar"
              data-id="${p.id}"
              ${llena ? "disabled" : ""}
            >
              ${
                !p.limite
                  ? "No disponible"
                  : llena
                    ? "Límite en carrito"
                    : "Agregar al carrito"
              }
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </article>
      `;
    }).join("");

    $("#favoritos-contador").textContent =
      estado.favoritos.length;

    $("#ver-favoritos").setAttribute(
      "aria-pressed",
      String(soloFavoritos)
    );
  }

  function actualizarContadores() {
    const lineas = lineasCarrito();

    const cantidad = lineas.reduce(
      (suma, linea) => suma + linea.cantidad,
      0
    );

    const t = calcular(lineas, cupon, "retiro");

    $("#carrito-contador").textContent = cantidad;
    $("#carrito-contador-movil").textContent = cantidad;
    $("#total-movil").textContent = dinero(t.total);
  }

  function agregar(id) {
    const p = porId.get(id);

    if (!p || (estado.carrito[id] || 0) >= p.limite) {
      return;
    }

    estado.carrito[id] = (estado.carrito[id] || 0) + 1;

    guardar();
    actualizarContadores();
    renderCatalogo();

    if ($("#detalle").open) {
      renderDetalle(id);
    }

    avisar(`${p.nombre} agregado al carrito.`);
  }

  function abrir(id, conservarFoco = false) {
    if (!conservarFoco) {
      ultimoFoco = document.activeElement;
    }

    document.querySelectorAll("dialog[open]").forEach(d => {
      d.dataset.transicion = "true";
      d.close();
    });

    const dialogo = document.getElementById(id);

    dialogo.showModal();
    document.body.classList.add("modal-abierto");

    const titulo = dialogo.querySelector('[tabindex="-1"]');

    titulo?.focus({ preventScroll: true });
  }

  document.querySelectorAll("dialog").forEach(d => {
    d.addEventListener("close", () => {
      if (d.dataset.transicion === "true") {
        delete d.dataset.transicion;
        return;
      }

      if (!document.querySelector("dialog[open]")) {
        document.body.classList.remove("modal-abierto");

        if (ultimoFoco?.isConnected) {
          ultimoFoco.focus();
        } else {
          $("#abrir-carrito").focus();
        }
      }
    });

    d.addEventListener("click", e => {
      if (e.target !== d) return;

      const r = d.getBoundingClientRect();

      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        d.close();
      }
    });
  });

  function renderDetalle(id) {
    const p = porId.get(id);

    if (!p) return;

    $("#detalle-titulo").textContent = p.nombre;

    $("#detalle-cuerpo").innerHTML = `
      <div class="detalle-imagen">
        ${imagen(p)}
      </div>

      <div class="detalle-texto">
        <span class="eyebrow">
          ${p.categoria} · Producto de muestra
        </span>

        <p>${p.descripcion}</p>

        <ul>
          ${p.detalles.map(d => `<li>${escapar(d)}</li>`).join("")}
        </ul>

        <div class="precio grande">
          <strong>${dinero(precioFinal(p))}</strong>
          ${p.rebaja ? `<del>${dinero(p.precio)}</del>` : ""}
        </div>

        <small>
          ${
            p.limite
              ? `Límite de prueba: ${p.limite} unidades por pedido.`
              : "Agotado en esta demostración."
          }
        </small>

        <button
          class="boton"
          data-accion="agregar"
          data-id="${p.id}"
          ${(estado.carrito[id] || 0) >= p.limite ? "disabled" : ""}
        >
          ${
            !p.limite
              ? "No disponible"
              : (estado.carrito[id] || 0) >= p.limite
                ? "Límite en carrito"
                : "Agregar al carrito"
          }
        </button>

        <button class="boton secundario" data-accion="carrito">
          Ver mi carrito →
        </button>
      </div>
    `;
  }

  function filasTotales(t, modo = false) {
    return `
      <div>
        <span>Productos</span>
        <b>${dinero(t.subtotal)}</b>
      </div>

      ${
        t.ahorro
          ? `<p class="ahorro">
               Ya ahorraste ${dinero(t.ahorro)} con las ofertas.
             </p>`
          : ""
      }

      ${
        t.descuento
          ? `<div class="ahorro">
               <span>Cupón KING10</span>
               <b>−${dinero(t.descuento)}</b>
             </div>`
          : ""
      }

      <div>
        <span>Entrega${modo ? "" : " estimada"}</span>
        <b>${t.envio ? dinero(t.envio) : "Sin costo"}</b>
      </div>

      <div class="total-final">
        <span>Total simulado</span>
        <strong>${dinero(t.total)}</strong>
      </div>

      <small>
        Importes de demostración en MXN.
        No se realizará ningún cobro.
      </small>
    `;
  }

  function renderCarrito(foco) {
    const lineas = lineasCarrito();

    $("#carrito-vacio").hidden = lineas.length > 0;
    $("#carrito-contenido").hidden = !lineas.length;

    $("#carrito-lista").innerHTML = lineas.map(l => {
      const p = porId.get(l.id);

      return `
        <article class="linea-carrito">
          ${imagen(p)}

          <div>
            <h3>${p.nombre}</h3>
            <p>${dinero(l.precio)} por unidad</p>

            <div class="cantidad">
              <button
                data-accion="menos"
                data-id="${p.id}"
                aria-label="Reducir cantidad de ${p.nombre}"
              >−</button>

              <span aria-label="Cantidad">${l.cantidad}</span>

              <button
                data-accion="mas"
                data-id="${p.id}"
                aria-label="Aumentar cantidad de ${p.nombre}"
                ${l.cantidad >= p.limite ? "disabled" : ""}
              >+</button>
            </div>
          </div>

          <div class="linea-precio">
            <strong>${dinero(l.precio * l.cantidad)}</strong>

            <button
              class="texto-boton"
              data-accion="quitar"
              data-id="${p.id}"
              aria-label="Quitar ${p.nombre}"
            >
              Quitar
            </button>
          </div>
        </article>
      `;
    }).join("");

    $("#carrito-totales").innerHTML = filasTotales(
      calcular(lineas, cupon, "retiro")
    );

    $("#cupon").value = cupon;

    $("#estado-cupon").textContent = cupon
      ? "KING10 aplicado: 10% adicional sobre los productos."
      : "Prueba KING10 y obtén 10% adicional.";

    $("#quitar-cupon").hidden = !cupon;

    actualizarContadores();

    if (foco) {
      const siguiente = $("#carrito-lista").querySelector(
        `[data-accion="${foco.accion}"][data-id="${foco.id}"]:not(:disabled)`
      );

      (siguiente || $("#carrito-titulo")).focus({
        preventScroll: true
      });
    }
  }

  function renderCheckout() {
    const lineas = lineasCarrito();

    if (!lineas.length) return;

    const entrega = $("#entrega").value;

    $("#checkout-items").textContent =
      `${lineas.reduce((s, l) => s + l.cantidad, 0)} artículos · ${
        lineas.length
      } productos diferentes`;

    $("#checkout-totales").innerHTML = filasTotales(
      calcular(lineas, cupon, entrega),
      true
    );
  }

  function mostrarRecibo(r, conservar = false) {
    reciboActual = r;

    const fecha = new Date(r.fecha).toLocaleString("es-MX");

    $("#recibo-cuerpo").innerHTML = `
      <div class="recibo-marca">
        <span class="eyebrow">ESTUDIO MARKET</span>
        <h3>Tu compra de prueba está lista.</h3>
        <p>DEMOSTRACIÓN · SIN VALIDEZ FISCAL · SIN COBRO</p>
      </div>

      <dl class="recibo-datos">
        <div>
          <dt>Folio</dt>
          <dd>${escapar(r.id)}</dd>
        </div>

        <div>
          <dt>Fecha</dt>
          <dd>${escapar(fecha)}</dd>
        </div>

        <div>
          <dt>Cliente</dt>
          <dd>Visitante de demostración</dd>
        </div>

        <div>
          <dt>Entrega</dt>
          <dd>${
            r.entrega === "envio"
              ? "Envío simulado"
              : "Retiro simulado"
          }</dd>
        </div>

        <div>
          <dt>Pago</dt>
          <dd>${escapar(r.pago)}</dd>
        </div>
      </dl>

      <div class="recibo-items">
        ${r.lineas.map(l => `
          <div>
            <span>
              ${escapar(l.nombre)}
              <small>${l.cantidad} × ${dinero(l.precio)}</small>
            </span>

            <b>${dinero(l.cantidad * l.precio)}</b>
          </div>
        `).join("")}
      </div>

      <div class="totales">
        ${filasTotales(r.totales, true)}
      </div>
    `;

    abrir("recibo", conservar);
  }

  function renderHistorial() {
    $("#historial-lista").innerHTML = estado.recibos.length
      ? estado.recibos.map((r, i) => `
          <button
            class="historial-item"
            data-accion="recibo"
            data-indice="${i}"
          >
            <span>
              <b>${escapar(r.id)}</b>
              <small>${
                escapar(new Date(r.fecha).toLocaleString("es-MX"))
              }</small>
            </span>

            <span>
              <b>${dinero(r.totales.total)}</b>
              <small>Ver recibo ↗</small>
            </span>
          </button>
        `).join("")
      : `
        <div class="vacio">
          <span>▤</span>
          <h3>Aún no hay compras de prueba</h3>
          <p>Completa una compra simulada para explorar un recibo.</p>
        </div>
      `;
  }

  function descargarRecibo() {
    if (!reciboActual) return;

    const r = reciboActual;

    const texto = [
      "ESTUDIO MARKET — DEMO KING LAND",
      "SIN VALIDEZ FISCAL · SIN COBRO",
      `Folio: ${r.id}`,
      `Fecha: ${new Date(r.fecha).toLocaleString("es-MX")}`,
      "Cliente: Visitante de demostración",
      "",
      ...r.lineas.map(l =>
        `${l.cantidad} x ${l.nombre} — ${
          dinero(l.precio)
        } c/u — ${dinero(l.precio * l.cantidad)}`
      ),
      "",
      `Productos: ${dinero(r.totales.subtotal)}`,
      `Ahorro en ofertas: ${dinero(r.totales.ahorro)}`,
      `Cupón: -${dinero(r.totales.descuento)}`,
      `Entrega: ${dinero(r.totales.envio)}`,
      `TOTAL SIMULADO: ${dinero(r.totales.total)}`,
      `Pago: ${r.pago}`,
      `Entrega: ${
        r.entrega === "envio"
          ? "Envío simulado"
          : "Retiro simulado"
      }`,
      "",
      "No se generó un pedido real."
    ].join("\n");

    const url = URL.createObjectURL(
      new Blob([texto], {
        type: "text/plain;charset=utf-8"
      })
    );

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "recibo-demo-kingland.txt";

    document.body.append(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-accion]");

    if (!b || b.disabled) return;

    const { accion, id } = b.dataset;

    if (accion === "cerrar") {
      b.closest("dialog")?.close();
    }

    if (accion === "detalle" && porId.has(id)) {
      renderDetalle(id);
      abrir("detalle");
    }

    if (accion === "agregar") {
      agregar(id);
    }

    if (accion === "favorito" && porId.has(id)) {
      estado.favoritos = estado.favoritos.includes(id)
        ? estado.favoritos.filter(x => x !== id)
        : [...estado.favoritos, id];

      guardar();
      renderCatalogo();

      const siguiente = $("#productos").querySelector(
        `[data-accion="favorito"][data-id="${id}"]`
      );

      (siguiente || $("#ver-favoritos")).focus({
        preventScroll: true
      });
    }

    if (accion === "carrito") {
      renderCarrito();

      abrir(
        "carrito",
        Boolean(document.querySelector("dialog[open]"))
      );
    }

    if (
      ["menos", "mas", "quitar"].includes(accion) &&
      estado.carrito[id]
    ) {
      if (accion === "quitar") {
        delete estado.carrito[id];
      }

      if (accion === "menos") {
        estado.carrito[id]--;

        if (!estado.carrito[id]) {
          delete estado.carrito[id];
        }
      }

      if (accion === "mas") {
        estado.carrito[id] = Math.min(
          estado.carrito[id] + 1,
          porId.get(id).limite
        );
      }

      guardar();
      renderCatalogo();
      renderCarrito({ accion, id });
    }

    if (accion === "historial") {
      renderHistorial();
      abrir("historial");
    }

    if (accion === "recibo") {
      const r = estado.recibos[Number(b.dataset.indice)];

      if (r) {
        mostrarRecibo(r, true);
      }
    }
  });

  document.querySelectorAll("[data-categoria]").forEach(b => {
    b.addEventListener("click", () => {
      categoria = b.dataset.categoria;

      document.querySelectorAll("[data-categoria]").forEach(x => {
        x.setAttribute("aria-pressed", String(x === b));
      });

      renderCatalogo();
    });
  });

  $("#buscar").addEventListener("input", renderCatalogo);
  $("#ordenar").addEventListener("change", renderCatalogo);
  $("#solo-ofertas").addEventListener("change", renderCatalogo);

  $("#ver-favoritos").addEventListener("click", () => {
    soloFavoritos = !soloFavoritos;
    renderCatalogo();

    $("#catalogo").scrollIntoView({
      behavior: "auto"
    });
  });

  $("#limpiar-filtros").addEventListener("click", () => {
    categoria = "Todas";
    soloFavoritos = false;

    $("#buscar").value = "";
    $("#solo-ofertas").checked = false;
    $("#ordenar").value = "destacados";

    document.querySelectorAll("[data-categoria]").forEach(b => {
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.categoria === "Todas")
      );
    });

    renderCatalogo();
    $("#buscar").focus();
  });

  $("#form-cupon").addEventListener("submit", e => {
    e.preventDefault();

    const codigo = $("#cupon").value.trim().toUpperCase();

    if (codigo !== "KING10") {
      $("#estado-cupon").textContent =
        "Código no válido. El cupón de demostración es KING10.";

      return;
    }

    cupon = codigo;
    renderCarrito();
  });

  $("#quitar-cupon").addEventListener("click", () => {
    cupon = "";
    renderCarrito();
    $("#cupon").focus();
  });

  $("#ir-checkout").addEventListener("click", () => {
    if (!lineasCarrito().length) return;

    $("#entrega").value = "retiro";
    $("#pago").value = "Tarjeta simulada";

    renderCheckout();
    abrir("checkout", true);
  });

  $("#entrega").addEventListener("change", renderCheckout);

  $("#form-checkout").addEventListener("submit", e => {
    e.preventDefault();

    const lineas = lineasCarrito();

    if (!lineas.length) return;

    const entrega = $("#entrega").value;
    const pago = $("#pago").value;

    if (
      !["retiro", "envio"].includes(entrega) ||
      ![
        "Tarjeta simulada",
        "Transferencia simulada",
        "Efectivo simulado"
      ].includes(pago)
    ) {
      return;
    }

    const fecha = Date.now();

    const r = {
      id: `DEMO-${fecha.toString(36).toUpperCase()}-${
        Math.random().toString(36).slice(2, 6).toUpperCase()
      }`,
      fecha,
      lineas,
      cupon,
      entrega,
      pago,
      totales: calcular(lineas, cupon, entrega)
    };

    estado.recibos.unshift(r);
    estado.recibos = estado.recibos.slice(0, 20);
    estado.carrito = {};
    cupon = "";

    guardar();
    renderCatalogo();
    actualizarContadores();
    mostrarRecibo(r, true);
  });

  $("#descargar-recibo").addEventListener(
    "click",
    descargarRecibo
  );

  $("#imprimir-recibo").addEventListener("click", () => {
    window.print();
  });

  $("#reiniciar-demo").addEventListener("click", () => {
    const confirmado = window.confirm(
      "¿Borrar el carrito, los favoritos y los recibos de prueba de este navegador?"
    );

    if (!confirmado) return;

    estado = {
      carrito: {},
      favoritos: [],
      recibos: []
    };

    cupon = "";
    reciboActual = null;
    soloFavoritos = false;

    guardar();
    renderCatalogo();
    actualizarContadores();
    avisar("Demostración reiniciada.");
  });

  document.addEventListener("error", e => {
    if (e.target instanceof HTMLImageElement) {
      e.target.hidden = true;

      const aviso = document.createElement("span");
      aviso.className = "imagen-fallback";
      aviso.textContent = "Imagen de muestra";

      e.target.after(aviso);
    }
  }, true);

  $("#aviso-local").hidden = almacenamientoDisponible;

  renderCatalogo();
  actualizarContadores();
})();