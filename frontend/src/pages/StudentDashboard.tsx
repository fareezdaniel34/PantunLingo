import { useEffect, useState } from "react";
import { Link } from "react-router";
import DashboardLayout from "../components/DashboardLayout";
import { apiFetch, getUser } from "../auth";

type Stats = {
  drafts: number;
  awaiting: number;
  reviewed: number;
  averageScore: number | null;
};

type RecentItem = {
  id: number;
  title: string;
  status: string;
  score: number | null;
  updated_at: string;
};

type Feedback = {
  id: number;
  title: string;
  score: number | null;
  feedback: string | null;
  reviewed_at: string | null;
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

const statusStyle: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-amber-100 text-amber-700",
  reviewed: "bg-emerald-100 text-emerald-700",
};

function StudentDashboard() {
  const firstName = getUser()?.fullName.split(" ")[0] ?? "Student";

  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [latestFeedback, setLatestFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await apiFetch("/api/student/stats");
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Unable to load your dashboard.");
          return;
        }

        setStats(data.stats);
        setRecent(data.recent);
        setLatestFeedback(data.latestFeedback);
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
    { label: "Drafts", value: stats?.drafts ?? 0, color: "text-slate-900", to: "/student/drafts?status=draft" },
    { label: "Awaiting review", value: stats?.awaiting ?? 0, color: "text-amber-600", to: "/student/submissions?status=submitted" },
    { label: "Reviewed", value: stats?.reviewed ?? 0, color: "text-emerald-600", to: "/student/submissions?status=reviewed" },
    {
      label: "Average score",
      value: stats?.averageScore !== null && stats?.averageScore !== undefined ? `${stats.averageScore}` : "-",
      color: "text-violet-700",
      to: "/student/submissions?status=reviewed",
    },
  ];

  return (
    <DashboardLayout
      role="Student"
      name="Nur Aina"
      title={`Selamat datang, ${firstName}!`}
      description="Here is a summary of your pantun writing progress."
      activeMenu="Dashboard"
    >
      {errorMessage && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {isLoading ? "…" : card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Recent activity</h2>
            <Link
              to="/student/write-pantun"
              className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800"
            >
              + Write Pantun
            </Link>
          </div>

          {!isLoading && recent.length === 0 && (
            <p className="py-10 text-center text-slate-600">
              No pantun yet. Start by writing your first one.
            </p>
          )}

          <ul className="divide-y divide-slate-100">
            {recent.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(item.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.score !== null && (
                    <span className="text-sm font-bold text-emerald-700">
                      {item.score}/100
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      statusStyle[item.status] ?? statusStyle.draft
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-violet-800 p-6 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-200">
            Latest feedback
          </p>

          {latestFeedback ? (
            <>
              <h2 className="mt-3 text-xl font-bold">{latestFeedback.title}</h2>
              {latestFeedback.score !== null && (
                <p className="mt-2 text-3xl font-bold">
                  {latestFeedback.score}
                  <span className="text-lg text-violet-200">/100</span>
                </p>
              )}
              <p className="mt-4 leading-7 text-violet-100">
                “{latestFeedback.feedback || "No written feedback."}”
              </p>
              <p className="mt-4 text-xs text-violet-300">
                {formatDate(latestFeedback.reviewed_at)}
              </p>
              <Link
                to="/student/submissions"
                className="mt-5 inline-block rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold transition hover:bg-white/25"
              >
                View all submissions
              </Link>
            </>
          ) : (
            <p className="mt-3 leading-7 text-violet-100">
              No feedback yet. Submit a pantun and your lecturer's comments will
              appear here.
            </p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;