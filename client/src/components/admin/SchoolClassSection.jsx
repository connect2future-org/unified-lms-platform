import { useMemo } from 'react'

const gradeOptions = Array.from({ length: 12 }, (_, index) => index + 1)

export const SchoolClassSection = ({
  schools,
  selectedSchoolId,
  setSelectedSchoolId,
  teachers,
  classes,
  students,
  gradeFilter,
  setGradeFilter,
  schoolForm,
  setSchoolForm,
  createSchool,
  teacherAssignForm,
  setTeacherAssignForm,
  assignTeacherToSchool,
  studentForm,
  setStudentForm,
  enrollStudent,
  updateStudentGrade,
  schoolStudentFile,
  setSchoolStudentFile,
  importStudents,
  downloadStudentImportTemplate,
  importing,
  loading,
  rosterFile,
  setRosterFile,
  importRoster,
  downloadRosterTemplate,
  rosterImporting
}) => {
  const selectedSchool = useMemo(
    () => schools.find((entry) => entry._id === selectedSchoolId) || null,
    [schools, selectedSchoolId]
  )

  return (
    <>
      <div className="panel">
        <h2>Complete C2F Roster Workbook</h2>
        <p className="muted">Import one Excel workbook to populate schools, teachers, students, classes, and enrolments.</p>
        <div className="form-grid import-panel">
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => setRosterFile(event.target.files?.[0] || null)}
            disabled={rosterImporting}
          />
          <button className="btn" onClick={importRoster} disabled={!rosterFile || rosterImporting}>
            {rosterImporting ? 'Importing roster...' : 'Import Complete Roster'}
          </button>
          <button className="btn btn-ghost" onClick={downloadRosterTemplate} disabled={rosterImporting}>
            Download Excel Template
          </button>
          <p className="muted">{rosterFile ? `Selected: ${rosterFile.name}` : 'Required sheets: Schools, Teachers, Students, Classes, Enrollments.'}</p>
        </div>
      </div>

      <div className="panel">
        <h2>Schools</h2>
        <div className="form-grid">
          <input
            placeholder="School ID (for example SCH-001)"
            value={schoolForm.schoolId}
            onChange={(event) => setSchoolForm((prev) => ({ ...prev, schoolId: event.target.value }))}
          />
          <input
            placeholder="School name"
            value={schoolForm.name}
            onChange={(event) => setSchoolForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <button className="btn" onClick={createSchool}>
            Create School
          </button>
        </div>

        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Select School</label>
          <select
            value={selectedSchoolId}
            onChange={(event) => setSelectedSchoolId(event.target.value)}
          >
            <option value="">Choose school</option>
            {schools.map((school) => (
              <option key={school._id} value={school._id}>
                {school.schoolId} - {school.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel">
        <h2>Teachers in School</h2>
        <div className="form-grid">
          <input
            placeholder="Teacher email"
            value={teacherAssignForm.teacherEmail}
            onChange={(event) => setTeacherAssignForm((prev) => ({ ...prev, teacherEmail: event.target.value }))}
          />
          <button
            className="btn"
            onClick={assignTeacherToSchool}
            disabled={!selectedSchoolId}
          >
            Assign Teacher to Selected School
          </button>
        </div>

        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher._id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.role}</td>
                </tr>
              ))}
              {!teachers.length ? (
                <tr>
                  <td colSpan={3}>{selectedSchool ? 'No teachers assigned yet.' : 'Select a school to view teachers.'}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Students and Grades (1-12)</h2>
        <div className="form-grid import-panel">
          <div>
            <strong>C2F school roster import</strong>
            <p className="muted">Use the C2F template. Each row links a student to a school and class.</p>
          </div>
          <input
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => setSchoolStudentFile(event.target.files?.[0] || null)}
            disabled={importing}
          />
          <p className="muted">
            {schoolStudentFile ? `Selected: ${schoolStudentFile.name}` : 'Choose a CSV or Excel file first.'}
            {!selectedSchoolId ? ' Select a school before loading it.' : ''}
          </p>
          <button className="btn" onClick={importStudents} disabled={!selectedSchoolId || !schoolStudentFile || importing}>
            {importing ? 'Importing...' : 'Load Students'}
          </button>
          <button className="btn btn-ghost" onClick={downloadStudentImportTemplate}>
            Download Template
          </button>
        </div>
        <div className="form-grid">
          <input
            placeholder="Student name"
            value={studentForm.name}
            onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            placeholder="Student email"
            value={studentForm.email}
            onChange={(event) => setStudentForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            placeholder="Temporary password"
            type="password"
            value={studentForm.password}
            onChange={(event) => setStudentForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          <select
            value={studentForm.grade}
            onChange={(event) => setStudentForm((prev) => ({ ...prev, grade: event.target.value }))}
          >
            <option value="">Select Grade</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={String(grade)}>
                Grade {grade}
              </option>
            ))}
          </select>
          <select
            value={studentForm.className}
            onChange={(event) => setStudentForm((prev) => ({ ...prev, className: event.target.value }))}
          >
            <option value="">Select Class</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass._id} value={schoolClass.title}>
                {schoolClass.title}
              </option>
            ))}
          </select>
          <button className="btn" onClick={enrollStudent} disabled={!selectedSchoolId}>
            Enroll Student in Selected School
          </button>
        </div>

        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Grade</label>
          <select
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
            disabled={!selectedSchoolId}
          >
            <option value="">All Grades</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={String(grade)}>
                Grade {grade}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Class</th>
                <th>Update Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.grade || '-'}</td>
                  <td>{student.classes?.map((studentClass) => studentClass.title).join(', ') || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        defaultValue={String(student.grade || '')}
                        onChange={(event) => updateStudentGrade(student, event.target.value)}
                      >
                        <option value="">Select Grade</option>
                        {gradeOptions.map((grade) => (
                          <option key={grade} value={String(grade)}>
                            Grade {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {!students.length ? (
                <tr>
                  <td colSpan={5}>{selectedSchool ? 'No students found for this school/grade.' : 'Select a school to view students.'}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {loading ? <p className="muted">Loading school data...</p> : null}
      </div>
    </>
  )
}
