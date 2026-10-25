
const token = sessionStorage.getItem('token');

const panel = document.getElementById('panel');
const botonCerrar = document.getElementById('cerrarSesion');

let usuarioActual = null;
let usuarios = [];
let paginaUsuarios = 1;
let totalPaginasUsuarios = 1;
let solicitudUsuarios = 0;

// ==========================================
// SESIÓN Y PETICIONES A LA API
// ==========================================

function cerrarSesion() {
    sessionStorage.removeItem('token');
    window.location.replace('/');
}

botonCerrar.addEventListener('click', cerrarSesion);

async function api(ruta, opciones = {}) {
    const headers = {
        Authorization: `Bearer ${token}`,
        ...(opciones.body ? {
            'Content-Type': 'application/json'
        } : {}),
        ...opciones.headers
    };

    let respuesta;

    try {
        respuesta = await fetch(ruta, {
            ...opciones,
            headers
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor');
    }

    if (respuesta.status === 401) {
        cerrarSesion();
        throw new Error('La sesión ha expirado');
    }

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        const detalles = Array.isArray(datos.errores)
            ? datos.errores.map(error => error.mensaje).join('. ')
            : '';

        throw new Error(
            detalles || datos.mensaje || 'Ocurrió un error'
        );
    }

    return datos;
}

// Diálogos propios para confirmaciones y mensajes de botones.
const modalAviso = document.getElementById('modalAviso');
const tituloAviso = document.getElementById('tituloAviso');
const textoAviso = document.getElementById('textoAviso');
const botonAceptarAviso = document.getElementById('botonAceptarAviso');
const botonCancelarAviso = document.getElementById('botonCancelarAviso');
let resolverAviso = null;
let focoAvisoAnterior = null;

function cerrarAviso(confirmado = false) {
    if (modalAviso.hidden) return;
    modalAviso.hidden = true;
    document.body.classList.remove('modal-aviso-abierto');
    if (focoAvisoAnterior?.isConnected) focoAvisoAnterior.focus();
    focoAvisoAnterior = null;
    const resolver = resolverAviso;
    resolverAviso = null;
    if (resolver) resolver(confirmado);
}

function mostrarAviso(mensaje, { titulo = 'Aviso', confirmar = false, peligro = false } = {}) {
    // Evitar diálogos superpuestos.
    if (resolverAviso) cerrarAviso(false);
    tituloAviso.textContent = titulo;
    textoAviso.textContent = mensaje;
    botonCancelarAviso.hidden = !confirmar;
    botonAceptarAviso.textContent = confirmar ? (peligro ? 'Sí, continuar' : 'Confirmar') : 'Aceptar';
    botonAceptarAviso.classList.toggle('aviso-peligro', peligro);
    focoAvisoAnterior = document.activeElement;
    modalAviso.hidden = false;
    document.body.classList.add('modal-aviso-abierto');
    botonAceptarAviso.focus();
    return new Promise(resolve => { resolverAviso = resolve; });
}

botonAceptarAviso.addEventListener('click', () => cerrarAviso(true));
botonCancelarAviso.addEventListener('click', () => cerrarAviso(false));
modalAviso.addEventListener('click', evento => {
    if (evento.target === modalAviso) cerrarAviso(false);
});
modalAviso.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') { evento.stopPropagation(); cerrarAviso(false); }
    if (evento.key === 'Tab') {
        const botones = [botonCancelarAviso, botonAceptarAviso].filter(b => !b.hidden);
        const i = botones.indexOf(document.activeElement);
        if (i !== -1) {
            evento.preventDefault();
            botones[(i + (evento.shiftKey ? botones.length - 1 : 1)) % botones.length].focus();
        }
    }
});

function mostrarMensaje(id, mensaje, tipo = 'exito') {
    if (!mensaje) return;
    return mostrarAviso(mensaje, { titulo: tipo === 'error' ? 'Error' : 'Operación realizada' });
}

// ==========================================
// PERFIL
// ==========================================

async function cargarPerfil() {
    if (!token) {
        cerrarSesion();
        return;
    }

    try {
        const datos = await api('/api/auth/perfil');

        usuarioActual = datos.usuario;

        document.getElementById('bienvenida').textContent =
            `Bienvenido, ${usuarioActual.nombre}`;

        document.getElementById('correo').textContent =
            usuarioActual.correo;

        document.getElementById('rol').textContent =
            usuarioActual.rol;

        document.getElementById('nombreHeader').textContent =
            usuarioActual.nombre;

        document.getElementById('rolHeader').textContent =
            usuarioActual.rol;
        actualizarVistaPerfil();

        if (usuarioActual.rol === 'Administrador') {
            document.getElementById('menuUsuarios').hidden = false;
            document.getElementById('menuActividades').hidden = false;
            document.getElementById('panelEstadisticas').hidden = false;
            await cargarEstadisticas();
        }

        panel.hidden = false;

    } catch (error) {
        console.error('Error al cargar perfil:', error.message);
        cerrarSesion();
    }
}

