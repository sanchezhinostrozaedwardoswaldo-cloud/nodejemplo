
const { Actividad } = require('../models');
const { Op } = require('sequelize');

// Solo recibe campos explícitamente permitidos; nunca registra contraseñas ni JWT.
async function registrarActividad({ responsable, accion, objetivo = null, detalle = '' }) {
  try {
    await Actividad.create({
      responsableId: responsable?.id ?? null,
      responsableNombre: String(responsable?.nombre || 'Sistema').slice(0, 100),
      accion, objetivoId: objetivo?.id ?? null,
      objetivoNombre: objetivo?.nombre ? String(objetivo.nombre).slice(0, 100) : null,
      detalle: String(detalle).slice(0, 255)
    });
  } catch (error) { console.error('No se pudo registrar actividad:', error); }
}

const ACCIONES = ['REGISTRO', 'LOGIN', 'CREAR_USUARIO', 'EDITAR_USUARIO', 'ELIMINAR_USUARIO', 'ACTIVAR_USUARIO', 'DESACTIVAR_USUARIO', 'RESTABLECER_PASSWORD', 'CAMBIAR_PASSWORD', 'EDITAR_PERFIL', 'ACTUALIZAR_FOTO', 'ELIMINAR_FOTO'];
async function listarActividades(req, res) {
  try {
    const pagina = Math.max(1, Math.min(1000000, parseInt(req.query.pagina, 10) || 1));
    const limite = [10, 20, 50].includes(Number(req.query.limite)) ? Number(req.query.limite) : 10;
    const where = {};
    const accion = String(req.query.accion || 'Todos');
    if (accion !== 'Todos') {
      if (!ACCIONES.includes(accion)) return res.status(400).json({ mensaje: 'Acción inválida' });
      where.accion = accion;
    }
    const responsable = String(req.query.responsable || '').trim().slice(0, 100);
    if (responsable) where.responsableNombre = { [Op.like]: `%${responsable.replace(/[\%_]/g, '\\$&')}%` };
    const desde = String(req.query.desde || '');
    const hasta = String(req.query.hasta || '');
    if (desde && !/^\d{4}-\d{2}-\d{2}$/.test(desde)) return res.status(400).json({ mensaje: 'Fecha inicial inválida' });
    if (hasta && !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) return res.status(400).json({ mensaje: 'Fecha final inválida' });
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(`${desde}T00:00:00-05:00`);
      if (hasta) where.createdAt[Op.lte] = new Date(`${hasta}T23:59:59.999-05:00`);
      if (Object.values(where.createdAt).some(fecha => Number.isNaN(fecha.getTime()))) return res.status(400).json({ mensaje: 'Fecha inválida' });
    }
    const total = await Actividad.count({ where });
    const paginas = Math.max(1, Math.ceil(total / limite));
    const paginaActual = Math.min(pagina, paginas);
    const actividades = await Actividad.findAll({ where, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit: limite, offset: (paginaActual - 1) * limite });
    const hoy = new Date();
    const inicioHoy = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
    return res.json({ actividades, total, paginas, pagina: paginaActual, limite, totalHoy: await Actividad.count({ where: { createdAt: { [Op.gte]: inicioHoy } } }) });
  } catch (error) { console.error('Historial:', error); return res.status(500).json({ mensaje: 'No se pudo cargar el historial' }); }
}
module.exports = { registrarActividad, listarActividades };
