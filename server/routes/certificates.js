const express = require('express');
const router = express.Router();
const db = require('../db');
const { uuid, generateCertNumber, parseCertStatus } = require('../utils');

router.get('/course/:courseId', (req, res) => {
  const certs = db.prepare(`
    SELECT c.*, s.name AS student_name, s.phone, s.email, co.name AS course_name, t.name AS template_name
    FROM certificates c
    JOIN students s ON s.id = c.student_id
    JOIN courses co ON co.id = c.course_id
    LEFT JOIN certificate_templates t ON t.id = c.template_id
    WHERE c.course_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.courseId);
  res.json(certs);
});

router.get('/student/:studentId', (req, res) => {
  const certs = db.prepare(`
    SELECT c.*, co.name AS course_name, t.name AS template_name
    FROM certificates c
    JOIN courses co ON co.id = c.course_id
    LEFT JOIN certificate_templates t ON t.id = c.template_id
    WHERE c.student_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.studentId);
  res.json(certs);
});

router.get('/:id', (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, s.name AS student_name, co.name AS course_name,
      t.name AS template_name, t.bg_color, t.border_color, t.title_text, t.title_color, t.body_color, t.seal_text, t.font_family
    FROM certificates c
    JOIN students s ON s.id = c.student_id
    JOIN courses co ON co.id = c.course_id
    LEFT JOIN certificate_templates t ON t.id = c.template_id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!cert) return res.status(404).json({ error: '证书不存在' });
  res.json(cert);
});

router.get('/:id/history', (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: '证书不存在' });

  const history = [];

  let current = cert;
  while (current.reissue_parent_id) {
    const parent = db.prepare(`
      SELECT c.*, s.name AS student_name, co.name AS course_name
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      JOIN courses co ON co.id = c.course_id
      WHERE c.id = ?
    `).get(current.reissue_parent_id);
    if (parent) {
      history.push(parent);
      current = parent;
    } else break;
  }

  const reissued = db.prepare(`
    SELECT c.*, s.name AS student_name, co.name AS course_name
    FROM certificates c
    JOIN students s ON s.id = c.student_id
    JOIN courses co ON co.id = c.course_id
    WHERE c.reissue_parent_id = ?
  `).all(req.params.id);

  res.json({ cert, parent_history: history, reissued_children: reissued });
});

router.post('/issue', (req, res) => {
  const { student_id, course_id, template_id } = req.body;
  if (!student_id || !course_id) return res.status(400).json({ error: '学员ID和课程ID必填' });

  const existing = db.prepare('SELECT * FROM certificates WHERE student_id = ? AND course_id = ? AND status = \'active\'').get(student_id, course_id);
  if (existing) return res.status(409).json({ error: '该学员已有有效证书', certificate: existing });

  const totalSessions = db.prepare('SELECT COUNT(*) AS cnt FROM sessions WHERE course_id = ?').get(course_id).cnt;
  const attendedSessions = db.prepare(
    "SELECT COUNT(*) AS cnt FROM attendance a JOIN sessions s ON s.id = a.session_id WHERE s.course_id = ? AND a.student_id = ? AND a.status IN ('present','late','makeup')"
  ).get(course_id, student_id).cnt;

  if (totalSessions > 0 && attendedSessions < totalSessions) {
    return res.status(403).json({ error: `该学员未完成全部课次（${attendedSessions}/${totalSessions}），不能发放证书` });
  }

  const totalQuizzes = db.prepare('SELECT COUNT(*) AS cnt FROM quizzes WHERE course_id = ?').get(course_id).cnt;
  if (totalQuizzes > 0) {
    const passedQuizzes = db.prepare(
      `SELECT COUNT(DISTINCT q.id) AS cnt FROM quizzes q
       JOIN quiz_attempts qa ON qa.quiz_id = q.id
       WHERE q.course_id = ? AND qa.student_id = ? AND qa.passed = 1`
    ).get(course_id, student_id).cnt;
    if (passedQuizzes < totalQuizzes) {
      return res.status(403).json({ error: `该学员未通过全部测验（${passedQuizzes}/${totalQuizzes}），不能发放证书` });
    }
  }

  const id = uuid();
  const certNumber = generateCertNumber();

  db.prepare('INSERT INTO certificates (id, student_id, course_id, template_id, cert_number) VALUES (?, ?, ?, ?, ?)')
    .run(id, student_id, course_id, template_id || null, certNumber);

  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
  res.status(201).json(cert);
});

router.post('/reissue', (req, res) => {
  const { old_cert_id, reason } = req.body;
  if (!old_cert_id) return res.status(400).json({ error: '旧证书ID必填' });

  const oldCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(old_cert_id);
  if (!oldCert) return res.status(404).json({ error: '旧证书不存在' });
  if (oldCert.status !== 'active') return res.status(400).json({ error: '旧证书不是有效状态' });

  const now = new Date().toISOString();

  db.prepare('UPDATE certificates SET status = ?, revoke_date = ?, revoke_reason = ? WHERE id = ?')
    .run('revoked', now, reason || '证书补发', old_cert_id);

  const id = uuid();
  const certNumber = generateCertNumber();

  db.prepare('INSERT INTO certificates (id, student_id, course_id, template_id, cert_number, reissue_parent_id, reissue_reason) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, oldCert.student_id, oldCert.course_id, oldCert.template_id, certNumber, old_cert_id, reason || '证书补发');

  const newCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
  res.status(201).json({ revoked: old_cert_id, reissued: newCert });
});

router.put('/:id/revoke', (req, res) => {
  const { reason } = req.body;
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: '证书不存在' });
  if (cert.status !== 'active') return res.status(400).json({ error: '证书不是有效状态' });

  const now = new Date().toISOString();
  db.prepare('UPDATE certificates SET status = ?, revoke_date = ?, revoke_reason = ? WHERE id = ?')
    .run('revoked', now, reason || '手动撤销', req.params.id);

  const updated = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
