const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'training.db');
const DB_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS organizers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    organizer_id TEXT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (organizer_id) REFERENCES organizers(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    late_threshold INTEGER DEFAULT 15,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS checkin_codes (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    enrolled_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'absent',
    checkin_time TEXT,
    checkin_code_id TEXT,
    makeup_reason TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(session_id, student_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (checkin_code_id) REFERENCES checkin_codes(id)
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    passing_score INTEGER NOT NULL DEFAULT 60,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    passed INTEGER NOT NULL DEFAULT 0,
    answers TEXT DEFAULT '{}',
    attempted_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS certificate_templates (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    name TEXT NOT NULL,
    bg_color TEXT DEFAULT '#ffffff',
    border_color TEXT DEFAULT '#c9a84c',
    title_text TEXT DEFAULT '结业证书',
    title_color TEXT DEFAULT '#c9a84c',
    body_color TEXT DEFAULT '#333333',
    seal_text TEXT DEFAULT '',
    font_family TEXT DEFAULT 'serif',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    template_id TEXT,
    cert_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    issue_date TEXT DEFAULT (datetime('now', 'localtime')),
    revoke_date TEXT,
    revoke_reason TEXT,
    reissue_parent_id TEXT,
    reissue_reason TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (template_id) REFERENCES certificate_templates(id),
    FOREIGN KEY (reissue_parent_id) REFERENCES certificates(id)
  );
`);

module.exports = db;
