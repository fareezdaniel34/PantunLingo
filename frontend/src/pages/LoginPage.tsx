import { useState } from "react";
import { useNavigate } from "react-router";

type UserRole = "student" | "lecturer" | "admin";

type DemoAccount = {
  role: UserRole;
};

const demoAccounts: Record<string, DemoAccount> = {
  "student@pantunlingo.com": { role: "student" },
  "lecturer@pantunlingo.com": { role: "lecturer" },
  "admin@pantunlingo.com": { role: "admin" },
};

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const account = demoAccounts[normalizedEmail];

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (!account) {
      setMessage(
        "Demo account not found. Use student@pantunlingo.com, lecturer@pantunlingo.com or admin@pantunlingo.com.",
      );
      return;
    }

    if (account.role === "student") {
      navigate("/student");
    }

    if (account.role === "lecturer") {
      navigate("/lecturer");
    }

    if (account.role === "admin") {
      navigate("/admin");
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
              <p className="mt-5 rounded-xl bg-violet-50 p-4 text-sm font-medium text-violet-800">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="mt-7 w-full rounded-xl bg-violet-700 px-5 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800"
            >
              Log In
            </button>
          </form>

          <div className="mt-10 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
            <p className="font-bold text-slate-700">Demo accounts</p>
            <p>Student: student@pantunlingo.com</p>
            <p>Lecturer: lecturer@pantunlingo.com</p>
            <p>Administrator: admin@pantunlingo.com</p>
            <p>Password: any value for now</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;