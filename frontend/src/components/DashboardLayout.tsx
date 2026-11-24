import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";

type UserRole = "Student" | "Lecturer" | "Administrator";

type MenuItem = {
  label: string;
  to?: string;
};

type DashboardLayoutProps = {
  role: UserRole;
  name: string;
  title: string;
  description: string;
  activeMenu: string;
  children: ReactNode;
};

const studentMenu: MenuItem[] = [
  { label: "Dashboard", to: "/student" },
  { label: "Write Pantun", to: "/student/write-pantun" },
  { label: "My Drafts", to: "/student/drafts" },
  { label: "Submissions" },
];

const lecturerMenu: MenuItem[] = [
  { label: "Dashboard", to: "/lecturer" },
  { label: "Activities" },
  { label: "Review Submissions" },
  { label: "Students" },
];

const adminMenu: MenuItem[] = [
  { label: "Dashboard", to: "/admin" },
  { label: "Users" },
  { label: "Audit Logs" },
  { label: "Backups" },
];

function DashboardLayout({
  role,
  name,
  title,
  description,
  activeMenu,
  children,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  function handleLogout() {
    setShowLogoutConfirmation(false);

    // Later, remove the real login token/session here.
    navigate("/", { replace: true });
  }

  const menuItems =
    role === "Student"
      ? studentMenu
      : role === "Lecturer"
        ? lecturerMenu
        : adminMenu;

  return (
    <div className="min-h-screen bg-violet-50">
      {/* Desktop sidebar: stays fixed while main content scrolls */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-violet-950 p-6 text-white md:flex">
        <img
          src="/logo.png"
          alt="PantunLingo logo"
          className="w-40 rounded-xl bg-white p-2"
        />

        {/* This area takes available height and allows menu scrolling */}
        <div className="mt-10 flex min-h-0 flex-1 flex-col">
          <p className="shrink-0 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
            {role} Portal
          </p>

          <nav className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
            {menuItems.map((item) => {
              if (!item.to) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled
                    title="This page will be added later."
                    className="w-full cursor-not-allowed rounded-xl px-4 py-3 text-left text-sm font-semibold text-violet-300/60"
                  >
                    {item.label}
                    <span className="ml-2 text-xs">(Soon)</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/student" || item.to === "/lecturer" || item.to === "/admin"}
                  className={({ isActive }) =>
                    `block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                      isActive || item.label === activeMenu
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                        : "text-violet-100 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Always stays at the bottom of the fixed sidebar */}
        <div className="mt-6 shrink-0 rounded-2xl border border-white/15 bg-white/10 p-4">
          <p className="font-semibold">{name}</p>
          <p className="mt-1 text-sm text-violet-200">{role}</p>

          <button
            type="button"
            onClick={() => setShowLogoutConfirmation(true)}
            className="mt-4 block w-full rounded-xl bg-white/15 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-white/25"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between bg-violet-950 p-4 text-white md:hidden">
        <img
          src="/logo.png"
          alt="PantunLingo logo"
          className="w-32 rounded-lg bg-white p-2"
        />

        <button
          type="button"
          onClick={() => setShowLogoutConfirmation(true)}
          className="rounded-lg bg-white/15 px-3 py-2 text-sm font-bold"
        >
          Log out
        </button>
      </header>

      {/* md:ml-72 leaves space for the fixed desktop sidebar */}
      <main className="min-w-0 p-6 md:ml-72 md:p-10">
        <header className="flex flex-col gap-4 border-b border-violet-100 pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
              {role} Portal
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
              {title}
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              {description}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Signed in as
            </p>
            <p className="mt-1 font-bold text-slate-900">{name}</p>
          </div>
        </header>

        <div className="py-8">{children}</div>
      </main>

      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
              Confirm logout
            </p>

            <h2
              id="logout-title"
              className="mt-3 text-2xl font-bold text-slate-900"
            >
              Are you sure you want to log out?
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              You will return to the PantunLingo login page.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmation(false)}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
              >
                Yes, log out
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;