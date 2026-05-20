import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Recursos Humanos',
    allowNull: false,
    validate: {
      isIn: [['Administrador', 'Recursos Humanos', 'Super Usuario']]
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'activo',
    allowNull: false,
    validate: {
      isIn: [['activo', 'inactivo']]
    }
  },
}, {
  timestamps: true,
});

export default User;
