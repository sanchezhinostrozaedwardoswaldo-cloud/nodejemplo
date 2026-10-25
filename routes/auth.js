
const express = require('express');
const router = express.Router();

const {
    registrar,
    login,
    cambiarPassword, obtenerPerfil, actualizarPerfil, actualizarFoto, eliminarFoto
} = require('../controllers/authController');

const verificarToken = require('../middlewares/verificarToken');

const {
    validarRegistro,
    validarLogin,
    validarCambioPassword
} = require('../middlewares/validaciones');

// Registro de usuarios
router.post('/registro', validarRegistro, registrar);

// Inicio de sesión
router.post('/login', validarLogin, login);

// Perfil editable y fotografía (JWT obligatorio).
const multer = require('multer');
const subirFoto = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, archivo, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(archivo.mimetype))
});
const recibirFoto = (req, res, next) => subirFoto.single('foto')(req, res, error => {
    if (error) return res.status(400).json({ mensaje: 'Imagen inválida o superior a 10 MB' });
    next();
});
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.post('/perfil/foto', verificarToken, recibirFoto, actualizarFoto);
router.delete('/perfil/foto', verificarToken, eliminarFoto);

// Cambiar contraseña del usuario autenticado
router.put(
    '/cambiar-password',
    verificarToken,
    validarCambioPassword,
    cambiarPassword
);

module.exports = router;
