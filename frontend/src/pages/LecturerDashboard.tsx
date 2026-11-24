import DashboardLayout from "../components/DashboardLayout";

function LecturerDashboard() {
  return (
    <DashboardLayout
      role="Lecturer"
      name="Dr. Has"
      title="Selamat datang, Dr. Has"
      description="Review student submissions, monitor activities and provide meaningful feedback."
      activeMenu="Dashboard"
    >
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Awaiting Review", "12", "Student pantun to assess"],
          ["Active Activities", "4", "Activities currently available"],
          ["Total Students", "36", "Students in your classes"],
          ["Reviewed This Week", "18", "Completed feedback records"],
        ].map(([label, value, description]) => (
          <article key={label} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-4xl font-bold text-violet-700">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
              Priority task
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              12 submissions are awaiting your review.
            </h2>
            <p className="mt-2 text-slate-600">
              Start reviewing student work and publish constructive feedback.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl bg-violet-700 px-5 py-3 font-bold text-white hover:bg-violet-800"
          >
            Review submissions
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default LecturerDashboard;