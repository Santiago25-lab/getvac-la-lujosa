import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { createLog } from './auditLogController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gestvac_super_secret_key_2026';

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
    }



    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    if (user.status === 'inactivo') {
      return res.status(403).json({ message: 'Su cuenta ha sido desactivada. Comuníquese con el Super Usuario.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Registrar en auditoría
    createLog(user.id, user.username, 'LOGIN', 'auth', user.id.toString(), 'Inicio de sesión exitoso');

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getProfile = async (req, res) => {
  try {

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el perfil.' });
  }
};
