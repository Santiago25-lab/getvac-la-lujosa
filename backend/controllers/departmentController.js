import { Department } from '../models/index.js';

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    res.status(500).json({ message: 'Error al obtener departamentos.' });
  }
};

export const createDepartment = async (req, res) => {
  const { name } = req.body;
  try {
    const existing = await Department.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'El departamento ya existe.' });
    }
    const department = await Department.create({ name });
    res.status(201).json(department);
  } catch (error) {
    console.error('Error al crear departamento:', error);
    res.status(500).json({ message: 'Error al crear departamento.' });
  }
};

export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Departamento no encontrado.' });
    }
    department.name = name;
    await department.save();
    res.json(department);
  } catch (error) {
    console.error('Error al actualizar departamento:', error);
    res.status(500).json({ message: 'Error al actualizar departamento.' });
  }
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Departamento no encontrado.' });
    }
    await department.destroy();
    res.json({ message: 'Departamento eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar departamento:', error);
    res.status(500).json({ message: 'Error al eliminar departamento.' });
  }
};
