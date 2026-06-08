const express = require('express');
const router = express.Router();
const db = require('../db');
const { uuid } = require('../utils');

router.get('/course/:courseId', (req, res) => {
  const quizzes = db.prepare('SELECT * FROM quizzes WHERE course_id = ? ORDER BY created_at DESC').all(req.params.courseId);
  res.json(quizzes);
});

router.get('/:id', (req, res) => {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz) return res.status(404).json({ error: '测验不存在' });
  const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC').all(req.params.id);
  res.json({ ...quiz, questions });
});

router.post('/', (req, res) => {
  const { course_id, title, passing_score, questions } = req.body;
  if (!course_id || !title) return res.status(400).json({ error: '课程ID和测验标题必填' });

  const id = uuid();
  db.prepare('INSERT INTO quizzes (id, course_id, title, passing_score) VALUES (?, ?, ?, ?)')
    .run(id, course_id, title, passing_score || 60);

  if (questions && questions.length > 0) {
    const stmt = db.prepare('INSERT INTO quiz_questions (id, quiz_id, question, options, correct_answer, points, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
    questions.forEach((q, idx) => {
      stmt.run(uuid(), id, q.question, JSON.stringify(q.options), q.correct_answer, q.points || 1, idx);
    });
  }

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);
  const qs = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC').all(id);
  res.status(201).json({ ...quiz, questions: qs });
});

router.put('/:id', (req, res) => {
  const { title, passing_score } = req.body;
  const existing = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '测验不存在' });
  db.prepare('UPDATE quizzes SET title = COALESCE(?, title), passing_score = COALESCE(?, passing_score) WHERE id = ?')
    .run(title, passing_score, req.params.id);
  res.json(db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM quiz_questions WHERE quiz_id = ?').run(req.params.id);
  db.prepare('DELETE FROM quizzes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/submit', (req, res) => {
  const { student_id, answers } = req.body;
  if (!student_id || !answers) return res.status(400).json({ error: '学员ID和答案必填' });

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz) return res.status(404).json({ error: '测验不存在' });

  const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC').all(req.params.id);

  let score = 0;
  let totalPoints = 0;
  questions.forEach(q => {
    totalPoints += q.points;
    if (answers[q.id] === q.correct_answer) {
      score += q.points;
    }
  });

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = percentage >= quiz.passing_score;

  const attemptId = uuid();
  db.prepare('INSERT INTO quiz_attempts (id, quiz_id, student_id, score, passed, answers) VALUES (?, ?, ?, ?, ?, ?)')
    .run(attemptId, req.params.id, student_id, percentage, passed ? 1 : 0, JSON.stringify(answers));

  res.status(201).json({
    attempt_id: attemptId,
    score: percentage,
    passed,
    correct_count: questions.filter(q => answers[q.id] === q.correct_answer).length,
    total_questions: questions.length
  });
});

router.get('/:id/attempts/:studentId', (req, res) => {
  const attempts = db.prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY attempted_at DESC').all(req.params.id, req.params.studentId);
  res.json(attempts);
});

module.exports = router;
