import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  daysRequiredForOneVacationDay: {
    type: DataTypes.FLOAT,
    defaultValue: 24.333333333333332,
    allowNull: false,
  },
  checkInTime: {
    type: DataTypes.STRING,
    defaultValue: '08:00',
    allowNull: false,
  },
  checkOutTime: {
    type: DataTypes.STRING,
    defaultValue: '17:00',
    allowNull: false,
  },
  toleranceMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    allowNull: false,
  },
  workDays: {
    type: DataTypes.STRING,
    defaultValue: '1,2,3,4,5', // 1=Lunes, 5=Viernes
    allowNull: false,
  },
  halfWorkDays: {
    type: DataTypes.STRING,
    defaultValue: '', // Días de media jornada (ej: '6')
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyNit: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyLogo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  vacationsSaturdaysCount: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  vacationsSundaysCount: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isSplitShift: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  checkInTimeMorning: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  checkOutTimeMorning: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  checkInTimeAfternoon: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  checkOutTimeAfternoon: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default Setting;
