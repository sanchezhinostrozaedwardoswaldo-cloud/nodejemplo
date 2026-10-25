
'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Usuario extends Model {}

    Usuario.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            nombre: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            correo: {
                type: DataTypes.STRING(150),
                allowNull: false,
                unique: true
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false
            },
            rol: {
                type: DataTypes.ENUM('Administrador', 'Usuario'),
                allowNull: false,
                defaultValue: 'Usuario'
            },
            
            activo: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            fotoPerfil: {
                type: DataTypes.STRING(255),
                allowNull: true,
                defaultValue: null
            },
            tokenVersion: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0
            }
        },
        {
            sequelize,
            modelName: 'Usuario',
            tableName: 'Usuarios',
            timestamps: true
        }
    );

    return Usuario;
};
