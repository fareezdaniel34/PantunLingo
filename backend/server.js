const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is missing. Create backend/.env and run: npm start");
  process.exit(1);
}

const databaseFolder = path.join(__dirname, "database");
const databasePath = path.join(databaseFolder, "pantunlingo.db");
fs.mkdirSync(databaseFolder, { recursive: true });
const db = new Database(databasePath);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ---------- Tables ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('student', 'lecturer', 'admin')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pantun_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    line_1 TEXT NOT NULL,
    line_2 TEXT NOT NULL,
    line_3 TEXT NOT NULL,
    line_4 TEXT NOT NULL,
    rhyme_pattern TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES users(id)
  );
`);

// Add new columns to an existing database without losing data.
function addColumnIfMissing(table, column, definition) {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((item) => item.name);

  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    // users.is_active: 1 = active, 0 = deactivated
const userColumns = db.prepare("PRAGMA table_info(users)").all();
if (!userColumns.some((column) => column.name === "is_active")) {
  db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
}
  }
}

addColumnIfMissing("users", "password_hash", "TEXT");
addColumnIfMissing("pantun_drafts", "feedback", "TEXT");
addColumnIfMissing("pantun_drafts", "score", "INTEGER");
addColumnIfMissing("pantun_drafts", "submitted_at", "TEXT");
addColumnIfMissing("pantun_drafts", "reviewed_at", "TEXT");

// ---------- Demo accounts (development only) ----------
const demoUsers = [
  { fullName: "Nur Aina", email: "student@pantunlingo.com", role: "student", password: "student123" },
  { fullName: "Dr. Lecturer", email: "lecturer@pantunlingo.com", role: "lecturer", password: "lecturer123" },
  { fullName: "Administrator", email: "admin@pantunlingo.com", role: "admin", password: "admin123" },
];

for (const user of demoUsers) {
  const existing = db
    .prepare("SELECT id, password_hash FROM users WHERE email = ?")
    .get(user.email);

  const hash = bcrypt.hashSync(user.password, 10);

  if (!existing) {
    db.prepare(
      "INSERT INTO users (full_name, email, role, password_hash) VALUES (?, ?, ?, ?)",
    ).run(user.fullName, user.email, user.role, hash);
    console.log(`Demo ${user.role} account created.`);
  } else if (!existing.password_hash) {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, existing.id);
    console.log(`Password set for demo ${user.role}.`);
  }
}

// ---------- Auth helpers ----------
function toPublicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
  };
}

// requireAuth() = any logged-in user. requireAuth("lecturer") = lecturers only.
function requireAuth(...allowedRoles) {
  return (request, response, next) => {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return response.status(401).json({ success: false, message: "Please log in first." });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db
        .prepare("SELECT id, full_name, email, role FROM users WHERE id = ?")
        .get(Number(payload.sub));

      if (!user) {
        return response.status(401).json({ success: false, message: "Account not found." });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return response.status(403).json({
          success: false,
          message: "You do not have permission to do this.",
        });
      }

      request.user = user;
      return next();
    } catch {
      return response.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
  };
}

function isValidPantun(body) {
  const { title, line1, line2, line3, line4, rhymePattern } = body;
  return (
    title?.trim() &&
    line1?.trim() &&
    line2?.trim() &&
    line3?.trim() &&
    line4?.trim() &&
    rhymePattern?.trim()
  );
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ---------- Public routes ----------
app.get("/api/health", (request, response) => {
  response.json({ success: true, message: "PantunLingo backend is running." });
});

app.post("/api/auth/login", (request, response) => {
  const { email, password } = request.body;

  if (!email?.trim() || !password) {
    return response.status(400).json({
      success: false,
      message: "Please enter your email and password.",
    });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase());

  // Same message for wrong email or wrong password (do not reveal which).
  if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    return response.status(401).json({
      success: false,
      message: "Incorrect email or password.",
    });
  }
  if (user.is_active === 0) {
    return response.status(403).json({
      success: false,
      message: "This account has been deactivated. Please contact the administrator.",
    });
  }
  const token = jwt.sign({ sub: String(user.id), role: user.role }, JWT_SECRET, {
    expiresIn: "8h",
  });

  return response.json({ success: true, token, user: toPublicUser(user) });
});

app.get("/api/auth/me", requireAuth(), (request, response) => {
  response.json({ success: true, user: toPublicUser(request.user) });
});

// ---------- Student: drafts ----------
// "/mine" must come before "/:draftId".
app.get("/api/drafts/mine", requireAuth("student"), (request, response) => {
  const drafts = db
    .prepare(`
      SELECT id, title, line_1, line_2, line_3, line_4, rhyme_pattern,
             status, created_at, updated_at
      FROM pantun_drafts
      WHERE student_id = ?
      ORDER BY updated_at DESC, id DESC
    `)
    .all(request.user.id);

  response.json({ success: true, drafts });
});

app.post("/api/drafts", requireAuth("student"), (request, response) => {
  if (!isValidPantun(request.body)) {
    return response.status(400).json({
      success: false,
      message: "Please complete the title and all four pantun lines.",
    });
  }

  const { title, line1, line2, line3, line4, rhymePattern } = request.body;

  const result = db
    .prepare(`
      INSERT INTO pantun_drafts
        (student_id, title, line_1, line_2, line_3, line_4, rhyme_pattern)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      request.user.id,
      title.trim(),
      line1.trim(),
      line2.trim(),
      line3.trim(),
      line4.trim(),
      rhymePattern.trim(),
    );

  const draft = db
    .prepare("SELECT * FROM pantun_drafts WHERE id = ?")
    .get(result.lastInsertRowid);

  response.status(201).json({ success: true, message: "Draft saved successfully.", draft });
});

