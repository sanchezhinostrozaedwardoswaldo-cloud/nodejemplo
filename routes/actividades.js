const router = require('express').Router();
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');
const { listarActividades } = require('../controllers/actividadController');
router.get('/', verificarToken, verificarRol('Administrador'), listarActividades);
module.exports = router;
