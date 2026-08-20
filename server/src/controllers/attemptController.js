import { Attempt } from "../models/Attempt.js";
import { CheatingLog } from "../models/CheatingLog.js";
import { Question } from "../models/Question.js";
import { Test } from "../models/Test.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { calculateAttemptScore } from "../services/scoringService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { shuffleArray } from "../utils/randomization.js";

const getMissingCandidateProfileFields = (user) => {
  const missingFields = [];

  if (!String(user?.email || "").trim()) {
    missingFields.push("email");
  }
  if (!String(user?.usn || "").trim()) {
    missingFields.push("usn");
  }
  if (!String(user?.branch || "").trim()) {
    missingFields.push("branch");
  }
  if (!String(user?.college || "").trim()) {
    missingFields.push("college");
  }

  return missingFields;
};

const assertAttemptOwnership = (attempt, user) => {
  if (!attempt) {
    return { ok: false, status: 404, message: "Attempt not found" };
  }

  if (user.role === "candidate" && String(attempt.userId) !== String(user._id)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true };
};

const buildQuestionAndOptionOrder = (test, questions) => {
  const questionOrder = test.randomizeQuestions
    ? shuffleArray(questions.map((q) => q._id))
    : questions.map((q) => q._id);

  const optionOrders = {};

  if (test.randomizeOptions) {
    for (const question of questions) {
      if (question.type === "MCQ") {
        optionOrders[String(question._id)] = shuffleArray(
          (question.mcq?.options || []).map((opt) => opt.key)
        );
      }
    }
  }

  return { questionOrder, optionOrders };
};

const finalizeAttempt = async (attempt, status = "SUBMITTED") => {
  const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
  const questionsById = new Map(questions.map((q) => [String(q._id), q]));
  const test = await Test.findById(attempt.testId);
  const scoring = calculateAttemptScore({ attempt, questionsById, test });

  attempt.score = scoring.score;
  attempt.maxScore = scoring.maxScore;
  attempt.breakdown = scoring.breakdown;
  attempt.status = status;
  attempt.submittedAt = new Date();
  await attempt.save();

  return attempt;
};

const createAttemptForTest = async ({ test, user, questionBank }) => {
  const { questionOrder, optionOrders } = buildQuestionAndOptionOrder(test, questionBank);
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + test.durationMinutes * 60 * 1000);

  return Attempt.create({
    userId: user._id,
    testId: test._id,
    candidateProfileSnapshot: {
      name: user.name,
      email: user.email,
      usn: user.usn,
      branch: user.branch,
      college: user.college
    },
    startedAt,
    expiresAt,
    questionOrder,
    optionOrders,
    answers: questionOrder.map((questionId) => ({ questionId }))
  });
};

const hasSavedProgress = (attempt) => {
  return (attempt.answers || []).some((answer) => {
    const picked = Array.isArray(answer.selectedOptions) && answer.selectedOptions.length > 0;
    const coded = typeof answer.code === "string" && answer.code.trim().length > 0;
    return picked || coded;
  });
};

const isDuplicateKeyError = (error) => Number(error?.code) === 11000;

export const startAttempt = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const candidate = await User.findById(req.user._id).select("_id name email role usn branch college");

  if (!candidate || candidate.role !== "candidate") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const missingFields = getMissingCandidateProfileFields(candidate);
  if (missingFields.length) {
    return res.status(400).json({
      message: "Complete profile details before attempting the test",
      code: "PROFILE_INCOMPLETE",
      missingFields,
      requiredFields: ["email", "usn", "branch", "college"]
    });
  }

  const test = await Test.findById(testId).select("_id isPublished durationMinutes randomizeQuestions randomizeOptions questions");

  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  if (!test.isPublished) {
    return res.status(400).json({ message: "Test is not published" });
  }

  const questionBank = await Question.find({ _id: { $in: test.questions || [] } })
    .select("_id type mcq.options.key")
    .lean();

  const activeAttempt = await Attempt.findOne({
    userId: candidate._id,
    testId,
    status: "IN_PROGRESS"
  });

  if (activeAttempt) {
    if (new Date() > activeAttempt.expiresAt) {
      const finalized = await finalizeAttempt(activeAttempt, "EXPIRED");
      return res.json({ attempt: finalized });
    }

    const isQuestionSetStale = Number(activeAttempt.questionOrder?.length || 0) !== Number((test.questions || []).length || 0);
    if (isQuestionSetStale && !hasSavedProgress(activeAttempt)) {
      await Attempt.deleteOne({ _id: activeAttempt._id });
      const freshAttempt = await createAttemptForTest({ test, user: candidate, questionBank });
      return res.status(201).json({
        attempt: freshAttempt,
        refreshed: true,
        message: "Attempt refreshed to include latest questions"
      });
    }

    return res.json({ attempt: activeAttempt });
  }

  try {
    const attempt = await createAttemptForTest({ test, user: candidate, questionBank });
    return res.status(201).json({ attempt });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existingAttempt = await Attempt.findOne({
        userId: candidate._id,
        testId,
        status: "IN_PROGRESS"
      });

      if (existingAttempt) {
        return res.json({ attempt: existingAttempt });
      }
    }

    throw error;
  }
});

