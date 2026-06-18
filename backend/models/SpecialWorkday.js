import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SpecialWorkday = sequelize.define('SpecialWorkday', {
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
  type: {
    type: DataTypes.ENUM('Normal', 'Media Jornada', 'Jornada Continua', 'No Laborable'),
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: true, // required if not No Laborable
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  observation: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
});

export default SpecialWorkday;
