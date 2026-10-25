
'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];

const db = {};

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
);

// Cargar automáticamente los modelos
fs.readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.endsWith('.js') &&
            !file.endsWith('.test.js')
        );
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(
            sequelize,
            Sequelize.DataTypes
        );

        db[model.name] = model;
    });

// Configurar asociaciones entre modelos, si existen
Object.keys(db).forEach(modelName => {
    if (typeof db[modelName].associate === 'function') {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
