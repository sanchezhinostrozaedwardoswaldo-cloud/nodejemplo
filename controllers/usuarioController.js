
const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { registrarActividad } = require('./actividadController');

// Mostrar datos públicos de un usuario
const datosUsuario = (usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    activo: usuario.activo
});

// Manejar errores de base de datos
const manejarError = (error, res) => {
    console.error('Error en usuarios:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            mensaje: 'El correo electrónico ya está registrado'
        });
    }

    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            mensaje: 'Los datos proporcionados no son válidos'
        });
    }

    return res.status(500).json({
        mensaje: 'Error interno del servidor'
    });
};

// Listado paginado, filtrado y ordenado desde MySQL
const listarUsuarios = async (req, res) => {
    try {
        const pagina = Math.max(1, Math.min(1000000, Number.parseInt(req.query.pagina, 10) || 1));
        const limite = [5, 10, 20].includes(Number(req.query.limite)) ? Number(req.query.limite) : 5;
        const roles = ['Todos', 'Administrador', 'Usuario'];
        const estados = ['Todos', 'Activo', 'Inactivo'];
        const campos = ['id', 'nombre', 'correo', 'rol', 'createdAt'];
        const rol = roles.includes(req.query.rol) ? req.query.rol : 'Todos';
        const estado = estados.includes(req.query.estado) ? req.query.estado : 'Todos';
        const ordenar = campos.includes(req.query.ordenar) ? req.query.ordenar : 'id';
        const direccion = req.query.direccion === 'DESC' ? 'DESC' : 'ASC';
        const buscar = String(req.query.buscar || '').trim().slice(0, 150);
        const where = {};
        if (rol !== 'Todos') where.rol = rol;
        if (estado !== 'Todos') where.activo = estado === 'Activo';
        if (buscar) {
            const patron = `%${buscar.replace(/[\%_]/g, '\\$&')}%`;
            where[Op.or] = [{ nombre: { [Op.like]: patron } }, { correo: { [Op.like]: patron } }];
        }
        const total = await Usuario.count({ where });
        const paginas = Math.max(1, Math.ceil(total / limite));
        const paginaActual = Math.min(pagina, paginas);
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'nombre', 'correo', 'rol', 'activo', 'createdAt'],
            where,
            order: [[ordenar, direccion], ['id', 'ASC']],
            limit: limite,
            offset: (paginaActual - 1) * limite
        });
        return res.json({ usuarios, total, pagina: paginaActual, paginas, limite });
    } catch (error) {
        return manejarError(error, res);
    }
};

// Crear usuario
const crearUsuario = async (req, res) => {
    try {
        const { nombre, correo, password, rol } = req.body;

        const rolAsignado = rol || 'Usuario';

        if (!['Administrador', 'Usuario'].includes(rolAsignado)) {
            return res.status(400).json({
                mensaje: 'El rol indicado no es válido'
            });
        }

        const existente = await Usuario.findOne({
            where: { correo }
        });

        if (existente) {
            return res.status(409).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const usuario = await Usuario.create({
            nombre,
            correo,
            password: passwordHash,
            rol: rolAsignado
        });

        await registrarActividad({ responsable: req.usuario, accion: 'CREAR_USUARIO', objetivo: usuario, detalle: `Rol: ${usuario.rol}` });
        return res.status(201).json({
            mensaje: 'Usuario creado correctamente',
            usuario: datosUsuario(usuario)
        });

    } catch (error) {
        return manejarError(error, res);
    }
};

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, rol } = req.body;

        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        const cambios = { nombre, correo };

        // Cambiar rol si fue proporcionado
        if (rol !== undefined) {
            if (!['Administrador', 'Usuario'].includes(rol)) {
                return res.status(400).json({
                    mensaje: 'Rol no válido'
                });
            }

            // Evitar quitarse el rol de administrador
            if (
                Number(id) === Number(req.usuario.id) &&
                rol !== 'Administrador'
            ) {
                return res.status(403).json({
                    mensaje: 'No puedes quitarte tu propio rol de administrador'
                });
            }

            cambios.rol = rol;
        }

        await usuario.update(cambios);
        await registrarActividad({ responsable: req.usuario, accion: 'EDITAR_USUARIO', objetivo: usuario, detalle: 'Datos de usuario actualizados' });

        return res.json({
            mensaje: 'Usuario actualizado correctamente',
            usuario: datosUsuario(usuario)
        });

    } catch (error) {
        return manejarError(error, res);
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Evitar que un administrador se elimine a sí mismo
        if (Number(id) === Number(req.usuario.id)) {
            return res.status(403).json({
                mensaje: 'No puedes eliminar tu propia cuenta'
            });
        }

        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        await usuario.destroy();
        await registrarActividad({ responsable: req.usuario, accion: 'ELIMINAR_USUARIO', objetivo: usuario, detalle: 'Cuenta eliminada' });

        return res.json({
            mensaje: 'Usuario eliminado correctamente'
        });

    } catch (error) {
        return manejarError(error, res);
    }
};

// Restablecer contraseña de otro usuario (Administrador)
const restablecerPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { passwordNueva } = req.body;

        // Evitar restablecer la propia contraseña desde esta ruta
        if (Number(id) === Number(req.usuario.id)) {
            return res.status(403).json({
                mensaje: 'Para cambiar tu propia contraseña utiliza la opción de cambio personal'
            });
        }

        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        // Validación adicional de seguridad
        if (
            typeof passwordNueva !== 'string' ||
            passwordNueva.length < 8 ||
            passwordNueva.length > 72
        ) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener entre 8 y 72 caracteres'
            });
        }

        // Generar hash de la nueva contraseña
        const passwordHash = await bcrypt.hash(passwordNueva, 10);

        // Actualizar contraseña e invalidar sesiones anteriores
        await usuario.update({
            password: passwordHash,
            tokenVersion: usuario.tokenVersion + 1
        });

        await registrarActividad({ responsable: req.usuario, accion: 'RESTABLECER_PASSWORD', objetivo: usuario, detalle: 'Contraseña restablecida por administrador' });
        return res.json({
            mensaje: 'Contraseña restablecida correctamente',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo
            }
        });

    } catch (error) {
        return manejarError(error, res);
    }
};


// Activar o desactivar una cuenta
const cambiarEstadoUsuario = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { activo } = req.body;
        if (typeof activo !== 'boolean') {
            return res.status(400).json({ mensaje: 'El campo activo debe ser verdadero o falso' });
        }
        if (id === Number(req.usuario.id)) {
            return res.status(403).json({ mensaje: 'No puedes cambiar el estado de tu propia cuenta' });
        }
        const usuario = await Usuario.findByPk(id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        if (usuario.activo !== activo) {
            await usuario.update({ activo, tokenVersion: usuario.tokenVersion + 1 });
            await registrarActividad({ responsable: req.usuario, accion: activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO', objetivo: usuario, detalle: activo ? 'Cuenta activada' : 'Cuenta desactivada' });
        }
        return res.json({ mensaje: activo ? 'Cuenta activada correctamente' : 'Cuenta desactivada correctamente', usuario: datosUsuario(usuario) });
    } catch (error) {
        return manejarError(error, res);
    }
};

module.exports = {
    listarUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    restablecerPassword,
    cambiarEstadoUsuario
};

