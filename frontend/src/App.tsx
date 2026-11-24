import { useState } from "react";

type Role = "Student" | "Lecturer" | "Administrator";

function App() {
  const [selectedRole, setSelectedRole] = useState<Role>("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const roles: Role[] = ["Student", "Lecturer", "Administrator"];

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setMessage(
      `Demo login successful as ${selectedRole}. Backend login will be added later.`,
    );
  }

  return (
    <main className="grid min-h-screen w-full md:grid-cols-2">
      {/* Left branding panel */}
      <section className="relative flex min-h-[48vh] overflow-hidden bg-gradient-to-br from-violet-950 via-violet-800 to-purple-600 p-8 text-white md:min-h-screen md:p-16 lg:p-20">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-fuchsia-300/10" />

        <div className="relative flex w-full flex-col justify-between">
          <div>
            <img
              src="/logo.png"
              alt="PantunLingo logo"
              className="w-48 rounded-2xl bg-white p-3 shadow-xl"
            />

            <p className="mt-10 text-sm font-bold uppercase tracking-[0.25em] text-violet-200">
              Digital Pantun Learning
            </p>

            <h1 className="mt-5 max-w-xl text-5xl font-bold leading-tight md:text-6xl">
              Belajar pantun dengan lebih yakin.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-violet-100">
              Tulis pantun, semak struktur asas, simpan draf dan terima maklum
              balas daripada pensyarah dalam satu platform.
            </p>
          </div>

          <div className="mt-12 max-w-xl rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-lg font-bold">“Bahasa jiwa bangsa.”</p>
            <p className="mt-2 leading-6 text-violet-100">
              PantunLingo supports learning practice. Lecturer judgement remains
              essential.
            </p>
          </div>
        </div>
      </section>

      {/* Right login panel */}
      <section className="flex min-h-screen items-center justify-center bg-white p-8 md:p-16 lg:p-20">
        <div className="w-full max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
            Welcome back
          </p>

          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            Log in to PantunLingo
          </h2>

          <p className="mt-4 text-lg leading-7 text-slate-600">
            Select your role and enter your account details.
          </p>

          <form className="mt-10" onSubmit={handleLogin}>
            <label className="text-sm font-semibold text-slate-700">
              Log in as
            </label>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    selectedRole === role
                      ? "border-violet-700 bg-violet-700 text-white shadow-lg shadow-violet-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="mt-7">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700"
              >
                Email or Student ID
              </label>

              <input
                id="email"
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {message && (
              <p
                aria-live="polite"
                className="mt-5 rounded-xl bg-violet-50 p-4 text-sm font-medium text-violet-800"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              className="mt-7 w-full rounded-xl bg-violet-700 px-5 py-4 text-base font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800"
            >
              Log In
            </button>

            <button
              type="button"
              className="mt-5 w-full text-sm font-semibold text-violet-700 transition hover:text-violet-950"
            >
              Forgot password?
            </button>
          </form>

          <p className="mt-12 text-center text-xs leading-5 text-slate-500">
            This is currently a frontend demo. Real authentication and database
            storage will be added through the Node.js backend.
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;