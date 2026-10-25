
const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('node:fs/promises');
const path = require('node:path');
const { registrarActividad } = require('./actividadController');

// Registrar usuario
const registrar = async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        if (!nombre || !correo || !password) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener al menos 8 caracteres'
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
            rol: 'Usuario'
        });

        await registrarActividad({ responsable: usuario, accion: 'REGISTRO', objetivo: usuario, detalle: 'Registro de cuenta' });
        return res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: 'Error al registrar usuario'
        });
    }
};

// Iniciar sesión
const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                mensaje: 'Correo y contraseña obligatorios'
            });
        }

        const usuario = await Usuario.findOne({
            where: { correo }
        });

        if (!usuario) {
            return res.status(401).json({
                mensaje: 'Credenciales incorrectas'
            });
        }

        if (!usuario.activo) {
            return res.status(403).json({ mensaje: 'Tu cuenta está desactivada. Contacta al administrador' });
        }

        const passwordValida = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordValida) {
            return res.status(401).json({
                mensaje: 'Credenciales incorrectas'
            });
        }

        
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol,
                tokenVersion: usuario.tokenVersion
            },
            process.env.JWT_SECRET,
            {
                algorithm: 'HS256',
                expiresIn: '1h'
            }
        );

        await registrarActividad({ responsable: usuario, accion: 'LOGIN', objetivo: usuario, detalle: 'Inicio de sesión correcto' });
        return res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: 'Error al iniciar sesión'
        });
    }
};


const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        if (
            typeof passwordActual !== 'string' ||
            typeof passwordNueva !== 'string' ||
            passwordNueva.length < 8 ||
            passwordNueva.length > 72
        ) {
            return res.status(400).json({
                mensaje: 'Datos de contraseña inválidos'
            });
        }

        const usuario = await Usuario.findByPk(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        const coincide = await bcrypt.compare(
            passwordActual,
            usuario.password
        );

        if (!coincide) {
            return res.status(401).json({
                mensaje: 'La contraseña actual es incorrecta'
            });
        }

        const esIgual = await bcrypt.compare(
            passwordNueva,
            usuario.password
        );

        if (esIgual) {
            return res.status(400).json({
                mensaje: 'La nueva contraseña debe ser diferente'
            });
        }

        
        const nuevoHash = await bcrypt.hash(passwordNueva, 10);

        await usuario.update({
            password: nuevoHash,
            tokenVersion: usuario.tokenVersion + 1
        });

        await registrarActividad({ responsable: usuario, accion: 'CAMBIAR_PASSWORD', objetivo: usuario, detalle: 'Contraseña personal actualizada' });
        return res.json({
            mensaje: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);

        return res.status(500).json({
            mensaje: 'Error interno del servidor'
        });
    }
};

// Datos públicos de la cuenta autenticada, sin contraseña ni tokenVersion.
const datosPerfil = usuario => ({
    id: usuario.id, nombre: usuario.nombre, correo: usuario.correo,
    rol: usuario.rol, activo: usuario.activo, fotoPerfil: usuario.fotoPerfil || null
});

const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario || !usuario.activo) return res.status(403).json({ mensaje: 'Cuenta no disponible' });
        return res.json({ mensaje: 'Perfil obtenido correctamente', usuario: datosPerfil(usuario) });
    } catch (error) {
        console.error('Perfil:', error);
        return res.status(500).json({ mensaje: 'No se pudo obtener el perfil' });
    }
};

const actualizarPerfil = async (req, res) => {
    try {
        const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
        const correo = typeof req.body.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
        if (nombre.length < 2 || nombre.length > 100 || correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).json({ mensaje: 'Nombre o correo inválidos' });
        }
        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        const otro = await Usuario.findOne({ where: { correo } });
        if (otro && otro.id !== usuario.id) return res.status(409).json({ mensaje: 'El correo ya está registrado' });
        await usuario.update({ nombre, correo });
        await registrarActividad({ responsable: usuario, accion: 'EDITAR_PERFIL', objetivo: usuario, detalle: 'Datos personales actualizados' });
        return res.json({ mensaje: 'Perfil actualizado correctamente', usuario: datosPerfil(usuario) });
    } catch (error) {
        console.error('Actualizar perfil:', error);
        return res.status(500).json({ mensaje: 'No se pudo actualizar el perfil' });
    }
};

const borrarFotoAnterior = async foto => {
    if (!foto || !/^\/uploads\/perfiles\/[a-f0-9-]+\.(?:jpg|webp)$/.test(foto)) return;
    await fs.unlink(path.join(__dirname, '..', 'public', foto.slice(1))).catch(() => {});
};

const actualizarFoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ mensaje: 'Selecciona una imagen válida' });
        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        const sharp = require('sharp');
        const { randomUUID } = require('node:crypto');
        const directorio = path.join(__dirname, '..', 'public', 'uploads', 'perfiles');
        await fs.mkdir(directorio, { recursive: true });
        const nombreArchivo = `${randomUUID()}.webp`;
        const destino = path.join(directorio, nombreArchivo);
        try {
            await sharp(req.file.buffer, { limitInputPixels: 16000000 })
                .rotate().resize(512, 512, { fit: 'cover' })
                .webp({ quality: 82, effort: 5 }).toFile(destino);
        } catch {
            return res.status(400).json({ mensaje: 'El archivo no es una imagen válida' });
        }
        const anterior = usuario.fotoPerfil;
        try {
            await usuario.update({ fotoPerfil: `/uploads/perfiles/${nombreArchivo}` });
        } catch (error) {
            await fs.unlink(destino).catch(() => {});
            throw error;
        }
        await borrarFotoAnterior(anterior);
        await registrarActividad({ responsable: usuario, accion: 'ACTUALIZAR_FOTO', objetivo: usuario, detalle: 'Fotografía de perfil actualizada' });
        return res.json({ mensaje: 'Fotografía actualizada correctamente', usuario: datosPerfil(usuario) });
    } catch (error) {
        console.error('Actualizar foto:', error);
        return res.status(500).json({ mensaje: 'No se pudo guardar la fotografía' });
    }
};

const eliminarFoto = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        const anterior = usuario.fotoPerfil;
        await usuario.update({ fotoPerfil: null });
        await borrarFotoAnterior(anterior);
        await registrarActividad({ responsable: usuario, accion: 'ELIMINAR_FOTO', objetivo: usuario, detalle: 'Fotografía de perfil eliminada' });
        return res.json({ mensaje: 'Fotografía eliminada correctamente', usuario: datosPerfil(usuario) });
    } catch (error) {
        console.error('Eliminar foto:', error);
        return res.status(500).json({ mensaje: 'No se pudo eliminar la fotografía' });
    }
};

module.exports = {
    registrar,
    login,
    cambiarPassword, obtenerPerfil, actualizarPerfil, actualizarFoto, eliminarFoto
};
