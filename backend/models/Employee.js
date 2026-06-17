import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  documentNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hireDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo',
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profilePicture: {
    type: DataTypes.TEXT, // Almacenamiento flexible (Base64 / Path / URL)
    allowNull: true,
  },
  contractType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  baseSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  appliesVacationCalculation: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  isLegacy: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  lastVacationCutoffDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  lastVacationEnjoyedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  initialPendingVacationBalance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default Employee;
