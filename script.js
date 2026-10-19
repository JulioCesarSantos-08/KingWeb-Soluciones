(() => {
  const menuBoton = document.getElementById("menu-boton");
  const navegacion = document.getElementById("navegacion");
  const filtros = document.querySelectorAll("[data-filtro]");
  const proyectos = document.querySelectorAll("[data-categoria]");
  const resultado = document.getElementById("resultado-filtro");
  const anio = document.getElementById("anio");

  if (menuBoton && navegacion) {
    const cerrarMenu = () => {
      navegacion.classList.remove("abierta");
      menuBoton.setAttribute("aria-expanded", "false");
      menuBoton.setAttribute("aria-label", "Abrir menú");
      menuBoton.textContent = "☰";
    };

    menuBoton.addEventListener("click", () => {
      const abierto = navegacion.classList.toggle("abierta");

      menuBoton.setAttribute("aria-expanded", String(abierto));

      menuBoton.setAttribute(
        "aria-label",
        abierto ? "Cerrar menú" : "Abrir menú"
      );

      menuBoton.textContent = abierto ? "×" : "☰";
    });

    navegacion.querySelectorAll("a").forEach((enlace) => {
      enlace.addEventListener("click", cerrarMenu);
    });

    document.addEventListener("keydown", (evento) => {
      if (
        evento.key === "Escape" &&
        navegacion.classList.contains("abierta")
      ) {
        cerrarMenu();
        menuBoton.focus();
      }
    });

    document.addEventListener("click", (evento) => {
      if (
        navegacion.classList.contains("abierta") &&
        !navegacion.contains(evento.target) &&
        !menuBoton.contains(evento.target)
      ) {
        cerrarMenu();
      }
    });
  }

  filtros.forEach((boton) => {
    boton.addEventListener("click", () => {
      const categoria = boton.dataset.filtro;
      let visibles = 0;

      filtros.forEach((filtro) => {
        const activo = filtro === boton;

        filtro.classList.toggle("activo", activo);
        filtro.setAttribute("aria-pressed", String(activo));
      });

      proyectos.forEach((proyecto) => {
        const visible =
          categoria === "todos" ||
          proyecto.dataset.categoria === categoria;

        proyecto.hidden = !visible;

        if (visible) {
          visibles += 1;
        }
      });

      if (resultado) {
        resultado.textContent =
          `${visibles} ${
            visibles === 1 ? "demo disponible" : "demos disponibles"
          } para explorar.`;
      }
    });
  });

  if (anio) {
    anio.textContent = new Date().getFullYear();
  }

  const lanzador = document.getElementById("contacto-flotante");

  if (!lanzador || typeof HTMLDialogElement === "undefined") {
    return;
  }

  const base = new URL("./", document.baseURI);
  const rutaDatos = new URL("assets/asistente.json", base);
  const rutaEstilos = new URL("assets/asistente.css", base);

  function cargarEstilos() {
    return new Promise((resolve, reject) => {
      const enlace = document.createElement("link");

      enlace.rel = "stylesheet";
      enlace.href = rutaEstilos.href;

      const tiempo = window.setTimeout(() => {
        terminar(new Error("Tiempo de carga de estilos agotado."));
      }, 10000);

      function terminar(error) {
        window.clearTimeout(tiempo);

        enlace.onload = null;
        enlace.onerror = null;

        if (error) {
          enlace.remove();
          reject(error);
        } else {
          resolve();
        }
      }

      enlace.onload = () => terminar();

      enlace.onerror = () => {
        terminar(new Error("No se encontró assets/asistente.css."));
      };

      document.head.append(enlace);
    });
  }

  async function cargarDatos() {
    const controlador = new AbortController();

    const tiempo = window.setTimeout(() => {
      controlador.abort();
    }, 10000);

    try {
      const respuesta = await fetch(rutaDatos, {
        signal: controlador.signal
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo cargar assets/asistente.json.");
      }

      const datos = await respuesta.json();

      validarDatos(datos);

      return datos;
    } finally {
      window.clearTimeout(tiempo);
    }
  }

  function validarDatos(datos) {
    const secciones = [
      "asistente",
      "contacto",
      "navegacion",
      "inicio",
      "catalogo",
      "perfil",
      "cotizacion",
      "resumen"
    ];

    const listas = [
      "categorias",
      "proyectos",
      "servicios",
      "preguntas"
    ];

    if (!datos || secciones.some((clave) => !datos[clave])) {
      throw new Error("Faltan secciones en el JSON del asistente.");
    }

    if (listas.some((clave) => !Array.isArray(datos[clave]))) {
      throw new Error("El catálogo del asistente no es válido.");
    }

    if (!/^\d{10,15}$/.test(datos.contacto.whatsapp)) {
      throw new Error("El número de WhatsApp no es válido.");
    }

    const ids = new Set(
      datos.proyectos.map((proyecto) => proyecto.id)
    );

    if (ids.size !== datos.proyectos.length) {
      throw new Error("Hay proyectos duplicados en el JSON.");
    }

    for (const categoria of datos.categorias) {
      if (
        !Array.isArray(categoria.proyectos) ||
        categoria.proyectos.some((id) => !ids.has(id))
      ) {
        throw new Error(
          "Una categoría contiene un proyecto inexistente."
        );
      }
    }

    for (const proyecto of datos.proyectos) {
      if (
        !Array.isArray(proyecto.funciones_demo) ||
        !Array.isArray(proyecto.opciones_personalizables)
      ) {
        throw new Error("Faltan las funciones de un proyecto.");
      }
    }

    for (const clave of ["objetivo", "situacion", "plazo"]) {
      if (!Array.isArray(datos.perfil[clave]?.opciones)) {
        throw new Error("Faltan opciones del perfil.");
      }
    }

    if (
      !Array.isArray(datos.inicio.opciones) ||
      !Array.isArray(datos.catalogo.opciones_detalle)
    ) {
      throw new Error("Faltan opciones de navegación.");
    }
  }

  Promise.all([cargarDatos(), cargarEstilos()])
    .then(([datos]) => {
      iniciarAsistente(datos);
    })
    .catch((error) => {
      console.warn(
        "Asistente pendiente de cargar. WhatsApp sigue disponible.",
        error.message
      );
    });

  function iniciarAsistente(datos) {
    const nav = datos.navegacion;

    const catalogo = new Map(
      datos.proyectos.map((proyecto) => [
        proyecto.id,
        proyecto
      ])
    );

    const intereses = new Map();
    const preguntasConsultadas = new Set();
    const proyectosConsultados = new Set();
    const perfil = {};
    const historial = [];

    let vista = { tipo: "inicio" };
    let focoAnterior = lanzador;

    const maxProyectos = Math.max(
      1,
      Math.min(
        3,
        Number(datos.catalogo.limite_proyectos) || 3
      )
    );

    const maxFunciones = Math.max(
      1,
      Math.min(
        6,
        Number(datos.catalogo.limite_funciones_por_proyecto) || 6
      )
    );

    function elemento(etiqueta, clase, texto) {
      const nodo = document.createElement(etiqueta);

      if (clase) {
        nodo.className = clase;
      }

      if (texto !== undefined && texto !== null) {
        nodo.textContent = texto;
      }

      return nodo;
    }

    function boton(texto, accion, clase = "kl-opcion") {
      const nodo = elemento("button", clase, texto);

      nodo.type = "button";
      nodo.addEventListener("click", accion);

      return nodo;
    }

    const dialogo = elemento("dialog", "kl-chat");

    dialogo.id = "kl-asistente";
    dialogo.setAttribute("aria-labelledby", "kl-nombre");

    const cabecera = elemento("header", "kl-cabecera");
    const identidad = elemento("div", "kl-identidad");

    const nombre = elemento(
      "h2",
      "kl-nombre",
      datos.asistente.nombre
    );

    nombre.id = "kl-nombre";

    identidad.append(
      nombre,
      elemento(
        "p",
        "kl-subtitulo",
        datos.asistente.subtitulo
      )
    );

    const cerrar = boton(
      "×",
      () => dialogo.close(),
      "kl-cerrar"
    );

    cerrar.setAttribute("aria-label", nav.cerrar);
    cabecera.append(identidad, cerrar);

    const contenido = elemento("div", "kl-contenido");
    const titulo = elemento("h3", "kl-titulo");
    const cuerpo = elemento("div", "kl-cuerpo");
    const opciones = elemento("div", "kl-opciones");
    const aviso = elemento("p", "kl-aviso");

    titulo.tabIndex = -1;
    aviso.setAttribute("role", "status");

    contenido.append(
      titulo,
      cuerpo,
      aviso,
      opciones
    );

    const navegacionChat = elemento(
      "nav",
      "kl-navegacion"
    );

    navegacionChat.setAttribute(
      "aria-label",
      "Navegación del asistente"
    );

    const volver = boton(
      nav.volver,
      () => {
        if (historial.length) {
          vista = historial.pop();
          pintar();
        }
      },
      "kl-enlace"
    );

    const inicio = boton(
      nav.inicio,
      () => ir("inicio"),
      "kl-enlace"
    );

    const resumen = boton(
      nav.ver_resumen,
      () => ir("resumen"),
      "kl-enlace"
    );

    navegacionChat.append(
      volver,
      inicio,
      resumen
    );

    const pie = elemento("footer", "kl-pie");

    const contacto = boton(
      datos.contacto.texto_boton,
      () => ir("resumen"),
      "kl-contacto"
    );

    const reiniciar = boton(
      nav.reiniciar,
      () => ir("reiniciar"),
      "kl-reiniciar"
    );

    pie.append(contacto, reiniciar);

    dialogo.append(
      cabecera,
      contenido,
      navegacionChat,
      pie
    );

    document.body.append(dialogo);

    lanzador.setAttribute("aria-haspopup", "dialog");
    lanzador.setAttribute("aria-controls", dialogo.id);
    lanzador.setAttribute("aria-expanded", "false");

    lanzador.setAttribute(
      "aria-label",
      "Abrir asistente King Land"
    );

    const textoLanzador = lanzador.querySelector(
      "span:last-child"
    );

    if (textoLanzador) {
      textoLanzador.textContent = "Encuentra tu solución";
    }

    lanzador.addEventListener("click", (evento) => {
      evento.preventDefault();
      focoAnterior = document.activeElement;

      if (!dialogo.open) {
        dialogo.showModal();
        lanzador.setAttribute("aria-expanded", "true");
        pintar();
      }
    });

    dialogo.addEventListener("close", () => {
      lanzador.setAttribute("aria-expanded", "false");

      if (focoAnterior instanceof HTMLElement) {
        focoAnterior.focus();
      }
    });

    dialogo.addEventListener("click", (evento) => {
      if (evento.target !== dialogo) {
        return;
      }

      const rect = dialogo.getBoundingClientRect();

      const fuera =
        evento.clientX < rect.left ||
        evento.clientX > rect.right ||
        evento.clientY < rect.top ||
        evento.clientY > rect.bottom;

      if (fuera) {
        dialogo.close();
      }
    });

    function ir(tipo, id, detalle) {
      historial.push({ ...vista });

      if (historial.length > 40) {
        historial.shift();
      }

      vista = { tipo, id, detalle };
      pintar();
    }

    function parrafo(texto, clase = "kl-texto") {
      if (texto) {
        cuerpo.append(
          elemento("p", clase, texto)
        );
      }
    }

    function lista(tituloLista, valores) {
      if (!valores?.length) {
        return;
      }

      cuerpo.append(
        elemento("h4", "kl-subseccion", tituloLista)
      );

      const ul = elemento("ul", "kl-lista");

      valores.forEach((valor) => {
        ul.append(elemento("li", "", valor));
      });

      cuerpo.append(ul);
    }

    function opcion(texto, accion) {
      opciones.append(boton(texto, accion));
    }

    function rutaDestino(destino) {
      ir(destino === "whatsapp" ? "resumen" : destino);
    }

    function demoSeguro(ruta) {
      if (!ruta) {
        return null;
      }

      try {
        const url = new URL(ruta, base);

        const permitido =
          url.origin === base.origin &&
          ["http:", "https:"].includes(url.protocol);

        return permitido ? url.href : null;
      } catch {
        return null;
      }
    }

    function pintar() {
      cuerpo.replaceChildren();
      opciones.replaceChildren();

      aviso.textContent = "";
      volver.hidden = historial.length === 0;
      inicio.hidden = vista.tipo === "inicio";
      resumen.hidden = vista.tipo === "resumen";
      contacto.hidden = vista.tipo === "resumen";

      contenido.scrollTop = 0;

      switch (vista.tipo) {
        case "inicio":
          titulo.textContent = datos.inicio.pregunta;

          parrafo(datos.asistente.bienvenida);
          parrafo(datos.asistente.aclaracion, "kl-nota");

          datos.inicio.opciones.forEach((item) => {
            opcion(
              item.texto,
              () => rutaDestino(item.destino)
            );
          });
          break;

        case "categorias":
          titulo.textContent =
            datos.catalogo.pregunta_categoria;

          datos.categorias.forEach((item) => {
            opcion(
              item.nombre,
              () => ir("categoria", item.id)
            );
          });
          break;

        case "categoria": {
          const categoria = datos.categorias.find(
            (item) => item.id === vista.id
          );

          titulo.textContent =
            categoria?.nombre ||
            datos.catalogo.pregunta_proyecto;

          parrafo(datos.catalogo.pregunta_proyecto);

          categoria?.proyectos.forEach((id) => {
            opcion(
              catalogo.get(id).nombre,
              () => ir("proyecto", id)
            );
          });
          break;
        }

        case "demos":
          titulo.textContent =
            "Elige un demo para conocerlo";

          parrafo(datos.catalogo.aviso_demo);

          datos.proyectos
            .filter((item) => demoSeguro(item.demo))
            .forEach((item) => {
              opcion(
                item.nombre,
                () => ir("proyecto", item.id)
              );
            });
          break;

        case "proyecto":
        case "detalle":
          pintarProyecto();
          break;

        case "funciones":
          pintarFunciones();
          break;

        case "servicios":
          titulo.textContent =
            "¿Qué servicio te interesa?";

          datos.servicios.forEach((item) => {
            opcion(
              item.nombre,
              () => ir("servicio", item.id)
            );
          });
          break;

        case "servicio": {
          const servicio = datos.servicios.find(
            (item) => item.id === vista.id
          );

          titulo.textContent =
            servicio?.nombre || "Nuestros servicios";

          parrafo(servicio?.respuesta);

          if (servicio) {
            opcion(
              "Explorar estas soluciones",
              () => ir(
                "categoria",
                servicio.destino_categoria
              )
            );
          }
          break;
        }

        case "preguntas":
          titulo.textContent =
            "¿Qué te gustaría saber?";

          datos.preguntas.forEach((item) => {
            opcion(item.pregunta, () => {
              preguntasConsultadas.add(item.id);
              ir("respuesta", item.id);
            });
          });
          break;

        case "respuesta": {
          const pregunta = datos.preguntas.find(
            (item) => item.id === vista.id
          );

          titulo.textContent =
            pregunta?.pregunta || "Preguntas frecuentes";

          parrafo(pregunta?.respuesta);

          if (
            pregunta?.accion &&
            pregunta.accion !== "continuar"
          ) {
            opcion(
              pregunta.accion === "cotizacion"
                ? nav.cotizar
                : "Explorar soluciones",
              () => rutaDestino(pregunta.accion)
            );
          }

          opcion(
            "Consultar otra pregunta",
            () => ir("preguntas")
          );

          opcion(
            nav.ver_resumen,
            () => ir("resumen")
          );
          break;
        }

        case "perfil":
          pintarPerfil();
          break;

        case "cotizacion":
          if (
            datos.preguntas.some(
              (item) => item.id === "precio"
            )
          ) {
            preguntasConsultadas.add("precio");
          }

          titulo.textContent = datos.cotizacion.titulo;
          parrafo(datos.cotizacion.mensaje);

          if (!intereses.size) {
            parrafo(
              datos.cotizacion.sin_selecciones,
              "kl-nota"
            );
          }

          datos.cotizacion.opciones.forEach((item) => {
            opcion(
              item.texto,
              () => rutaDestino(item.destino)
            );
          });
          break;

        case "resumen":
          pintarResumen();
          break;

        case "editar":
          pintarEdicion();
          break;

        case "reiniciar":
          titulo.textContent = nav.reiniciar;

          parrafo(
            datos.asistente.confirmacion_reinicio
          );

          opcion("Sí, comenzar de nuevo", () => {
            intereses.clear();
            preguntasConsultadas.clear();
            proyectosConsultados.clear();

            Object.keys(perfil).forEach((clave) => {
              delete perfil[clave];
            });

            historial.length = 0;
            vista = { tipo: "inicio" };

            pintar();
          });

          opcion("Conservar mis selecciones", () => {
            vista =
              historial.pop() || { tipo: "inicio" };

            pintar();
          });
          break;

        default:
          titulo.textContent = "Volvamos al inicio";

          opcion(
            nav.inicio,
            () => ir("inicio")
          );
      }

      if (dialogo.open) {
        titulo.focus({ preventScroll: true });
      }
    }

    function pintarProyecto() {
      const proyecto = catalogo.get(vista.id);

      if (!proyecto) {
        return;
      }

      proyectosConsultados.add(proyecto.id);
      titulo.textContent = proyecto.nombre;

      if (
        vista.tipo === "proyecto" ||
        vista.detalle === "utilidad"
      ) {
        parrafo(proyecto.presentacion);
        parrafo(proyecto.ideal_para);
      }

      if (vista.detalle === "funciones") {
        lista(
          datos.catalogo.titulo_funciones_demo,
          proyecto.funciones_demo
        );

        lista(
          datos.catalogo.titulo_opciones_personalizables,
          proyecto.opciones_personalizables
        );

        parrafo(
          datos.catalogo.aclaracion_personalizacion,
          "kl-nota"
        );
      }

      if (vista.detalle === "ejemplo") {
        parrafo(proyecto.ejemplo_uso);
      }

      if (vista.detalle === "personalizar") {
        parrafo(datos.catalogo.personalizacion);
      }

      if (proyecto.nota) {
        parrafo(proyecto.nota, "kl-nota");
      }

      datos.catalogo.opciones_detalle.forEach((item) => {
        if (item.id !== vista.detalle) {
          opcion(
            item.texto,
            () => ir(
              "detalle",
              proyecto.id,
              item.id
            )
          );
        }
      });

      const url = demoSeguro(proyecto.demo);

      if (url) {
        const enlace = elemento(
          "a",
          "kl-opcion",
          `${nav.ver_demo} ↗`
        );

        enlace.href = url;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";

        enlace.setAttribute(
          "aria-label",
          `${nav.ver_demo}: ${proyecto.nombre}, en otra pestaña`
        );

        opciones.append(enlace);

        parrafo(
          datos.catalogo.aviso_demo,
          "kl-nota"
        );
      } else {
        parrafo(
          datos.catalogo.sin_demo,
          "kl-nota"
        );
      }

      opcion(
        intereses.has(proyecto.id)
          ? "Cambiar mis funciones de interés"
          : "Me interesa para mi negocio",
        () => {
          if (
            !intereses.has(proyecto.id) &&
            intereses.size >= maxProyectos
          ) {
            aviso.textContent =
              datos.catalogo.mensaje_limite_proyectos;

            return;
          }

          ir("funciones", proyecto.id);
        }
      );

      opcion(
        nav.otro_proyecto,
        () => ir("categorias")
      );

      opcion(
        nav.cotizar,
        () => ir("cotizacion")
      );
    }

    function pintarFunciones() {
      const proyecto = catalogo.get(vista.id);

      if (!proyecto) {
        return;
      }

      titulo.textContent = proyecto.nombre;

      parrafo(datos.catalogo.pregunta_funciones);

      parrafo(
        datos.catalogo.aclaracion_personalizacion,
        "kl-nota"
      );

      const seleccionadas = new Set(
        intereses.get(proyecto.id)?.funciones || []
      );

      const valores = [
        ...new Set([
          ...proyecto.funciones_demo,
          ...proyecto.opciones_personalizables
        ])
      ];

      const grupo = elemento(
        "fieldset",
        "kl-selecciones"
      );

      grupo.append(
        elemento(
          "legend",
          "kl-leyenda",
          `Selecciona hasta ${maxFunciones} funciones`
        )
      );

      valores.forEach((valor) => {
        const etiqueta = elemento(
          "label",
          "kl-seleccion"
        );

        const casilla = document.createElement("input");

        casilla.type = "checkbox";
        casilla.checked = seleccionadas.has(valor);

        casilla.addEventListener("change", () => {
          if (
            casilla.checked &&
            seleccionadas.size >= maxFunciones
          ) {
            casilla.checked = false;

            aviso.textContent =
              datos.catalogo.mensaje_limite_funciones;

            return;
          }

          if (casilla.checked) {
            seleccionadas.add(valor);
          } else {
            seleccionadas.delete(valor);
          }

          aviso.textContent = "";
        });

        etiqueta.append(
          casilla,
          elemento("span", "", valor)
        );

        grupo.append(etiqueta);
      });

      cuerpo.append(grupo);

      const guardar = (orientacion) => {
        if (
          !intereses.has(proyecto.id) &&
          intereses.size >= maxProyectos
        ) {
          aviso.textContent =
            datos.catalogo.mensaje_limite_proyectos;

          return;
        }

        intereses.set(proyecto.id, {
          funciones: orientacion
            ? []
            : [...seleccionadas],
          orientacion
        });

        ir("perfil", "objetivo");
      };

      opcion(nav.continuar, () => {
        if (!seleccionadas.size) {
          aviso.textContent =
            "Elige al menos una función o selecciona la opción de orientación.";

          return;
        }

        guardar(false);
      });

      opcion(
        datos.catalogo.seleccion_pendiente,
        () => guardar(true)
      );
    }

    function pintarPerfil() {
      const clave = vista.id;
      const pregunta = datos.perfil[clave];

      if (!pregunta) {
        return;
      }

      titulo.textContent = pregunta.pregunta;
      parrafo(pregunta.aclaracion, "kl-nota");

      const continuar = () => {
        if (clave === "objetivo") {
          ir("perfil", "situacion");
        } else if (clave === "situacion") {
          ir("perfil", "plazo");
        } else {
          ir("resumen");
        }
      };

      pregunta.opciones.forEach((item) => {
        const nodo = boton(item.texto, () => {
          perfil[clave] = item.id;
          continuar();
        });

        nodo.setAttribute(
          "aria-pressed",
          String(perfil[clave] === item.id)
        );

        opciones.append(nodo);
      });

      opcion("Omitir esta pregunta", () => {
        delete perfil[clave];
        continuar();
      });
    }

    function construirResumen() {
      const config = datos.resumen;

      const lineas = [
        config.saludo,
        "",
        config.encabezado
      ];

      if (intereses.size) {
        lineas.push(
          "",
          `${config.campos.proyectos}:`
        );

        intereses.forEach((interes, id) => {
          lineas.push(
            `• ${catalogo.get(id).nombre}`
          );

          if (interes.funciones.length) {
            lineas.push(
              `  ${config.campos.funciones}: ${
                interes.funciones.join(", ")
              }.`
            );
          } else if (interes.orientacion) {
            lineas.push(
              `  ${datos.catalogo.seleccion_pendiente}`
            );
          }
        });
      } else {
        lineas.push(
          "",
          config.sin_datos
        );
      }

      const explorados = [...proyectosConsultados].filter(
        (id) => !intereses.has(id)
      );

      if (explorados.length) {
        lineas.push(
          "",
          "Soluciones que consulté, sin confirmar interés:"
        );

        explorados.forEach((id) => {
          lineas.push(
            `• ${catalogo.get(id).nombre}`
          );
        });
      }

      for (const clave of ["objetivo", "situacion", "plazo"]) {
        const item = datos.perfil[clave].opciones.find(
          (opcion) => opcion.id === perfil[clave]
        );

        if (item) {
          lineas.push(
            "",
            `${config.campos[clave]}: ${item.texto}.`
          );
        }
      }

      if (
        config.incluir_preguntas_consultadas &&
        preguntasConsultadas.size
      ) {
        lineas.push(
          "",
          `${config.campos.preguntas}:`
        );

        preguntasConsultadas.forEach((id) => {
          const pregunta = datos.preguntas.find(
            (item) => item.id === id
          );

          if (pregunta) {
            lineas.push(
              `• ${pregunta.pregunta}`
            );
          }
        });
      }

      lineas.push(
        "",
        config.cierre
      );

      return lineas.join("\n");
    }

    function pintarResumen() {
      titulo.textContent = datos.resumen.titulo;

      parrafo(datos.resumen.descripcion);

      const texto = construirResumen();

      cuerpo.append(
        elemento(
          "pre",
          "kl-resumen",
          texto
        )
      );

      parrafo(
        datos.resumen.aviso,
        "kl-nota"
      );

      const limite =
        Number(datos.resumen.maximo_caracteres) || 3500;

      if (texto.length <= limite) {
        const enlace = elemento(
          "a",
          "kl-opcion kl-opcion-principal",
          nav.enviar_whatsapp
        );

        enlace.href =
          `https://wa.me/${datos.contacto.whatsapp}?text=${
            encodeURIComponent(texto)
          }`;

        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";

        opciones.append(enlace);
      } else {
        aviso.textContent =
          "El resumen es muy largo. Reduce algunas selecciones antes de continuar por WhatsApp.";
      }

      opcion(
        nav.editar_resumen,
        () => ir("editar")
      );

      opcion(
        "Agregar otra solución",
        () => ir("categorias")
      );
    }

    function pintarEdicion() {
      titulo.textContent = nav.editar_resumen;

      intereses.forEach((interes, id) => {
        const nombreProyecto = catalogo.get(id).nombre;

        opcion(
          `Cambiar funciones: ${nombreProyecto}`,
          () => ir("funciones", id)
        );

        opcion(
          `Quitar: ${nombreProyecto}`,
          () => {
            intereses.delete(id);
            pintar();

            aviso.textContent =
              "Solución retirada de tu resumen.";
          }
        );
      });

      if (proyectosConsultados.size) {
        opcion(
          "Quitar el historial de soluciones consultadas",
          () => {
            proyectosConsultados.clear();
            pintar();

            aviso.textContent =
              "Historial retirado del resumen.";
          }
        );
      }

      opcion(
        "Cambiar objetivo, situación o plazo",
        () => ir("perfil", "objetivo")
      );

      if (preguntasConsultadas.size) {
        opcion(
          "Quitar las preguntas consultadas del resumen",
          () => {
            preguntasConsultadas.clear();
            pintar();

            aviso.textContent =
              "Preguntas retiradas de tu resumen.";
          }
        );
      }

      opcion(
        "Agregar una solución",
        () => ir("categorias")
      );

      opcion(
        nav.ver_resumen,
        () => ir("resumen")
      );
    }
  }
})();