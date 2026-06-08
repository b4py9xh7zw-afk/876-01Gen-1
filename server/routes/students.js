const express = require('express');
const router = express.Router();
const db = require('../db');
const { uuid } = require('../utils');

router.get('/', (req, res) => {
  const students = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
  res.json(students);
});

router.get('/:id', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: '学员不存在' });
  res.json(student);
});

router.post('/', (req, res) => {
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: '学员姓名必填' });
  const id = uuid();
  db.prepare('INSERT INTO students (id, name, phone, email) VALUES (?, ?, ?, ?)')
    .run(id, name, phone || null, email || null);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  res.status(201).json(student);
});

router.put('/:id', (req, res) => {
  const { name, phone, email } = req.body;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '学员不存在' });
  db.prepare('UPDATE students SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?')
    .run(name, phone, email, req.params.id);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  res.json(student);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/courses', (req, res) => {
  const courses = db.prepare(`
    SELECT c.*, e.enrolled_at FROM courses c
    JOIN enrollments e ON e.course_id = c.id
    WHERE e.student_id = ?
    ORDER BY e.enrolled_at DESC
  `).all(req.params.id);
  res.json(courses);
});

router.get('/:id/attendance', (req, res) => {
  const { course_id } = req.query;
  let query = `
    SELECT a.*, s.name AS session_name, s.start_time, s.end_time, s.course_id
    FROM attendance a
    JOIN sessions s ON s.id = a.session_id
    WHERE a.student_id = ?
  `;
  const params = [req.params.id];
  if (course_id) {
    query += ' AND s.course_id = ?';
    params.push(course_id);
  }
  query += ' ORDER BY s.start_time ASC';
  const attendance = db.prepare(query).all(...params);
  res.json(attendance);
});

router.get('/:id/graduation-status/:courseId', (req, res) => {
  const { id, courseId } = req.params;

  const sessions = db.prepare('SELECT * FROM sessions WHERE course_id = ? ORDER BY start_time ASC').all(courseId);
  const totalSessions = sessions.length;

  const attendance = db.prepare(`
    SELECT a.*, s.name AS session_name
    FROM attendance a
    JOIN sessions s ON s.id = a.session_id
    WHERE a.student_id = ? AND s.course_id = ?
  `).all(id, courseId);

  const presentCount = attendance.filter(a => ['present', 'late', 'makeup'].includes(a.status)).length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const makeupCount = attendance.filter(a => a.status === 'makeup').length;

  const quizzes = db.prepare('SELECT * FROM quizzes WHERE course_id = ?').all(courseId);
  const totalQuizzes = quizzes.length;

  const passedQuizzes = db.prepare(`
    SELECT COUNT(DISTINCT q.id) AS cnt
    FROM quizzes q
    JOIN quiz_attempts qa ON qa.quiz_id = q.id
    WHERE q.course_id = ? AND qa.student_id = ? AND qa.passed = 1
  `).get(courseId, id).cnt;

  const quizPassed = totalQuizzes === 0 || passedQuizzes >= totalQuizzes;
  const attendancePassed = totalSessions === 0 || presentCount >= totalSessions;

  const graduated = quizPassed && attendancePassed;

  const activeCert = db.prepare('SELECT * FROM certificates WHERE student_id = ? AND course_id = ? AND status = \'active\'').get(id, courseId);

  res.json({
    total_sessions: totalSessions,
    attended_sessions: presentCount,
    late_count: lateCount,
    absent_count: absentCount,
    makeup_count: makeupCount,
    total_quizzes: totalQuizzes,
    passed_quizzes: passedQuizzes,
    quiz_passed: quizPassed,
    attendance_passed: attendancePassed,
    graduated,
    has_certificate: !!activeCert,
    certificate: activeCert || null
  });
});

module.exports = router;
