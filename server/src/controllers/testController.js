import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { Attempt } from "../models/Attempt.js";
import { CheatingLog } from "../models/CheatingLog.js";
import { Question } from "../models/Question.js";
import { Test } from "../models/Test.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const SUPPORTED_IMPORT_EXTENSIONS = [".csv", ".xlsx"];

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }
  return fallback;
};

const sanitizeQuestionInput = (question) => {
  const base = {
    title: question.title,
    description: question.description,
    type: question.type,
    marks: Number(question.marks || 1),
    negativeMarks: Number(question.negativeMarks || 0)
  };

  if (question.type === "MCQ") {
    return {
      ...base,
      mcq: {
        options: (question.mcq?.options || []).filter((opt) => opt?.key && opt?.text),
        correctAnswers: question.mcq?.correctAnswers || [],
        allowMultiple: Boolean(question.mcq?.allowMultiple)
      }
    };
  }

  if (question.type === "CODE") {
    return {
      ...base,
      coding: {
        defaultLanguage: question.coding?.defaultLanguage || "javascript",
        starterCode: question.coding?.starterCode || {
          javascript: "",
          python: "",
          java: "",
          cpp: ""
        },
        testCases: (question.coding?.testCases || []).filter((tc) => typeof tc.output === "string" && tc.output.length)
      }
    };
  }

  return base;
};

const normalizeHeader = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const getNormalizedRow = (row) => {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    normalized[normalizeHeader(key)] = value;
  }
  return normalized;
};

const getRowValue = (normalizedRow, possibleKeys, fallback = "") => {
  for (const key of possibleKeys) {
    if (normalizedRow[key] !== undefined && normalizedRow[key] !== null) {
      return normalizedRow[key];
    }
  }
  return fallback;
};

const normalizeCorrectAnswers = (rawCorrectAnswer) => {
  return String(rawCorrectAnswer || "")
    .split(/[|,;\/]/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
};

const buildMcqQuestion = (row) => {
  const normalizedRow = getNormalizedRow(row);

  const optionA = getRowValue(normalizedRow, ["optiona"]);
  const optionB = getRowValue(normalizedRow, ["optionb"]);
  const optionC = getRowValue(normalizedRow, ["optionc"]);
  const optionD = getRowValue(normalizedRow, ["optiond"]);

  const options = [
    { key: "A", text: optionA },
    { key: "B", text: optionB },
    { key: "C", text: optionC },
    { key: "D", text: optionD }
  ].filter((opt) => opt.text.trim().length);

  const rawCorrect = getRowValue(normalizedRow, ["correctanswer", "correctanswers"]);
  const correctAnswers = normalizeCorrectAnswers(rawCorrect);

  const title = String(getRowValue(normalizedRow, ["question", "questiontitle", "title"])).trim();
  const description = String(getRowValue(normalizedRow, ["explanation", "questiondescription", "description"], "No explanation provided")).trim() || "No explanation provided";
  const marks = getRowValue(normalizedRow, ["marks", "mark"], "1");
  const negativeMarks = getRowValue(normalizedRow, ["negativemarks", "negativemark", "negativemarking"], "0");
  const allowMultiple = getRowValue(normalizedRow, ["allowmultiple", "multiple"], "false");

  return {
    title: title,
    description: description,
    type: "MCQ",
    marks: Number(marks || 1),
    negativeMarks: Number(negativeMarks || 0),
    mcq: {
      options,
      correctAnswers,
      allowMultiple: normalizeBoolean(allowMultiple, false)
    }
  };
};

const validateImportedQuestions = (questionsPayload) => {
  const invalidQuestion = questionsPayload.find((question) => {
    if (!question.title || !question.description || question.mcq.options.length < 2 || !question.mcq.correctAnswers.length) {
      return true;
    }

    const optionKeys = new Set(question.mcq.options.map((option) => option.key));
    return question.mcq.correctAnswers.some((answer) => !optionKeys.has(answer));
  });

  if (!invalidQuestion) {
    return null;
  }

  return "Invalid row detected. Ensure each question has title, minimum 2 options, and valid correct answer values like A|B.";
};

const parseRowsFromCsvText = (csvContent) => {
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
};

const parseRowsFromExcelBuffer = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets.find((sheet) => sheet.actualRowCount > 0);
  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  const headers = headerRow.values
    .slice(1)
    .map((value) => String(value || "").trim());

  const rows = [];
  for (let index = 2; index <= worksheet.rowCount; index += 1) {
    const row = worksheet.getRow(index);
    const rowValues = row.values.slice(1);

    const hasData = rowValues.some((value) => String(value || "").trim().length > 0);
    if (!hasData) {
      continue;
    }

    const entry = {};
    headers.forEach((header, headerIndex) => {
      if (header) {
        entry[header] = rowValues[headerIndex];
      }
    });
    rows.push(entry);
  }

  return rows;
};

