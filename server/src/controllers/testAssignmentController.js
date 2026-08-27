import crypto from "crypto";
import { Test } from "../models/Test.js";
import { User } from "../models/User.js";
import { Enrollment } from "../models/Enrollment.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessCode = () => crypto.randomBytes(4).toString("hex").toUpperCase();

const getOwnedTest = (req) => Test.findOne({ _id: req.params.id, createdBy: req.user._id });

export const assignTestToStudents = asyncHandler(async (req, res) => {
  const test = await getOwnedTest(req);
  if (!test) return res.status(404).json({ message: "Test not found" });
  if (!req.user.schoolId) return res.status(403).json({ message: "A school assignment is required" });

  const studentIds = [...new Set((req.body?.studentIds || []).map(String))];
  if (!studentIds.length) return res.status(400).json({ message: "studentIds must contain at least one student" });

  const students = await User.find({
    _id: { $in: studentIds },
    role: "student",
    schoolId: req.user.schoolId
  }).select("_id");
  if (students.length !== studentIds.length) {
    return res.status(403).json({ message: "Every selected student must belong to your school" });
  }

  if (req.user.role === "teacher") {
    const assignments = await Enrollment.find({ userId: req.user._id, role: "teacher", status: "active" }).select("classId");
    const assignedClassIds = assignments.map(({ classId }) => classId);
    const allowed = await Enrollment.countDocuments({
      classId: { $in: assignedClassIds },
      userId: { $in: studentIds },
      role: "student",
      status: "active"
    });
    if (allowed !== studentIds.length) {
      return res.status(403).json({ message: "You can only assign tests to students in your classes" });
    }
  }

  test.schoolId = req.user.schoolId;
  test.assignedStudentIds = students.map(({ _id }) => _id);
  if (!test.accessCode) test.accessCode = generateAccessCode();
  await test.save();

  res.json({ test: { _id: test._id, assignedStudentIds: test.assignedStudentIds, accessCode: test.accessCode } });
});

export const getTestAssignment = asyncHandler(async (req, res) => {
  const test = await getOwnedTest(req);
  if (!test) return res.status(404).json({ message: "Test not found" });
  const students = await User.find({ _id: { $in: test.assignedStudentIds }, schoolId: req.user.schoolId })
    .select("_id name email schoolId");
  res.json({ testId: test._id, accessCode: test.accessCode, students });
});