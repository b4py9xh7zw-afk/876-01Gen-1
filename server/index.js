const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { uuid } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/courses', require('./routes/courses'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/students', require('./routes/students'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/certificates', require('./routes/certificates'));

app.get('/api/dashboard', (req, res) => {
  const courseCount = db.prepare('SELECT COUNT(*) AS cnt FROM courses').get().cnt;
  const studentCount = db.prepare('SELECT COUNT(*) AS cnt FROM students').get().cnt;
  const sessionCount = db.prepare('SELECT COUNT(*) AS cnt FROM sessions').get().cnt;
  const certCount = db.prepare('SELECT COUNT(*) AS cnt FROM certificates WHERE status = \'active\'').get().cnt;
  const todayCheckins = db.prepare(`SELECT COUNT(*) AS cnt FROM attendance WHERE date(checkin_time) = date('now', 'localtime')`).get().cnt;
  res.json({ courseCount, studentCount, sessionCount, certCount, todayCheckins });
});

app.post('/api/seed', (req, res) => {
  try {
    const hasData = db.prepare('SELECT COUNT(*) AS cnt FROM courses').get().cnt > 0;
    if (hasData) {
      return res.json({ success: true, message: '已有课程数据，跳过初始化' });
    }

    const organizerId = uuid();
    db.prepare('INSERT INTO organizers (id, name, email, password_hash) VALUES (?, ?, ?, ?)')
      .run(organizerId, '管理员', 'admin@training.com', 'hashed_password');

    const courseId = uuid();
    db.prepare('INSERT INTO courses (id, organizer_id, name, description) VALUES (?, ?, ?, ?)')
      .run(courseId, organizerId, '前端开发高级研修班', '深入学习React、Vue等现代前端框架，掌握工程化开发流程');

    const sessions = [
      { name: '第1课：现代前端概览', start: '2026-06-10T09:00:00', end: '2026-06-10T12:00:00' },
      { name: '第2课：React核心原理', start: '2026-06-12T09:00:00', end: '2026-06-12T12:00:00' },
      { name: '第3课：状态管理与路由', start: '2026-06-14T09:00:00', end: '2026-06-14T12:00:00' },
      { name: '第4课：工程化与部署', start: '2026-06-16T09:00:00', end: '2026-06-16T12:00:00' },
    ];
    const sessionIds = sessions.map(s => {
      const sid = uuid();
      db.prepare('INSERT INTO sessions (id, course_id, name, start_time, end_time) VALUES (?, ?, ?, ?, ?)')
        .run(sid, courseId, s.name, s.start, s.end);
      return sid;
    });

    const students = [
      { name: '张明', phone: '13800001111', email: 'zhangming@example.com' },
      { name: '李华', phone: '13800002222', email: 'lihua@example.com' },
      { name: '王芳', phone: '13800003333', email: 'wangfang@example.com' },
    ];
    const studentIds = students.map(s => {
      const sid = uuid();
      db.prepare('INSERT INTO students (id, name, phone, email) VALUES (?, ?, ?, ?)')
        .run(sid, s.name, s.phone, s.email);
      db.prepare('INSERT INTO enrollments (id, course_id, student_id) VALUES (?, ?, ?)')
        .run(uuid(), courseId, sid);
      return sid;
    });

    const quizId = uuid();
    db.prepare('INSERT INTO quizzes (id, course_id, title, passing_score) VALUES (?, ?, ?, ?)')
      .run(quizId, courseId, '前端开发结业测验', 60);

    const questions = [
      { q: 'React中用于管理副作用的Hook是？', options: ['useState', 'useEffect', 'useContext', 'useMemo'], answer: 1 },
      { q: '以下哪个不是JavaScript的数据类型？', options: ['string', 'number', 'float', 'boolean'], answer: 2 },
      { q: 'HTTP状态码404表示？', options: ['服务器错误', '未授权', '资源未找到', '请求超时'], answer: 2 },
      { q: 'CSS Flexbox中，主轴方向由哪个属性控制？', options: ['align-items', 'justify-content', 'flex-direction', 'flex-wrap'], answer: 2 },
      { q: '以下哪个工具用于JavaScript代码检查？', options: ['Prettier', 'ESLint', 'Webpack', 'Babel'], answer: 1 },
    ];
    questions.forEach((q, idx) => {
      db.prepare('INSERT INTO quiz_questions (id, quiz_id, question, options, correct_answer, points, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(uuid(), quizId, q.q, JSON.stringify(q.options), q.answer, 20, idx);
    });

    const tmplId = uuid();
    db.prepare(`INSERT INTO certificate_templates (id, course_id, name, bg_color, border_color, title_text, title_color, body_color, seal_text, font_family)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(tmplId, courseId, '金色经典模板', '#fffef5', '#c9a84c', '结业证书', '#c9a84c', '#333333', '培训中心', 'serif');

    res.json({ success: true, course_id: courseId, session_ids: sessionIds, student_ids: studentIds, quiz_id: quizId, template_id: tmplId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
