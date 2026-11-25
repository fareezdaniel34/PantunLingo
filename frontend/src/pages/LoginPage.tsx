import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { API_URL, getToken, getUser, homeFor, saveSession } from "../auth";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Already logged in? Go straight to the right dashboard.
  const currentUser = getUser();
  if (currentUser && getToken()) {
    return <Navigate to={homeFor(currentUser.role)} replace />;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    try {
      setIsLoggingIn(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to log in.");
        return;
      }

      saveSession(data.token, data.user);
      navigate(homeFor(data.user.role), { replace: true });
    } catch {
      setMessage(
        "Unable to connect to the backend. Make sure it is running on port 5000.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <main className="grid h-screen w-screen overflow-hidden md:grid-cols-2">
      <section className="relative flex overflow-hidden bg-gradient-to-br from-violet-950 via-violet-800 to-purple-600 p-8 text-white md:p-16 lg:p-20">
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

          <div className="max-w-xl rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-lg font-bold">“Bahasa jiwa bangsa.”</p>
            <p className="mt-2 leading-6 text-violet-100">
              PantunLingo supports learning practice. Lecturer judgement remains
              essential.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center overflow-hidden bg-white p-8 md:p-16 lg:p-20">
        <div className="w-full max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
            Welcome back
          </p>

          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            Log in to PantunLingo
          </h2>

          <p className="mt-4 text-lg leading-7 text-slate-600">
            Enter your account details to continue.
          </p>

          <form className="mt-10" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage("");
                }}
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
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setMessage("");
                }}
                placeholder="Enter your password"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {message && (
              <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-7 w-full rounded-xl bg-violet-700 px-5 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-10 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
            <p className="font-bold text-slate-700">
              Demo accounts (development only)
            </p>
            <p>Student: student@pantunlingo.com / student123</p>
            <p>Lecturer: lecturer@pantunlingo.com / lecturer123</p>
            <p>Administrator: admin@pantunlingo.com / admin123</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;