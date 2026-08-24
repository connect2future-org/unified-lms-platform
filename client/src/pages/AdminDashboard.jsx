import { useEffect, useMemo, useState } from "react";
import { ActivitySection } from "../components/admin/ActivitySection";
import { OverviewSection } from "../components/admin/OverviewSection";
import { SchoolClassSection } from "../components/admin/SchoolClassSection";
import { StudentsSection } from "../components/admin/StudentsSection";
import { TestEditorSection } from "../components/admin/TestEditorSection";
import { analyticsService } from "../services/analyticsService";
import { authService } from "../services/authService";
import { schoolService } from "../services/schoolService";
import { testService } from "../services/testService";

const initialQuestionDraft = {
  _id: "",
  title: "",
  description: "",
  type: "MCQ",
  marks: 1,
  negativeMarks: 0,
  mcq: {
    allowMultiple: false,
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" }
    ],
    correctAnswers: []
  }
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "tests", label: "Test & Question Editor" },
  { id: "students", label: "Student Registry" },
  { id: "schoolClass", label: "School & Class" },
  { id: "activity", label: "Live Activity" }
];

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [tests, setTests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [students, setStudents] = useState([]);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [studentCsvFile, setStudentCsvFile] = useState(null);
  const [userMigrationSummary, setUserMigrationSummary] = useState(null);
  const [userMigrationLoading, setUserMigrationLoading] = useState(false);
  const [userMigrationMessage, setUserMigrationMessage] = useState("");
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [schoolTeachers, setSchoolTeachers] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [schoolStudents, setSchoolStudents] = useState([]);
  const [schoolStudentFile, setSchoolStudentFile] = useState(null);
  const [schoolStudentImporting, setSchoolStudentImporting] = useState(false);
  const [rosterFile, setRosterFile] = useState(null);
  const [rosterImporting, setRosterImporting] = useState(false);
  const [rosterChunkSize, setRosterChunkSize] = useState(10000);
  const [schoolDataLoading, setSchoolDataLoading] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("");
  const [schoolForm, setSchoolForm] = useState({ schoolId: "", name: "" });
  const [teacherAssignForm, setTeacherAssignForm] = useState({ teacherEmail: "" });
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    password: "",
    grade: "",
    className: ""
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    negativeMarkingEnabled: true,
    randomizeQuestions: true,
    randomizeOptions: true,
    antiCheat: {
      violationThreshold: 5,
      requireFullscreen: true,
      disableCopyPaste: false
    }
  });

  const [selectedTestId, setSelectedTestId] = useState("");
  const [selectedTestForm, setSelectedTestForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60
  });
  const [questions, setQuestions] = useState([]);
  const [questionDraft, setQuestionDraft] = useState(initialQuestionDraft);
  const [editingQuestionId, setEditingQuestionId] = useState("");

  const totalAttempts = useMemo(
    () => (analytics?.statusBreakdown || []).reduce((sum, item) => sum + item.count, 0),
    [analytics]
  );

  const selectedTest = tests.find((test) => test._id === selectedTestId);

  const loadOverview = async () => {
    const [testsRes, analyticsRes] = await Promise.all([
      testService.list({ page: 1, limit: 30 }),
      analyticsService.summary()
    ]);
    setTests(testsRes.items || []);
    setAnalytics(analyticsRes);
  };

  const loadStudents = async () => {
    const [registrationRes, studentsRes] = await Promise.all([
      authService.getAdminRegistration(),
      authService.listAdminStudents({ page: 1, limit: 50 })
    ]);
    setRegistration(registrationRes);
    setStudents(studentsRes.items || []);
  };

  const loadActivity = async () => {
    const activityRes = await analyticsService.activity({ page: 1, limit: 30 });
    setActivity(activityRes.items || []);
  };

  const loadSchools = async () => {
    const response = await schoolService.listSchools();
    const nextSchools = response.items || [];
    setSchools(nextSchools);
    if (!selectedSchoolId && nextSchools.length) {
      setSelectedSchoolId(nextSchools[0]._id);
    }
  };

  const loadSchoolContext = async (schoolId, grade) => {
    if (!schoolId) {
      setSchoolTeachers([]);
      setSchoolClasses([]);
      setSchoolStudents([]);
      return;
    }

    setSchoolDataLoading(true);
    try {
      const [teachersResponse, classesResponse, studentsResponse] = await Promise.all([
        schoolService.listTeachersBySchool(schoolId),
        schoolService.listClassesBySchool(schoolId),
        schoolService.listStudentsBySchool(schoolId, grade ? { grade, page: 1, limit: 100 } : { page: 1, limit: 100 })
      ]);
      setSchoolTeachers(teachersResponse.items || []);
      setSchoolClasses(classesResponse.items || []);
      setSchoolStudents(studentsResponse.items || []);
    } finally {
      setSchoolDataLoading(false);
    }
  };

  const loadUserMigrationSummary = async () => {
    const summaryRes = await authService.getUserUnifiedAuthMigrationSummary();
    setUserMigrationSummary(summaryRes?.summary || null);
  };

  const loadTestQuestions = async (testId) => {
    const [{ test: fullTest }, questionListResponse] = await Promise.all([
      testService.getById(testId),
      testService.getQuestions(testId)
    ]);

    const testQuestions = fullTest?.questions || [];
    const routeQuestions = questionListResponse?.items || [];
    const byCreated = [...testQuestions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setQuestions(byCreated.length ? byCreated : routeQuestions);
    setSelectedTestForm({
      title: fullTest?.title || "",
      description: fullTest?.description || "",
      durationMinutes: fullTest?.durationMinutes || 60
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadOverview(), loadStudents(), loadActivity(), loadUserMigrationSummary(), loadSchools()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    loadSchoolContext(selectedSchoolId, gradeFilter);
  }, [selectedSchoolId, gradeFilter]);

  const createTestSkeleton = async () => {
    setStatusMessage("");
    if (csvFile) {
      await importQuestionFile();
      return;
    }

    await testService.create({
      ...form,
      questions: []
    });
    setStatusMessage("Empty draft test created. Add questions in Test & Question Editor or upload CSV/Excel.");
    await loadOverview();
  };

  const importQuestionFile = async () => {
    if (!csvFile) {
      setStatusMessage("Please choose a CSV or Excel file.");
      return;
    }

    setCsvUploading(true);
    setStatusMessage("");

    try {
      const response = await testService.importFile(csvFile, {
        title: form.title || "Imported Test",
        description: form.description || "Imported from CSV/Excel",
        durationMinutes: form.durationMinutes,
        negativeMarkingEnabled: form.negativeMarkingEnabled,
        randomizeQuestions: form.randomizeQuestions,
        randomizeOptions: form.randomizeOptions,
        antiCheat: form.antiCheat
      });
      setStatusMessage(`${response.importedQuestions} questions imported to MongoDB.`);
      await loadOverview();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "File import failed.");
    } finally {
      setCsvUploading(false);
    }
  };

  const downloadCsvTemplate = async () => {
    try {
      await testService.downloadCsvTemplate();
    } catch (error) {
      setStatusMessage("Failed to download CSV template.");
    }
  };

  const importStudentsCsv = async () => {
    if (!studentCsvFile) {
      setStatusMessage("Please choose student CSV file.");
      return;
    }

    const csvContent = await studentCsvFile.text();
    const result = await authService.importStudentsCsv({ csvContent });
    setStatusMessage(`Students imported: ${result.imported}, skipped: ${result.skipped}`);
    await loadStudents();
  };

  const exportFinalDataExcel = async () => {
    try {
      await analyticsService.exportFinalDataExcel();
      setStatusMessage("Final student data exported successfully.");
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to export final student data.");
    }
  };

  const togglePublish = async (test) => {
    if (test.isPublished) {
      await testService.unpublish(test._id);
    } else {
      await testService.publish(test._id);
    }
    await loadOverview();
  };

  const deleteTest = async (test) => {
    if (test.isPublished) {
      setStatusMessage("Published test cannot be deleted. Unpublish first.");
      return;
    }

    const confirmed = window.confirm(`Delete test \"${test.title}\"? This will remove its questions and attempts.`);
    if (!confirmed) {
      return;
    }

    try {
      await testService.remove(test._id);
      setStatusMessage("Test deleted successfully.");
      if (selectedTestId === test._id) {
        setSelectedTestId("");
        setQuestions([]);
        setEditingQuestionId("");
        setQuestionDraft(initialQuestionDraft);
      }
      await loadOverview();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Unable to delete test.");
    }
  };

  const openTestEditor = async (test) => {
    setActiveTab("tests");
    setEditingQuestionId("");
    setQuestionDraft(initialQuestionDraft);
    setSelectedTestId(test._id);
    await loadTestQuestions(test._id);
    setStatusMessage(`Loaded ${test.questionCount ?? ""} questions for ${test.title}`.trim());
  };

  const selectTestForEditing = async (testId) => {
    if (!testId) {
      setSelectedTestId("");
      setQuestions([]);
      return;
    }
    const test = tests.find((entry) => entry._id === testId);
    if (!test) {
      return;
    }
    await openTestEditor(test);
  };

  const saveTestSettings = async () => {
    if (!selectedTestId) {
      return;
    }
    await testService.update(selectedTestId, selectedTestForm);
    setStatusMessage("Test settings updated.");
    await loadOverview();
  };

  const upsertQuestion = async () => {
    if (!selectedTestId) {
      setStatusMessage("Select a test first.");
      return;
    }

    try {
      const payload = {
        ...questionDraft,
        mcq: {
          ...questionDraft.mcq,
          correctAnswers: questionDraft.mcq.correctAnswers
        }
      };

      const targetQuestionId = editingQuestionId || questionDraft._id;
      if (targetQuestionId) {
        await testService.updateQuestion(selectedTestId, targetQuestionId, payload);
        setStatusMessage("Question updated successfully.");
      } else {
        await testService.addQuestion(selectedTestId, payload);
        setStatusMessage("Question added successfully.");
      }

      setQuestionDraft(initialQuestionDraft);
      setEditingQuestionId("");
      await loadTestQuestions(selectedTestId);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Unable to save question changes.");
    }
  };

  const startEditQuestion = (question) => {
    setEditingQuestionId(question._id);
    setQuestionDraft({
      _id: question._id,
      title: question.title,
      description: question.description,
      type: question.type,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      mcq: {
        allowMultiple: question.mcq?.allowMultiple || false,
        options: question.mcq?.options || initialQuestionDraft.mcq.options,
        correctAnswers: question.mcq?.correctAnswers || []
      }
    });
    setStatusMessage(`Editing question: ${question.title}`);
  };

  const cancelQuestionEdit = () => {
    setEditingQuestionId("");
    setQuestionDraft(initialQuestionDraft);
    setStatusMessage("Edit mode cancelled.");
  };

  const removeQuestion = async (questionId) => {
    await testService.deleteQuestion(selectedTestId, questionId);
    await loadTestQuestions(selectedTestId);
    setStatusMessage("Question deleted.");
  };

  const createSchool = async () => {
    setStatusMessage("");
    try {
      await schoolService.createSchool({
        schoolId: schoolForm.schoolId,
        name: schoolForm.name
      });
      setSchoolForm({ schoolId: "", name: "" });
      setStatusMessage("School created successfully.");
      await loadSchools();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to create school.");
    }
  };

  const assignTeacherToSchool = async () => {
    if (!selectedSchoolId) {
      setStatusMessage("Select a school first.");
      return;
    }

    try {
      await schoolService.assignTeacherToSchool({
        schoolId: selectedSchoolId,
        teacherEmail: teacherAssignForm.teacherEmail
      });
      setTeacherAssignForm({ teacherEmail: "" });
      setStatusMessage("Teacher assigned to school.");
      await loadSchoolContext(selectedSchoolId, gradeFilter);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to assign teacher.");
    }
  };

  const enrollStudentInSchool = async () => {
    if (!selectedSchoolId) {
      setStatusMessage("Select a school first.");
      return;
    }

    try {
      await schoolService.enrollStudent({
        schoolId: selectedSchoolId,
        name: studentForm.name,
        email: studentForm.email,
        password: studentForm.password,
        grade: Number(studentForm.grade),
        className: studentForm.className
      });
      setStudentForm({ name: "", email: "", password: "", grade: "", className: "" });
      setStatusMessage("Student enrolled successfully.");
      await loadSchoolContext(selectedSchoolId, gradeFilter);
      await loadStudents();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to enroll student.");
    }
  };

  const importStudentsInSchool = async () => {
    if (!selectedSchoolId) {
      setStatusMessage("Select a school first.");
      return;
    }
    if (!schoolStudentFile) {
      setStatusMessage("Please choose a CSV or Excel file.");
      return;
    }

    setSchoolStudentImporting(true);
    try {
      const result = await schoolService.importStudents(selectedSchoolId, schoolStudentFile);
      const errorMessage = result.errors?.length ? ` ${result.errors.length} row(s) need attention.` : "";
      setStatusMessage(
        `Students created: ${result.imported}, classes created: ${result.classesCreated || 0}, ` +
        `enrolments created or restored: ${result.enrollmentsCreated || 0}, skipped: ${result.skipped}.${errorMessage}`
      );
      setSchoolStudentFile(null);
      await loadSchoolContext(selectedSchoolId, gradeFilter);
      await loadStudents();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Student file import failed.");
    } finally {
      setSchoolStudentImporting(false);
    }
  };

  const downloadStudentImportTemplate = async () => {
    try {
      await schoolService.downloadStudentImportTemplate();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to download student template.");
    }
  };

  const importC2FRoster = async () => {
    if (!rosterFile) {
      setStatusMessage("Please choose the C2F roster Excel workbook.");
      return;
    }
    setRosterImporting(true);
    try {
      const result = await schoolService.importRoster(rosterFile, rosterChunkSize, (progress) => {
        setStatusMessage(`Importing roster chunk ${progress.current} of ${progress.total}...`);
      });
      setStatusMessage(
        `Roster imported: ${result.schoolsCreated} schools, ${result.teachersCreated} teachers, ` +
        `${result.studentsCreated} students, ${result.classesCreated} classes, ` +
        `${result.enrollmentsCreated} enrolments. Skipped: ${result.skipped}.`
      );
      setRosterFile(null);
      await loadSchools();
      if (selectedSchoolId) await loadSchoolContext(selectedSchoolId, gradeFilter);
      await loadStudents();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "C2F roster import failed.");
    } finally {
      setRosterImporting(false);
    }
  };

  const downloadRosterTemplate = async () => {
    try {
      await schoolService.downloadRosterTemplate();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to download C2F roster template.");
    }
  };

  const updateStudentGrade = async (student, nextGrade) => {
    if (!nextGrade) {
      return;
    }

    try {
      await schoolService.updateStudentEnrollment(student._id, {
        schoolId: selectedSchoolId,
        grade: Number(nextGrade)
      });
      setStatusMessage(`Updated grade for ${student.name}.`);
      await loadSchoolContext(selectedSchoolId, gradeFilter);
      await loadStudents();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to update student grade.");
    }
  };

  const runUserMigration = async () => {
    setUserMigrationLoading(true);
    setUserMigrationMessage("");
    try {
      const response = await authService.runUserUnifiedAuthMigration();
      const summary = response?.summary || {};
      setUserMigrationMessage(
        `${response?.message || "User migration executed"}. Updated: ${summary.updatedUsers || 0}, Admin code backfilled: ${summary.adminCodeBackfilled || 0}`
      );
      await loadUserMigrationSummary();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Unable to run user migration.");
    } finally {
      setUserMigrationLoading(false);
    }
  };

  return (
    <section className="dashboard-grid">
      <div className="panel">
        <h2>Admin Workspace</h2>
        <div className="tab-row">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? "" : "btn-ghost"}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {statusMessage ? <p className="muted">{statusMessage}</p> : null}
      </div>

      {activeTab === "overview" ? (
        <OverviewSection
          analytics={analytics}
          totalAttempts={totalAttempts}
          form={form}
          setForm={setForm}
          createTestSkeleton={createTestSkeleton}
          csvUploading={csvUploading}
          setCsvFile={setCsvFile}
          downloadCsvTemplate={downloadCsvTemplate}
          tests={tests}
          loading={loading}
          togglePublish={togglePublish}
          openTestEditor={openTestEditor}
          deleteTest={deleteTest}
        />
      ) : null}

      {activeTab === "tests" ? (
        <TestEditorSection
          tests={tests}
          selectedTest={selectedTest}
          selectedTestId={selectedTestId}
          onSelectTest={selectTestForEditing}
          selectedTestForm={selectedTestForm}
          setSelectedTestForm={setSelectedTestForm}
          saveTestSettings={saveTestSettings}
          editingQuestionId={editingQuestionId}
          questionDraft={questionDraft}
          setQuestionDraft={setQuestionDraft}
          upsertQuestion={upsertQuestion}
          cancelQuestionEdit={cancelQuestionEdit}
          questions={questions}
          startEditQuestion={startEditQuestion}
          removeQuestion={removeQuestion}
          userMigrationSummary={userMigrationSummary}
          userMigrationMessage={userMigrationMessage}
          userMigrationLoading={userMigrationLoading}
          onRunUserMigration={runUserMigration}
          onRefreshUserMigrationSummary={loadUserMigrationSummary}
        />
      ) : null}

      {activeTab === "students" ? (
        <StudentsSection
          registration={registration}
          setStudentCsvFile={setStudentCsvFile}
          importStudentsCsv={importStudentsCsv}
          students={students}
          exportFinalDataExcel={exportFinalDataExcel}
        />
      ) : null}

      {activeTab === "schoolClass" ? (
        <SchoolClassSection
          schools={schools}
          selectedSchoolId={selectedSchoolId}
          setSelectedSchoolId={setSelectedSchoolId}
          teachers={schoolTeachers}
          classes={schoolClasses}
          students={schoolStudents}
          gradeFilter={gradeFilter}
          setGradeFilter={setGradeFilter}
          schoolForm={schoolForm}
          setSchoolForm={setSchoolForm}
          createSchool={createSchool}
          teacherAssignForm={teacherAssignForm}
          setTeacherAssignForm={setTeacherAssignForm}
          assignTeacherToSchool={assignTeacherToSchool}
          studentForm={studentForm}
          setStudentForm={setStudentForm}
          enrollStudent={enrollStudentInSchool}
          updateStudentGrade={updateStudentGrade}
          schoolStudentFile={schoolStudentFile}
          setSchoolStudentFile={setSchoolStudentFile}
          importStudents={importStudentsInSchool}
          downloadStudentImportTemplate={downloadStudentImportTemplate}
          importing={schoolStudentImporting}
          loading={schoolDataLoading}
          rosterFile={rosterFile}
          setRosterFile={setRosterFile}
          importRoster={importC2FRoster}
          downloadRosterTemplate={downloadRosterTemplate}
          rosterImporting={rosterImporting}
          rosterChunkSize={rosterChunkSize}
          setRosterChunkSize={setRosterChunkSize}
        />
      ) : null}

      {activeTab === "activity" ? <ActivitySection activity={activity} /> : null}
    </section>
  );
};