// ==========================================
// NAVEGACIÓN DEL MENÚ LATERAL
// ==========================================

const botonesMenu = document.querySelectorAll('.menu-item');
const secciones = document.querySelectorAll('.dashboard-seccion');

function mostrarSeccion(nombre) {
    if (
        (nombre === 'usuarios' || nombre === 'actividades') &&
        usuarioActual?.rol !== 'Administrador'
    ) {
        return;
    }

    secciones.forEach(seccion => {
        seccion.hidden = seccion.id !== `seccion-${nombre}`;
    });

    botonesMenu.forEach(boton => {
        boton.classList.toggle(
            'activo',
            boton.dataset.seccion === nombre
        );
    });

    const titulos = {
        inicio: 'Inicio',
        usuarios: 'Administración de usuarios',
        actividades: 'Historial de actividades',
        password: 'Cambiar contraseña',
        perfil: 'Mi perfil'
    };

    document.getElementById('tituloSeccion').textContent =
        titulos[nombre] || 'Panel';

    if (nombre === 'usuarios') {
        cargarUsuarios();
    }
    if (nombre === 'actividades') cargarActividades();
    if (nombre === 'inicio' && usuarioActual?.rol === 'Administrador') {
        cargarEstadisticas();
    }
}

botonesMenu.forEach(boton => {
    boton.addEventListener('click', () => {
        mostrarSeccion(boton.dataset.seccion);
    });
});

// ==========================================
// ADMINISTRACIÓN DE USUARIOS
// ==========================================

async function cargarUsuarios() {
    if (usuarioActual?.rol !== 'Administrador') return;
    const solicitud = ++solicitudUsuarios;
    const tabla = document.getElementById('tablaUsuarios');
    tabla.replaceChildren();
    const fila = tabla.insertRow();
    const celda = fila.insertCell();
    celda.colSpan = 7;
    celda.textContent = 'Cargando usuarios...';
    const params = new URLSearchParams({
        pagina: paginaUsuarios,
        limite: document.getElementById('limiteUsuarios').value,
        buscar: document.getElementById('buscarUsuario').value.trim(),
        rol: document.getElementById('filtroRol').value,
        estado: document.getElementById('filtroEstado').value,
        ordenar: document.getElementById('ordenUsuarios').value,
        direccion: document.getElementById('direccionUsuarios').value
    });
    try {
        const datos = await api(`/api/usuarios?${params}`);
        if (solicitud !== solicitudUsuarios) return;
        if (!Array.isArray(datos.usuarios)) throw new Error('Respuesta inesperada del servidor');
        usuarios = datos.usuarios;
        paginaUsuarios = datos.pagina;
        totalPaginasUsuarios = datos.paginas;
        mostrarUsuarios();
        document.getElementById('resumenPaginacion').textContent = `${datos.total} usuario(s) encontrados`;
        document.getElementById('numeroPagina').textContent = `Página ${datos.pagina} de ${datos.paginas}`;
        document.getElementById('paginaAnterior').disabled = datos.pagina <= 1;
        document.getElementById('paginaSiguiente').disabled = datos.pagina >= datos.paginas;
    } catch (error) {
        if (solicitud !== solicitudUsuarios) return;
        tabla.replaceChildren();
        const f = tabla.insertRow();
        const c = f.insertCell();
        c.colSpan = 7;
        c.textContent = 'No se pudieron cargar los usuarios';
        mostrarMensaje('mensajeUsuarios', error.message, 'error');
    }
}

function mostrarUsuarios() {
    const tabla = document.getElementById('tablaUsuarios');
    tabla.replaceChildren();
    if (!usuarios.length) {
        const celda = tabla.insertRow().insertCell();
        celda.colSpan = 7;
        celda.textContent = 'No se encontraron usuarios';
        return;
    }
    for (const usuario of usuarios) {
        const fila = tabla.insertRow();
        const fecha = new Date(usuario.createdAt);
        const valores = [
            usuario.id, usuario.nombre, usuario.correo, usuario.rol,
            usuario.activo ? 'Activo' : 'Inactivo',
            Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleDateString('es-PE')
        ];
        for (const valor of valores) fila.insertCell().textContent = valor;
        const acciones = document.createElement('div');
        acciones.className = 'acciones-usuario';
        acciones.appendChild(crearBoton('Editar', 'btn-editar', () => editarUsuario(usuario.id)));
        if (Number(usuario.id) !== Number(usuarioActual.id)) {
            acciones.appendChild(crearBoton('Clave', 'btn-restablecer', () => abrirRestablecerPassword(usuario.id)));
            acciones.appendChild(crearBoton(usuario.activo ? 'Desactivar' : 'Activar', usuario.activo ? 'btn-desactivar' : 'btn-activar', () => cambiarEstadoUsuario(usuario)));
            acciones.appendChild(crearBoton('Eliminar', 'btn-eliminar', () => eliminarUsuario(usuario.id)));
        }
        fila.insertCell().appendChild(acciones);
    }
}

