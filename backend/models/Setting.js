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
  healthCompanyPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 8.5,
    allowNull: false,
  },
  pensionCompanyPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 12.0,
    allowNull: false,
  },
  compensationFundPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 4.0,
    allowNull: false,
  },
  arlRisk1Percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.522,
    allowNull: false,
  },
  arlRisk2Percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 1.044,
    allowNull: false,
  },
  arlRisk3Percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 2.436,
    allowNull: false,
  },
  arlRisk4Percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 4.350,
    allowNull: false,
  },
  arlRisk5Percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 6.960,
    allowNull: false,
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
