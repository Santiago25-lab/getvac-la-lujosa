import cron from 'node-cron';
import { Vacation } from '../models/index.js';
import { Op } from 'sequelize';
import { todayBogota } from '../utils/laborLaw.js';

// Avanza los estados según la fecha de hoy. `endDate` es el último día de descanso (inclusive).
export const updateVacationStatuses = async () => {
  const todayStr = todayBogota();

  // Una programada que ya terminó (p. ej. el servidor estuvo apagado) pasa directo a Finalizada.
  const [scheduledToFinished] = await Vacation.update(
    { status: 'Finalizada' },
    { where: { status: { [Op.in]: ['Programada', 'En disfrute'] }, endDate: { [Op.lt]: todayStr } } }
  );

  const [scheduledToActive] = await Vacation.update(
    { status: 'En disfrute' },
    { where: { status: 'Programada', startDate: { [Op.lte]: todayStr }, endDate: { [Op.gte]: todayStr } } }
  );

  if (scheduledToFinished || scheduledToActive) {
    console.log(`Vacaciones actualizadas: ${scheduledToActive} en disfrute, ${scheduledToFinished} finalizadas.`);
  }
};

export const startVacationCronJob = () => {
  // Ejecutar todos los días a las 00:01 AM
  cron.schedule('1 0 * * *', async () => {
    try {
      await updateVacationStatuses();
    } catch (error) {
      console.error('Cron: Error al actualizar estados de vacaciones', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Bogota'
  });

  console.log('✅ Tarea en segundo plano (Cron) para Vacaciones iniciada.');
};
