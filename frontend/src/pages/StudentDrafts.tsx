import { useEffect, useState } from "react";
import { Link } from "react-router";
import DashboardLayout from "../components/DashboardLayout";
import { apiFetch } from "../auth";

type PantunDraft = {
  id: number;
  title: string;
  line_1: string;
  line_2: string;
  line_3: string;
  line_4: string;
  rhyme_pattern: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(dateValue: string) {
  const date = new Date(`${dateValue.replace(" ", "T")}Z`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StudentDrafts() {
  const [drafts, setDrafts] = useState<PantunDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [draftToDelete, setDraftToDelete] = useState<PantunDraft | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [draftToSubmit, setDraftToSubmit] = useState<PantunDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadDrafts() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await apiFetch("/api/drafts/mine");
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Unable to load your drafts.");
          return;
        }

        setDrafts(data.drafts);
      } catch {
        setErrorMessage(
          "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDrafts();
  }, []);

  async function handleDeleteDraft() {
    if (!draftToDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setActionMessage("");

      const response = await apiFetch(`/api/drafts/${draftToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setActionMessage(data.message || "Unable to delete this draft.");
        return;
      }

      setDrafts((currentDrafts) =>
        currentDrafts.filter((draft) => draft.id !== draftToDelete.id),
      );

      setActionMessage(data.message);
      setDraftToDelete(null);
    } catch {
      setActionMessage(
        "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSubmitDraft() {
    if (!draftToSubmit) {
      return;
    }

    try {
      setIsSubmitting(true);
      setActionMessage("");

      const response = await apiFetch(
        `/api/drafts/${draftToSubmit.id}/submit`,
        { method: "PATCH" },
      );

      const data = await response.json();

      if (!response.ok) {
        setActionMessage(data.message || "Unable to submit this pantun.");
        return;
      }

      setDrafts((currentDrafts) =>
        currentDrafts.map((draft) =>
          draft.id === draftToSubmit.id ? data.draft : draft,
        ),
      );

      setActionMessage(data.message);
      setDraftToSubmit(null);
    } catch {
      setActionMessage(
        "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      role="Student"
      name="Nur Aina"
      title="My Drafts"
      description="View, edit, delete or submit the pantun drafts you have saved."
      activeMenu="My Drafts"
    >
      <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Saved Pantun Drafts
            </h2>
            <p className="mt-2 text-slate-600">
              {drafts.length} {drafts.length === 1 ? "draft" : "drafts"} saved
              in your account.
            </p>
          </div>

          <Link
            to="/student/write-pantun"
            className="w-fit rounded-xl bg-violet-700 px-5 py-3 font-bold text-white transition hover:bg-violet-800"
          >
            + Write Pantun
          </Link>
        </div>

        {actionMessage && (
          <div className="mt-6 rounded-xl bg-violet-50 p-4 text-sm font-semibold text-violet-800">
            {actionMessage}
          </div>
        )}

        {isLoading && (
          <div className="py-14 text-center">
            <p className="font-semibold text-slate-600">Loading drafts...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && drafts.length === 0 && (
          <div className="py-14 text-center">
            <p className="text-xl font-bold text-slate-900">
              No saved drafts yet
            </p>
            <p className="mt-2 text-slate-600">
              Start writing your first pantun and save it as a draft.
            </p>

            <Link
              to="/student/write-pantun"
              className="mt-6 inline-block rounded-xl bg-violet-700 px-5 py-3 font-bold text-white transition hover:bg-violet-800"
            >
              Write Your First Pantun
            </Link>
          </div>
        )}

        {!isLoading && !errorMessage && drafts.length > 0 && (
          <div className="mt-6 space-y-5">
            {drafts.map((draft) => {
              const isLocked = draft.status !== "draft";

              return (
                <article
                  key={draft.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-violet-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">
                          {draft.title}
                        </h3>

                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                          {draft.rhyme_pattern}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            draft.status === "reviewed"
                              ? "bg-emerald-100 text-emerald-700"
                              : draft.status === "submitted"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {draft.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Last saved: {formatDate(draft.updated_at)}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-slate-500">
                      Draft #{draft.id}
                    </span>
                  </div>

                  <div className="mt-5 rounded-xl bg-violet-50 p-5 text-slate-700">
                    <p>{draft.line_1}</p>
                    <p className="mt-2">{draft.line_2}</p>
                    <p className="mt-2">{draft.line_3}</p>
                    <p className="mt-2">{draft.line_4}</p>
                  </div>

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    {isLocked ? (
                      <Link
                        to="/student/submissions"
                        className={`rounded-xl px-4 py-2.5 text-center text-sm font-bold transition ${
                          draft.status === "reviewed"
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        {draft.status === "reviewed"
                          ? "Reviewed · View feedback"
                          : "Submitted · Awaiting review"}
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActionMessage("");
                            setDraftToDelete(draft);
                          }}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                        >
                          Delete Draft
                        </button>

                        <Link
                          to={`/student/write-pantun?draftId=${draft.id}`}
                          className="rounded-xl border border-violet-300 px-4 py-2.5 text-center text-sm font-bold text-violet-700 transition hover:bg-violet-50"
                        >
                          Continue Editing
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setActionMessage("");
                            setDraftToSubmit(draft);
                          }}
                          className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800"
                        >
                          Submit Pantun
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-draft-title"
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
              Delete draft
            </p>

            <h2
              id="delete-draft-title"
              className="mt-3 text-2xl font-bold text-slate-900"
            >
              Delete this draft?
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              You are about to permanently delete{" "}
              <span className="font-bold text-slate-800">
                "{draftToDelete.title}"
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDraftToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Draft"}
              </button>
            </div>
          </section>
        </div>
      )}

      {draftToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-draft-title"
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
              Submit pantun
            </p>

            <h2
              id="submit-draft-title"
              className="mt-3 text-2xl font-bold text-slate-900"
            >
              Submit for review?
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              <span className="font-bold text-slate-800">
                "{draftToSubmit.title}"
              </span>{" "}
              will be sent to your lecturer. After submitting, you can no
              longer edit or delete it.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDraftToSubmit(null)}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitDraft}
                disabled={isSubmitting}
                className="rounded-xl bg-violet-700 px-5 py-3 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentDrafts;