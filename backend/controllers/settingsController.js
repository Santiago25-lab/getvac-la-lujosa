import { Setting } from '../models/index.js';

export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      // Si no existe, crear la configuración por defecto
      setting = await Setting.create({
        daysRequiredForOneVacationDay: 24.333333333333332,
        checkInTime: '08:00',
        checkOutTime: '17:00',
        toleranceMinutes: 10,
        workDays: '1,2,3,4,5',
        updatedBy: 'Sistema (Inicial)'
      });
    }
    res.json(setting);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ message: 'Error al obtener la configuración.' });
  }
};

export const updateSettings = async (req, res) => {
  const { 
    daysRequiredForOneVacationDay, checkInTime, checkOutTime, toleranceMinutes, workDays, halfWorkDays,
    companyName, companyNit, companyAddress, companyPhone, companyEmail, companyLogo,
    vacationsSaturdaysCount, vacationsSundaysCount, isSplitShift,
    checkInTimeMorning, checkOutTimeMorning, checkInTimeAfternoon, checkOutTimeAfternoon
  } = req.body;

  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        daysRequiredForOneVacationDay: daysRequiredForOneVacationDay !== undefined ? parseFloat(daysRequiredForOneVacationDay) : 24.333333333333332,
        checkInTime: checkInTime || '08:00',
        checkOutTime: checkOutTime || '17:00',
        toleranceMinutes: toleranceMinutes !== undefined ? parseInt(toleranceMinutes) : 10,
        workDays: workDays || '1,2,3,4,5',
        halfWorkDays: halfWorkDays || '',
        companyName, companyNit, companyAddress, companyPhone, companyEmail, companyLogo,
        vacationsSaturdaysCount, vacationsSundaysCount, isSplitShift,
        checkInTimeMorning, checkOutTimeMorning, checkInTimeAfternoon, checkOutTimeAfternoon,
        updatedBy: req.user.fullName
      });
    } else {
      if (daysRequiredForOneVacationDay !== undefined) setting.daysRequiredForOneVacationDay = parseFloat(daysRequiredForOneVacationDay);
      if (checkInTime !== undefined) setting.checkInTime = checkInTime;
      if (checkOutTime !== undefined) setting.checkOutTime = checkOutTime;
      if (toleranceMinutes !== undefined) setting.toleranceMinutes = parseInt(toleranceMinutes);
      if (workDays !== undefined) setting.workDays = workDays;
      if (halfWorkDays !== undefined) setting.halfWorkDays = halfWorkDays;
      if (companyName !== undefined) setting.companyName = companyName;
      if (companyNit !== undefined) setting.companyNit = companyNit;
      if (companyAddress !== undefined) setting.companyAddress = companyAddress;
      if (companyPhone !== undefined) setting.companyPhone = companyPhone;
      if (companyEmail !== undefined) setting.companyEmail = companyEmail;
      if (companyLogo !== undefined) setting.companyLogo = companyLogo;
      if (vacationsSaturdaysCount !== undefined) setting.vacationsSaturdaysCount = vacationsSaturdaysCount;
      if (vacationsSundaysCount !== undefined) setting.vacationsSundaysCount = vacationsSundaysCount;
      if (isSplitShift !== undefined) setting.isSplitShift = isSplitShift;
      if (checkInTimeMorning !== undefined) setting.checkInTimeMorning = checkInTimeMorning;
      if (checkOutTimeMorning !== undefined) setting.checkOutTimeMorning = checkOutTimeMorning;
      if (checkInTimeAfternoon !== undefined) setting.checkInTimeAfternoon = checkInTimeAfternoon;
      if (checkOutTimeAfternoon !== undefined) setting.checkOutTimeAfternoon = checkOutTimeAfternoon;
      
      setting.updatedBy = req.user.fullName;
      await setting.save();
    }

    res.json({
      message: 'Configuración actualizada exitosamente.',
      setting
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ message: 'Error al actualizar la configuración.' });
  }
};
