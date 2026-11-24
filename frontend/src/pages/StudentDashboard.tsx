import DashboardLayout from "../components/DashboardLayout";
import { Link } from "react-router";
function StudentDashboard() {
  return (
    <DashboardLayout
      role="Student"
      name="Nur Aina"
      title="Selamat datang, Nur Aina"
      description="Teruskan pembelajaran anda dengan menulis, menyemak dan menambah baik pantun."
      activeMenu="Dashboard"
    >
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">My Drafts</p>
          <p className="mt-3 text-4xl font-bold text-violet-700">3</p>
          <p className="mt-2 text-sm text-slate-500">Pantun belum dihantar</p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Submitted Pantun
          </p>
          <p className="mt-3 text-4xl font-bold text-violet-700">2</p>
          <p className="mt-2 text-sm text-slate-500">Submission completed</p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Feedback Received
          </p>
          <p className="mt-3 text-4xl font-bold text-violet-700">1</p>
          <p className="mt-2 text-sm text-slate-500">
            Lecturer feedback available
          </p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Active Activities
          </p>
          <p className="mt-3 text-4xl font-bold text-violet-700">2</p>
          <p className="mt-2 text-sm text-slate-500">Activities to complete</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl bg-gradient-to-br from-violet-800 to-purple-600 p-7 text-white xl:col-span-2">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-200">
            Continue learning
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Ready to write a new pantun?
          </h2>

          <p className="mt-3 max-w-xl leading-7 text-violet-100">
            Use the Pantun Editor to write four lines, check the basic rhyme
            pattern and save your work as a draft.
          </p>

          <Link
            to="/student/write-pantun"
            className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-bold text-violet-800 transition hover:bg-violet-100"
          >
            + Write Pantun
          </Link>
        </article>

        <article className="rounded-2xl bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
            Latest feedback
          </p>

          <h2 className="mt-3 text-xl font-bold text-slate-900">
            Pantun Alam Sekitar
          </h2>

          <p className="mt-3 leading-6 text-slate-600">
            Good structure. Review the rhyme of line two and line four before
            your next submission.
          </p>

          <button
            type="button"
            className="mt-5 text-sm font-bold text-violet-700 hover:text-violet-950"
          >
            View feedback →
          </button>
        </article>
      </section>
    </DashboardLayout>
  );
}

export default StudentDashboard;
