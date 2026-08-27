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
} from "../controllers/admin/testController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { uploadTestImportFile } from "../middleware/upload.js";
import { assignTestToStudents, getTestAssignment } from "../controllers/testAssignmentController.js";
import { findAssignedTestByCode, getAssignedTest, listAssignedTests, listManagedTests } from "../controllers/student/testController.js";

export const testRoutes = Router();

testRoutes.get("/", requireAuth, (req, res, next) => {
  if (req.user.role === "student") return listAssignedTests(req, res, next);
  if (req.user.role === "teacher") return listManagedTests(req, res, next);
  return getTests(req, res, next);
});
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
testRoutes.get("/code/:accessCode", requireAuth, findAssignedTestByCode);
testRoutes.get("/:id", requireAuth, (req, res, next) => {
  if (req.user.role === "student") return getAssignedTest(req, res, next);
  return getTestById(req, res, next);
});

testRoutes.use(requireAuth);

testRoutes.post("/import/csv", requireRole("admin", "teacher"), importTestsFromCsv);
testRoutes.post("/import/file", requireRole("admin", "teacher"), uploadTestImportFile.single("file"), importTestsFromFile);
testRoutes.post("/", requireRole("admin", "teacher"), createTest);
testRoutes.get("/:id/questions", requireRole("admin", "teacher"), getTestQuestions);
testRoutes.post("/:id/questions", requireRole("admin", "teacher"), addQuestionToTest);
testRoutes.get("/:id/assignment", requireRole("admin", "teacher"), getTestAssignment);
testRoutes.put("/:id/assignment", requireRole("admin", "teacher"), assignTestToStudents);
testRoutes.patch("/:id/questions/:questionId", requireRole("admin", "teacher"), updateQuestionInTest);
testRoutes.delete("/:id/questions/:questionId", requireRole("admin", "teacher"), deleteQuestionFromTest);
testRoutes.patch("/:id", requireRole("admin", "teacher"), updateTest);
testRoutes.delete("/:id", requireRole("admin", "teacher"), deleteTest);
testRoutes.patch("/:id/publish", requireRole("admin", "teacher"), (req, res, next) => {
  req.body = req.body || {};
  req.body.isPublished = true;
  next();
}, setPublishStatus);
testRoutes.patch("/:id/unpublish", requireRole("admin", "teacher"), (req, res, next) => {
  req.body = req.body || {};
  req.body.isPublished = false;
  next();
}, setPublishStatus);
