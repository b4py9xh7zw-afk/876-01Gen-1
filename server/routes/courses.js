const express = require('express');
const router = express.Router();
const db = require('../db');
const { uuid } = require('../utils');

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS student_count,
      (SELECT COUNT(*) FROM sessions WHERE course_id = c.id) AS session_count
    FROM courses c ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: '课程不存在' });
  res.json(course);
});

router.post('/', (req, res) => {
  const { name, description, organizer_id } = req.body;
  if (!name) return res.status(400).json({ error: '课程名称必填' });
  const id = uuid();
  db.prepare('INSERT INTO courses (id, organizer_id, name, description) VALUES (?, ?, ?, ?)')
    .run(id, organizer_id || null, name, description || '');
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  res.status(201).json(course);
});

router.put('/:id', (req, res) => {
  const { name, description, status } = req.body;
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '课程不存在' });
  db.prepare('UPDATE courses SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status) WHERE id = ?')
    .run(name, description, status, req.params.id);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  res.json(course);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/students', (req, res) => {
  const students = db.prepare(`
    SELECT s.*, e.enrolled_at FROM students s
    JOIN enrollments e ON e.student_id = s.id
    WHERE e.course_id = ?
    ORDER BY e.enrolled_at DESC
  `).all(req.params.id);
  res.json(students);
});

router.post('/:id/students', (req, res) => {
  const { student_id } = req.body;
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: '课程不存在' });
  const existing = db.prepare('SELECT * FROM enrollments WHERE course_id = ? AND student_id = ?').get(req.params.id, student_id);
  if (existing) return res.status(409).json({ error: '学员已报名' });
  const id = uuid();
  db.prepare('INSERT INTO enrollments (id, course_id, student_id) VALUES (?, ?, ?)').run(id, req.params.id, student_id);
  res.status(201).json({ success: true });
});

router.delete('/:courseId/students/:studentId', (req, res) => {
  db.prepare('DELETE FROM enrollments WHERE course_id = ? AND student_id = ?').run(req.params.courseId, req.params.studentId);
  res.json({ success: true });
});

module.exports = router;
