const express = require('express');
const router = express.Router();
const db = require('../db');
const { uuid, generateCertNumber } = require('../utils');

router.get('/course/:courseId', (req, res) => {
  const templates = db.prepare('SELECT * FROM certificate_templates WHERE course_id = ? ORDER BY created_at DESC').all(req.params.courseId);
  res.json(templates);
});

router.get('/:id', (req, res) => {
  const tmpl = db.prepare('SELECT * FROM certificate_templates WHERE id = ?').get(req.params.id);
  if (!tmpl) return res.status(404).json({ error: '证书模板不存在' });
  res.json(tmpl);
});

router.post('/', (req, res) => {
  const { course_id, name, bg_color, border_color, title_text, title_color, body_color, seal_text, font_family } = req.body;
  if (!course_id || !name) return res.status(400).json({ error: '课程ID和模板名称必填' });
  const id = uuid();
  db.prepare(`INSERT INTO certificate_templates (id, course_id, name, bg_color, border_color, title_text, title_color, body_color, seal_text, font_family)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, course_id, name, bg_color || '#ffffff', border_color || '#c9a84c', title_text || '结业证书', title_color || '#c9a84c', body_color || '#333333', seal_text || '', font_family || 'serif');
  const tmpl = db.prepare('SELECT * FROM certificate_templates WHERE id = ?').get(id);
  res.status(201).json(tmpl);
});

router.put('/:id', (req, res) => {
  const { name, bg_color, border_color, title_text, title_color, body_color, seal_text, font_family } = req.body;
  const existing = db.prepare('SELECT * FROM certificate_templates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '证书模板不存在' });
  db.prepare(`UPDATE certificate_templates SET name = COALESCE(?, name), bg_color = COALESCE(?, bg_color), border_color = COALESCE(?, border_color),
    title_text = COALESCE(?, title_text), title_color = COALESCE(?, title_color), body_color = COALESCE(?, body_color), seal_text = COALESCE(?, seal_text), font_family = COALESCE(?, font_family) WHERE id = ?`)
    .run(name, bg_color, border_color, title_text, title_color, body_color, seal_text, font_family, req.params.id);
  res.json(db.prepare('SELECT * FROM certificate_templates WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM certificate_templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