app.get("/api/drafts/:draftId", requireAuth("student"), (request, response) => {
  const draftId = parseId(request.params.draftId);

  if (!draftId) {
    return response.status(400).json({ success: false, message: "Invalid draft ID." });
  }

  const draft = db
    .prepare("SELECT * FROM pantun_drafts WHERE id = ? AND student_id = ?")
    .get(draftId, request.user.id);

  if (!draft) {
    return response.status(404).json({ success: false, message: "Draft not found." });
  }

  response.json({ success: true, draft });
});

app.put("/api/drafts/:draftId", requireAuth("student"), (request, response) => {
  const draftId = parseId(request.params.draftId);

  if (!draftId) {
    return response.status(400).json({ success: false, message: "Invalid draft ID." });
  }

  if (!isValidPantun(request.body)) {
    return response.status(400).json({
      success: false,
      message: "Please complete the title and all four pantun lines.",
    });
  }

  const existing = db
    .prepare("SELECT id, status FROM pantun_drafts WHERE id = ? AND student_id = ?")
    .get(draftId, request.user.id);

  if (!existing) {
    return response.status(404).json({ success: false, message: "Draft not found." });
  }

  if (existing.status !== "draft") {
    return response.status(400).json({
      success: false,
      message: "Submitted pantun can no longer be edited.",
    });
  }

  const { title, line1, line2, line3, line4, rhymePattern } = request.body;

  db.prepare(`
    UPDATE pantun_drafts
    SET title = ?, line_1 = ?, line_2 = ?, line_3 = ?, line_4 = ?,
        rhyme_pattern = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title.trim(),
    line1.trim(),
    line2.trim(),
    line3.trim(),
    line4.trim(),
    rhymePattern.trim(),
    draftId,
  );

  const draft = db.prepare("SELECT * FROM pantun_drafts WHERE id = ?").get(draftId);
  response.json({ success: true, message: "Draft updated successfully.", draft });
});

app.delete("/api/drafts/:draftId", requireAuth("student"), (request, response) => {
  const draftId = parseId(request.params.draftId);

  if (!draftId) {
    return response.status(400).json({ success: false, message: "Invalid draft ID." });
  }

  const draft = db
    .prepare("SELECT id, title, status FROM pantun_drafts WHERE id = ? AND student_id = ?")
    .get(draftId, request.user.id);

  if (!draft) {
    return response.status(404).json({ success: false, message: "Draft not found." });
  }

  if (draft.status !== "draft") {
    return response.status(400).json({
      success: false,
      message: "Submitted pantun cannot be deleted.",
    });
  }

  db.prepare("DELETE FROM pantun_drafts WHERE id = ?").run(draftId);

  response.json({
    success: true,
    message: `Draft "${draft.title}" deleted successfully.`,
    deletedDraftId: draftId,
  });
});

app.patch("/api/drafts/:draftId/submit", requireAuth("student"), (request, response) => {
  const draftId = parseId(request.params.draftId);

  if (!draftId) {
    return response.status(400).json({ success: false, message: "Invalid draft ID." });
  }

  const draft = db
    .prepare("SELECT id, title, status FROM pantun_drafts WHERE id = ? AND student_id = ?")
    .get(draftId, request.user.id);

  if (!draft) {
    return response.status(404).json({ success: false, message: "Draft not found." });
  }

  if (draft.status !== "draft") {
    return response.status(400).json({
      success: false,
      message: "This pantun has already been submitted.",
    });
  }

  db.prepare(`
    UPDATE pantun_drafts
    SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(draftId);

  const updated = db.prepare("SELECT * FROM pantun_drafts WHERE id = ?").get(draftId);

  response.json({
    success: true,
    message: `"${draft.title}" submitted for review.`,
    draft: updated,
  });
});

// ---------- Student: submissions ----------
app.get("/api/submissions/mine", requireAuth("student"), (request, response) => {
  const submissions = db
    .prepare(`
      SELECT id, title, line_1, line_2, line_3, line_4, rhyme_pattern, status,
             feedback, score, submitted_at, reviewed_at, updated_at
      FROM pantun_drafts
      WHERE student_id = ? AND status IN ('submitted', 'reviewed')
      ORDER BY COALESCE(submitted_at, updated_at) DESC, id DESC
    `)
    .all(request.user.id);

  response.json({ success: true, submissions });
});

// ---------- Lecturer: review ----------
const lecturerSelect = `
  SELECT p.id, p.title, p.line_1, p.line_2, p.line_3, p.line_4, p.rhyme_pattern,
         p.status, p.feedback, p.score, p.submitted_at, p.reviewed_at, p.updated_at,
         u.full_name AS student_name, u.email AS student_email
  FROM pantun_drafts p
  JOIN users u ON u.id = p.student_id
`;

app.get("/api/lecturer/submissions", requireAuth("lecturer"), (request, response) => {
  const submissions = db
    .prepare(`
      ${lecturerSelect}
      WHERE p.status IN ('submitted', 'reviewed')
      ORDER BY CASE p.status WHEN 'submitted' THEN 0 ELSE 1 END,
               COALESCE(p.submitted_at, p.updated_at) DESC
    `)
    .all();

  response.json({ success: true, submissions });
});

app.patch("/api/submissions/:draftId/review", requireAuth("lecturer"), (request, response) => {
  const draftId = parseId(request.params.draftId);
  const { score, feedback } = request.body;
  const numericScore = Number(score);

  if (!draftId) {
    return response.status(400).json({ success: false, message: "Invalid submission ID." });
  }

  if (
    score === "" ||
    score === null ||
    score === undefined ||
    !Number.isInteger(numericScore) ||
    numericScore < 0 ||
    numericScore > 100
  ) {
    return response.status(400).json({
      success: false,
      message: "Score must be a whole number between 0 and 100.",
    });
  }

  if (!feedback?.trim()) {
    return response.status(400).json({
      success: false,
      message: "Please write feedback for the student.",
    });
  }

  const submission = db
    .prepare("SELECT id, title, status FROM pantun_drafts WHERE id = ?")
    .get(draftId);

  if (!submission || submission.status === "draft") {
    return response.status(404).json({ success: false, message: "Submission not found." });
  }

  db.prepare(`
    UPDATE pantun_drafts
    SET status = 'reviewed', score = ?, feedback = ?,
        reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(numericScore, feedback.trim(), draftId);

  const reviewed = db.prepare(`${lecturerSelect} WHERE p.id = ?`).get(draftId);

  response.json({
    success: true,
    message: `"${submission.title}" reviewed successfully.`,
    submission: reviewed,
  });
});
// ---------- Dashboards ----------
app.get("/api/student/stats", requireAuth("student"), (request, response) => {
  const studentId = request.user.id;

  const counts = db
    .prepare(`
      SELECT
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS awaiting,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed,
        ROUND(AVG(CASE WHEN status = 'reviewed' THEN score END), 1) AS averageScore
      FROM pantun_drafts
      WHERE student_id = ?
    `)
    .get(studentId);

  const recent = db
    .prepare(`
      SELECT id, title, status, score, updated_at
      FROM pantun_drafts
      WHERE student_id = ?
      ORDER BY updated_at DESC, id DESC
      LIMIT 5
    `)
    .all(studentId);

  const latestFeedback = db
    .prepare(`
      SELECT id, title, score, feedback, reviewed_at
      FROM pantun_drafts
      WHERE student_id = ? AND status = 'reviewed'
      ORDER BY reviewed_at DESC
      LIMIT 1
    `)
    .get(studentId);

  response.json({
    success: true,
    stats: {
      drafts: counts.drafts ?? 0,
      awaiting: counts.awaiting ?? 0,
      reviewed: counts.reviewed ?? 0,
      averageScore: counts.averageScore,
    },
    recent,
    latestFeedback: latestFeedback ?? null,
  });
});

app.get("/api/lecturer/stats", requireAuth("lecturer"), (request, response) => {
  const counts = db
    .prepare(`
      SELECT
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS awaiting,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed,
        ROUND(AVG(CASE WHEN status = 'reviewed' THEN score END), 1) AS averageScore
      FROM pantun_drafts
    `)
    .get();

  const students = db
    .prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'student'")
    .get();

  const awaitingList = db
    .prepare(`
      SELECT p.id, p.title, p.rhyme_pattern, p.submitted_at, p.updated_at,
             u.full_name AS student_name
      FROM pantun_drafts p
      JOIN users u ON u.id = p.student_id
      WHERE p.status = 'submitted'
      ORDER BY COALESCE(p.submitted_at, p.updated_at) ASC
      LIMIT 5
    `)
    .all();

  response.json({
    success: true,
    stats: {
      awaiting: counts.awaiting ?? 0,
      reviewed: counts.reviewed ?? 0,
      students: students.total,
      averageScore: counts.averageScore,
    },
    awaitingList,
  });
});
// ---------- Migration: users.is_active ----------
// 1 = active, 0 = deactivated
const userColumns = db.prepare("PRAGMA table_info(users)").all();
if (!userColumns.some((column) => column.name === "is_active")) {
  db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  console.log("Added column users.is_active");
}
// ---------- Admin: user management ----------
const ROLES = ["student", "lecturer", "admin"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function adminUserRow(userId) {
  return db
    .prepare(`
      SELECT u.id, u.full_name, u.email, u.role, u.is_active,
             (SELECT COUNT(*) FROM pantun_drafts p WHERE p.student_id = u.id) AS pantun_count
      FROM users u
      WHERE u.id = ?
    `)
    .get(userId);
}

function readUserId(request, response) {
  const userId = Number(request.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    response.status(400).json({ success: false, message: "Invalid user ID." });
    return null;
  }
  return userId;
}

app.get("/api/admin/stats", requireAuth("admin"), (request, response) => {
  const users = db
    .prepare(`
      SELECT
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) AS students,
        SUM(CASE WHEN role = 'lecturer' THEN 1 ELSE 0 END) AS lecturers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive
      FROM users
    `)
    .get();

  const pantun = db
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS awaiting,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed
      FROM pantun_drafts
    `)
    .get();

  response.json({
    success: true,
    stats: {
      students: users.students ?? 0,
      lecturers: users.lecturers ?? 0,
      admins: users.admins ?? 0,
      inactive: users.inactive ?? 0,
      pantun: pantun.total ?? 0,
      awaiting: pantun.awaiting ?? 0,
      reviewed: pantun.reviewed ?? 0,
    },
  });
});

