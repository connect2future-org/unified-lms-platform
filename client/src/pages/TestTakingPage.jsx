import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attemptService } from "../services/attemptService";
import { authService } from "../services/authService";
import { submissionService } from "../services/submissionService";
import { testService } from "../services/testService";

const languageMap = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp"
};

export const TestTakingPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [executionResult, setExecutionResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileRequired, setProfileRequired] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileForm, setProfileForm] = useState({
    email: "",
    usn: "",
    branch: "",
    college: ""
  });
  const dirtyRef = useRef(new Set());

  const isProfileComplete = (profile) => {
    return Boolean(
      String(profile?.email || "").trim()
      && String(profile?.usn || "").trim()
      && String(profile?.branch || "").trim()
      && String(profile?.college || "").trim()
    );
  };

  const getId = (value) => {
    if (!value) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "object" && value._id) {
      return String(value._id);
    }
    return String(value);
  };

  const currentQuestion = questions[currentIndex];

  const orderedOptions = useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== "MCQ") {
      return [];
    }

    const originalOptions = currentQuestion.mcq?.options || [];
    const questionId = getId(currentQuestion._id);
    const order = attempt?.optionOrders?.[questionId] || originalOptions.map((opt) => opt.key);
    const map = new Map(originalOptions.map((opt) => [opt.key, opt]));

    return order.map((key) => map.get(key)).filter(Boolean);
  }, [currentQuestion, attempt]);

  const bootstrap = async () => {
    const [{ test: testData }, { attempt: attemptData }] = await Promise.all([
      testService.getById(testId),
      attemptService.start(testId)
    ]);

    setTest(testData);
    setAttempt(attemptData);

    const questionMap = new Map(testData.questions.map((q) => [getId(q._id), q]));
    const ordered = attemptData.questionOrder
      .map((id) => questionMap.get(getId(id)))
      .filter(Boolean);
    setQuestions(ordered);

    const answerMap = {};
    for (const ans of attemptData.answers || []) {
      answerMap[getId(ans.questionId)] = {
        selectedOptions: ans.selectedOptions || [],
        code: ans.code || "",
        language: ans.language || "javascript",
        isMarkedForReview: Boolean(ans.isMarkedForReview)
      };
    }
    setAnswers(answerMap);
  };

  const prepareTestSession = async () => {
    setProfileLoading(true);
    setProfileError("");

    try {
      const meResponse = await authService.me();
      const user = meResponse?.user || {};
      const nextProfile = {
        email: user.email || "",
        usn: user.usn || "",
        branch: user.branch || "",
        college: user.college || ""
      };

      setProfileForm(nextProfile);

      if (!isProfileComplete(nextProfile)) {
        setProfileRequired(true);
        return;
      }

      setProfileRequired(false);
      await bootstrap();
    } catch (error) {
      const code = error?.response?.data?.code;
      if (code === "PROFILE_INCOMPLETE") {
        setProfileRequired(true);
      } else {
        setProfileError(error?.response?.data?.message || "Unable to prepare test session.");
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const saveProfileAndStart = async () => {
    const payload = {
      usn: String(profileForm.usn || "").trim(),
      branch: String(profileForm.branch || "").trim(),
      college: String(profileForm.college || "").trim()
    };

    if (!payload.usn || !payload.branch || !payload.college) {
      setProfileError("USN, Branch and College are required.");
      return;
    }

    setProfileSubmitting(true);
    setProfileError("");

    try {
      await authService.updateCandidateProfile(payload);
      setProfileRequired(false);
      await bootstrap();
    } catch (error) {
      setProfileError(error?.response?.data?.message || "Unable to save profile details.");
      setProfileRequired(true);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const submitTest = async () => {
    if (!attempt || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await flushAutosave();
      const { attempt: submitted } = await attemptService.submit(attempt._id);
      alert(`Test submitted. Score: ${submitted.score}/${submitted.maxScore}`);
      navigate("/candidate");
    } finally {
      setSubmitting(false);
    }
  };

  const logEvent = async (event, metadata = {}) => {
    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return;
    }

    try {
      const response = await attemptService.logEvent(attempt._id, { event, metadata });
      if (response.autoSubmitted) {
        alert("Auto-submitted due to anti-cheating policy violations.");
        navigate("/candidate");
      }
    } catch {
      // Prevent UI disruption if log API fails.
    }
  };

  const flushAutosave = async () => {
    if (!attempt || !dirtyRef.current.size) {
      return;
    }

    const pendingQuestionIds = Array.from(dirtyRef.current.values());
    dirtyRef.current.clear();

    await Promise.all(
      pendingQuestionIds.map((questionId) =>
        attemptService.saveAnswer(attempt._id, {
          questionId,
          ...(answers[questionId] || {})
        })
      )
    );
  };

  useEffect(() => {
    prepareTestSession();
  }, [testId]);

  useEffect(() => {
    if (!attempt?.expiresAt) {
      return undefined;
    }

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(attempt.expiresAt) - new Date()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        submitTest();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt?.expiresAt]);

  useEffect(() => {
    if (!attempt) {
      return undefined;
    }

    const autosave = setInterval(() => {
      flushAutosave();
    }, 5000);

    return () => clearInterval(autosave);
  }, [attempt, answers]);

  useEffect(() => {
    if (!test) {
      return undefined;
    }

    const onVisibility = () => {
      if (document.hidden) {
        logEvent("TAB_SWITCH");
      }
    };

    const onBlur = () => logEvent("WINDOW_BLUR");
    const onFocus = () => logEvent("WINDOW_FOCUS");
    const onFullscreen = () => {
      if (test.antiCheat?.requireFullscreen && !document.fullscreenElement) {
        logEvent("FULLSCREEN_EXIT");
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreen);

    const preventClipboard = (event, name) => {
      if (test.antiCheat?.disableCopyPaste) {
        event.preventDefault();
        logEvent(name);
      }
    };

    const onCopy = (e) => preventClipboard(e, "COPY");
    const onPaste = (e) => preventClipboard(e, "PASTE");

    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);

    if (test.antiCheat?.requireFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        logEvent("FULLSCREEN_EXIT", { reason: "request_denied" });
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [test, attempt]);

  if (profileLoading) {
    return <div className="center-state">Preparing assessment...</div>;
  }

  if (profileRequired) {
    return (
      <section className="dashboard-grid">
        <div className="panel" style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2>Complete Student Details Before Test</h2>
          <p className="muted">Email, USN, Branch and College are required to start the test and for final report export.</p>
          {profileError ? <p className="muted" style={{ color: "#b91c1c" }}>{profileError}</p> : null}
          <div className="form-grid">
            <input value={profileForm.email} readOnly placeholder="Email" />
            <input
              value={profileForm.usn}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, usn: e.target.value }))}
              placeholder="USN"
            />
            <input
              value={profileForm.branch}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, branch: e.target.value }))}
              placeholder="Branch"
            />
            <input
              value={profileForm.college}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, college: e.target.value }))}
              placeholder="College"
            />
            <button className="btn" onClick={saveProfileAndStart} disabled={profileSubmitting}>
              {profileSubmitting ? "Saving..." : "Save and Start Test"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!test || !attempt || !currentQuestion) {
    return <div className="center-state">Preparing assessment...</div>;
  }

  const setAnswerState = (questionId, partial) => {
    const normalizedQuestionId = getId(questionId);
    setAnswers((prev) => {
      const next = {
        ...prev,
        [normalizedQuestionId]: {
          ...(prev[normalizedQuestionId] || {}),
          ...partial
        }
      };
      return next;
    });
    dirtyRef.current.add(normalizedQuestionId);
  };

  const runCode = async () => {
    const questionId = getId(currentQuestion._id);
    const answer = answers[questionId] || {};
    const sourceCode = answer.code || currentQuestion.coding?.starterCode?.[answer.language || "javascript"] || "";
    const language = answer.language || currentQuestion.coding?.defaultLanguage || "javascript";

    const visibleCases = currentQuestion.coding?.testCases || [];
    const { result } = await submissionService.run({
      sourceCode,
      language,
      testCases: visibleCases.length ? visibleCases : [{ input: "", output: "" }]
    });

    setExecutionResult(result);
  };

  const submitCode = async () => {
    const questionId = getId(currentQuestion._id);
    const answer = answers[questionId] || {};
    const sourceCode = answer.code || "";
    const language = answer.language || currentQuestion.coding?.defaultLanguage || "javascript";

    const { result } = await submissionService.submit(attempt._id, questionId, {
      sourceCode,
      language
    });

    setExecutionResult(result);
    dirtyRef.current.add(questionId);
  };

  return (
    <section className="test-layout">
      <aside className="question-nav">
        <h3>{test.title}</h3>
        <p className="timer">Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</p>
        <div className="question-buttons">
          {questions.map((question, index) => (
            <button
              key={question._id}
              className={index === currentIndex ? "active" : ""}
              onClick={() => setCurrentIndex(index)}
            >
              Q{index + 1}
            </button>
          ))}
        </div>
        <button className="btn" onClick={submitTest} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Test"}
        </button>
      </aside>

      <article className="question-panel">
        <h2>
          Q{currentIndex + 1}. {currentQuestion.title}
        </h2>
        <p>{currentQuestion.description}</p>

        {currentQuestion.type === "MCQ" ? (
          <div className="mcq-list">
            {orderedOptions.map((option) => {
              const questionId = getId(currentQuestion._id);
              const selectedOptions = answers[questionId]?.selectedOptions || [];
              const checked = selectedOptions.includes(option.key);
              const allowMultiple = currentQuestion.mcq?.allowMultiple;

              return (
                <label key={option.key} className="mcq-item">
                  <input
                    type={allowMultiple ? "checkbox" : "radio"}
                    name={`question-${currentQuestion._id}`}
                    checked={checked}
                    onChange={(e) => {
                      if (allowMultiple) {
                        const next = e.target.checked
                          ? [...selectedOptions, option.key]
                          : selectedOptions.filter((key) => key !== option.key);
                        setAnswerState(questionId, { selectedOptions: next });
                      } else {
                        setAnswerState(questionId, { selectedOptions: [option.key] });
                      }
                    }}
                  />
                  <span>{option.key}. {option.text}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="code-box">
            <div className="code-actions">
              <select
                value={answers[getId(currentQuestion._id)]?.language || currentQuestion.coding?.defaultLanguage || "javascript"}
                onChange={(e) => setAnswerState(getId(currentQuestion._id), { language: e.target.value })}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
              <button className="btn btn-ghost" onClick={runCode}>Run</button>
              <button className="btn" onClick={submitCode}>Submit Code</button>
            </div>

            <Editor
              height="360px"
              language={languageMap[answers[getId(currentQuestion._id)]?.language || "javascript"]}
              value={
                answers[getId(currentQuestion._id)]?.code
                || currentQuestion.coding?.starterCode?.[answers[getId(currentQuestion._id)]?.language || "javascript"]
                || ""
              }
              onChange={(value) => setAnswerState(getId(currentQuestion._id), { code: value || "" })}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />

            {executionResult ? (
              <div className="result-box">
                <strong>Status: {executionResult.status}</strong>
                <p>
                  Passed: {executionResult.passedCount}/{executionResult.totalCount} | Time: {executionResult.executionTimeMs}ms
                </p>
                <pre>{executionResult.output}</pre>
              </div>
            ) : null}
          </div>
        )}
      </article>
    </section>
  );
};