function crearBoton(texto, clase, accion) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = texto;
    boton.className = clase;
    boton.addEventListener('click', accion);
    return boton;
}

async function cambiarEstadoUsuario(usuario) {
    const activo = !usuario.activo;
    if (!await mostrarAviso(`¿Deseas ${activo ? 'activar' : 'desactivar'} la cuenta de ${usuario.nombre}?`, { titulo: 'Confirmar cambio de estado', confirmar: true, peligro: !activo })) return;
    try {
        const datos = await api(`/api/usuarios/${usuario.id}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ activo })
        });
        await cargarUsuarios();
        mostrarMensaje('mensajeUsuarios', datos.mensaje);
    } catch (error) {
        mostrarMensaje('mensajeUsuarios', error.message, 'error');
    }
}

let temporizadorBusqueda;
document.getElementById('buscarUsuario').addEventListener('input', () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => { paginaUsuarios = 1; cargarUsuarios(); }, 300);
});
for (const id of ['filtroRol', 'filtroEstado', 'ordenUsuarios', 'direccionUsuarios', 'limiteUsuarios']) {
    document.getElementById(id).addEventListener('change', () => { paginaUsuarios = 1; cargarUsuarios(); });
}
document.getElementById('paginaAnterior').addEventListener('click', () => {
    if (paginaUsuarios > 1) { paginaUsuarios--; cargarUsuarios(); }
});
document.getElementById('paginaSiguiente').addEventListener('click', () => {
    if (paginaUsuarios < totalPaginasUsuarios) { paginaUsuarios++; cargarUsuarios(); }
});

// ==========================================
// VENTANAS MODALES
// ==========================================

const modalUsuario = document.getElementById('contenedorFormularioUsuario');
const modalRestablecer = document.getElementById('contenedorRestablecerPassword');
const modales = [modalUsuario, modalRestablecer];
let focoAnterior = null;

function abrirModal(modal) {
    modales.forEach(otro => {
        if (otro !== modal) otro.hidden = true;
    });
    focoAnterior = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-abierto');
    modal.querySelector('input:not([type="hidden"]), select')?.focus();
}

function cerrarModal(modal) {
    modal.hidden = true;
    if (modales.every(elemento => elemento.hidden)) {
        document.body.classList.remove('modal-abierto');
    }
    if (focoAnterior?.isConnected) focoAnterior.focus();
    focoAnterior = null;
}

modales.forEach(modal => {
    modal.addEventListener('click', evento => {
        if (evento.target === modal || evento.target.closest('[data-cerrar-modal]')) {
            cerrarModal(modal);
        }
    });
    // Mantener el foco dentro del modal mientras está abierto.
    modal.addEventListener('keydown', evento => {
        if (evento.key !== 'Tab') return;
        const elementos = [...modal.querySelectorAll('button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled])')]
            .filter(elemento => elemento.getClientRects().length > 0);
        if (!elementos.length) return;
        const primero = elementos[0];
        const ultimo = elementos[elementos.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primero.focus();
        }
    });
});

document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && !modalAviso.hidden) return;
    if (evento.key === 'Escape') {
        const abierto = modales.find(modal => !modal.hidden);
        if (abierto) cerrarModal(abierto);
    }
});

// ==========================================
// CREAR Y EDITAR USUARIOS
// ==========================================

const contenedorFormulario = document.getElementById(
    'contenedorFormularioUsuario'
);

const formularioUsuario = document.getElementById('formUsuario');

function cerrarFormularioUsuario() {
    cerrarModal(contenedorFormulario);
    formularioUsuario.reset();
    document.getElementById('usuarioId').value = '';
}

document.getElementById('btnNuevoUsuario')
    .addEventListener('click', () => {
        modalRestablecer.hidden = true;
        document.getElementById('mensajeFormularioUsuario').textContent = '';
        formularioUsuario.reset();

        document.getElementById('usuarioId').value = '';

        document.getElementById(
            'tituloFormularioUsuario'
        ).textContent = 'Registrar usuario';

        document.getElementById(
            'grupoPasswordUsuario'
        ).hidden = false;

        document.getElementById(
            'usuarioPassword'
        ).required = true;

        abrirModal(contenedorFormulario);
    });

function editarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);

    if (!usuario) return;

    modalRestablecer.hidden = true;
    document.getElementById('mensajeFormularioUsuario').textContent = '';

    document.getElementById('usuarioId').value =
        usuario.id;

    document.getElementById('usuarioNombre').value =
        usuario.nombre;

    document.getElementById('usuarioCorreo').value =
        usuario.correo;

    document.getElementById('usuarioRol').value =
        usuario.rol;

    document.getElementById(
        'tituloFormularioUsuario'
    ).textContent = 'Editar usuario';

    document.getElementById(
        'grupoPasswordUsuario'
    ).hidden = true;

    document.getElementById(
        'usuarioPassword'
    ).required = false;

    abrirModal(contenedorFormulario);
}

document.getElementById('btnCancelarUsuario')
    .addEventListener('click', cerrarFormularioUsuario);

formularioUsuario.addEventListener('submit', async evento => {
    evento.preventDefault();

    const id = document.getElementById('usuarioId').value;

    const datos = {
        nombre: document.getElementById(
            'usuarioNombre'
        ).value.trim(),

        correo: document.getElementById(
            'usuarioCorreo'
        ).value.trim(),

        rol: document.getElementById('usuarioRol').value
    };

    if (!id) {
        datos.password = document.getElementById(
            'usuarioPassword'
        ).value;
    }

    const ruta = id
        ? `/api/usuarios/${id}`
        : '/api/usuarios';

    const metodo = id ? 'PUT' : 'POST';

    try {
        await api(ruta, {
            method: metodo,
            body: JSON.stringify(datos)
        });

        cerrarFormularioUsuario();

        mostrarMensaje(
            'mensajeUsuarios',
            id
                ? 'Usuario actualizado correctamente'
                : 'Usuario registrado correctamente'
        );

        await cargarUsuarios();
        cargarEstadisticas();

        // Si se editó la cuenta del administrador actual,
        // refrescamos los datos del perfil.
        if (id && Number(id) === usuarioActual.id) {
            const perfil = await api('/api/auth/perfil');

            usuarioActual = perfil.usuario;

            document.getElementById('bienvenida').textContent =
                `Bienvenido, ${usuarioActual.nombre}`;

            document.getElementById('nombreHeader').textContent =
                usuarioActual.nombre;

            document.getElementById('correo').textContent =
                usuarioActual.correo;

            document.getElementById('rol').textContent =
                usuarioActual.rol;
        }

    } catch (error) {
        mostrarMensaje('mensajeFormularioUsuario', error.message, 'error');
    }
});

// ==========================================
// ELIMINAR USUARIOS
// ==========================================

async function eliminarUsuario(id) {
    if (id === usuarioActual.id) {
        return;
    }

    const usuario = usuarios.find(u => u.id === id);

    if (!usuario) return;

    const confirmado = await mostrarAviso(
        `¿Seguro que deseas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
        { titulo: 'Eliminar usuario', confirmar: true, peligro: true }
    );

    if (!confirmado) return;

    try {
        await api(`/api/usuarios/${id}`, {
            method: 'DELETE'
        });

        mostrarMensaje(
            'mensajeUsuarios',
            'Usuario eliminado correctamente'
        );

        await cargarUsuarios();
        cargarEstadisticas();

    } catch (error) {
        mostrarMensaje(
            'mensajeUsuarios',
            error.message,
            'error'
        );
    }
}

// ==========================================
// RESTABLECER CONTRASEÑAS
// ==========================================

const formularioRestablecer = document.getElementById(
    'formRestablecerPassword'
);

function abrirRestablecerPassword(id) {
    const usuario = usuarios.find(u => u.id === id);

    if (!usuario || id === usuarioActual.id) return;

    cerrarFormularioUsuario();

    document.getElementById(
        'restablecerUsuarioId'
    ).value = usuario.id;

    document.getElementById(
        'nombreUsuarioRestablecer'
    ).textContent = `Usuario: ${usuario.nombre}`;

    document.getElementById(
        'passwordRestablecida'
    ).value = '';

    document.getElementById('mensajeFormularioRestablecer').textContent = '';
    abrirModal(modalRestablecer);
}

document.getElementById('btnCancelarRestablecer')
    .addEventListener('click', () => {
        cerrarModal(modalRestablecer);
    });

formularioRestablecer.addEventListener(
    'submit',
    async evento => {
        evento.preventDefault();

        const id = document.getElementById(
            'restablecerUsuarioId'
        ).value;

        const passwordNueva = document.getElementById(
            'passwordRestablecida'
        ).value;

        try {
            await api(
                `/api/usuarios/${id}/restablecer-password`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ passwordNueva })
                }
            );

            formularioRestablecer.reset();

            cerrarModal(modalRestablecer);

            mostrarMensaje(
                'mensajeUsuarios',
                'Contraseña restablecida correctamente'
            );

        } catch (error) {
            mostrarMensaje('mensajeFormularioRestablecer', error.message, 'error');
        }
    }
);

