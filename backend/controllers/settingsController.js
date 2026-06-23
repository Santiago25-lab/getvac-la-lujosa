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
    checkInTimeMorning, checkOutTimeMorning, checkInTimeAfternoon, checkOutTimeAfternoon,
    healthCompanyPercentage, pensionCompanyPercentage, compensationFundPercentage,
    arlRisk1Percentage, arlRisk2Percentage, arlRisk3Percentage, arlRisk4Percentage, arlRisk5Percentage
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
        healthCompanyPercentage: healthCompanyPercentage !== undefined ? parseFloat(healthCompanyPercentage) : 8.5,
        pensionCompanyPercentage: pensionCompanyPercentage !== undefined ? parseFloat(pensionCompanyPercentage) : 12.0,
        compensationFundPercentage: compensationFundPercentage !== undefined ? parseFloat(compensationFundPercentage) : 4.0,
        arlRisk1Percentage: arlRisk1Percentage !== undefined ? parseFloat(arlRisk1Percentage) : 0.522,
        arlRisk2Percentage: arlRisk2Percentage !== undefined ? parseFloat(arlRisk2Percentage) : 1.044,
        arlRisk3Percentage: arlRisk3Percentage !== undefined ? parseFloat(arlRisk3Percentage) : 2.436,
        arlRisk4Percentage: arlRisk4Percentage !== undefined ? parseFloat(arlRisk4Percentage) : 4.350,
        arlRisk5Percentage: arlRisk5Percentage !== undefined ? parseFloat(arlRisk5Percentage) : 6.960,
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
      if (healthCompanyPercentage !== undefined) setting.healthCompanyPercentage = parseFloat(healthCompanyPercentage);
      if (pensionCompanyPercentage !== undefined) setting.pensionCompanyPercentage = parseFloat(pensionCompanyPercentage);
      if (compensationFundPercentage !== undefined) setting.compensationFundPercentage = parseFloat(compensationFundPercentage);
      if (arlRisk1Percentage !== undefined) setting.arlRisk1Percentage = parseFloat(arlRisk1Percentage);
      if (arlRisk2Percentage !== undefined) setting.arlRisk2Percentage = parseFloat(arlRisk2Percentage);
      if (arlRisk3Percentage !== undefined) setting.arlRisk3Percentage = parseFloat(arlRisk3Percentage);
      if (arlRisk4Percentage !== undefined) setting.arlRisk4Percentage = parseFloat(arlRisk4Percentage);
      if (arlRisk5Percentage !== undefined) setting.arlRisk5Percentage = parseFloat(arlRisk5Percentage);
      
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
