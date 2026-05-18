import { Router } from "express";
import { getAdminActivity, getAdminAnalytics, getStudentDetail } from "../controllers/analyticsController.js";
import { requireAdminAuth, requireAdminRole, adminToUserCompat, requireLmsAdmin } from "../middleware/auth.js";

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAdminAuth);
analyticsRoutes.use(adminToUserCompat);
analyticsRoutes.use(requireLmsAdmin);
analyticsRoutes.use(requireAdminRole("admin", "super-admin"));
analyticsRoutes.get("/admin", getAdminAnalytics);
analyticsRoutes.get("/admin/activity", getAdminAnalytics);
analyticsRoutes.get("/admin/students/:studentId/detail", getStudentDetail);
