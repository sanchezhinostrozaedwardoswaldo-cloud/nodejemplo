
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./models');

const usuariosRouter = require('./routes/usuarios');
const authRouter = require('./routes/auth');
const actividadesRouter = require('./routes/actividades');

const app = express();

// Seguridad básica
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                imgSrc: ["'self'", "data:", "blob:"]
            }
        }
    })
);
app.use(cors());
app.use(express.json());

// Archivos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/usuarios', usuariosRouter);
app.use('/api/auth', authRouter);
app.use('/api/actividades', actividadesRouter);

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        await sequelize.authenticate();

        console.log('Conexión a MySQL mediante Sequelize exitosa');

        app.listen(PORT, () => {
            console.log(`Servidor activo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);
        process.exitCode = 1;
    }
}

iniciarServidor();
