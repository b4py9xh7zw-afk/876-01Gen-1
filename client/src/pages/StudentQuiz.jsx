import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function StudentQuiz() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await api.students.list();
      setStudents(data);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (selectedStudent) {
      loadCourses();
    }
  }, [selectedStudent]);

  async function loadCourses() {
    try {
      const data = await api.students.getCourses(selectedStudent);
      setCourses(data);
      setSelectedCourse('');
      setQuizzes([]);
      setQuizData(null);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (selectedCourse) {
      loadQuizzes();
    }
  }, [selectedCourse]);

  async function loadQuizzes() {
    try {
      const data = await api.quizzes.list(selectedCourse);
      setQuizzes(data);
      setQuizData(null);
      setResult(null);
    } catch (e) { console.error(e); }
  }

  async function startQuiz(quizId) {
    try {
      const data = await api.quizzes.get(quizId);
      setQuizData(data);
      setSelectedQuiz(quizId);
      setAnswers({});
      setResult(null);
    } catch (e) { alert(e.message); }
  }

  function selectAnswer(questionId, optionIdx) {
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  }

  async function submitQuiz() {
    if (!quizData || !selectedStudent) return;
    setSubmitting(true);
    try {
      const data = await api.quizzes.submit(selectedQuiz, {
        student_id: selectedStudent,
        answers,
      });
      setResult(data);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>参加测验</h1>
          <p>完成结业测验，通过后即可结业</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640, marginBottom: 16 }}>
        <div className="form-group">
          <label>选择身份</label>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            <option value="">-- 请选择学员 --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="form-group">
            <label>选择课程</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              <option value="">-- 请选择课程 --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedCourse && !quizData && (
        <div style={{ maxWidth: 640 }}>
          {quizzes.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="icon">📝</div><h3>暂无测验</h3></div></div>
          ) : (
            quizzes.map(q => (
              <div key={q.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{q.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>及格分: {q.passing_score}分</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => startQuiz(q.id)}>开始测验</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {quizData && !result && (
        <div className="quiz-container">
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{quizData.title}</h2>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                已答 {Object.keys(answers).length}/{quizData.questions.length} 题
              </span>
            </div>
          </div>

          {quizData.questions.map((q, idx) => (
            <div key={q.id} className="quiz-question">
              <h4>{idx + 1}. {q.question}</h4>
              {JSON.parse(q.options).map((opt, oIdx) => (
                <label key={oIdx} className={`quiz-option ${answers[q.id] === oIdx ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === oIdx}
                    onChange={() => selectAnswer(q.id, oIdx)}
                  />
                  <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                </label>
              ))}
            </div>
          ))}

          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={submitQuiz}
              disabled={submitting || Object.keys(answers).length < quizData.questions.length}
            >
              {submitting ? '提交中...' : '提交答卷'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="quiz-container">
          <div className="card">
            <div className="quiz-result">
              <div className={`score ${result.passed ? 'passed' : 'failed'}`}>{result.score}</div>
              <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>得分</p>
              <div style={{ marginTop: 16 }}>
                <span className={`badge ${result.passed ? 'badge-passed' : 'badge-failed'}`} style={{ fontSize: 16, padding: '6px 16px' }}>
                  {result.passed ? '✓ 测验通过' : '✗ 测验未通过'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 8 }}>
                答对 {result.correct_count}/{result.total_questions} 题
              </p>
              <button
                className="btn btn-outline"
                style={{ marginTop: 16 }}
                onClick={() => { setQuizData(null); setResult(null); }}
              >
                返回测验列表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
