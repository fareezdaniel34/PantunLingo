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

app.listen(PORT, () => {
  console.log(`PantunLingo backend running at http://localhost:${PORT}`);
  console.log(`Database file: ${databasePath}`);
});