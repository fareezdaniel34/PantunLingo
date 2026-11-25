import { useEffect, useState } from "react";
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
  student_name: string;
  student_email: string;
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

function LecturerReviewSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("submitted");

  const [selected, setSelected] = useState<Submission | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await apiFetch("/api/lecturer/submissions");
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Unable to load submissions.");
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

  function openReview(submission: Submission) {
    setSelected(submission);
    setScore(submission.score !== null ? String(submission.score) : "");
    setFeedback(submission.feedback ?? "");
    setFormError("");
    setActionMessage("");
  }

  async function handleSaveReview() {
    if (!selected) {
      return;
    }

    const numericScore = Number(score);

    if (
      score.trim() === "" ||
      !Number.isInteger(numericScore) ||
      numericScore < 0 ||
      numericScore > 100
    ) {
      setFormError("Score must be a whole number between 0 and 100.");
      return;
    }

    if (!feedback.trim()) {
      setFormError("Please write feedback for the student.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");

      const response = await apiFetch(
        `/api/submissions/${selected.id}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({ score: numericScore, feedback }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Unable to save the review.");
        return;
      }

      setSubmissions((current) =>
        current.map((item) =>
          item.id === selected.id ? data.submission : item,
        ),
      );
      setActionMessage(data.message);
      setSelected(null);
    } catch {
      setFormError(
        "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const awaitingCount = submissions.filter(
    (item) => item.status === "submitted",
  ).length;
  const reviewedCount = submissions.length - awaitingCount;

  const visible =
    filter === "all"
      ? submissions
      : submissions.filter((item) => item.status === filter);

  const filters: { value: Filter; label: string }[] = [
    { value: "submitted", label: `Awaiting (${awaitingCount})` },
    { value: "reviewed", label: `Reviewed (${reviewedCount})` },
    { value: "all", label: `All (${submissions.length})` },
  ];

  return (
    <DashboardLayout
      role="Lecturer"
      name="Dr. Lecturer"
      title="Review Submissions"
      description="Read submitted pantun, give a score and write feedback for each student."
      activeMenu="Review Submissions"
    >
      <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Student Submissions
          </h2>

          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  filter === item.value
                    ? "bg-violet-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {actionMessage && (
          <div className="mt-6 rounded-xl bg-violet-50 p-4 text-sm font-semibold text-violet-800">
            {actionMessage}
          </div>
        )}

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

        {!isLoading && !errorMessage && visible.length === 0 && (
          <p className="py-14 text-center text-slate-600">
            No submissions in this list.
          </p>
        )}

        {!isLoading && !errorMessage && visible.length > 0 && (
          <div className="mt-6 space-y-5">
            {visible.map((item) => {
              const isReviewed = item.status === "reviewed";

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">
                          {item.title}
                        </h3>
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                          {item.rhyme_pattern}
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
                        By{" "}
                        <span className="font-semibold text-slate-700">
                          {item.student_name}
                        </span>{" "}
                        · Submitted{" "}
                        {formatDate(item.submitted_at ?? item.updated_at)}
                      </p>
                    </div>

                    {isReviewed && item.score !== null && (
                      <span className="w-fit rounded-xl bg-emerald-50 px-4 py-2 text-lg font-bold text-emerald-700">
                        {item.score}/100
                      </span>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl bg-violet-50 p-5 text-slate-700">
                    <p>{item.line_1}</p>
                    <p className="mt-2">{item.line_2}</p>
                    <p className="mt-2">{item.line_3}</p>
                    <p className="mt-2">{item.line_4}</p>
                  </div>

                  {isReviewed && item.feedback && (
                    <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm leading-6 text-slate-700">
                      <span className="font-bold text-emerald-700">
                        Your feedback:{" "}
                      </span>
                      {item.feedback}
                    </p>
                  )}

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openReview(item)}
                      className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                        isReviewed
                          ? "border border-violet-300 text-violet-700 hover:bg-violet-50"
                          : "bg-violet-700 text-white hover:bg-violet-800"
                      }`}
                    >
                      {isReviewed ? "Edit Review" : "Review Pantun"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
              Review pantun
            </p>
            <h2
              id="review-title"
              className="mt-3 text-2xl font-bold text-slate-900"
            >
              {selected.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              By {selected.student_name}
            </p>

            <div className="mt-5 rounded-xl bg-violet-50 p-4 text-slate-700">
              <p>{selected.line_1}</p>
              <p className="mt-1">{selected.line_2}</p>
              <p className="mt-1">{selected.line_3}</p>
              <p className="mt-1">{selected.line_4}</p>
            </div>

            <label
              htmlFor="review-score"
              className="mt-6 block text-sm font-semibold text-slate-700"
            >
              Score (0 to 100)
            </label>
            <input
              id="review-score"
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(event) => setScore(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
            />

            <label
              htmlFor="review-feedback"
              className="mt-5 block text-sm font-semibold text-slate-700"
            >
              Feedback
            </label>
            <textarea
              id="review-feedback"
              rows={4}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Comment on rhyme, meaning, language and creativity..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
            />

            {formError && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {formError}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={isSaving}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={isSaving}
                className="rounded-xl bg-violet-700 px-5 py-3 font-bold text-white transition hover:bg-violet-800 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Review"}
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default LecturerReviewSubmissions;