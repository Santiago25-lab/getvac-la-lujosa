import { SpecialWorkday } from '../models/index.js';

export const getSpecialWorkdays = async (req, res) => {
  try {
    const specialWorkdays = await SpecialWorkday.findAll({
      order: [['date', 'ASC']]
    });
    res.json(specialWorkdays);
  } catch (error) {
    console.error('Error al obtener jornadas especiales:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const createSpecialWorkday = async (req, res) => {
  const { date, type, startTime, endTime, observation } = req.body;
  try {
    const existing = await SpecialWorkday.findOne({ where: { date } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe una jornada especial para esta fecha.' });
    }
    const newSpecialWorkday = await SpecialWorkday.create({
      date,
      type,
      startTime: type !== 'No Laborable' ? startTime : null,
      endTime: type !== 'No Laborable' ? endTime : null,
      observation
    });
    res.status(201).json({ message: 'Jornada especial creada con éxito.', specialWorkday: newSpecialWorkday });
  } catch (error) {
    console.error('Error al crear jornada especial:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const updateSpecialWorkday = async (req, res) => {
  const { id } = req.params;
  const { date, type, startTime, endTime, observation } = req.body;
  try {
    const specialWorkday = await SpecialWorkday.findByPk(id);
    if (!specialWorkday) {
      return res.status(404).json({ message: 'Jornada especial no encontrada.' });
    }
    
    // Check if updating to a date that already exists (and is not this one)
    if (date !== specialWorkday.date) {
      const existing = await SpecialWorkday.findOne({ where: { date } });
      if (existing) {
        return res.status(400).json({ message: 'Ya existe una jornada especial para esta fecha.' });
      }
    }

    specialWorkday.date = date;
    specialWorkday.type = type;
    specialWorkday.startTime = type !== 'No Laborable' ? startTime : null;
    specialWorkday.endTime = type !== 'No Laborable' ? endTime : null;
    specialWorkday.observation = observation;

    await specialWorkday.save();
    res.json({ message: 'Jornada especial actualizada con éxito.', specialWorkday });
  } catch (error) {
    console.error('Error al actualizar jornada especial:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const deleteSpecialWorkday = async (req, res) => {
  const { id } = req.params;
  try {
    const specialWorkday = await SpecialWorkday.findByPk(id);
    if (!specialWorkday) {
      return res.status(404).json({ message: 'Jornada especial no encontrada.' });
    }
    await specialWorkday.destroy();
    res.json({ message: 'Jornada especial eliminada con éxito.' });
  } catch (error) {
    console.error('Error al eliminar jornada especial:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