// ==========================================
// CAMBIAR MI CONTRASEÑA
// ==========================================

document.getElementById('formCambiarPassword')
    .addEventListener('submit', async evento => {
        evento.preventDefault();

        const passwordActual = document.getElementById(
            'passwordActual'
        ).value;

        const passwordNueva = document.getElementById(
            'passwordNueva'
        ).value;

        const confirmarPassword = document.getElementById(
            'confirmarPassword'
        ).value;

        if (passwordNueva !== confirmarPassword) {
            mostrarMensaje(
                'mensajePassword',
                'Las contraseñas nuevas no coinciden',
                'error'
            );
            return;
        }

        try {
            await api('/api/auth/cambiar-password', {
                method: 'PUT',
                body: JSON.stringify({
                    passwordActual,
                    passwordNueva
                })
            });

            await mostrarAviso('Contraseña actualizada. Inicia sesión nuevamente.', { titulo: 'Contraseña actualizada' });

            cerrarSesion();

        } catch (error) {
            mostrarMensaje(
                'mensajePassword',
                error.message,
                'error'
            );
        }
    });

// ==========================================
// ESTADÍSTICAS DEL DASHBOARD (ADMINISTRADOR)
// ==========================================

async function cargarEstadisticas() {
    if (usuarioActual?.rol !== 'Administrador') return;
    const mensaje = document.getElementById('mensajeEstadisticas');
    const boton = document.getElementById('btnActualizarEstadisticas');
    boton.disabled = true;
    mensaje.textContent = 'Actualizando estadísticas...';
    mensaje.className = '';
    try {
        const datos = await api('/api/usuarios/estadisticas');
        document.getElementById('statTotal').textContent = datos.totalUsuarios;
        document.getElementById('statAdministradores').textContent = datos.administradores;
        document.getElementById('statUsuarios').textContent = datos.usuariosNormales;
        document.getElementById('statMes').textContent = datos.nuevosEsteMes;

        const cuerpo = document.getElementById('tablaUsuariosRecientes');
        cuerpo.replaceChildren();
        if (!Array.isArray(datos.recientes) || datos.recientes.length === 0) {
            const fila = cuerpo.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 4;
            celda.textContent = 'Todavía no hay usuarios registrados';
        } else {
            for (const usuario of datos.recientes) {
                const fila = cuerpo.insertRow();
                const fecha = new Date(usuario.createdAt);
                const columnas = [
                    usuario.nombre,
                    usuario.correo,
                    usuario.rol,
                    Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleString('es-PE')
                ];
                for (const valor of columnas) {
                    fila.insertCell().textContent = valor ?? '—';
                }
            }
        }
        mensaje.textContent = '';
    } catch (error) {
        mensaje.textContent = error.message;
        mensaje.className = 'error';
    } finally {
        boton.disabled = false;
    }
}

