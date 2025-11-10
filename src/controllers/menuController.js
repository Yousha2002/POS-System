import { Menu } from '../models/index.js';

export const getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.findAll({
      order: [['name', 'ASC']]
    });
    res.json(menus);
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createMenu = async (req, res) => {
  try {
    const { name, price } = req.body;
    const menu = await Menu.create({ name, price });
    res.status(201).json(menu);
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMenu = async (req, res) => {
  try {
    const { name, price } = req.body;
    const menu = await Menu.findByPk(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    await menu.update({ name, price });
    res.json(menu);
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    await menu.destroy();
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};