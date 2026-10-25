
const express = require('express');
const router = express.Router();

const {
    listarUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    restablecerPassword,
    cambiarEstadoUsuario
} = require('../controllers/usuarioController');


const { obtenerEstadisticas } = require('../controllers/estadisticasController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

const {
    validarRegistro,
    validarActualizacion,
    validarId,
    validarRestablecimientoPassword
} = require('../middlewares/validaciones');


// Todas las rutas requieren autenticación
router.use(verificarToken);

// Estadísticas generales: únicamente administradores
router.get('/estadisticas', verificarRol('Administrador'), obtenerEstadisticas);

// Solo administradores pueden listar usuarios
router.get(
    '/',
    verificarRol('Administrador'),
    listarUsuarios
);

// Crear usuarios con validaciones
router.post(
    '/',
    verificarRol('Administrador'),
    validarRegistro,
    crearUsuario
);

// Actualizar usuarios con validaciones
router.put(
    '/:id',
    verificarRol('Administrador'),
    validarActualizacion,
    actualizarUsuario
);

// Activar o desactivar usuarios
router.patch('/:id/estado', verificarRol('Administrador'), validarId, cambiarEstadoUsuario);

// Eliminar usuarios validando el ID
router.delete(
    '/:id',
    verificarRol('Administrador'),
    validarId,
    eliminarUsuario
);

// Restablecer contraseña de otro usuario
// Solo administradores
router.put(
    '/:id/restablecer-password',
    verificarRol('Administrador'),
    validarRestablecimientoPassword,
    restablecerPassword
);


module.exports = router;
