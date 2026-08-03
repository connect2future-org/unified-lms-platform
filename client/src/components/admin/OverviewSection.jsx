export const OverviewSection = ({
  analytics,
  totalAttempts,
  form,
  setForm,
  createTestSkeleton,
  csvUploading,
  setCsvFile,
  importCsv,
  tests,
  loading,
  togglePublish,
  openTestEditor,
  deleteTest,
  downloadCsvTemplate
}) => {
  return (
    <>
      <div className="panel">
        <h2>Analytics Snapshot</h2>
        {analytics ? (
          <div className="kpi-grid">
            <div className="kpi-card">
              <span>Total Attempts</span>
              <strong>{totalAttempts}</strong>
            </div>
            <div className="kpi-card">
              <span>Avg Score</span>
              <strong>{Number(analytics.scoreSummary?.avgScore || 0).toFixed(2)}</strong>
            </div>
            <div className="kpi-card">
              <span>Max Score</span>
              <strong>{analytics.scoreSummary?.maxScore || 0}</strong>
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ margin: 0 }}>Create Test / Import CSV</h2>
          <button
            className="btn btn-ghost"
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}
            onClick={downloadCsvTemplate}
          >
            Download CSV Template
          </button>
        </div>
        <p className="muted" style={{ marginBottom: "1.2rem" }}>
          If a CSV file is selected below, Create Test imports questions from the CSV. Without a CSV, an empty draft test is created.
        </p>
        <div className="form-grid">
          <input
            placeholder="Test title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            placeholder="Test description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", alignItems: "flex-end" }}>
            <div>
              <label style={{ marginBottom: "0.3rem", fontSize: "0.85rem" }}>Duration (Minutes)</label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                min={1}
              />
            </div>
            <div>
              <label style={{ marginBottom: "0.3rem", fontSize: "0.85rem" }}>Choose CSV File (Optional)</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
                style={{ padding: "0.55rem" }}
              />
            </div>
          </div>
          <button className="btn" onClick={createTestSkeleton} disabled={csvUploading}>
            {csvUploading ? "Importing questions..." : "Create Test"}
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Your Tests</h2>
        {loading ? <div>Loading...</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test._id}>
                  <td>{test.title}</td>
                  <td>{test.durationMinutes} min</td>
                  <td>{test.questionCount ?? 0}</td>
                  <td>{test.isPublished ? "Published" : "Draft"}</td>
                  <td className="action-row">
                    <button className="btn btn-ghost" onClick={() => togglePublish(test)}>
                      {test.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => openTestEditor(test)}>
                      Edit Test
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => deleteTest(test)}
                      disabled={test.isPublished}
                      title={test.isPublished ? "Unpublish test first to delete" : "Delete this test"}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
