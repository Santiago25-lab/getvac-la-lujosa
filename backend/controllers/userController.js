import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios.' });
  }
};

export const createUser = async (req, res) => {
  const { username, email, password, fullName, role, status } = req.body;
  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      role,
      status: status || 'activo'
    });

    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario.' });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, fullName, role, status } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Protect superadmin from deactivation or role changes
    if (user.username === 'superadmin') {
      if (role && role !== 'Super Usuario') {
        return res.status(400).json({ message: 'No se puede cambiar el rol del Superusuario principal.' });
      }
      if (status && status === 'inactivo') {
        return res.status(400).json({ message: 'No se puede desactivar al Superusuario principal.' });
      }
    }

    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
      }
      user.email = email;
    }

    user.fullName = fullName || user.fullName;
    user.role = role || user.role;
    user.status = status || user.status;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario.' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Prevent deleting self
    if (req.user.id === user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario.' });
    }

    // Prevent deleting superadmin
    if (user.username === 'superadmin') {
      return res.status(400).json({ message: 'No se puede eliminar al Superusuario principal.' });
    }

    await user.destroy();
    res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario.' });
  }
};
