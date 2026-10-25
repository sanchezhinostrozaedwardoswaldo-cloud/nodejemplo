
const { body, param, validationResult } = require('express-validator');

// Procesar errores de validación
const validar = (req, res, next) => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        return res.status(400).json({
            mensaje: 'Error de validación',
            errores: errores.array().map(error => ({
                campo: error.path,
                mensaje: error.msg
            }))
        });
    }

    next();
};

// Validaciones para registrar usuarios
const validarRegistro = [
    body('nombre')
        .isString().withMessage('El nombre debe ser texto')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    body('correo')
        .isString().withMessage('El correo debe ser texto')
        .trim()
        .isEmail().withMessage('Ingresa un correo válido')
        .isLength({ max: 150 })
        .withMessage('El correo es demasiado largo')
        .normalizeEmail(),

    body('password')
        .isString().withMessage('La contraseña debe ser texto')
        .isLength({ min: 8, max: 72 })
        .withMessage('La contraseña debe tener entre 8 y 72 caracteres'),

    body('rol')
        .optional()
        .isIn(['Administrador', 'Usuario'])
        .withMessage('Rol no válido'),

    validar
];

// Validaciones para iniciar sesión
const validarLogin = [
    body('correo')
        .isString().withMessage('El correo debe ser texto')
        .trim()
        .isEmail().withMessage('Correo inválido')
        .normalizeEmail(),

    body('password')
        .isString().withMessage('La contraseña debe ser texto')
        .notEmpty().withMessage('La contraseña es obligatoria'),

    validar
];

// Validaciones para actualizar usuarios
const validarActualizacion = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un entero positivo'),

    body('nombre')
        .isString().withMessage('El nombre debe ser texto')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    body('correo')
        .isString().withMessage('El correo debe ser texto')
        .trim()
        .isEmail().withMessage('Correo inválido')
        .isLength({ max: 150 })
        .withMessage('El correo es demasiado largo')
        .normalizeEmail(),

    validar
];

// Validar ID de usuario
const validarId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de usuario inválido'),

    validar
];

// Validar cambio de contraseña
const validarCambioPassword = [
    body('passwordActual')
        .isString()
        .withMessage('La contraseña actual debe ser texto')
        .notEmpty()
        .withMessage('La contraseña actual es obligatoria'),

    body('passwordNueva')
        .isString()
        .withMessage('La nueva contraseña debe ser texto')
        .isLength({ min: 8, max: 72 })
        .withMessage('La nueva contraseña debe tener entre 8 y 72 caracteres'),

    validar
];

// Validar restablecimiento de contraseña por administrador
const validarRestablecimientoPassword = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID del usuario debe ser un entero positivo'),

    body('passwordNueva')
        .isString()
        .withMessage('La nueva contraseña debe ser texto')
        .isLength({ min: 8, max: 72 })
        .withMessage('La nueva contraseña debe tener entre 8 y 72 caracteres'),

    validar
];


module.exports = {
    validarRegistro,
    validarLogin,
    validarActualizacion,
    validarId,
    validarCambioPassword,
    validarRestablecimientoPassword
};

