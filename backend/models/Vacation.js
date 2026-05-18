import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Vacation = sequelize.define('Vacation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  returnDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  businessDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Programada', 'Activa', 'Completada'),
    allowNull: false,
    defaultValue: 'Programada',
  },
}, {
  timestamps: true,
});

export default Vacation;
