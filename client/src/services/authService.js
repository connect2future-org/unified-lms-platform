import { api } from "./api";

export const authService = {
  signup(payload) {
    return api.post("/auth/signup", payload).then((res) => res.data);
  },
  login(payload) {
    return api.post("/auth/login", payload).then((res) => res.data);
  },
  me() {
    return api.get("/auth/me").then((res) => res.data);
  },
  updateCandidateProfile(payload) {
    return api.patch("/auth/candidate/profile", payload).then((res) => res.data);
  },
  getAdminRegistration() {
    return api.get("/auth/admin/registration").then((res) => res.data);
  },
  regenerateAdminRegistration() {
    return api.post("/auth/admin/registration/regenerate").then((res) => res.data);
  },
  listAdminStudents(params = {}) {
    return api.get("/auth/admin/students", { params }).then((res) => res.data);
  },
  importStudentsCsv(payload) {
    return api.post("/auth/admin/students/import/csv", payload).then((res) => res.data);
  },
  getUserUnifiedAuthMigrationSummary() {
    return api.get("/auth/admin/migration/users-unified-auth").then((res) => res.data);
  },
  runUserUnifiedAuthMigration() {
    return api.post("/auth/admin/migration/users-unified-auth").then((res) => res.data);
  },
  listManagedAdmins() {
    return api.get("/auth/super-admin/admins").then((res) => res.data);
  },
  createManagedAdmin(payload) {
    return api.post("/auth/super-admin/admins", payload).then((res) => res.data);
  },
  updateManagedAdminCredentials(adminId, payload) {
    return api.patch(`/auth/super-admin/admins/${adminId}`, payload).then((res) => res.data);
  },
  resetManagedAdminPassword(adminId) {
    return api.post(`/auth/super-admin/admins/${adminId}/reset-password`).then((res) => res.data);
  }
};
