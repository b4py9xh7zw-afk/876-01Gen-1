const express = require('express');
const router = express.Router();
const db = require('../db');
const { uuid, generateCode } = require('../utils');
const QRCode = require('qrcode');

router.get('/session/:sessionId', (req, res) => {
  const codes = db.prepare('SELECT * FROM checkin_codes WHERE session_id = ? ORDER BY created_at DESC').all(req.params.sessionId);
  res.json(codes);
});

router.post('/', async (req, res) => {
  const { session_id, expires_at } = req.body;
  if (!session_id) return res.status(400).json({ error: '课次ID必填' });
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(session_id);
  if (!session) return res.status(404).json({ error: '课次不存在' });

  const id = uuid();
  const code = generateCode('CK');
  const qrData = JSON.stringify({ type: 'checkin', session_id, code });

  let qrImage = '';
  try {
    qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
  } catch (e) {
    qrImage = '';
  }

  db.prepare('INSERT INTO checkin_codes (id, session_id, code, expires_at) VALUES (?, ?, ?, ?)')
    .run(id, session_id, code, expires_at || null);

  const result = db.prepare('SELECT * FROM checkin_codes WHERE id = ?').get(id);
  res.status(201).json({ ...result, qr_image: qrImage, qr_data: qrData });
});

router.post('/verify', (req, res) => {
  const { code, student_id } = req.body;
  if (!code || !student_id) return res.status(400).json({ error: '签到码和学员ID必填' });

  const checkinCode = db.prepare('SELECT cc.*, s.course_id, s.start_time, s.end_time, s.late_threshold FROM checkin_codes cc JOIN sessions s ON s.id = cc.session_id WHERE cc.code = ?').get(code);
  if (!checkinCode) return res.status(404).json({ error: '签到码无效' });

  if (checkinCode.expires_at && new Date(checkinCode.expires_at) < new Date()) {
    return res.status(400).json({ error: '签到码已过期' });
  }

  const enrollment = db.prepare('SELECT * FROM enrollments WHERE course_id = ? AND student_id = ?').get(checkinCode.course_id, student_id);
  if (!enrollment) return res.status(403).json({ error: '该学员未报名此课程' });

  const existing = db.prepare('SELECT * FROM attendance WHERE session_id = ? AND student_id = ?').get(checkinCode.session_id, student_id);
  if (existing) return res.status(409).json({ error: '已经签到过', attendance: existing });

  const now = new Date();
  const startTime = new Date(checkinCode.start_time);
  const lateTime = new Date(startTime.getTime() + checkinCode.late_threshold * 60000);

  let status = 'present';
  if (now > lateTime) {
    status = 'late';
  }

  const attendanceId = uuid();
  db.prepare('INSERT INTO attendance (id, session_id, student_id, status, checkin_time, checkin_code_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(attendanceId, checkinCode.session_id, student_id, status, now.toISOString(), checkinCode.id);

  const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(attendanceId);
  res.status(201).json({ ...attendance, late: status === 'late' });
});

router.put('/:sessionId/makeup', (req, res) => {
  const { student_id, makeup_reason } = req.body;
  if (!student_id) return res.status(400).json({ error: '学员ID必填' });

  const existing = db.prepare('SELECT * FROM attendance WHERE session_id = ? AND student_id = ?').get(req.params.sessionId, student_id);

  if (existing) {
    db.prepare('UPDATE attendance SET status = ?, makeup_reason = ? WHERE id = ?')
      .run('makeup', makeup_reason || '补签', existing.id);
    const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id);
    return res.json(attendance);
  }

  const attId = uuid();
  db.prepare('INSERT INTO attendance (id, session_id, student_id, status, checkin_time, makeup_reason) VALUES (?, ?, ?, ?, ?, ?)')
    .run(attId, req.params.sessionId, student_id, 'makeup', new Date().toISOString(), makeup_reason || '补签');
  const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(attId);
  res.status(201).json(attendance);
});

router.put('/:sessionId/mark-absent', (req, res) => {
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: '学员ID必填' });

  const existing = db.prepare('SELECT * FROM attendance WHERE session_id = ? AND student_id = ?').get(req.params.sessionId, student_id);
  if (existing) {
    db.prepare('UPDATE attendance SET status = ? WHERE id = ?').run('absent', existing.id);
    const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id);
    return res.json(attendance);
  }

  const id = uuid();
  db.prepare('INSERT INTO attendance (id, session_id, student_id, status) VALUES (?, ?, ?, ?)')
    .run(id, req.params.sessionId, student_id, 'absent');
  const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id);
  res.status(201).json(attendance);
});

module.exports = router;