app.get("/api/admin/users", requireAuth("admin"), (request, response) => {
  const users = db
    .prepare(`
      SELECT u.id, u.full_name, u.email, u.role, u.is_active,
             (SELECT COUNT(*) FROM pantun_drafts p WHERE p.student_id = u.id) AS pantun_count
      FROM users u
      ORDER BY u.role, u.full_name
    `)
    .all();

  response.json({ success: true, users });
});

app.post("/api/admin/users", requireAuth("admin"), (request, response) => {
  const fullName = String(request.body.fullName ?? "").trim();
  const email = String(request.body.email ?? "").trim().toLowerCase();
  const role = String(request.body.role ?? "");
  const password = String(request.body.password ?? "");

  if (!fullName || !email || !password) {
    return response.status(400).json({ success: false, message: "Name, email and password are required." });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return response.status(400).json({ success: false, message: "Please enter a valid email." });
  }
  if (!ROLES.includes(role)) {
    return response.status(400).json({ success: false, message: "Invalid role." });
  }
  if (password.length < 8) {
    return response.status(400).json({ success: false, message: "Password must be at least 8 characters." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return response.status(409).json({ success: false, message: "This email is already registered." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (full_name, email, role, password_hash, is_active) VALUES (?, ?, ?, ?, 1)")
    .run(fullName, email, role, passwordHash);

  response.status(201).json({
    success: true,
    message: `Account for ${fullName} created.`,
    user: adminUserRow(result.lastInsertRowid),
  });
});

app.put("/api/admin/users/:userId", requireAuth("admin"), (request, response) => {
  const userId = readUserId(request, response);
  if (userId === null) return;

  const target = adminUserRow(userId);
  if (!target) {
    return response.status(404).json({ success: false, message: "User not found." });
  }

  const fullName = String(request.body.fullName ?? "").trim();
  const role = String(request.body.role ?? "");

  if (!fullName) {
    return response.status(400).json({ success: false, message: "Name is required." });
  }
  if (!ROLES.includes(role)) {
    return response.status(400).json({ success: false, message: "Invalid role." });
  }
  if (userId === Number(request.user.id) && role !== "admin") {
    return response.status(400).json({ success: false, message: "You cannot remove your own admin role." });
  }

  db.prepare("UPDATE users SET full_name = ?, role = ? WHERE id = ?").run(fullName, role, userId);

  response.json({ success: true, message: "User updated.", user: adminUserRow(userId) });
});

app.patch("/api/admin/users/:userId/password", requireAuth("admin"), (request, response) => {
  const userId = readUserId(request, response);
  if (userId === null) return;

  const password = String(request.body.password ?? "");
  if (password.length < 8) {
    return response.status(400).json({ success: false, message: "Password must be at least 8 characters." });
  }

  const result = db
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(bcrypt.hashSync(password, 10), userId);

  if (result.changes === 0) {
    return response.status(404).json({ success: false, message: "User not found." });
  }

  response.json({ success: true, message: "Password has been reset." });
});

app.patch("/api/admin/users/:userId/status", requireAuth("admin"), (request, response) => {
  const userId = readUserId(request, response);
  if (userId === null) return;

  const isActive = request.body.isActive ? 1 : 0;

  if (userId === Number(request.user.id) && isActive === 0) {
    return response.status(400).json({ success: false, message: "You cannot deactivate your own account." });
  }

  const result = db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(isActive, userId);
  if (result.changes === 0) {
    return response.status(404).json({ success: false, message: "User not found." });
  }

  response.json({
    success: true,
    message: isActive ? "Account reactivated." : "Account deactivated.",
    user: adminUserRow(userId),
  });
});
app.listen(PORT, () => {
  console.log(`PantunLingo backend running at http://localhost:${PORT}`);
  console.log(`Database file: ${databasePath}`);
});