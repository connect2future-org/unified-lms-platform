import { useEffect, useMemo, useState } from "react";
import { ActivitySection } from "../components/admin/ActivitySection";
import { OverviewSection } from "../components/admin/OverviewSection";
import { StudentsSection } from "../components/admin/StudentsSection";
import { TestEditorSection } from "../components/admin/TestEditorSection";
import { analyticsService } from "../services/analyticsService";
import { authService } from "../services/authService";
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
      await Promise.all([loadOverview(), loadStudents(), loadActivity(), loadUserMigrationSummary()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const regenerateCode = async () => {
    const response = await authService.regenerateAdminRegistration();
    setRegistration(response);
    setStatusMessage("Registration code regenerated.");
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
          regenerateCode={regenerateCode}
          setStudentCsvFile={setStudentCsvFile}
          importStudentsCsv={importStudentsCsv}
          students={students}
          exportFinalDataExcel={exportFinalDataExcel}
        />
      ) : null}

      {activeTab === "activity" ? <ActivitySection activity={activity} /> : null}
    </section>
  );
};
