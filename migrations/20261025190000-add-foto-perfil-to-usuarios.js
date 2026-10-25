'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Usuarios', 'fotoPerfil', { type: Sequelize.STRING(255), allowNull: true, defaultValue: null });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Usuarios', 'fotoPerfil');
  }
};
