import { Router } from "express";
import {
  getAttemptById,
  listAttempts,
  logCheatingEvent,
  saveAnswer,
  startAttempt,
  submitAttempt
} from "../controllers/student/attemptController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const attemptRoutes = Router();

attemptRoutes.use(requireAuth);

attemptRoutes.get("/", listAttempts);
attemptRoutes.get("/:attemptId", getAttemptById);
attemptRoutes.post("/start/:testId", requireRole("student"), startAttempt);
attemptRoutes.patch("/:attemptId/answers", requireRole("student"), saveAnswer);
attemptRoutes.post("/:attemptId/logs", requireRole("student"), logCheatingEvent);
attemptRoutes.post("/:attemptId/submit", requireRole("student"), submitAttempt);
