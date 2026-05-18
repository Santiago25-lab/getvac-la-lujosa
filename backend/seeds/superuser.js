import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import User from '../models/User.js';

async function seedSuperuser() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    // Verificar si ya existe el superusuario
    const existingUser = await User.findOne({ where: { username: 'superadmin' } });
    if (existingUser) {
      console.log('El superusuario ya existe.');
      process.exit(0);
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash('Admin123456*', 10);

    // Crear superusuario
    await User.create({
      username: 'superadmin',
      email: 'admin@staffflow.com',
      password: hashedPassword,
      fullName: 'Super Usuario',
      role: 'Super Usuario'
    });

    console.log('Superusuario creado con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear superusuario:', error);
    process.exit(1);
  }
}

seedSuperuser();
