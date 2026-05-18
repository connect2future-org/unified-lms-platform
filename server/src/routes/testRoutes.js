import { Router } from "express";
import {
  addQuestionToTest,
  createTest,
  deleteTest,
  deleteQuestionFromTest,
  getTestById,
  getTestQuestions,
  getTests,
  importTestsFromCsv,
  setPublishStatus,
  updateQuestionInTest,
  updateTest
} from "../controllers/testController.js";
import { requireAdminAuth, requireAdminRole, adminToUserCompat, requireLmsAdmin } from "../middleware/auth.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const testRoutes = Router();

testRoutes.get("/", requireAuth, getTests);
testRoutes.get("/:id", requireAuth, getTestById);

testRoutes.use(requireAdminAuth);
testRoutes.use(adminToUserCompat);
testRoutes.use(requireLmsAdmin);

testRoutes.post("/import/csv", requireAdminRole("admin"), importTestsFromCsv);
testRoutes.post("/", requireAdminRole("admin"), createTest);
testRoutes.get("/:id/questions", requireAdminRole("admin"), getTestQuestions);
testRoutes.post("/:id/questions", requireAdminRole("admin"), addQuestionToTest);
testRoutes.patch("/:id/questions/:questionId", requireAdminRole("admin"), updateQuestionInTest);
testRoutes.delete("/:id/questions/:questionId", requireAdminRole("admin"), deleteQuestionFromTest);
testRoutes.patch("/:id", requireAdminRole("admin"), updateTest);
testRoutes.delete("/:id", requireAdminRole("admin"), deleteTest);
testRoutes.patch("/:id/publish", requireAdminRole("admin"), (req, res, next) => {
  req.body = req.body || {};
  req.body.isPublished = true;
  next();
}, setPublishStatus);
testRoutes.patch("/:id/unpublish", requireAdminRole("admin"), (req, res, next) => {
  req.body = req.body || {};
  req.body.isPublished = false;
  next();
}, setPublishStatus);
