// src/routes/dashboard.js
import express from "express";
import {
  getDashboardStats,
  getTodaysDetailedStats,
} from "../controllers/dashboardController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/stats", authenticate, getDashboardStats);
router.get("/today-stats", authenticate, getTodaysDetailedStats);

export default router;
