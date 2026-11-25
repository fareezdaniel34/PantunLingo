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

// Add review columns to existing databases (safe to run every time).
const draftColumns = db
  .prepare("PRAGMA table_info(pantun_drafts)")
  .all()
  .map((column) => column.name);

if (!draftColumns.includes("feedback")) {
  db.exec("ALTER TABLE pantun_drafts ADD COLUMN feedback TEXT");
}

if (!draftColumns.includes("score")) {
  db.exec("ALTER TABLE pantun_drafts ADD COLUMN score INTEGER");
}

if (!draftColumns.includes("submitted_at")) {
  db.exec("ALTER TABLE pantun_drafts ADD COLUMN submitted_at TEXT");
}

if (!draftColumns.includes("reviewed_at")) {
  db.exec("ALTER TABLE pantun_drafts ADD COLUMN reviewed_at TEXT");
}

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
// Get one draft for editing.
app.get("/api/drafts/:draftId", (request, response) => {
  const draftId = Number(request.params.draftId);

  if (!Number.isInteger(draftId) || draftId <= 0) {
    return response.status(400).json({
      success: false,
      message: "Invalid draft ID.",
    });
  }

  const draft = db
    .prepare(`
      SELECT
        id,
        student_id,
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
      WHERE id = ?
    `)
    .get(draftId);

  if (!draft) {
    return response.status(404).json({
      success: false,
      message: "Draft not found.",
    });
  }

  return response.json({
    success: true,
    draft,
  });
});

// Update an existing pantun draft.
app.put("/api/drafts/:draftId", (request, response) => {
  const draftId = Number(request.params.draftId);

  const {
    studentId,
    title,
    line1,
    line2,
    line3,
    line4,
    rhymePattern,
  } = request.body;

  if (!Number.isInteger(draftId) || draftId <= 0) {
    return response.status(400).json({
      success: false,
      message: "Invalid draft ID.",
    });
  }

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

  const existingDraft = db
    .prepare(`
      SELECT id, status
      FROM pantun_drafts
      WHERE id = ? AND student_id = ?
    `)
    .get(draftId, studentId);

  if (!existingDraft) {
    if (existingDraft.status === "submitted") {
  return response.status(400).json({
    success: false,
    message: "Submitted pantun can no longer be edited.",
  });
}
    return response.status(404).json({
      success: false,
      message: "Draft not found or does not belong to this student.",
    });
  }

  db.prepare(`
    UPDATE pantun_drafts
    SET
      title = ?,
      line_1 = ?,
      line_2 = ?,
      line_3 = ?,
      line_4 = ?,
      rhyme_pattern = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND student_id = ?
  `).run(
    title.trim(),
    line1.trim(),
    line2.trim(),
    line3.trim(),
    line4.trim(),
    rhymePattern.trim(),
    draftId,
    studentId,
  );

  const updatedDraft = db
    .prepare("SELECT * FROM pantun_drafts WHERE id = ?")
    .get(draftId);

  return response.json({
    success: true,
    message: "Draft updated successfully.",
    draft: updatedDraft,
  });
});
// Delete one pantun draft.
app.delete("/api/drafts/:draftId", (request, response) => {
  const draftId = Number(request.params.draftId);
  const { studentId } = request.body;

  if (!Number.isInteger(draftId) || draftId <= 0) {
    return response.status(400).json({
      success: false,
      message: "Invalid draft ID.",
    });
  }

  if (!studentId) {
    return response.status(400).json({
      success: false,
      message: "Student ID is required.",
    });
  }

  const draft = db
    .prepare(`
      SELECT id, title, status
      FROM pantun_drafts
      WHERE id = ? AND student_id = ?
    `)
    .get(draftId, studentId);

  if (!draft) {
    if (draft.status === "submitted") {
  return response.status(400).json({
    success: false,
    message: "Submitted pantun cannot be deleted.",
  });
}
    return response.status(404).json({
      success: false,
      message: "Draft not found or you do not have permission to delete it.",
    });
  }

  db.prepare(`
    DELETE FROM pantun_drafts
    WHERE id = ? AND student_id = ?
  `).run(draftId, studentId);

  return response.json({
    success: true,
    message: `Draft "${draft.title}" deleted successfully.`,
    deletedDraftId: draftId,
  });
});
// Submit a pantun draft for lecturer review.
app.patch("/api/drafts/:draftId/submit", (request, response) => {
  const draftId = Number(request.params.draftId);
  const { studentId } = request.body;

  if (!Number.isInteger(draftId) || draftId <= 0) {
    return response.status(400).json({
      success: false,
      message: "Invalid draft ID.",
    });
  }

  if (!studentId) {
    return response.status(400).json({
      success: false,
      message: "Student ID is required.",
    });
  }

  const draft = db
    .prepare(`
      SELECT id, title, status
      FROM pantun_drafts
      WHERE id = ? AND student_id = ?
    `)
    .get(draftId, studentId);

  if (!draft) {
    return response.status(404).json({
      success: false,
      message: "Draft not found or does not belong to this student.",
    });
  }

  if (draft.status === "submitted") {
    return response.status(400).json({
      success: false,
      message: "This pantun has already been submitted.",
    });
  }

  db.prepare(`
    UPDATE pantun_drafts
    SET
      status = 'submitted',
      submitted_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND student_id = ?
  `).run(draftId, studentId);

  const submittedDraft = db
    .prepare("SELECT * FROM pantun_drafts WHERE id = ?")
    .get(draftId);

  return response.json({
    success: true,
    message: `"${draft.title}" submitted for review.`,
    draft: submittedDraft,
  });
});
// Get submitted and reviewed pantun for one student.
app.get("/api/submissions/student/:studentId", (request, response) => {
  const studentId = Number(request.params.studentId);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return response.status(400).json({
      success: false,
      message: "Invalid student ID.",
    });
  }

  const submissions = db
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
        feedback,
        score,
        submitted_at,
        reviewed_at,
        updated_at
      FROM pantun_drafts
      WHERE student_id = ? AND status IN ('submitted', 'reviewed')
      ORDER BY COALESCE(submitted_at, updated_at) DESC, id DESC
    `)
    .all(studentId);

  return response.json({
    success: true,
    submissions,
  });
});
app.listen(PORT, () => {
  console.log(`PantunLingo backend running at http://localhost:${PORT}`);
  console.log(`Database file: ${databasePath}`);
});