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
  // 'auto': valor legal si devenga hasta 2 SMMLV · 'ninguno': la empresa da el transporte o hay teletrabajo
  // · 'manual': se usa `transportAllowance` (valor pactado)
  transportAllowanceMode: {
    type: DataTypes.STRING,
    defaultValue: 'auto',
    allowNull: false,
  },
  transportAllowance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  // Art. 132 CST: salario integral (mínimo 13 SMMLV, sin prima ni cesantías)
  integralSalary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  arlRiskLevel: {
    type: DataTypes.ENUM('Riesgo I', 'Riesgo II', 'Riesgo III', 'Riesgo IV', 'Riesgo V'),
    defaultValue: 'Riesgo I',
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
  initialCesantiasBalance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  initialPrimaDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Fecha real de terminación del contrato: base de la liquidación (Arts. 189 y 249 CST)
  terminationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  terminationReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Art. 190 CST: técnicos, especializados, de confianza o extranjeros pueden acumular hasta 4 años
  extendedVacationAccumulation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default Employee;
