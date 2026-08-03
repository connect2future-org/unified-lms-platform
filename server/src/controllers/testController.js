import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import { Attempt } from "../models/Attempt.js";
import { CheatingLog } from "../models/CheatingLog.js";
import { Question } from "../models/Question.js";
import { Test } from "../models/Test.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

const buildCsvMcqQuestion = (row) => {
  const getVal = (possibleKeys, fallback = "") => {
    for (const key of Object.keys(row)) {
      if (possibleKeys.includes(key.toLowerCase().trim())) {
        return row[key] !== undefined && row[key] !== null ? row[key] : fallback;
      }
    }
    return fallback;
  };

  const optionA = getVal(["option a", "optiona"]);
  const optionB = getVal(["option b", "optionb"]);
  const optionC = getVal(["option c", "optionc"]);
  const optionD = getVal(["option d", "optiond"]);

  const options = [
    { key: "A", text: optionA },
    { key: "B", text: optionB },
    { key: "C", text: optionC },
    { key: "D", text: optionD }
  ].filter((opt) => opt.text.trim().length);

  const rawCorrect = getVal(["correct answer", "correctanswers", "correct_answer"]);
  const correctAnswers = String(rawCorrect)
    .split("|")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const title = String(getVal(["question", "questiontitle", "title", "question_title"])).trim();
  const description = String(getVal(["explanation", "questiondescription", "description", "question_description"])).trim() || "No explanation provided";
  const marks = getVal(["marks", "mark"], "1");
  const negativeMarks = getVal(["negativemarks", "negative_marks", "negative mark", "negative marking"], "0");
  const allowMultiple = getVal(["allowmultiple", "allow_multiple", "multiple"], "false");

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

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (!rows.length) {
    return res.status(400).json({ message: "CSV has no question rows" });
  }

  const questionsPayload = rows.map(buildCsvMcqQuestion);
  const invalidRow = questionsPayload.find((q) => !q.title || !q.description || q.mcq.options.length < 2 || !q.mcq.correctAnswers.length);
  if (invalidRow) {
    return res.status(400).json({
      message: "Invalid CSV row detected. Ensure questionTitle, questionDescription, optionA/optionB..., and correctAnswers are present"
    });
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
          negativeMarkingEnabled: normalizeBoolean(req.body.negativeMarkingEnabled, true),
          randomizeQuestions: normalizeBoolean(req.body.randomizeQuestions, true),
          randomizeOptions: normalizeBoolean(req.body.randomizeOptions, true),
          antiCheat: req.body.antiCheat || {},
          questions: createdQuestions.map((q) => q._id),
          createdBy: req.user._id
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return res.status(201).json({
      message: "CSV imported successfully",
      test,
      importedQuestions: createdQuestions.length
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
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
