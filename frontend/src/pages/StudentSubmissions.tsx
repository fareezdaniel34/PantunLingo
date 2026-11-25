import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import DashboardLayout from "../components/DashboardLayout";
import { apiFetch } from "../auth";

type Submission = {
  id: number;
  title: string;
  line_1: string;
  line_2: string;
  line_3: string;
  line_4: string;
  rhyme_pattern: string;
  status: string;
  feedback: string | null;
  score: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  updated_at: string;
};

type Filter = "all" | "submitted" | "reviewed";

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

function StudentSubmissions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const filter: Filter =
    statusParam === "submitted" || statusParam === "reviewed"
      ? statusParam
      : "all";

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await apiFetch("/api/submissions/mine");
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Unable to load your submissions.");
          return;
        }

        setSubmissions(data.submissions);
      } catch {
        setErrorMessage(
          "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSubmissions();
  }, []);

  const reviewedCount = submissions.filter(
    (submission) => submission.status === "reviewed",
  ).length;
  const awaitingCount = submissions.length - reviewedCount;

  const visibleSubmissions =
    filter === "all"
      ? submissions
      : submissions.filter((submission) => submission.status === filter);

  function changeFilter(next: Filter) {
    if (next === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ status: next });
    }
  }

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: submissions.length },
    { key: "submitted", label: "Awaiting review", count: awaitingCount },
    { key: "reviewed", label: "Reviewed", count: reviewedCount },
  ];

  const emptyText =
    filter === "submitted"
      ? "Nothing is waiting for review."
      : filter === "reviewed"
        ? "None of your pantun has been reviewed yet."
        : "No submissions yet";

  return (
    <DashboardLayout
      role="Student"
      name="Nur Aina"
      title="Submissions"
      description="Track the pantun you have submitted and read your lecturer's feedback once it has been reviewed."
      activeMenu="Submissions"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => changeFilter(tab.key)}
            className={`rounded-2xl p-5 text-left shadow-sm transition ${
              filter === tab.key
                ? "bg-violet-700 text-white"
                : "bg-white hover:shadow-md"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                filter === tab.key ? "text-violet-100" : "text-slate-500"
              }`}
            >
              {tab.key === "all" ? "Total submitted" : tab.label}
            </p>
            <p
              className={`mt-2 text-3xl font-bold ${
                filter === tab.key
                  ? "text-white"
                  : tab.key === "submitted"
                    ? "text-amber-600"
                    : tab.key === "reviewed"
                      ? "text-emerald-600"
                      : "text-slate-900"
              }`}
            >
              {tab.count}
            </p>
          </button>
        ))}
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Submitted Pantun</h2>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => changeFilter(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  filter === tab.key
                    ? "bg-violet-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <p className="py-14 text-center font-semibold text-slate-600">
            Loading submissions...
          </p>
        )}

        {!isLoading && errorMessage && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && visibleSubmissions.length === 0 && (
          <div className="py-14 text-center">
            <p className="text-xl font-bold text-slate-900">{emptyText}</p>
            {filter === "all" && (
              <>
                <p className="mt-2 text-slate-600">
                  Submit a finished pantun from My Drafts to send it to your
                  lecturer.
                </p>
                <Link
                  to="/student/drafts"
                  className="mt-6 inline-block rounded-xl bg-violet-700 px-5 py-3 font-bold text-white transition hover:bg-violet-800"
                >
                  Go to My Drafts
                </Link>
              </>
            )}
          </div>
        )}

        {!isLoading && !errorMessage && visibleSubmissions.length > 0 && (
          <div className="mt-6 space-y-5">
            {visibleSubmissions.map((submission) => {
              const isReviewed = submission.status === "reviewed";

              return (
                <article
                  key={submission.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">
                          {submission.title}
                        </h3>
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                          {submission.rhyme_pattern}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isReviewed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isReviewed ? "Reviewed" : "Awaiting review"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Submitted:{" "}
                        {formatDate(
                          submission.submitted_at ?? submission.updated_at,
                        )}
                      </p>
                    </div>

                    {isReviewed && submission.score !== null && (
                      <div className="rounded-xl bg-emerald-50 px-4 py-2 text-center">
                        <p className="text-xs font-semibold text-emerald-700">
                          Score
                        </p>
                        <p className="text-2xl font-bold text-emerald-700">
                          {submission.score}/100
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl bg-violet-50 p-5 text-slate-700">
                    <p>{submission.line_1}</p>
                    <p className="mt-2">{submission.line_2}</p>
                    <p className="mt-2">{submission.line_3}</p>
                    <p className="mt-2">{submission.line_4}</p>
                  </div>

                  {isReviewed ? (
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                      <p className="text-sm font-bold uppercase tracking-[0.15em] text-emerald-700">
                        Lecturer feedback
                      </p>
                      <p className="mt-2 leading-7 text-slate-700">
                        {submission.feedback || "No written feedback."}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        Reviewed: {formatDate(submission.reviewed_at)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-slate-500">
                      Your lecturer has not reviewed this pantun yet.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default StudentSubmissions;