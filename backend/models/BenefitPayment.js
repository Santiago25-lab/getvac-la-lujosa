import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BenefitPayment = sequelize.define('BenefitPayment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Employees',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'Prima', 
      'Cesantías', 
      'Intereses de Cesantías', 
      'Vacaciones'
    ),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  periodStart: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  periodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  registeredBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'BenefitPayments',
  timestamps: true
});

export default BenefitPayment;
