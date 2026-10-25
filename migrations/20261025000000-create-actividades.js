
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Actividades', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      responsableId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      responsableNombre: { type: Sequelize.STRING(100), allowNull: false },
      accion: { type: Sequelize.STRING(50), allowNull: false },
      objetivoId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      objetivoNombre: { type: Sequelize.STRING(100), allowNull: true },
      detalle: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('Actividades', ['createdAt']);
    await queryInterface.addIndex('Actividades', ['accion']);
    await queryInterface.addIndex('Actividades', ['responsableId']);
  },
  async down(queryInterface) { await queryInterface.dropTable('Actividades'); }
};
