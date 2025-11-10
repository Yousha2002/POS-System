// src/routes/menus.js
import express from 'express';
import {
  getAllMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu
} from '../controllers/menuController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllMenus);
router.get('/:id', authenticate, getMenuById);
router.post('/', authenticate, createMenu);
router.put('/:id', authenticate, updateMenu);
router.delete('/:id', authenticate, deleteMenu);

export default router;