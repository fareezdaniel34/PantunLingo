import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { apiFetch, getUser } from "../auth";

type Role = "student" | "lecturer" | "admin";

type AdminUser = {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: number;
  pantun_count: number;
};

type Modal =
  | { type: "add" }
  | { type: "edit"; user: AdminUser }
  | { type: "password"; user: AdminUser }
  | { type: "status"; user: AdminUser }
  | null;

const roleLabel: Record<Role, string> = {
  student: "Student",
  lecturer: "Lecturer",
  admin: "Administrator",
};

const roleStyle: Record<Role, string> = {
  student: "bg-slate-100 text-slate-700",
  lecturer: "bg-violet-100 text-violet-800",
  admin: "bg-blue-100 text-blue-800",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100";

function AdminUsers() {
  const myId = Number(getUser()?.id);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");

  const [modal, setModal] = useState<Modal>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<Role>("student");
  const [formPassword, setFormPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await apiFetch("/api/admin/users");
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Unable to load users.");
          return;
        }

        setUsers(data.users);
      } catch {
        setErrorMessage(
          "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  function openModal(next: Modal) {
    setFormError("");
    setFormPassword("");
    setActionMessage("");

    if (next?.type === "add") {
      setFormName("");
      setFormEmail("");
      setFormRole("student");
    }

    if (next?.type === "edit") {
      setFormName(next.user.full_name);
      setFormRole(next.user.role);
    }

    setModal(next);
  }

  function replaceUser(updated: AdminUser) {
    setUsers((current) =>
      current.map((user) => (user.id === updated.id ? updated : user)),
    );
  }

  async function handleSave() {
    if (!modal) {
      return;
    }

    setFormError("");

    let path = "";
    let method = "POST";
    let body: Record<string, unknown> = {};

    if (modal.type === "add") {
      if (!formName.trim() || !formEmail.trim()) {
        setFormError("Please fill in the name and email.");
        return;
      }
      if (formPassword.length < 8) {
        setFormError("Password must be at least 8 characters.");
        return;
      }
      path = "/api/admin/users";
      body = {
        fullName: formName,
        email: formEmail,
        role: formRole,
        password: formPassword,
      };
    } else if (modal.type === "edit") {
      if (!formName.trim()) {
        setFormError("Please fill in the name.");
        return;
      }
      path = `/api/admin/users/${modal.user.id}`;
      method = "PUT";
      body = { fullName: formName, role: formRole };
    } else if (modal.type === "password") {
      if (formPassword.length < 8) {
        setFormError("Password must be at least 8 characters.");
        return;
      }
      path = `/api/admin/users/${modal.user.id}/password`;
      method = "PATCH";
      body = { password: formPassword };
    } else {
      path = `/api/admin/users/${modal.user.id}/status`;
      method = "PATCH";
      body = { isActive: modal.user.is_active === 0 };
    }

    try {
      setIsSaving(true);

      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Something went wrong.");
        return;
      }

      if (modal.type === "add") {
        setUsers((current) => [...current, data.user]);
      } else if (data.user) {
        replaceUser(data.user);
      }

      setActionMessage(data.message);
      setModal(null);
    } catch {
      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSaving(false);
    }
  }

  const keyword = search.trim().toLowerCase();
  const visibleUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSearch =
      !keyword ||
      user.full_name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword);
    return matchesRole && matchesSearch;
  });

  const roleTabs: { key: "all" | Role; label: string }[] = [
    { key: "all", label: "All" },
    { key: "student", label: "Students" },
    { key: "lecturer", label: "Lecturers" },
    { key: "admin", label: "Admins" },
  ];

  const modalTitle =
    modal?.type === "add"
      ? "Add new user"
      : modal?.type === "edit"
        ? "Edit user"
        : modal?.type === "password"
          ? "Reset password"
          : modal?.user.is_active === 0
            ? "Reactivate account?"
            : "Deactivate account?";

  return (
    <DashboardLayout
      role="Administrator"
      name="Administrator"
      title="Users"
      description="Add, edit, reset passwords and deactivate PantunLingo accounts."
      activeMenu="Users"
    >
      <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">User Accounts</h2>
            <p className="mt-2 text-slate-600">{users.length} accounts in total.</p>
          </div>
          <button
            type="button"
            onClick={() => openModal({ type: "add" })}
            className="w-fit rounded-xl bg-violet-700 px-5 py-3 font-bold text-white transition hover:bg-violet-800"
          >
            + Add User
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {roleTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  roleFilter === tab.key
                    ? "bg-violet-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100 lg:w-72"
          />
        </div>

        {actionMessage && (
          <div className="mt-6 rounded-xl bg-violet-50 p-4 text-sm font-semibold text-violet-800">
            {actionMessage}
          </div>
        )}

        {isLoading && (
          <p className="py-14 text-center font-semibold text-slate-600">Loading users...</p>
        )}

        {!isLoading && errorMessage && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && visibleUsers.length === 0 && (
          <p className="py-14 text-center text-slate-600">No users match your filter.</p>
        )}

        {!isLoading && !errorMessage && visibleUsers.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-semibold">Name</th>
                  <th className="py-3 pr-4 font-semibold">Role</th>
                  <th className="py-3 pr-4 font-semibold">Pantun</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((user) => {
                  const isMe = user.id === myId;
                  const isActive = user.is_active !== 0;

                  return (
                    <tr key={user.id} className={isActive ? "" : "opacity-60"}>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-900">
                          {user.full_name}
                          {isMe && (
                            <span className="ml-2 text-xs font-bold text-violet-700">(You)</span>
                          )}
                        </p>
                        <p className="text-slate-500">{user.email}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${roleStyle[user.role]}`}>
                          {roleLabel[user.role]}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">
                        {user.role === "student" ? user.pantun_count : "-"}
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openModal({ type: "edit", user })}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal({ type: "password", user })}
                            className="rounded-lg border border-violet-300 px-3 py-1.5 font-bold text-violet-700 transition hover:bg-violet-50"
                          >
                            Reset Password
                          </button>
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => openModal({ type: "status", user })}
                              className={`rounded-lg px-3 py-1.5 font-bold transition ${
                                isActive
                                  ? "border border-red-200 text-red-600 hover:bg-red-50"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                            >
                              {isActive ? "Deactivate" : "Reactivate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-900">{modalTitle}</h2>

            {modal.type !== "add" && (
              <p className="mt-2 text-slate-600">
                {modal.user.full_name} · {modal.user.email}
              </p>
            )}

            {(modal.type === "add" || modal.type === "edit") && (
              <div className="mt-5">
                <label className="text-sm font-semibold text-slate-700">Full name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {modal.type === "add" && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(event) => setFormEmail(event.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {(modal.type === "add" || modal.type === "edit") && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <select
                  value={formRole}
                  onChange={(event) => setFormRole(event.target.value as Role)}
                  disabled={modal.type === "edit" && modal.user.id === myId}
                  className={`${inputClass} disabled:bg-slate-100`}
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            {(modal.type === "add" || modal.type === "password") && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700">
                  {modal.type === "add" ? "Temporary password" : "New password"}
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(event) => setFormPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Give this password to the user privately.
                </p>
              </div>
            )}

            {modal.type === "status" && (
              <p className="mt-4 leading-7 text-slate-600">
                {modal.user.is_active === 0
                  ? "This user will be able to log in again."
                  : "This user will not be able to log in. Their pantun and reviews stay in the system."}
              </p>
            )}

            {formError && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {formError}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={isSaving}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`rounded-xl px-5 py-3 font-bold text-white transition disabled:opacity-60 ${
                  modal.type === "status" && modal.user.is_active !== 0
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-violet-700 hover:bg-violet-800"
                }`}
              >
                {isSaving
                  ? "Saving..."
                  : modal.type === "add"
                    ? "Create Account"
                    : modal.type === "status"
                      ? modal.user.is_active === 0
                        ? "Yes, Reactivate"
                        : "Yes, Deactivate"
                      : "Save"}
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminUsers;