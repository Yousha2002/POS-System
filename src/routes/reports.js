
import express from 'express';
import { 
  getReport, 
  getAvailableYears, 
  getAvailableMonths,
  getAvailableWeeks,
  getCustomReport 
} from '../controllers/reportController.js';
import { authenticate } from '../middlewares/auth.js';
const router = express.Router();


router.get('/',authenticate , getReport);
router.get('/years',authenticate , getAvailableYears);
router.get('/months',authenticate , getAvailableMonths);
router.get('/weeks',authenticate , getAvailableWeeks);
router.get('/custom',authenticate , getCustomReport);
router.get('/:period',authenticate , getReport);

export default router;