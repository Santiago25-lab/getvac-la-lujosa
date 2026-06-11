import sequelize from '../config/database.js';
import { Attendance, Vacation, Permission, Absence } from '../models/index.js';

const cleanDB = async () => {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    
    console.log('Limpiando tabla Attendance...');
    await Attendance.destroy({ where: {} });
    
    console.log('Limpiando tabla Vacation...');
    await Vacation.destroy({ where: {} });
    
    console.log('Limpiando tabla Permission...');
    await Permission.destroy({ where: {} });
    
    console.log('Limpiando tabla Absence...');
    await Absence.destroy({ where: {} });
    
    console.log('¡Base de datos limpiada exitosamente! Los empleados y configuración se mantienen.');
    process.exit(0);
  } catch (error) {
    console.error('Error al limpiar la base de datos:', error);
    process.exit(1);
  }
};

cleanDB();
