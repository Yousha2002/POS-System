import { Table } from '../models/index.js';

export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.findAll({
      order: [['tableNumber', 'ASC']]
    });
    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTableById = async (req, res) => {
  try {
    const table = await Table.findByPk(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    const table = await Table.create({ tableNumber });
    res.status(201).json(table);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    const table = await Table.findByPk(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    await table.update({ tableNumber });
    res.json(table);
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByPk(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    await table.destroy();
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};