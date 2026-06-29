import Novelty from '../models/Novelty.js';
import Employee from '../models/Employee.js';
import AuditLog from '../models/AuditLog.js';
import Attendance from '../models/Attendance.js';
import Vacation from '../models/Vacation.js';
import { Op } from 'sequelize';
import { registerVacation } from './vacationController.js';

export const createNovelty = async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, observations, reason, coverage, diasATomar, tipoDisfrute } = req.body;
    const observationsText = observations || reason || '';
    
    // Si la novedad es Vacaciones, enrutar a Vacation y crear ausencias si es físico
    if (type === 'Vacaciones') {
      req.body.endDate = endDate; // El frontend envía la calculada en endDate
      req.body.notes = observationsText;
      req.body.businessDays = diasATomar;
      req.body.tipoDisfrute = tipoDisfrute || 'Físico';
      req.body.calendarDays = diasATomar;
      
      // Mockear la response para atraparla
      let vacationResult = null;
      let vacationError = null;
      let vacationStatus = 200;
      
      const mockRes = {
        status: (code) => {
          vacationStatus = code;
          return mockRes;
        },
        json: (data) => {
          if (vacationStatus >= 400) {
            vacationError = data;
          } else {
            vacationResult = data;
          }
        }
      };
      
      await registerVacation(req, mockRes);
      
      if (vacationError) {
        return res.status(vacationStatus).json(vacationError);
      }

      const newVacation = vacationResult.vacation;

      // Generar ausencias si es físico
      if (tipoDisfrute === 'Físico') {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        
        let current = new Date(start);
        while (current < end) { // El endDate es endDate, es decir, día de regreso
          const dateStr = current.toISOString().split('T')[0];
          
          let att = await Attendance.findOne({ where: { employeeId, date: dateStr } });
          if (!att) {
            att = await Attendance.create({
              employeeId,
              date: dateStr,
              status: 'Vacaciones',
              notes: `Vacaciones físicas aprobadas (Ref: Vacación #${newVacation.id})`
            });
          } else {
            att.status = 'Vacaciones';
            att.notes = `Vacaciones físicas aprobadas (Ref: Vacación #${newVacation.id})`;
            await att.save();
          }
          current.setDate(current.getDate() + 1);
        }
      }

      return res.status(201).json({ message: 'Vacaciones registradas exitosamente en el sistema principal', novelty: newVacation });
    }
    
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
      observations: observationsText,
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

    // Fase 2: Recalcular Asistencias Retroactivamente
    // Buscar si hay inasistencias en este rango de fechas y justificarlas
    const attendancesToUpdate = await Attendance.findAll({
      where: {
        employeeId,
        date: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.in]: ['Ausente', 'Presente', 'Tarde']
        }
      }
    });

    for (const att of attendancesToUpdate) {
      const oldStatus = att.status;
      att.status = 'Ausencia Justificada';
      att.notes = `Justificada por Novedad #${newNovelty.id} (${type}): ${observationsText}`.trim();
      await att.save();

      // Dejar rastro en auditoría de este cambio retroactivo
      if (req.user) {
        await AuditLog.create({
          userId: req.user.id,
          username: req.user.username,
          action: 'Actualizar',
          target: 'Asistencia',
          targetId: att.id.toString(),
          details: `Asistencia del ${att.date} pasó de ${oldStatus} a Ausencia Justificada debido a la Novedad #${newNovelty.id}`
        });
      }
    }

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

    const vacations = await Vacation.findAll({
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'fullName', 'documentNumber', 'department']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Mappear las vacaciones para que la vista las entienda como Novedad
    const mappedVacations = vacations.map(v => ({
      id: `vac-${v.id}`, // Prefijo para evitar colisiones en keys de React
      employeeId: v.employeeId,
      employee: v.employee,
      type: 'Vacaciones',
      startDate: v.startDate,
      endDate: v.endDate,
      reason: v.notes || `Disfrute ${v.tipoDisfrute}`,
      status: v.status === 'En disfrute' || v.status === 'Programada' ? 'Activa' 
             : v.status === 'Cancelada' ? 'Rechazada' 
             : 'Historico',
      coverage: `${v.businessDays} días hábiles`,
      createdAt: v.createdAt,
      attachments: []
    }));

    const combined = [...novelties, ...mappedVacations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(combined);
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
