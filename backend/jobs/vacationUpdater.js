import cron from 'node-cron';
import { Vacation } from '../models/index.js';
import { Op } from 'sequelize';

export const startVacationCronJob = () => {
  // Ejecutar todos los días a las 00:01 AM
  cron.schedule('1 0 * * *', async () => {
    console.log('--- CRON JOB: Evaluando y actualizando estados de vacaciones ---');
    try {
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

      // 1. Pasar "Programada" a "En disfrute" si ya llegó la fecha de inicio
      const pendingToActive = await Vacation.update(
        { status: 'En disfrute' },
        {
          where: {
            status: 'Programada',
            startDate: { [Op.lte]: todayStr }
          }
        }
      );

      // 2. Pasar "En disfrute" a "Finalizada" si ya llegó o pasó la fecha de regreso
      const activeToFinished = await Vacation.update(
        { status: 'Finalizada' },
        {
          where: {
            status: 'En disfrute',
            returnDate: { [Op.lte]: todayStr }
          }
        }
      );

      console.log(`Cron: Vacaciones pasadas a "En disfrute": ${pendingToActive[0]}`);
      console.log(`Cron: Vacaciones pasadas a "Finalizada": ${activeToFinished[0]}`);
      
    } catch (error) {
      console.error('Cron: Error al actualizar estados de vacaciones', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Bogota"
  });

  console.log('✅ Tarea en segundo plano (Cron) para Vacaciones iniciada.');
};
