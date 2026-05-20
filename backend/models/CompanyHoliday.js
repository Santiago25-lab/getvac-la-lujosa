import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CompanyHoliday = sequelize.define('CompanyHoliday', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default CompanyHoliday;
