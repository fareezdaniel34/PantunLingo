import { useEffect, useState } from "react";
import { Link } from "react-router";
import DashboardLayout from "../components/DashboardLayout";
import { apiFetch } from "../auth";

type Stats = {
  students: number;
  lecturers: number;
  admins: number;
  inactive: number;
  pantun: number;
  awaiting: number;
  reviewed: number;
};

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await apiFetch("/api/admin/stats");
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Unable to load the dashboard.");
          return;
        }

        setStats(data.stats);
      } catch {
        setErrorMessage(
          "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const userCards = [
    { label: "Students", value: stats?.students, color: "text-slate-900" },
    { label: "Lecturers", value: stats?.lecturers, color: "text-violet-700" },
    { label: "Administrators", value: stats?.admins, color: "text-slate-900" },
    { label: "Deactivated", value: stats?.inactive, color: "text-red-600" },
  ];

  const pantunCards = [
    { label: "Total pantun", value: stats?.pantun, color: "text-slate-900" },
    { label: "Awaiting review", value: stats?.awaiting, color: "text-amber-600" },
    { label: "Reviewed", value: stats?.reviewed, color: "text-emerald-600" },
  ];

  return (
    <DashboardLayout
      role="Administrator"
      name="Administrator"
      title="Dashboard"
      description="Overview of accounts and pantun activity in PantunLingo."
      activeMenu="Dashboard"
    >
      {errorMessage && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <h2 className="mb-3 text-lg font-bold text-slate-900">Accounts</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {userCards.map((card) => (
          <Link
            key={card.label}
            to="/admin/users"
            className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {isLoading ? "…" : card.value ?? 0}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">Pantun</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {pantunCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {isLoading ? "…" : card.value ?? 0}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 flex flex-col gap-4 rounded-2xl bg-violet-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold">Manage user accounts</p>
          <p className="mt-1 text-sm text-violet-100">
            Add students and lecturers, reset passwords or deactivate accounts.
          </p>
        </div>
        <Link
          to="/admin/users"
          className="w-fit rounded-xl bg-white px-5 py-3 font-bold text-violet-800 transition hover:bg-violet-50"
        >
          Open Users
        </Link>
      </section>
    </DashboardLayout>
  );
}

export default AdminDashboard;