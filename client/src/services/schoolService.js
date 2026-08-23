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
  assignTeacherToSchool(payload) {
    return api.patch('/schools/teachers/assign-school', payload).then((res) => res.data)
  },
  listStudentsBySchool(schoolId, params = {}) {
    return api.get(`/schools/${schoolId}/students`, { params }).then((res) => res.data)
  },
  enrollStudent(payload) {
    return api.post('/schools/students/enroll', payload).then((res) => res.data)
  },
  updateStudentEnrollment(studentId, payload) {
    return api.patch(`/schools/students/${studentId}/enrollment`, payload).then((res) => res.data)
  }
}
