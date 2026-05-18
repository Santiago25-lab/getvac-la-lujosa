import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  checkIn: {
    type: DataTypes.STRING, // Almacenado como 'HH:MM:SS'
    allowNull: false,
  },
  checkOut: {
    type: DataTypes.STRING, // Almacenado como 'HH:MM:SS'
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Presente', 'Tarde', 'Ausente', 'Salida registrada', 'Sin salida'),
    defaultValue: 'Presente',
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default Attendance;
