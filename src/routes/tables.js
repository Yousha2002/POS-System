// src/routes/tables.js
import express from 'express';
import {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
} from '../controllers/tableController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, getAllTables);
router.get('/:id', authenticate, getTableById);
router.post('/', authenticate, createTable);
router.put('/:id', authenticate, updateTable);
router.delete('/:id', authenticate, deleteTable);

export default router;