document.getElementById('btnActualizarEstadisticas')
    .addEventListener('click', cargarEstadisticas);

// ==========================================
// INICIALIZAR
// ==========================================

cargarPerfil();

// ==========================================
// MI PERFIL Y FOTOGRAFÍA
// ==========================================
let vistaPreviaURL = null;
function actualizarVistaPerfil() {
    if (!usuarioActual) return;
    document.getElementById('perfilNombre').value = usuarioActual.nombre;
    document.getElementById('perfilCorreo').value = usuarioActual.correo;
    document.getElementById('perfilRol').value = usuarioActual.rol;
    const inicial = (usuarioActual.nombre || 'U').trim().charAt(0).toUpperCase();
    document.getElementById('avatarHeaderInicial').textContent = inicial;
    document.getElementById('fotoPerfilInicial').textContent = inicial;
    mostrarFotografia(usuarioActual.fotoPerfil);
}
function mostrarFotografia(url) {
    for (const [imagenId, inicialId] of [['avatarHeader', 'avatarHeaderInicial'], ['fotoPerfilVista', 'fotoPerfilInicial']]) {
        const imagen = document.getElementById(imagenId);
        imagen.hidden = !url;
        document.getElementById(inicialId).hidden = Boolean(url);
        if (url) imagen.src = url;
        else imagen.removeAttribute('src');
    }
    document.getElementById('btnEliminarFotoPerfil').disabled = !usuarioActual?.fotoPerfil;
}
function sincronizarUsuarioPerfil(datos) {
    usuarioActual = datos.usuario;
    document.getElementById('bienvenida').textContent = `Bienvenido, ${usuarioActual.nombre}`;
    document.getElementById('nombreHeader').textContent = usuarioActual.nombre;
    document.getElementById('rolHeader').textContent = usuarioActual.rol;
    document.getElementById('correo').textContent = usuarioActual.correo;
    document.getElementById('rol').textContent = usuarioActual.rol;
    actualizarVistaPerfil();
}
document.getElementById('formMiPerfil').addEventListener('submit', async evento => {
    evento.preventDefault();
    try {
        const datos = await api('/api/auth/perfil', {
            method: 'PUT',
            body: JSON.stringify({
                nombre: document.getElementById('perfilNombre').value.trim(),
                correo: document.getElementById('perfilCorreo').value.trim()
            })
        });
        sincronizarUsuarioPerfil(datos);
        await mostrarAviso(datos.mensaje, { titulo: 'Perfil actualizado' });
    } catch (error) { await mostrarAviso(error.message, { titulo: 'Error' }); }
});
// Editor de encuadre: no altera el archivo original en el equipo del usuario.
const modalEditorFoto = document.getElementById('modalEditorFoto');
const canvasEditorFoto = document.getElementById('canvasEditorFoto');
const contextoEditor = canvasEditorFoto.getContext('2d');
const zoomEditorFoto = document.getElementById('zoomEditorFoto');
const entradaFotoPerfil = document.getElementById('archivoFotoPerfil');
let imagenEditor = null;
let archivoEditor = null;
let urlEditor = null;
let editorX = 0, editorY = 0, editorZoom = 1;
let arrastreEditor = null;
let focoPrevioEditor = null;

