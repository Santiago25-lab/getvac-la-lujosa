import { CompanyHoliday } from '../models/index.js';

export const getCompanyHolidays = async (req, res) => {
  try {
    const holidays = await CompanyHoliday.findAll({
      order: [['date', 'ASC']]
    });
    res.json(holidays);
  } catch (error) {
    console.error('Error al obtener días no laborables de la empresa:', error);
    res.status(500).json({ message: 'Error al obtener los días no laborables de la empresa.' });
  }
};

export const createCompanyHoliday = async (req, res) => {
  const { date, reason } = req.body;

  try {
    if (!date || !reason) {
      return res.status(400).json({ message: 'La fecha y el motivo son obligatorios.' });
    }

    // Verificar si ya existe
    const existing = await CompanyHoliday.findOne({ where: { date } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un día no laborable registrado para esta fecha.' });
    }

    const newHoliday = await CompanyHoliday.create({ date, reason });
    res.status(201).json({
      message: 'Día no laborable registrado exitosamente.',
      holiday: newHoliday
    });
  } catch (error) {
    console.error('Error al crear día no laborable:', error);
    res.status(500).json({ message: 'Error interno al registrar el día no laborable.' });
  }
};

export const deleteCompanyHoliday = async (req, res) => {
  const { id } = req.params;

  try {
    const holiday = await CompanyHoliday.findByPk(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Día no laborable no encontrado.' });
    }

    await holiday.destroy();
    res.json({ message: 'Día no laborable eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar día no laborable:', error);
    res.status(500).json({ message: 'Error al eliminar el día no laborable.' });
  }
};
