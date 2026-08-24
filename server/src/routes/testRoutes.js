import { Router } from "express";
import {
  addQuestionToTest,
  createTest,
  deleteTest,
  deleteQuestionFromTest,
  getTestById,
  getTestQuestions,
  getTests,
  importTestsFromFile,
  importTestsFromCsv,
  setPublishStatus,
  updateQuestionInTest,
  updateTest
} from "../modules/admin/index.js";
import { requireAdminAuth, requireAdminRole, adminToUserCompat, requireLmsAdmin } from "../middleware/auth.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadTestImportFile } from "../middleware/upload.js";

export const testRoutes = Router();

testRoutes.get("/", requireAuth, getTests);
testRoutes.get("/csv-template", requireAuth, (req, res) => {
  const csv = `Question Type,Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Difficulty,Topic,Marks
MCQ,"Sample Question","Option A","Option B","Option C","Option D","A","One-line explanation","Easy","Sample Topic",1`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="question-import-template.csv"'
  );
  return res.status(200).send(csv);
});
testRoutes.get("/:id", requireAuth, getTestById);

testRoutes.use(requireAdminAuth);
testRoutes.use(adminToUserCompat);
testRoutes.use(requireLmsAdmin);

testRoutes.post("/import/csv", requireAdminRole("admin"), importTestsFromCsv);
testRoutes.post("/import/file", requireAdminRole("admin"), uploadTestImportFile.single("file"), importTestsFromFile);
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
