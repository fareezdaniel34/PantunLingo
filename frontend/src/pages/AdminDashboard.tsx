import DashboardLayout from "../components/DashboardLayout";

function AdminDashboard() {
  return (
    <DashboardLayout
      role="Administrator"
      name="PantunLingo Admin"
      title="System Overview"
      description="Manage users, monitor system activity and maintain PantunLingo records."
      activeMenu="Dashboard"
    >
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Users", "128", "Registered accounts"],
          ["Active Accounts", "121", "Accounts currently active"],
          ["Lecturers", "8", "Teaching accounts"],
          ["Recent Audit Logs", "24", "Recorded system actions"],
        ].map(([label, value, description]) => (
          <article key={label} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-4xl font-bold text-violet-700">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
            User management
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            Create and manage accounts
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Add student and lecturer accounts, manage account status, and reset
            passwords.
          </p>

          <button
            type="button"
            className="mt-6 rounded-xl bg-violet-700 px-5 py-3 font-bold text-white hover:bg-violet-800"
          >
            Manage users
          </button>
        </article>

        <article className="rounded-2xl bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
            Data protection
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            System backup
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Download a secure copy of the system data before major changes or
            scheduled maintenance.
          </p>

          <button
            type="button"
            className="mt-6 rounded-xl border border-violet-700 px-5 py-3 font-bold text-violet-700 hover:bg-violet-50"
          >
            Create backup
          </button>
        </article>
      </section>
    </DashboardLayout>
  );
}

export default AdminDashboard;