const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

const databaseFolder = path.join(__dirname, "database");
const databasePath = path.join(databaseFolder, "pantunlingo.db");

// Create the database folder automatically if it does not exist.
fs.mkdirSync(databaseFolder, { recursive: true });

// Create or open the SQLite database file.
const db = new Database(databasePath);

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

// Create tables when the backend starts.
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

// Create a temporary demo student for development.
const demoStudent = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get("student@pantunlingo.com");

if (!demoStudent) {
  db.prepare(`
    INSERT INTO users (full_name, email, role)
    VALUES (?, ?, ?)
  `).run("Nur Aina", "student@pantunlingo.com", "student");

  console.log("Demo student account created.");
}

// Test route.
app.get("/api/health", (request, response) => {
  response.json({
    success: true,
    message: "PantunLingo backend is running.",
  });
});

// Save a new pantun draft.
app.post("/api/drafts", (request, response) => {
  const {
    studentId,
    title,
    line1,
    line2,
    line3,
    line4,
    rhymePattern,
  } = request.body;

  if (
    !studentId ||
    !title?.trim() ||
    !line1?.trim() ||
    !line2?.trim() ||
    !line3?.trim() ||
    !line4?.trim() ||
    !rhymePattern?.trim()
  ) {
    return response.status(400).json({
      success: false,
      message: "Please complete the title and all four pantun lines.",
    });
  }

  const student = db
    .prepare("SELECT id, role FROM users WHERE id = ?")
    .get(studentId);

  if (!student || student.role !== "student") {
    return response.status(400).json({
      success: false,
      message: "Valid student account not found.",
    });
  }

  const result = db
    .prepare(`
      INSERT INTO pantun_drafts (
        student_id,
        title,
        line_1,
        line_2,
        line_3,
        line_4,
        rhyme_pattern
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      studentId,
      title.trim(),
      line1.trim(),
      line2.trim(),
      line3.trim(),
      line4.trim(),
      rhymePattern.trim(),
    );

  const savedDraft = db
    .prepare("SELECT * FROM pantun_drafts WHERE id = ?")
    .get(result.lastInsertRowid);

  return response.status(201).json({
    success: true,
    message: "Draft saved successfully.",
    draft: savedDraft,
  });
});

// Get all drafts for one student.
app.get("/api/drafts/student/:studentId", (request, response) => {
  const studentId = Number(request.params.studentId);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return response.status(400).json({
      success: false,
      message: "Invalid student ID.",
    });
  }

  const drafts = db
    .prepare(`
      SELECT
        id,
        title,
        line_1,
        line_2,
        line_3,
        line_4,
        rhyme_pattern,
        status,
        created_at,
        updated_at
      FROM pantun_drafts
      WHERE student_id = ?
      ORDER BY updated_at DESC, id DESC
    `)
    .all(studentId);

  return response.json({
    success: true,
    drafts,
  });
});

app.listen(PORT, () => {
  console.log(`PantunLingo backend running at http://localhost:${PORT}`);
  console.log(`Database file: ${databasePath}`);
});