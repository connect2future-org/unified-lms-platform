import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [status, setStatus] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [editingAdminId, setEditingAdminId] = useState("");
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "" });
  const [temporaryPasswords, setTemporaryPasswords] = useState({});

  const loadAdmins = async () => {
    const response = await authService.listManagedAdmins();
    setAdmins(response.items || []);
    if (!selectedAdminId && response.items?.length) {
      setSelectedAdminId(response.items[0]._id);
    }
  };

  const loadStudents = async (adminId) => {
    if (!adminId) {
      setStudents([]);
      return;
    }
    const response = await authService.listAdminStudents({ adminId, page: 1, limit: 100 });
    setStudents(response.items || []);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    loadStudents(selectedAdminId);
  }, [selectedAdminId]);

  const createAdmin = async () => {
    setStatus("");
    try {
      await authService.createManagedAdmin(adminForm);
      setAdminForm({ name: "", email: "", password: "" });
      setStatus("Admin created under your hierarchy.");
      await loadAdmins();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to create admin.");
    }
  };

  const startEditAdmin = (admin) => {
    setEditingAdminId(admin._id);
    setEditForm({
      name: admin.name || "",
      email: admin.email || "",
      password: ""
    });
    setStatus("");
  };

  const cancelEditAdmin = () => {
    setEditingAdminId("");
    setEditForm({ name: "", email: "", password: "" });
  };

  const saveAdminCredentials = async (adminId) => {
    setStatus("");

    const payload = {};
    if (editForm.name.trim()) {
      payload.name = editForm.name.trim();
    }
    if (editForm.email.trim()) {
      payload.email = editForm.email.trim();
    }
    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }

    if (!payload.name && !payload.email && !payload.password) {
      setStatus("Provide at least one value to update.");
      return;
    }

    try {
      await authService.updateManagedAdminCredentials(adminId, payload);
      setStatus("Admin credentials updated successfully.");
      cancelEditAdmin();
      await loadAdmins();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to update admin credentials.");
    }
  };

  const resetAdminPassword = async (admin) => {
    setStatus("");
    try {
      const response = await authService.resetManagedAdminPassword(admin._id);
      const tempPassword = response?.temporaryPassword || "";

      setTemporaryPasswords((prev) => ({
        ...prev,
        [admin._id]: tempPassword
      }));

      setStatus(`Temporary password reset for ${admin.name}. Share it securely and ask admin to change it after login.`);
      await loadAdmins();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to reset admin password.");
    }
  };

  const importStudents = async () => {
    if (!selectedAdminId || !csvFile) {
      setStatus("Select an admin and CSV file first.");
      return;
    }

    try {
      const csvContent = await csvFile.text();
      const result = await authService.importStudentsCsv({
        adminId: selectedAdminId,
        csvContent
      });
      setStatus(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
      await loadStudents(selectedAdminId);
    } catch (error) {
      setStatus(error.response?.data?.message || "Bulk import failed.");
    }
  };

  return (
    <section className="dashboard-grid">
      <div className="panel">
        <h2>Super Admin Control Center</h2>
        {status ? <p className="muted">{status}</p> : null}
      </div>

      <div className="panel">
        <h3>Create Managed Admin</h3>
        <div className="form-grid">
          <input placeholder="Admin name" value={adminForm.name} onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))} />
          <input placeholder="Admin email" value={adminForm.email} onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))} />
          <input type="password" placeholder="Temporary password" value={adminForm.password} onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))} />
          <button className="btn" onClick={createAdmin}>Create Admin</button>
        </div>
      </div>

      <div className="panel">
        <h3>All Admins</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Code</th>
                <th>Manage</th>
                <th>Temp Password</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td>
                    {editingAdminId === admin._id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Admin name"
                      />
                    ) : (
                      admin.name
                    )}
                  </td>
                  <td>
                    {editingAdminId === admin._id ? (
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="Admin email"
                      />
                    ) : (
                      admin.email
                    )}
                  </td>
                  <td>{admin.adminCode}</td>
                  <td>
                    {editingAdminId === admin._id ? (
                      <div className="form-grid">
                        <input
                          type="password"
                          value={editForm.password}
                          onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                          placeholder="New password (optional)"
                        />
                        <button className="btn" onClick={() => saveAdminCredentials(admin._id)}>
                          Save
                        </button>
                        <button className="btn btn-ghost" onClick={cancelEditAdmin}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost" onClick={() => startEditAdmin(admin)}>
                        Edit Credentials
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="form-grid">
                      <button className="btn btn-ghost" onClick={() => resetAdminPassword(admin)}>
                        Reset Password
                      </button>
                      {temporaryPasswords[admin._id] ? (
                        <small className="muted">{temporaryPasswords[admin._id]}</small>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => setSelectedAdminId(admin._id)}>
                      {selectedAdminId === admin._id ? "Selected" : "Select"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3>Bulk Student Import (CSV)</h3>
        <div className="form-grid">
          <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
          <button className="btn" onClick={importStudents}>Import to Selected Admin</button>
          <p className="muted">CSV headers: name,email,password</p>
        </div>
      </div>

      <div className="panel">
        <h3>Students Under Selected Admin</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{new Date(student.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => navigate(`/super-admin/students/${student._id}`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