function dibujarEditor() {
    if (!imagenEditor) return;
    const lado = canvasEditorFoto.width;
    const escalaBase = Math.max(lado / imagenEditor.naturalWidth, lado / imagenEditor.naturalHeight);
    const ancho = imagenEditor.naturalWidth * escalaBase * editorZoom;
    const alto = imagenEditor.naturalHeight * escalaBase * editorZoom;
    const limiteX = Math.max(0, (ancho - lado) / 2);
    const limiteY = Math.max(0, (alto - lado) / 2);
    editorX = Math.max(-limiteX, Math.min(limiteX, editorX));
    editorY = Math.max(-limiteY, Math.min(limiteY, editorY));
    contextoEditor.clearRect(0, 0, lado, lado);
    contextoEditor.drawImage(imagenEditor, (lado - ancho) / 2 + editorX, (lado - alto) / 2 + editorY, ancho, alto);
}
function cerrarEditorFoto() {
    modalEditorFoto.hidden = true;
    document.body.classList.remove('editor-abierto');
    entradaFotoPerfil.value = '';
    if (urlEditor) URL.revokeObjectURL(urlEditor);
    urlEditor = null;
    imagenEditor = null;
    archivoEditor = null;
    arrastreEditor = null;
    mostrarFotografia(usuarioActual?.fotoPerfil);
    focoPrevioEditor?.focus();
}
async function abrirEditorFoto(archivo) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 10 * 1024 * 1024) {
        entradaFotoPerfil.value = '';
        await mostrarAviso('Selecciona una imagen JPG, PNG o WebP de hasta 10 MB.', { titulo: 'Imagen no válida' });
        return;
    }
    try {
        urlEditor = URL.createObjectURL(archivo);
        const img = new Image();
        img.src = urlEditor;
        await img.decode();
        if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 16000000) throw new Error('La imagen tiene dimensiones no admitidas (máximo 16 megapíxeles).');
        imagenEditor = img;
        archivoEditor = archivo;
        editorX = editorY = 0;
        editorZoom = 1;
        zoomEditorFoto.value = '1';
        focoPrevioEditor = document.activeElement;
        modalEditorFoto.hidden = false;
        document.body.classList.add('editor-abierto');
        dibujarEditor();
        document.getElementById('cancelarEditorFoto').focus();
    } catch (error) {
        if (urlEditor) URL.revokeObjectURL(urlEditor);
        urlEditor = null;
        entradaFotoPerfil.value = '';
        await mostrarAviso(error.message || 'No se pudo abrir la imagen.', { titulo: 'Imagen no válida' });
    }
}
entradaFotoPerfil.addEventListener('change', async evento => {
    const archivo = evento.target.files?.[0];
    if (archivo) await abrirEditorFoto(archivo);
});
zoomEditorFoto.addEventListener('input', () => { editorZoom = Number(zoomEditorFoto.value); dibujarEditor(); });
canvasEditorFoto.addEventListener('pointerdown', evento => {
    if (!imagenEditor) return;
    canvasEditorFoto.setPointerCapture(evento.pointerId);
    arrastreEditor = { id: evento.pointerId, x: evento.clientX, y: evento.clientY };
});
canvasEditorFoto.addEventListener('pointermove', evento => {
    if (!arrastreEditor || arrastreEditor.id !== evento.pointerId) return;
    const factor = canvasEditorFoto.width / canvasEditorFoto.getBoundingClientRect().width;
    editorX += (evento.clientX - arrastreEditor.x) * factor;
    editorY += (evento.clientY - arrastreEditor.y) * factor;
    arrastreEditor.x = evento.clientX;
    arrastreEditor.y = evento.clientY;
    dibujarEditor();
});
for (const evento of ['pointerup', 'pointercancel', 'lostpointercapture']) canvasEditorFoto.addEventListener(evento, () => { arrastreEditor = null; });
document.getElementById('cancelarEditorFoto').addEventListener('click', cerrarEditorFoto);
modalEditorFoto.addEventListener('click', evento => { if (evento.target === modalEditorFoto) cerrarEditorFoto(); });
modalEditorFoto.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') { evento.preventDefault(); cerrarEditorFoto(); }
    if (evento.key === 'Tab') {
        const elementos = [...modalEditorFoto.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
        const primero = elementos[0], ultimo = elementos[elementos.length - 1];
        if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
        else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
    }
});
document.getElementById('btnGuardarFotoPerfil').addEventListener('click', async () => {
    if (archivoEditor) { modalEditorFoto.hidden = false; document.body.classList.add('editor-abierto'); dibujarEditor(); }
    else entradaFotoPerfil.click();
});
document.getElementById('guardarEditorFoto').addEventListener('click', async () => {
    if (!imagenEditor || !archivoEditor) return;
    const boton = document.getElementById('guardarEditorFoto');
    boton.disabled = true;
    try {
        dibujarEditor();
        // El lienzo representa el encuadre elegido, no modifica el JPG/PNG original.
        const lienzoSalida = document.createElement('canvas');
        lienzoSalida.width = lienzoSalida.height = 512;
        lienzoSalida.getContext('2d').drawImage(canvasEditorFoto, 0, 0, 512, 512);
        const blob = await new Promise((resolver, rechazar) => lienzoSalida.toBlob(b => b ? resolver(b) : rechazar(new Error('No se pudo preparar la fotografía')), 'image/webp', 0.86));
        const formulario = new FormData();
        formulario.append('foto', blob, 'perfil.webp');
        const respuesta = await fetch('/api/auth/perfil/foto', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formulario });
        if (respuesta.status === 401) { cerrarSesion(); return; }
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo guardar la fotografía');
        cerrarEditorFoto();
        sincronizarUsuarioPerfil(datos);
        await mostrarAviso(datos.mensaje, { titulo: 'Fotografía actualizada' });
    } catch (error) { cerrarEditorFoto(); await mostrarAviso(error.message, { titulo: 'Error' }); }
    finally { boton.disabled = false; }
});
document.getElementById('btnEliminarFotoPerfil').addEventListener('click', async () => {
    if (!usuarioActual?.fotoPerfil) return;
    if (!await mostrarAviso('¿Deseas eliminar tu fotografía de perfil?', { titulo: 'Eliminar fotografía', confirmar: true, peligro: true })) return;
    try {
        const datos = await api('/api/auth/perfil/foto', { method: 'DELETE' });
        document.getElementById('archivoFotoPerfil').value = '';
        if (vistaPreviaURL) URL.revokeObjectURL(vistaPreviaURL);
        vistaPreviaURL = null;
        sincronizarUsuarioPerfil(datos);
        await mostrarAviso(datos.mensaje, { titulo: 'Fotografía eliminada' });
    } catch (error) { await mostrarAviso(error.message, { titulo: 'Error' }); }
});

