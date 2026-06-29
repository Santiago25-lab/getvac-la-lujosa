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
  endDate: {
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
  tipoDisfrute: {
    type: DataTypes.ENUM('Físico', 'Dinero', 'Mixto'),
    allowNull: false,
    defaultValue: 'Físico',
  },
  calendarDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fechaNotificacion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  responsableAprobacion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fechaSuspension: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  motivoSuspension: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fechaReanudacion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Pendiente', 'Aprobada', 'Programada', 'En disfrute', 'Suspendida', 'Finalizada', 'Cancelada'),
    allowNull: false,
    defaultValue: 'Programada',
  },
}, {
  timestamps: true,
});

export default Vacation;