const parseAntiCheatField = (value) => {
  if (!value) {
    return {};
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const createImportedTest = async ({ req, rows, title, description, durationMinutes, negativeMarkingEnabled, randomizeQuestions, randomizeOptions, antiCheat }) => {
  if (!rows.length) {
    return { status: 400, payload: { message: "Import file has no question rows" } };
  }

  const questionsPayload = rows.map(buildMcqQuestion);
  const validationError = validateImportedQuestions(questionsPayload);
  if (validationError) {
    return { status: 400, payload: { message: validationError } };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createdQuestions = await Question.insertMany(
      questionsPayload.map((q) => ({ ...sanitizeQuestionInput(q), createdBy: req.user._id })),
      { session }
    );

    const [test] = await Test.create(
      [
        {
          title,
          description,
          durationMinutes: Number(durationMinutes),
          negativeMarkingEnabled: normalizeBoolean(negativeMarkingEnabled, true),
          randomizeQuestions: normalizeBoolean(randomizeQuestions, true),
          randomizeOptions: normalizeBoolean(randomizeOptions, true),
          antiCheat,
          questions: createdQuestions.map((q) => q._id),
          createdBy: req.user._id
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return {
      status: 201,
      payload: {
        message: "Questions imported successfully",
        test,
        importedQuestions: createdQuestions.length
      }
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const sanitizeQuestionForCandidate = (question) => {
  const base = {
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
      testCases: (question.coding?.testCases || []).filter((tc) => !tc.isHidden).map((tc) => ({
        input: tc.input,
        output: tc.output
      }))
    } : undefined
  };

  return base;
};

export const createTest = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      title,
      description,
      durationMinutes,
      negativeMarkingEnabled,
      randomizeQuestions,
      randomizeOptions,
      antiCheat,
      questions
    } = req.body;

    if (!title || !durationMinutes) {
      return res.status(400).json({ message: "title and durationMinutes are required" });
    }

    if (questions && !Array.isArray(questions)) {
      return res.status(400).json({ message: "questions must be an array when provided" });
    }

    const normalizedQuestions = Array.isArray(questions) ? questions : [];

    const createdQuestions = normalizedQuestions.length
      ? await Question.insertMany(
        normalizedQuestions.map((q) => ({ ...sanitizeQuestionInput(q), createdBy: req.user._id })),
        { session }
      )
      : [];

    const test = await Test.create(
      [
        {
          title,
          description,
          durationMinutes,
          negativeMarkingEnabled: Boolean(negativeMarkingEnabled),
          randomizeQuestions: Boolean(randomizeQuestions),
          randomizeOptions: Boolean(randomizeOptions),
          antiCheat: antiCheat || {},
          questions: createdQuestions.map((q) => q._id),
          createdBy: req.user._id
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return res.status(201).json({ test: test[0] });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const importTestsFromCsv = asyncHandler(async (req, res) => {
  const { csvContent, title, description, durationMinutes } = req.body;

  if (!csvContent || !title || !durationMinutes) {
    return res.status(400).json({
      message: "csvContent, title and durationMinutes are required"
    });
  }

  const rows = parseRowsFromCsvText(csvContent);
  const result = await createImportedTest({
    req,
    rows,
    title,
    description,
    durationMinutes,
    negativeMarkingEnabled: req.body.negativeMarkingEnabled,
    randomizeQuestions: req.body.randomizeQuestions,
    randomizeOptions: req.body.randomizeOptions,
    antiCheat: parseAntiCheatField(req.body.antiCheat)
  });

  return res.status(result.status).json(result.payload);
});

export const importTestsFromFile = asyncHandler(async (req, res) => {
  const { title, description, durationMinutes } = req.body;

  if (!req.file || !title || !durationMinutes) {
    return res.status(400).json({
      message: "file, title and durationMinutes are required"
    });
  }

  const fileName = String(req.file.originalname || "").toLowerCase();
  let rows = [];

  if (fileName.endsWith(".csv")) {
    rows = parseRowsFromCsvText(req.file.buffer.toString("utf-8"));
  } else if (fileName.endsWith(".xlsx")) {
    rows = await parseRowsFromExcelBuffer(req.file.buffer);
  } else {
    return res.status(400).json({
      message: `Unsupported file type. Use ${SUPPORTED_IMPORT_EXTENSIONS.join(" or ")}`
    });
  }

  const result = await createImportedTest({
    req,
    rows,
    title,
    description,
    durationMinutes,
    negativeMarkingEnabled: req.body.negativeMarkingEnabled,
    randomizeQuestions: req.body.randomizeQuestions,
    randomizeOptions: req.body.randomizeOptions,
    antiCheat: parseAntiCheatField(req.body.antiCheat)
  });

  return res.status(result.status).json(result.payload);
});

export const updateTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const test = await Test.findOneAndUpdate(
    { _id: id, createdBy: req.user._id },
    updates,
    { new: true }
  );

  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  return res.json({ test });
});

export const setPublishStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isPublished } = req.body;

  const test = await Test.findOneAndUpdate(
    { _id: id, createdBy: req.user._id },
    { isPublished: Boolean(isPublished) },
    { new: true }
  );

  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  return res.json({ test });
});

export const deleteTest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const test = await Test.findOne({ _id: id, createdBy: req.user._id });
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  if (test.isPublished) {
    return res.status(400).json({
      message: "Published tests cannot be deleted. Unpublish the test first."
    });
  }

  await Promise.all([
    Question.deleteMany({ _id: { $in: test.questions }, createdBy: req.user._id }),
    Attempt.deleteMany({ testId: test._id }),
    CheatingLog.deleteMany({ testId: test._id }),
    Test.deleteOne({ _id: test._id })
  ]);

  return res.json({ ok: true, message: "Test deleted successfully" });
});

export const getTests = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const skip = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search) : "";

  const filter = {
    ...(search ? { title: { $regex: search, $options: "i" } } : {})
  };

  if (req.user.role === "admin") {
    filter.createdBy = req.user._id;
  } else {
    filter.isPublished = true;
  }

  const [items, total] = await Promise.all([
    Test.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          title: 1,
          description: 1,
          durationMinutes: 1,
          isPublished: 1,
          negativeMarkingEnabled: 1,
          randomizeQuestions: 1,
          randomizeOptions: 1,
          createdAt: 1,
          questionCount: { $size: { $ifNull: ["$questions", []] } }
        }
      }
    ]),
    Test.countDocuments(filter)
  ]);

  return res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getTestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const test = await Test.findById(id).populate("questions");
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  if (req.user.role === "candidate" && !test.isPublished) {
    return res.status(403).json({ message: "Test not published" });
  }

  if (req.user.role === "admin" && String(test.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.user.role === "candidate") {
    return res.json({
      test: {
        _id: test._id,
        title: test.title,
        description: test.description,
        durationMinutes: test.durationMinutes,
        randomizeQuestions: test.randomizeQuestions,
        randomizeOptions: test.randomizeOptions,
        antiCheat: test.antiCheat,
        questions: test.questions.map(sanitizeQuestionForCandidate)
      }
    });
  }

  return res.json({ test });
});