// ==========================================
// HISTORIAL DE ACTIVIDADES
// ==========================================
const etiquetasActividades = {
    REGISTRO: 'Registro de cuenta', LOGIN: 'Inicio de sesión',
    CREAR_USUARIO: 'Creación de usuario', EDITAR_USUARIO: 'Edición de usuario',
    ELIMINAR_USUARIO: 'Eliminación de usuario', ACTIVAR_USUARIO: 'Activación de cuenta',
    DESACTIVAR_USUARIO: 'Desactivación de cuenta', RESTABLECER_PASSWORD: 'Restablecimiento de clave',
    CAMBIAR_PASSWORD: 'Cambio de contraseña', EDITAR_PERFIL: 'Actualización de perfil',
    ACTUALIZAR_FOTO: 'Actualización de fotografía', ELIMINAR_FOTO: 'Eliminación de fotografía'
};
let paginaActividades = 1;
let paginasActividades = 1;
let peticionActividades = 0;
const accionSelect = document.getElementById('actividadAccion');
for (const [codigo, etiqueta] of Object.entries(etiquetasActividades)) {
    const opcion = document.createElement('option'); opcion.value = codigo; opcion.textContent = etiqueta; accionSelect.appendChild(opcion);
}
async function cargarActividades() {
    if (usuarioActual?.rol !== 'Administrador') return;
    const solicitud = ++peticionActividades;
    const tabla = document.getElementById('tablaActividades');
    tabla.replaceChildren();
    const cargando = tabla.insertRow().insertCell(); cargando.colSpan = 5; cargando.textContent = 'Cargando historial...';
    const params = new URLSearchParams({
        pagina: paginaActividades, limite: document.getElementById('actividadLimite').value,
        responsable: document.getElementById('actividadResponsable').value.trim(),
        accion: accionSelect.value, desde: document.getElementById('actividadDesde').value,
        hasta: document.getElementById('actividadHasta').value
    });
    try {
        const datos = await api(`/api/actividades?${params}`);
        if (solicitud !== peticionActividades) return;
        tabla.replaceChildren();
        paginaActividades = datos.pagina; paginasActividades = datos.paginas;
        document.getElementById('actividadesTotal').textContent = datos.total;
        document.getElementById('actividadesHoy').textContent = datos.totalHoy;
        document.getElementById('resumenActividades').textContent = `${datos.total} actividad(es) encontradas`;
        document.getElementById('actividadPagina').textContent = `Página ${datos.pagina} de ${datos.paginas}`;
        document.getElementById('actividadAnterior').disabled = datos.pagina <= 1;
        document.getElementById('actividadSiguiente').disabled = datos.pagina >= datos.paginas;
        if (!datos.actividades.length) { const celda = tabla.insertRow().insertCell(); celda.colSpan = 5; celda.textContent = 'No hay actividades con estos filtros.'; return; }
        for (const a of datos.actividades) {
            const fila = tabla.insertRow();
            const fecha = new Date(a.createdAt);
            const valores = [Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleString('es-PE'), a.responsableNombre, etiquetasActividades[a.accion] || a.accion, a.objetivoNombre || '—'];
            for (const valor of valores) fila.insertCell().textContent = valor;
            const boton = document.createElement('button'); boton.type = 'button'; boton.textContent = 'Ver detalles';
            boton.className = 'actividad-detalle-btn';
            boton.addEventListener('click', () => mostrarAviso(`Fecha: ${valores[0]}\nResponsable: ${a.responsableNombre} (ID: ${a.responsableId ?? '—'})\nAcción: ${valores[2]}\nUsuario afectado: ${a.objetivoNombre || '—'} (ID: ${a.objetivoId ?? '—'})\nDetalle: ${a.detalle || 'Sin detalles'}`, { titulo: 'Detalle de actividad' }));
            fila.insertCell().appendChild(boton);
        }
    } catch (error) {
        if (solicitud !== peticionActividades) return;
        tabla.replaceChildren(); const celda = tabla.insertRow().insertCell(); celda.colSpan = 5; celda.textContent = 'No se pudo cargar el historial.';
        await mostrarAviso(error.message, { titulo: 'Error al cargar historial' });
    }
}
let esperaActividades;
document.getElementById('actividadResponsable').addEventListener('input', () => { clearTimeout(esperaActividades); esperaActividades = setTimeout(() => { paginaActividades = 1; cargarActividades(); }, 350); });
for (const id of ['actividadAccion', 'actividadDesde', 'actividadHasta', 'actividadLimite']) document.getElementById(id).addEventListener('change', () => { paginaActividades = 1; cargarActividades(); });
document.getElementById('btnActualizarActividades').addEventListener('click', cargarActividades);
document.getElementById('limpiarFiltroActividades').addEventListener('click', () => {
    document.getElementById('actividadResponsable').value = ''; accionSelect.value = 'Todos';
    document.getElementById('actividadDesde').value = ''; document.getElementById('actividadHasta').value = '';
    paginaActividades = 1; cargarActividades();
});
document.getElementById('actividadAnterior').addEventListener('click', () => { if (paginaActividades > 1) { paginaActividades--; cargarActividades(); } });
document.getElementById('actividadSiguiente').addEventListener('click', () => { if (paginaActividades < paginasActividades) { paginaActividades++; cargarActividades(); } });
