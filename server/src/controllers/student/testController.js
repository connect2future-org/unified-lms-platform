import { Test } from "../../models/Test.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const safeTest = (test) => ({
  _id: test._id,
  title: test.title,
  description: test.description,
  durationMinutes: test.durationMinutes,
  randomizeQuestions: test.randomizeQuestions,
  randomizeOptions: test.randomizeOptions,
  antiCheat: test.antiCheat,
  isPublished: test.isPublished,
  accessCode: test.accessCode,
  questions: test.questions?.filter((question) => question?.title).map((question) => ({
    _id: question._id,
    title: question.title,
    description: question.description,
    type: question.type,
    marks: question.marks,
    mcq: question.type === "MCQ" ? {
      options: question.mcq?.options || [],
      allowMultiple: question.mcq?.allowMultiple || false
    } : undefined,
    coding: question.type === "CODE" ? {
      defaultLanguage: question.coding?.defaultLanguage,
      starterCode: question.coding?.starterCode,
      testCases: (question.coding?.testCases || []).filter(({ isHidden }) => !isHidden)
    } : undefined
  })) || []
});

export const listAssignedTests = asyncHandler(async (req, res) => {
  const tests = await Test.find({
    assignedStudentIds: req.user._id,
    isPublished: true
  }).sort({ createdAt: -1 });

  res.json({ items: tests.map(safeTest) });
});

export const getAssignedTest = asyncHandler(async (req, res) => {
  const test = await Test.findOne({
    _id: req.params.id,
    assignedStudentIds: req.user._id,
    isPublished: true
  }).populate("questions");

  if (!test) return res.status(404).json({ message: "Assigned test not found" });
  res.json({ test: safeTest(test) });
});

export const findAssignedTestByCode = asyncHandler(async (req, res) => {
  const accessCode = String(req.params.accessCode || "").trim().toUpperCase();
  const test = await Test.findOne({
    accessCode,
    assignedStudentIds: req.user._id,
    isPublished: true
  }).select("_id title durationMinutes accessCode isPublished");

  if (!test) return res.status(404).json({ message: "Invalid or unauthorised test code" });
  res.json({ test });
});

export const listManagedTests = asyncHandler(async (req, res) => {
  const tests = await Test.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ items: tests, pagination: { page: 1, limit: tests.length, total: tests.length, totalPages: 1 } });
});