const ensureAdminOwnsTest = async (testId, adminId) => {
  return Test.findOne({ _id: testId, createdBy: adminId });
};

export const getTestQuestions = asyncHandler(async (req, res) => {
  const test = await ensureAdminOwnsTest(req.params.id, req.user._id);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  const questions = await Question.find({ _id: { $in: test.questions } }).sort({ createdAt: -1 });
  return res.json({ items: questions });
});

export const addQuestionToTest = asyncHandler(async (req, res) => {
  const test = await ensureAdminOwnsTest(req.params.id, req.user._id);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  const question = await Question.create({
    ...sanitizeQuestionInput(req.body),
    createdBy: req.user._id
  });

  test.questions.push(question._id);
  await test.save();

  return res.status(201).json({ question });
});

export const updateQuestionInTest = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;
  const test = await ensureAdminOwnsTest(id, req.user._id);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  const isPartOfTest = test.questions.some((entry) => String(entry) === String(questionId));
  if (!isPartOfTest) {
    return res.status(404).json({ message: "Question not part of this test" });
  }

  const existingQuestion = await Question.findOne({ _id: questionId, createdBy: req.user._id });
  if (!existingQuestion) {
    return res.status(404).json({ message: "Question not found" });
  }

  const updates = sanitizeQuestionInput({
    ...existingQuestion.toObject(),
    ...req.body,
    type: req.body.type || existingQuestion.type
  });
  const question = await Question.findOneAndUpdate(
    { _id: questionId, createdBy: req.user._id },
    updates,
    { new: true }
  );

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  return res.json({ question });
});

export const deleteQuestionFromTest = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;
  const test = await ensureAdminOwnsTest(id, req.user._id);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  test.questions = test.questions.filter((entry) => String(entry) !== String(questionId));
  await test.save();

  await Question.deleteOne({ _id: questionId, createdBy: req.user._id });
  return res.json({ ok: true });
});
