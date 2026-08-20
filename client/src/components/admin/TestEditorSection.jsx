export const TestEditorSection = ({
  tests,
  selectedTest,
  selectedTestId,
  onSelectTest,
  selectedTestForm,
  setSelectedTestForm,
  saveTestSettings,
  editingQuestionId,
  questionDraft,
  setQuestionDraft,
  upsertQuestion,
  cancelQuestionEdit,
  questions,
  startEditQuestion,
  removeQuestion,
  userMigrationSummary,
  userMigrationMessage,
  userMigrationLoading,
  onRunUserMigration,
  onRefreshUserMigrationSummary
}) => {
  return (
    <div className="panel">
      <h2>Test & Question Editor</h2>
      <div className="rounded-lg border border-blue-300/40 bg-blue-900/20 p-3" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "0.4rem" }}>User Role/Auth Migration</h3>
        <p className="muted" style={{ marginBottom: "0.6rem" }}>
          Run unified auth migration from LMS Test section (no delete, in-place upgrade).
        </p>
        {userMigrationMessage ? <p className="muted" style={{ marginBottom: "0.6rem" }}>{userMigrationMessage}</p> : null}
        <div className="action-row" style={{ marginBottom: "0.6rem" }}>
          <button className="btn" onClick={onRunUserMigration} disabled={userMigrationLoading}>
            {userMigrationLoading ? "Applying User Migration..." : "Apply User Migration"}
          </button>
          <button className="btn btn-ghost" onClick={onRefreshUserMigrationSummary} disabled={userMigrationLoading}>
            Refresh Migration Summary
          </button>
        </div>
        <div className="option-grid">
          <p className="muted">Total Users: {userMigrationSummary?.totalUsers ?? '-'}</p>
          <p className="muted">Needs Update: {userMigrationSummary?.updatedUsers ?? '-'}</p>
          <p className="muted">AdminCode Backfill: {userMigrationSummary?.adminCodeBackfilled ?? '-'}</p>
        </div>
      </div>
      <div className="form-grid">
        <select
          value={selectedTestId}
          onChange={(e) => onSelectTest(e.target.value)}
        >
          <option value="">Select test to edit</option>
          {tests.map((test) => (
            <option key={test._id} value={test._id}>{test.title} ({test.questionCount ?? 0} questions)</option>
          ))}
        </select>
      </div>
      {!selectedTest ? <p>Select a test from Overview tab using Edit Test.</p> : null}
      {selectedTest ? (
        <div className="form-grid">
          <h3>Editing: {selectedTest.title}</h3>
          <input
            value={selectedTestForm.title}
            onChange={(e) => setSelectedTestForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Test title"
          />
          <textarea
            value={selectedTestForm.description}
            onChange={(e) => setSelectedTestForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Test description"
            rows={3}
          />
          <input
            type="number"
            value={selectedTestForm.durationMinutes}
            onChange={(e) => setSelectedTestForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
          />
          <button className="btn" onClick={saveTestSettings}>Save Test Settings</button>

          <h3>{editingQuestionId ? "Edit Question" : "Add Question"}</h3>
          {editingQuestionId ? <p className="muted">Edit mode active for selected question.</p> : null}
          <input
            placeholder="Question title"
            value={questionDraft.title}
            onChange={(e) => setQuestionDraft((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            placeholder="Question description"
            value={questionDraft.description}
            onChange={(e) => setQuestionDraft((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <div className="option-grid">
            <input
              type="number"
              placeholder="Marks"
              value={questionDraft.marks}
              onChange={(e) => setQuestionDraft((prev) => ({ ...prev, marks: Number(e.target.value) || 0 }))}
            />
            <input
              type="number"
              placeholder="Negative marks"
              value={questionDraft.negativeMarks}
              onChange={(e) => setQuestionDraft((prev) => ({ ...prev, negativeMarks: Number(e.target.value) || 0 }))}
            />
          </div>
          <label>
            <input
              type="checkbox"
              checked={Boolean(questionDraft.mcq.allowMultiple)}
              onChange={(e) => setQuestionDraft((prev) => ({
                ...prev,
                mcq: { ...prev.mcq, allowMultiple: e.target.checked }
              }))}
            />
            Allow multiple correct options
          </label>
          <div className="option-grid">
            {questionDraft.mcq.options.map((opt, idx) => (
              <input
                key={opt.key}
                placeholder={`Option ${opt.key}`}
                value={opt.text}
                onChange={(e) => {
                  const nextOptions = [...questionDraft.mcq.options];
                  nextOptions[idx] = { ...nextOptions[idx], text: e.target.value };
                  setQuestionDraft((prev) => ({ ...prev, mcq: { ...prev.mcq, options: nextOptions } }));
                }}
              />
            ))}
          </div>
          <input
            placeholder="Correct answers (A or A|C)"
            value={questionDraft.mcq.correctAnswers.join("|")}
            onChange={(e) => {
              const correctAnswers = e.target.value
                .split("|")
                .map((item) => item.trim().toUpperCase())
                .filter(Boolean);
              setQuestionDraft((prev) => ({ ...prev, mcq: { ...prev.mcq, correctAnswers } }));
            }}
          />
          <div className="action-row">
            <button className="btn" onClick={upsertQuestion}>{editingQuestionId ? "Update Selected Question" : "Add Question"}</button>
            {editingQuestionId ? <button className="btn btn-ghost" onClick={cancelQuestionEdit}>Cancel Edit</button> : null}
          </div>

          <h3>Questions</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question._id}>
                    <td>{question.title}</td>
                    <td>{question.type}</td>
                    <td>{question.marks}</td>
                    <td className="action-row">
                      <button className="btn btn-ghost" onClick={() => startEditQuestion(question)}>Edit</button>
                      <button className="btn btn-ghost" onClick={() => removeQuestion(question._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
