
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Usuarios', {
            id: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },

            nombre: {
                type: Sequelize.STRING(100),
                allowNull: false
            },

            correo: {
                type: Sequelize.STRING(150),
                allowNull: false,
                unique: true
            },

            password: {
                type: Sequelize.STRING(255),
                allowNull: false
            },

            rol: {
                type: Sequelize.ENUM('Administrador', 'Usuario'),
                allowNull: false,
                defaultValue: 'Usuario'
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('Usuarios');
    }
};
