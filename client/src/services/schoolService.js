import { api } from './api'

export const schoolService = {
  listSchools() {
    return api.get('/schools').then((res) => res.data)
  },
  createSchool(payload) {
    return api.post('/schools', payload).then((res) => res.data)
  },
  updateSchool(schoolId, payload) {
    return api.patch(`/schools/${schoolId}`, payload).then((res) => res.data)
  },
  listTeachersBySchool(schoolId) {
    return api.get(`/schools/${schoolId}/teachers`).then((res) => res.data)
  },
  listClassesBySchool(schoolId) {
    return api.get(`/schools/${schoolId}/classes`).then((res) => res.data)
  },
  assignTeacherToSchool(payload) {
    return api.patch('/schools/teachers/assign-school', payload).then((res) => res.data)
  },
  listStudentsBySchool(schoolId, params = {}) {
    return api.get(`/schools/${schoolId}/students`, { params }).then((res) => res.data)
  },
  importStudents(schoolId, file) {
    const formData = new FormData()
    formData.append('schoolId', schoolId)
    formData.append('file', file)
    return api.post('/schools/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => res.data)
  },
  async importRoster(file, chunkSize = 10000, onProgress) {
    const contentType = String(file.type || '').toLowerCase()
    const isCsv = /\.csv$/i.test(file.name || '') || contentType.includes('csv') || contentType.includes('text')
    if (!isCsv) {
      const formData = new FormData()
      formData.append('file', file)
      return api.post('/schools/roster/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then((res) => res.data)
    }

    const text = await file.text()
    const records = []
    let start = 0
    let quoted = false
    for (let index = 0; index < text.length; index += 1) {
      if (text[index] === '"') {
        if (quoted && text[index + 1] === '"') index += 1
        else quoted = !quoted
      } else if (!quoted && (text[index] === '\n' || text[index] === '\r')) {
        records.push(text.slice(start, index))
        if (text[index] === '\r' && text[index + 1] === '\n') index += 1
        start = index + 1
      }
    }
    if (start < text.length) records.push(text.slice(start))
    const header = records.shift()
    if (!header || !records.length) throw new Error('The CSV file has no data rows.')

    const total = Math.ceil(records.length / chunkSize)
    const summary = { schoolsCreated: 0, teachersCreated: 0, studentsCreated: 0, classesCreated: 0, enrollmentsCreated: 0, skipped: 0, errors: [] }
    for (let offset = 0; offset < records.length; offset += chunkSize) {
      const current = Math.floor(offset / chunkSize) + 1
      onProgress?.({ current, total, state: 'uploading' })
      const chunk = new Blob([`${header}\n${records.slice(offset, offset + chunkSize).join('\n')}\n`], { type: 'text/csv' })
      const formData = new FormData()
      formData.append('file', chunk, `${file.name}.part-${current}.csv`)
      let result
      try {
        result = await api.post('/schools/roster/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then((res) => res.data)
      } catch (error) {
        error.importChunk = { current, total, rows: Math.min(chunkSize, records.length - offset) }
        throw error
      }
      for (const key of ['schoolsCreated', 'teachersCreated', 'studentsCreated', 'classesCreated', 'enrollmentsCreated', 'skipped']) summary[key] += result[key] || 0
      summary.errors.push(...(result.errors || []).map((error) => ({ ...error, chunk: current })))
      onProgress?.({ current, total, state: 'completed' })
    }
    return summary
  },
  downloadRosterTemplate() {
    return api.get('/schools/roster/import/template', { responseType: 'blob' }).then((response) => {
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = 'c2f-school-roster-template.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    })
  },
  downloadStudentImportTemplate() {
    return api.get('/schools/students/import/template', { responseType: 'blob' }).then((response) => {
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = 'school-student-import-template.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    })
  },
  enrollStudent(payload) {
    return api.post('/schools/students/enroll', payload).then((res) => res.data)
  },
  updateStudentEnrollment(studentId, payload) {
    return api.patch(`/schools/students/${studentId}/enrollment`, payload).then((res) => res.data)
  }
}
