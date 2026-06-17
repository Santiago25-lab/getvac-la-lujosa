import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Novelty = sequelize.define('Novelty', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'Incapacidad',
      'Licencia Maternidad',
      'Licencia Paternidad',
      'Licencia Luto',
      'Permiso Remunerado',
      'Permiso No Remunerado',
      'Suspensión',
      'Abandono de Cargo',
      'Otro'
    ),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Activa', 'Finalizada', 'Cancelada'),
    defaultValue: 'Activa',
    allowNull: false,
  },
  attachments: {
    type: DataTypes.JSON, // Array of file paths/URLs
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default Novelty;
