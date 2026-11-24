import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import DashboardLayout from "../components/DashboardLayout";

function getLineEnding(line: string) {
  const cleanText = line
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-ZÀ-ÿ]/g, "");

  if (!cleanText) {
    return "-";
  }

  return cleanText.slice(-2);
}

function StudentPantunEditor() {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [title, setTitle] = useState("");
  const [lines, setLines] = useState(["", "", "", ""]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(draftId));

  const endings = lines.map(getLineEnding);

  function getRhymeLabels() {
    const labels = ["", "", "", ""];

    // Line 1 always begins with rhyme group A.
    if (endings[0] !== "-") {
      labels[0] = "A";
    }

    // Line 2 begins with rhyme group B.
    if (endings[1] !== "-") {
      labels[1] = "B";
    }

    // Line 3 can match A, B, or become C.
    if (endings[2] !== "-") {
      if (endings[2] === endings[0]) {
        labels[2] = "A";
      } else if (endings[2] === endings[1]) {
        labels[2] = "B";
      } else {
        labels[2] = "C";
      }
    }

    // Line 4 can match A, B, C, or become D.
    if (endings[3] !== "-") {
      if (endings[3] === endings[0]) {
        labels[3] = "A";
      } else if (endings[3] === endings[1]) {
        labels[3] = "B";
      } else if (labels[2] === "C" && endings[3] === endings[2]) {
        labels[3] = "C";
      } else {
        labels[3] = "D";
      }
    }

    return labels;
  }

  const rhymeLabels = getRhymeLabels();

  const allLinesCompleted = lines.every((line) => line.trim().length > 0);

  const followsAbabPattern =
    allLinesCompleted &&
    endings[0] !== "-" &&
    endings[1] !== "-" &&
    endings[0] === endings[2] &&
    endings[1] === endings[3];

  useEffect(() => {
    async function loadDraft() {
      if (!draftId) {
        return;
      }

      try {
        setIsLoadingDraft(true);
        setMessage("");

        const response = await fetch(
          `http://localhost:5000/api/drafts/${draftId}`,
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Unable to load this draft.");
          return;
        }

        const draft = data.draft;

        // Temporary demo ownership check. Replace this with real login later.
        if (draft.student_id !== 1) {
          setMessage("You do not have permission to edit this draft.");
          return;
        }

        setTitle(draft.title);
        setLines([draft.line_1, draft.line_2, draft.line_3, draft.line_4]);
      } catch {
        setMessage(
          "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
        );
      } finally {
        setIsLoadingDraft(false);
      }
    }

    loadDraft();
  }, [draftId]);

  function updateLine(index: number, value: string) {
    const updatedLines = [...lines];
    updatedLines[index] = value;
    setLines(updatedLines);
    setMessage("");
  }

  async function handleSaveDraft() {
    if (!title.trim()) {
      setMessage("Please enter a title for your pantun.");
      return;
    }

    if (!allLinesCompleted) {
      setMessage("Please complete all four pantun lines before saving.");
      return;
    }

    const rhymePattern = rhymeLabels.join("-");
    const isEditing = Boolean(draftId);

    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        isEditing
          ? `http://localhost:5000/api/drafts/${draftId}`
          : "http://localhost:5000/api/drafts",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: 1,
            title,
            line1: lines[0],
            line2: lines[1],
            line3: lines[2],
            line4: lines[3],
            rhymePattern,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to save the draft.");
        return;
      }

      setMessage(
        isEditing
          ? `Draft "${data.draft.title}" updated successfully.`
          : `Draft "${data.draft.title}" saved successfully to the database.`,
      );
    } catch {
      setMessage(
        "Unable to connect to the backend. Make sure the backend server is running on port 5000.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleClear() {
    setTitle("");
    setLines(["", "", "", ""]);
    setMessage("");
  }

  return (
    <DashboardLayout
      role="Student"
      name="Nur Aina"
      title={draftId ? "Edit Pantun Draft" : "Write Pantun"}
      description={
        draftId
          ? "Update your saved pantun draft and save the changes to the database."
          : "Write a four-line pantun and review its basic A-B-A-B ending pattern before saving it as a draft."
      }
      activeMenu="Write Pantun"
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2 md:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Pantun Editor
              </h2>
              <p className="mt-2 leading-6 text-slate-600">
                Complete each line. The system checks the final two letters as a
                simple rhyme guide only.
              </p>
            </div>

            <span className="w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
              4 lines required
            </span>
          </div>

          <div className="mt-7">
            <label
              htmlFor="pantun-title"
              className="text-sm font-semibold text-slate-700"
            >
              Pantun Title
            </label>

            <input
              id="pantun-title"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setMessage("");
              }}
              placeholder="Example: Pantun Alam Sekitar"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="mt-7 space-y-5">
            {lines.map((line, index) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`pantun-line-${index}`}
                    className="text-sm font-semibold text-slate-700"
                  >
                    Line {index + 1}
                  </label>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        rhymeLabels[index] === "A"
                          ? "bg-violet-100 text-violet-800"
                          : rhymeLabels[index] === "B"
                            ? "bg-blue-100 text-blue-800"
                            : rhymeLabels[index] === "C"
                              ? "bg-amber-100 text-amber-800"
                              : rhymeLabels[index] === "D"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      Rhyme: {rhymeLabels[index] || "-"}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      Ending: {endings[index]}
                    </span>
                  </div>
                </div>

                <textarea
                  id={`pantun-line-${index}`}
                  value={line}
                  onChange={(event) => updateLine(index, event.target.value)}
                  rows={2}
                  placeholder={`Write pantun line ${index + 1}...`}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            ))}
          </div>

          {message && (
            <p className="mt-6 rounded-xl bg-violet-50 p-4 text-sm font-semibold text-violet-800">
              {message}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving || isLoadingDraft}
              className="rounded-xl bg-violet-700 px-5 py-3 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : isLoadingDraft
                  ? "Loading Draft..."
                  : draftId
                    ? "Update Draft"
                    : "Save Draft"}
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
              Basic structure check
            </p>

            <h2 className="mt-3 text-xl font-bold text-slate-900">
              Rhyme Pattern Check
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {rhymeLabels.map((label, index) => (
                <span
                  key={index}
                  className={`rounded-lg px-3 py-2 text-sm font-bold ${
                    label === "A"
                      ? "bg-violet-100 text-violet-800"
                      : label === "B"
                        ? "bg-blue-100 text-blue-800"
                        : label === "C"
                          ? "bg-amber-100 text-amber-800"
                          : label === "D"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Line {index + 1}: {label || "-"}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Detected pattern:{" "}
              <span className="text-violet-700">
                {rhymeLabels.every((label) => label)
                  ? rhymeLabels.join("-")
                  : "-"}
              </span>
            </p>

            {!allLinesCompleted && (
              <p className="mt-3 leading-6 text-slate-600">
                Write all four lines to check the suggested pantun rhyme
                pattern.
              </p>
            )}

            {allLinesCompleted && followsAbabPattern && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                <p className="font-bold text-emerald-800">
                  Basic A-B-A-B pattern detected.
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  Line 1 matches line 3, and line 2 matches line 4 based on
                  their final two letters.
                </p>
              </div>
            )}

            {allLinesCompleted && !followsAbabPattern && (
              <div className="mt-4 rounded-xl bg-amber-50 p-4">
                <p className="font-bold text-amber-800">
                  Pattern needs review.
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  Try making line 1 and line 3 similar at the end, then line 2
                  and line 4 similar at the end.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-violet-800 p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-200">
              Reminder
            </p>

            <p className="mt-3 text-lg font-bold">
              System feedback is only a guide.
            </p>

            <p className="mt-3 text-sm leading-6 text-violet-100">
              Your lecturer will still evaluate meaning, language quality,
              creativity and the overall suitability of your pantun.
            </p>
          </section>
        </aside>
      </div>
    </DashboardLayout>
  );
}

export default StudentPantunEditor;
