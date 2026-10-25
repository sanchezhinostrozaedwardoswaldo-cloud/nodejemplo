
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const verificarToken = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        // Verificar que se envió el token
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                mensaje: 'Token de autenticación requerido'
            });
        }

        const token = authorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                mensaje: 'Token de autenticación requerido'
            });
        }

        // Verificar firma y vencimiento del JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ['HS256'] }
        );

        // Buscar al usuario en MySQL
        const usuario = await Usuario.findByPk(decoded.id);

        if (!usuario) {
            return res.status(401).json({
                mensaje: 'Usuario no encontrado o sesión inválida'
            });
        }

        if (!usuario.activo) {
            return res.status(403).json({ mensaje: 'Tu cuenta está desactivada. Contacta al administrador' });
        }

        // Comprobar la versión de sesión
        if (
            !Number.isInteger(decoded.tokenVersion) ||
            decoded.tokenVersion !== usuario.tokenVersion
        ) {
            return res.status(401).json({
                mensaje: 'La sesión ha expirado. Inicia sesión nuevamente'
            });
        }

        // Guardar los datos del usuario autenticado
        req.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol
        };

        next();

    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError'
        ) {
            return res.status(401).json({
                mensaje: 'Token inválido o expirado'
            });
        }

        console.error('Error al verificar token:', error);

        return res.status(500).json({
            mensaje: 'Error interno del servidor'
        });
    }
};

module.exports = verificarToken;
