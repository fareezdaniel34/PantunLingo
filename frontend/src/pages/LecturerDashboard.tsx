import { useEffect, useState } from "react";
import { Link } from "react-router";
import DashboardLayout from "../components/DashboardLayout";
import { apiFetch } from "../auth";

type Stats = {
  awaiting: number;
  reviewed: number;
  students: number;
  averageScore: number | null;
};

type AwaitingItem = {
  id: number;
  title: string;
  rhyme_pattern: string;
  submitted_at: string | null;
  updated_at: string;
  student_name: string;
};

function formatDate(dateValue: string | null) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(`${dateValue.replace(" ", "T")}Z`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function LecturerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [awaitingList, setAwaitingList] = useState<AwaitingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await apiFetch("/api/lecturer/stats");
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Unable to load the dashboard.");
          return;
        }

        setStats(data.stats);
        setAwaitingList(data.awaitingList);
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

  const cards = [
    { label: "Awaiting review", value: stats?.awaiting ?? 0, color: "text-amber-600" },
    { label: "Reviewed", value: stats?.reviewed ?? 0, color: "text-emerald-600" },
    { label: "Students", value: stats?.students ?? 0, color: "text-slate-900" },
    {
      label: "Average score",
      value: stats?.averageScore !== null && stats?.averageScore !== undefined ? `${stats.averageScore}` : "-",
      color: "text-violet-700",
    },
  ];

  return (
    <DashboardLayout
      role="Lecturer"
      name="Dr. Lecturer"
      title="Dashboard"
      description="Overview of student submissions and your review progress."
      activeMenu="Dashboard"
    >
      {errorMessage && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {isLoading ? "…" : card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Waiting for your review
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Oldest submissions first.
            </p>
          </div>
          <Link
            to="/lecturer/review"
            className="w-fit rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800"
          >
            Open Review Submissions
          </Link>
        </div>

        {!isLoading && awaitingList.length === 0 && (
          <p className="py-10 text-center text-slate-600">
            All caught up. No pantun is waiting for review.
          </p>
        )}

        <ul className="divide-y divide-slate-100">
          {awaitingList.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {item.student_name} · {formatDate(item.submitted_at ?? item.updated_at)}
                </p>
              </div>
              <span className="w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                {item.rhyme_pattern}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}

export default LecturerDashboard;