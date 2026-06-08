const express = require('express');
const router = express.Router();
const db = require('../db');
const { uuid } = require('../utils');

router.get('/course/:courseId', (req, res) => {
  const sessions = db.prepare('SELECT * FROM sessions WHERE course_id = ? ORDER BY start_time ASC').all(req.params.courseId);
  res.json(sessions);
});

router.get('/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: '课次不存在' });
  res.json(session);
});

router.post('/', (req, res) => {
  const { course_id, name, start_time, end_time, late_threshold } = req.body;
  if (!course_id || !name || !start_time || !end_time) {
    return res.status(400).json({ error: '课程ID、课次名称、开始和结束时间必填' });
  }
  const id = uuid();
  db.prepare('INSERT INTO sessions (id, course_id, name, start_time, end_time, late_threshold) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, course_id, name, start_time, end_time, late_threshold || 15);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  res.status(201).json(session);
});

router.put('/:id', (req, res) => {
  const { name, start_time, end_time, late_threshold } = req.body;
  const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '课次不存在' });
  db.prepare('UPDATE sessions SET name = COALESCE(?, name), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), late_threshold = COALESCE(?, late_threshold) WHERE id = ?')
    .run(name, start_time, end_time, late_threshold, req.params.id);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  res.json(session);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/attendance', (req, res) => {
  const attendance = db.prepare(`
    SELECT a.*, s.name AS student_name, s.phone, s.email
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    WHERE a.session_id = ?
    ORDER BY a.checkin_time DESC
  `).all(req.params.id);
  res.json(attendance);
});

module.exports = router;
