import Novelty from '../models/Novelty.js';
import Employee from '../models/Employee.js';
import AuditLog from '../models/AuditLog.js';
import { Op } from 'sequelize';

export const createNovelty = async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, observations } = req.body;
    
    // Validar datos básicos
    if (!employeeId || !type || !startDate || !endDate) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser llenados' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'La fecha de inicio no puede ser mayor a la fecha de fin' });
    }

    // Validar cruces de fechas con otras novedades
    const overlappingNovelty = await Novelty.findOne({
      where: {
        employeeId,
        status: { [Op.ne]: 'Cancelada' },
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (overlappingNovelty) {
      return res.status(400).json({ message: 'Ya existe una novedad para este empleado en las fechas especificadas' });
    }

    // Procesar archivos adjuntos
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => `/uploads/novelties/${file.filename}`);
    }

    const newNovelty = await Novelty.create({
      employeeId,
      type,
      startDate,
      endDate,
      observations,
      attachments
    });

    // Auditoría
    if (req.user) {
      await AuditLog.create({
        userId: req.user.id,
        username: req.user.username,
        action: 'Crear',
        target: 'Novedad',
        targetId: newNovelty.id.toString(),
        details: `Novedad creada: ${type} para el empleado ID ${employeeId}`
      });
    }

    // TODO: Aquí podríamos despachar un evento o llamar a una función para recalcular asistencias (Fase 2 extendida)

    res.status(201).json({ message: 'Novedad creada exitosamente', novelty: newNovelty });
  } catch (error) {
    console.error('Error al crear novedad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getNovelties = async (req, res) => {
  try {
    const novelties = await Novelty.findAll({
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'fullName', 'documentNumber', 'department']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(novelties);
  } catch (error) {
    console.error('Error al obtener novedades:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateNovelty = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, startDate, endDate, observations, status } = req.body;

    const novelty = await Novelty.findByPk(id);
    if (!novelty) {
      return res.status(404).json({ message: 'Novedad no encontrada' });
    }

    // Validar cruces solo si cambian las fechas y no está cancelada
    if ((startDate !== novelty.startDate || endDate !== novelty.endDate) && status !== 'Cancelada') {
      const overlappingNovelty = await Novelty.findOne({
        where: {
          employeeId: novelty.employeeId,
          id: { [Op.ne]: id },
          status: { [Op.ne]: 'Cancelada' },
          [Op.or]: [
            { startDate: { [Op.between]: [startDate, endDate] } },
            { endDate: { [Op.between]: [startDate, endDate] } },
            {
              [Op.and]: [
                { startDate: { [Op.lte]: startDate } },
                { endDate: { [Op.gte]: endDate } }
              ]
            }
          ]
        }
      });

      if (overlappingNovelty) {
        return res.status(400).json({ message: 'Ya existe una novedad para este empleado en las nuevas fechas especificadas' });
      }
    }

    // Mantener adjuntos existentes y agregar nuevos
    let currentAttachments = novelty.attachments || [];
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => `/uploads/novelties/${file.filename}`);
      currentAttachments = [...currentAttachments, ...newAttachments];
    }

    await novelty.update({
      type: type || novelty.type,
      startDate: startDate || novelty.startDate,
      endDate: endDate || novelty.endDate,
      observations: observations !== undefined ? observations : novelty.observations,
      status: status || novelty.status,
      attachments: currentAttachments
    });

    if (req.user) {
      await AuditLog.create({
        userId: req.user.id,
        username: req.user.username,
        action: 'Actualizar',
        target: 'Novedad',
        targetId: novelty.id.toString(),
        details: `Novedad editada: Estado cambiado a ${status}`
      });
    }

    res.json({ message: 'Novedad actualizada exitosamente', novelty });
  } catch (error) {
    console.error('Error al actualizar novedad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteNovelty = async (req, res) => {
  // Según requerimientos "cancelar" es la acción preferida sobre eliminar
  try {
    const { id } = req.params;
    const novelty = await Novelty.findByPk(id);
    
    if (!novelty) {
      return res.status(404).json({ message: 'Novedad no encontrada' });
    }

    await novelty.update({ status: 'Cancelada' });

    if (req.user) {
      await AuditLog.create({
        userId: req.user.id,
        username: req.user.username,
        action: 'Cancelar',
        target: 'Novedad',
        targetId: novelty.id.toString(),
        details: `Novedad cancelada`
      });
    }

    res.json({ message: 'Novedad cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar novedad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
