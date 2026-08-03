import { api } from "./api";

export const analyticsService = {
  summary() {
    return api.get("/analytics/admin").then((res) => res.data);
  },
  activity(params = {}) {
    return api.get("/analytics/admin/activity", { params }).then((res) => res.data);
  },
  studentDetail(studentId) {
    return api.get(`/analytics/admin/students/${studentId}/detail`).then((res) => res.data);
  },
  exportFinalDataExcel() {
    return api.get("/analytics/admin/export/final-data", {
      responseType: "blob"
    }).then((response) => {
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", "final-student-data.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    });
  }
};