export const getAttemptById = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId)
    .populate("testId", "title durationMinutes antiCheat randomizeQuestions randomizeOptions");

  const ownership = assertAttemptOwnership(attempt, req.user);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ message: ownership.message });
  }

  return res.json({ attempt });
});

export const saveAnswer = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { questionId, selectedOptions, code, language, isMarkedForReview } = req.body;

  const attempt = await Attempt.findById(attemptId);
  const ownership = assertAttemptOwnership(attempt, req.user);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ message: ownership.message });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return res.status(400).json({ message: "Attempt is already finished" });
  }

  if (new Date() > attempt.expiresAt) {
    const finalized = await finalizeAttempt(attempt, "EXPIRED");
    return res.status(409).json({ message: "Attempt expired", attempt: finalized });
  }

  const answer = attempt.answers.find((entry) => String(entry.questionId) === String(questionId));
  if (!answer) {
    return res.status(404).json({ message: "Question not part of attempt" });
  }

  if (selectedOptions) {
    answer.selectedOptions = selectedOptions;
  }

  if (typeof code === "string") {
    answer.code = code;
  }

  if (typeof language === "string") {
    answer.language = language;
  }

  if (typeof isMarkedForReview === "boolean") {
    answer.isMarkedForReview = isMarkedForReview;
  }

  answer.lastSavedAt = new Date();
  await attempt.save();

  return res.json({ ok: true, updatedAt: answer.lastSavedAt });
});

export const logCheatingEvent = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { event, metadata } = req.body;

  const attempt = await Attempt.findById(attemptId);
  const ownership = assertAttemptOwnership(attempt, req.user);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ message: ownership.message });
  }

  const duplicateWindowMs = 2000;
  const latestLog = await CheatingLog.findOne({ attemptId: attempt._id })
    .sort({ timestamp: -1 })
    .select("event timestamp");

  const latestTimestamp = latestLog?.timestamp ? new Date(latestLog.timestamp).getTime() : 0;
  const isDuplicateBurst =
    latestLog
    && latestLog.event === event
    && latestTimestamp
    && (Date.now() - latestTimestamp) < duplicateWindowMs;

  if (isDuplicateBurst) {
    return res.json({ autoSubmitted: false, violationCount: attempt.violationCount, throttled: true });
  }

  await CheatingLog.create({
    attemptId: attempt._id,
    userId: attempt.userId,
    testId: attempt.testId,
    event,
    metadata: metadata || {}
  });

  const violationEvents = new Set(["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT", "COPY", "PASTE"]);
  if (violationEvents.has(event)) {
    attempt.violationCount += 1;
  }
  await attempt.save();

  const test = await Test.findById(attempt.testId);
  const threshold = test?.antiCheat?.violationThreshold || env.cheatingViolationThreshold;

  if (attempt.violationCount >= threshold && attempt.status === "IN_PROGRESS") {
    const finalized = await finalizeAttempt(attempt, "AUTO_SUBMITTED");
    return res.status(200).json({ autoSubmitted: true, attempt: finalized });
  }

  return res.json({ autoSubmitted: false, violationCount: attempt.violationCount, threshold });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId);
  const ownership = assertAttemptOwnership(attempt, req.user);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ message: ownership.message });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return res.json({ attempt });
  }

  const status = new Date() > attempt.expiresAt ? "EXPIRED" : "SUBMITTED";
  const finalized = await finalizeAttempt(attempt, status);
  return res.json({ attempt: finalized });
});

export const listAttempts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user.role === "candidate") {
    filter.userId = req.user._id;
  } else if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  if (req.query.testId) {
    filter.testId = req.query.testId;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Attempt.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("testId", "title durationMinutes")
      .populate("userId", "name email"),
    Attempt.countDocuments(filter)
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
