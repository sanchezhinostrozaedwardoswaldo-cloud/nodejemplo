
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Actividad extends Model {}
  Actividad.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    responsableId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    responsableNombre: { type: DataTypes.STRING(100), allowNull: false },
    accion: { type: DataTypes.STRING(50), allowNull: false },
    objetivoId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    objetivoNombre: { type: DataTypes.STRING(100), allowNull: true },
    detalle: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' }
  }, { sequelize, modelName: 'Actividad', tableName: 'Actividades', timestamps: true, updatedAt: false, indexes: [{ fields: ['createdAt'] }, { fields: ['accion'] }, { fields: ['responsableId'] }] });
  return Actividad;
};
