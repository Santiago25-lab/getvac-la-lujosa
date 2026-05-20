import sequelize from '../config/database.js';
import User from './User.js';
import Employee from './Employee.js';
import Vacation from './Vacation.js';
import Setting from './Setting.js';
import Attendance from './Attendance.js';
import Permission from './Permission.js';
import Absence from './Absence.js';
import Department from './Department.js';
import AuditLog from './AuditLog.js';
import CompanyHoliday from './CompanyHoliday.js';

// Relaciones
Employee.hasMany(Vacation, { foreignKey: 'employeeId', as: 'vacations', onDelete: 'CASCADE' });
Vacation.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances', onDelete: 'CASCADE' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Permission, { foreignKey: 'employeeId', as: 'permissions', onDelete: 'CASCADE' });
Permission.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Absence, { foreignKey: 'employeeId', as: 'absences', onDelete: 'CASCADE' });
Absence.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

export {
  sequelize,
  User,
  Employee,
  Vacation,
  Setting,
  Attendance,
  Permission,
  Absence,
  Department,
  AuditLog,
  CompanyHoliday
};

