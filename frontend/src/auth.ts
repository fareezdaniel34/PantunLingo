export const API_URL = "http://localhost:5000";

export type AppRole = "student" | "lecturer" | "admin";

export type SessionUser = {
  id: number;
  fullName: string;
  email: string;
  role: AppRole;
};

const TOKEN_KEY = "pantunlingo_token";
const USER_KEY = "pantunlingo_user";

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function homeFor(role: AppRole) {
  return role === "student" ? "/student" : role === "lecturer" ? "/lecturer" : "/admin";
}

// Use this instead of fetch for every backend call.
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearSession();
    window.location.href = "/";
  }

  return response;
}