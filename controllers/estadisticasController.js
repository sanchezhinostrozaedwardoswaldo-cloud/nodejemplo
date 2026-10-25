const { Op } = require('sequelize');
const { Usuario } = require('../models');

async function obtenerEstadisticas(req, res) {
    try {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const [totalUsuarios, administradores, usuariosNormales, nuevosEsteMes, recientes] = await Promise.all([
            Usuario.count(),
            Usuario.count({ where: { rol: 'Administrador' } }),
            Usuario.count({ where: { rol: 'Usuario' } }),
            Usuario.count({ where: { createdAt: { [Op.gte]: inicioMes } } }),
            Usuario.findAll({
                attributes: ['id', 'nombre', 'correo', 'rol', 'createdAt'],
                order: [['createdAt', 'DESC'], ['id', 'DESC']],
                limit: 5
            })
        ]);
        return res.json({
            totalUsuarios,
            administradores,
            usuariosNormales,
            nuevosEsteMes,
            recientes
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({ mensaje: 'No se pudieron cargar las estadísticas' });
    }
}

module.exports = { obtenerEstadisticas };
