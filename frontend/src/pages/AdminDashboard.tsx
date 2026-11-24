import { Link } from "react-router";

function AdminDashboard() {
  return (
    <main className="min-h-screen bg-violet-50 p-8 md:p-12">
      <Link to="/" className="text-sm font-semibold text-violet-700">
        ← Log out
      </Link>

      <p className="mt-10 text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
        Administrator Dashboard
      </p>

      <h1 className="mt-3 text-4xl font-bold text-slate-900">
        Selamat datang, Administrator
      </h1>

      <p className="mt-3 text-slate-600">
        You logged in as an administrator.
      </p>
    </main>
  );
}

export default AdminDashboard;