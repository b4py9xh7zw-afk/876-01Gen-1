import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

const TABS = [
  { key: 'sessions', label: '📅 课次管理' },
  { key: 'students', label: '👥 学员管理' },
  { key: 'quizzes', label: '📝 测验管理' },
  { key: 'templates', label: '🎨 证书模板' },
  { key: 'certificates', label: '🏅 证书管理' },
];

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [gradStatuses, setGradStatuses] = useState({});

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showReissueModal, setShowReissueModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const [sessionForm, setSessionForm] = useState({ name: '', start_time: '', end_time: '', late_threshold: 15 });
  const [quizForm, setQuizForm] = useState({ title: '', passing_score: 60, questions: [] });
  const [templateForm, setTemplateForm] = useState({ name: '', bg_color: '#fffef5', border_color: '#c9a84c', title_text: '结业证书', title_color: '#c9a84c', body_color: '#333333', seal_text: '', font_family: 'serif' });
  const [qrData, setQRData] = useState(null);
  const [reissueTarget, setReissueTarget] = useState(null);
  const [reissueReason, setReissueReason] = useState('');
  const [addStudentId, setAddStudentId] = useState('');

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    try {
      const c = await api.courses.get(id);
      setCourse(c);
      const [sess, stu, allStu, qz, tmpl, certs] = await Promise.all([
        api.sessions.list(id),
        api.courses.getStudents(id),
        api.students.list(),
        api.quizzes.list(id),
        api.templates.list(id),
        api.certificates.listByCourse(id),
      ]);
      setSessions(sess);
      setEnrolledStudents(stu);
      setAllStudents(allStu);
      setQuizzes(qz);
      setTemplates(tmpl);
      setCertificates(certs);
      if (stu.length > 0) {
        const gs = {};
        await Promise.all(stu.map(async s => {
          try {
            gs[s.id] = await api.students.getGraduationStatus(s.id, id);
          } catch (e) { gs[s.id] = null; }
        }));
        setGradStatuses(gs);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function createSession() {
    if (!sessionForm.name || !sessionForm.start_time || !sessionForm.end_time) return;
    try {
      await api.sessions.create({ course_id: id, ...sessionForm });
      setShowSessionModal(false);
      setSessionForm({ name: '', start_time: '', end_time: '', late_threshold: 15 });
      loadAll();
    } catch (e) { alert(e.message); }
  }

  async function deleteSession(sid) {
    if (!confirm('确定删除此课次？')) return;
    try { await api.sessions.delete(sid); loadAll(); } catch (e) { alert(e.message); }
  }

  async function generateCheckinCode(sessionId) {
    try {
      const data = await api.checkin.generateCode({ session_id: sessionId });
      setQRData(data);
      setShowQRModal(true);
    } catch (e) { alert(e.message); }
  }

  async function addStudent() {
    if (!addStudentId) return;
    try {
      await api.courses.addStudent(id, addStudentId);
      setShowAddStudentModal(false);
      setAddStudentId('');
      loadAll();
    } catch (e) { alert(e.message); }
  }

  async function removeStudent(studentId) {
    if (!confirm('确定移除此学员？')) return;
    try { await api.courses.removeStudent(id, studentId); loadAll(); } catch (e) { alert(e.message); }
  }

  async function createQuiz() {
    if (!quizForm.title) return;
    try {
      await api.quizzes.create({ course_id: id, title: quizForm.title, passing_score: quizForm.passing_score, questions: quizForm.questions });
      setShowQuizModal(false);
      setQuizForm({ title: '', passing_score: 60, questions: [] });
      loadAll();
    } catch (e) { alert(e.message); }
  }

  function addQuestion() {
    setQuizForm(f => ({
      ...f,
      questions: [...f.questions, { question: '', options: ['', '', '', ''], correct_answer: 0, points: 1 }],
    }));
  }

  function updateQuestion(idx, field, value) {
    setQuizForm(f => {
      const questions = [...f.questions];
      questions[idx] = { ...questions[idx], [field]: value };
      return { ...f, questions };
    });
  }

  function updateOption(qIdx, oIdx, value) {
    setQuizForm(f => {
      const questions = [...f.questions];
      const options = [...questions[qIdx].options];
      options[oIdx] = value;
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...f, questions };
    });
  }

  async function deleteQuiz(qid) {
    if (!confirm('确定删除此测验？')) return;
    try { await api.quizzes.delete(qid); loadAll(); } catch (e) { alert(e.message); }
  }

  async function createTemplate() {
    if (!templateForm.name) return;
    try {
      await api.templates.create({ course_id: id, ...templateForm });
      setShowTemplateModal(false);
      setTemplateForm({ name: '', bg_color: '#fffef5', border_color: '#c9a84c', title_text: '结业证书', title_color: '#c9a84c', body_color: '#333333', seal_text: '', font_family: 'serif' });
      loadAll();
    } catch (e) { alert(e.message); }
  }

  async function deleteTemplate(tid) {
    if (!confirm('确定删除此模板？')) return;
    try { await api.templates.delete(tid); loadAll(); } catch (e) { alert(e.message); }
  }

  async function issueCertificate(studentId) {
    const tmplId = templates.length > 0 ? templates[0].id : null;
    try {
      await api.certificates.issue({ student_id: studentId, course_id: id, template_id: tmplId });
      loadAll();
    } catch (e) {
      alert('发证失败: ' + e.message);
    }
  }

  async function reissueCertificate() {
    if (!reissueTarget || !reissueReason.trim()) return;
    try {
      await api.certificates.reissue({ old_cert_id: reissueTarget, reason: reissueReason });
      setShowReissueModal(false);
      setReissueTarget(null);
      setReissueReason('');
      loadAll();
    } catch (e) { alert(e.message); }
  }

  async function revokeCertificate(certId) {
    const reason = prompt('请输入撤销原因：');
    if (!reason) return;
    try {
      await api.certificates.revoke(certId, reason);
      loadAll();
    } catch (e) { alert(e.message); }
  }

  async function markAbsent(sessionId, studentId) {
    try {
      await api.checkin.markAbsent(sessionId, { student_id: studentId });
      loadAll();
    } catch (e) { alert(e.message); }
  }

  async function makeupAttendance(sessionId, studentId) {
    const reason = prompt('请输入补签原因：');
    if (!reason) return;
    try {
      await api.checkin.makeup(sessionId, { student_id: studentId, makeup_reason: reason });
      loadAll();
    } catch (e) { alert(e.message); }
  }

  if (!course) return <div>加载中...</div>;

  const availableStudents = allStudents.filter(s => !enrolledStudents.find(es => es.id === s.id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{course.name}</h1>
          <p>{course.description}</p>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowSessionModal(true)}>＋ 新建课次</button>
          </div>
          {sessions.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="icon">📅</div><h3>暂无课次</h3></div></div>
          ) : (
            sessions.map(s => (
              <div key={s.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                      {new Date(s.start_time).toLocaleString('zh-CN')} → {new Date(s.end_time).toLocaleString('zh-CN')}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                      迟到阈值: {s.late_threshold}分钟
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => generateCheckinCode(s.id)}>
                      📱 生成签到码
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSession(s.id)}>删除</button>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>学员出勤</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>学员</th>
                        <th>状态</th>
                        <th>签到时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map(stu => {
                        const attendance = sessions.length > 0 ? null : null;
                        return (
                          <SessionStudentRow key={stu.id} session={s} student={stu} onMarkAbsent={markAbsent} onMakeup={makeupAttendance} />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'students' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowAddStudentModal(true)}>＋ 添加学员</button>
          </div>
          {enrolledStudents.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="icon">👥</div><h3>暂无学员</h3></div></div>
          ) : (
            <div className="card">
              <table>
                <thead>
                  <tr><th>姓名</th><th>电话</th><th>邮箱</th><th>报名日期</th><th>操作</th></tr>
                </thead>
                <tbody>
                  {enrolledStudents.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.phone || '-'}</td>
                      <td>{s.email || '-'}</td>
                      <td>{s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString('zh-CN') : '-'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => removeStudent(s.id)}>移除</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'quizzes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { addQuestion(); setShowQuizModal(true); }}>＋ 新建测验</button>
          </div>
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
                  <button className="btn btn-danger btn-sm" onClick={() => deleteQuiz(q.id)}>删除</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowTemplateModal(true)}>＋ 新建模板</button>
          </div>
          {templates.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="icon">🎨</div><h3>暂无证书模板</h3></div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {templates.map(t => (
                <div key={t.id} className="card">
                  <div className="certificate-preview" style={{ borderColor: t.border_color, background: t.bg_color, padding: 20, minHeight: 180 }}>
                    <div style={{ color: t.title_color, fontSize: 20, fontWeight: 700, fontFamily: t.font_family }}>{t.title_text}</div>
                    <div style={{ color: t.body_color, fontSize: 12, marginTop: 8, fontFamily: t.font_family }}>学员姓名 — 课程名称</div>
                    {t.seal_text && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--gray-400)' }}>{t.seal_text}</div>}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteTemplate(t.id)}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'certificates' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h2>批量发放证书</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
              为已结业但尚未获得证书的学员发放证书（需完成所有课次签到 + 通过测验）
            </p>
            {enrolledStudents.map(s => {
              const hasCert = certificates.find(c => c.student_id === s.id && c.status === 'active');
              const gs = gradStatuses[s.id];
              const graduated = gs ? gs.graduated : false;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{s.name}</span>
                    {gs && !graduated && (
                      <span className="badge badge-failed" style={{ fontSize: 11 }}>未结业</span>
                    )}
                    {gs && graduated && (
                      <span className="badge badge-passed" style={{ fontSize: 11 }}>已结业</span>
                    )}
                  </div>
                  {hasCert ? (
                    <span className="badge badge-active">已发证</span>
                  ) : graduated ? (
                    <button className="btn btn-success btn-sm" onClick={() => issueCertificate(s.id)}>发放证书</button>
                  ) : (
                    <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>未结业，不可发证</button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-header"><h2>证书列表</h2></div>
            {certificates.length === 0 ? (
              <div className="empty-state"><div className="icon">🏅</div><h3>暂无证书</h3></div>
            ) : (
              <table>
                <thead>
                  <tr><th>证书编号</th><th>学员</th><th>状态</th><th>发放日期</th><th>撤销/补发原因</th><th>操作</th></tr>
                </thead>
                <tbody>
                  {certificates.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.cert_number}</td>
                      <td>{c.student_name}</td>
                      <td><span className={`badge badge-${c.status}`}>{c.status === 'active' ? '有效' : c.status === 'revoked' ? '已撤销' : '已补发'}</span></td>
                      <td>{new Date(c.issue_date).toLocaleDateString('zh-CN')}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)', maxWidth: 160 }}>
                        {c.revoke_reason || c.reissue_reason || '-'}
                      </td>
                      <td>
                        <div className="actions-cell">
                          {c.status === 'active' && (
                            <>
                              <button className="btn btn-warning btn-sm" onClick={() => { setReissueTarget(c.id); setShowReissueModal(true); }}>补发</button>
                              <button className="btn btn-danger btn-sm" onClick={() => revokeCertificate(c.id)}>撤销</button>
                            </>
                          )}
                          <a href={`/certificates/${c.id}`} className="btn btn-outline btn-sm" onClick={e => { e.preventDefault(); window.open(`/certificates/${c.id}`, '_blank'); }}>详情</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="modal-overlay" onClick={() => setShowSessionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>新建课次</h3><button className="close-btn" onClick={() => setShowSessionModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>课次名称</label><input value={sessionForm.name} onChange={e => setSessionForm({ ...sessionForm, name: e.target.value })} placeholder="如：第1课：入门概览" /></div>
              <div className="form-row">
                <div className="form-group"><label>开始时间</label><input type="datetime-local" value={sessionForm.start_time} onChange={e => setSessionForm({ ...sessionForm, start_time: e.target.value })} /></div>
                <div className="form-group"><label>结束时间</label><input type="datetime-local" value={sessionForm.end_time} onChange={e => setSessionForm({ ...sessionForm, end_time: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>迟到阈值（分钟）</label><input type="number" value={sessionForm.late_threshold} onChange={e => setSessionForm({ ...sessionForm, late_threshold: parseInt(e.target.value) || 15 })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowSessionModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={createSession}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showQRModal && qrData && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>签到二维码</h3><button className="close-btn" onClick={() => setShowQRModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="qr-container">
                {qrData.qr_image && <img src={qrData.qr_image} alt="签到二维码" width={240} />}
                <div className="qr-code-text">{qrData.code}</div>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'center' }}>
                  学员可扫描二维码或输入签到码完成签到<br />
                  {qrData.expires_at ? `有效期至: ${new Date(qrData.expires_at).toLocaleString('zh-CN')}` : '长期有效'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>添加学员</h3><button className="close-btn" onClick={() => setShowAddStudentModal(false)}>✕</button></div>
            <div className="modal-body">
              {availableStudents.length === 0 ? (
                <p style={{ color: 'var(--gray-500)' }}>没有可添加的学员，请先在"学员管理"中创建</p>
              ) : (
                <div className="form-group">
                  <label>选择学员</label>
                  <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)}>
                    <option value="">-- 请选择 --</option>
                    {availableStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.phone || s.email || '无联系方式'})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddStudentModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={addStudent} disabled={!addStudentId}>添加</button>
            </div>
          </div>
        </div>
      )}

      {showQuizModal && (
        <div className="modal-overlay" onClick={() => setShowQuizModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>新建测验</h3><button className="close-btn" onClick={() => setShowQuizModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>测验标题</label><input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} /></div>
              <div className="form-group"><label>及格分数（百分比）</label><input type="number" value={quizForm.passing_score} onChange={e => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 60 })} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14 }}>题目列表</h4>
                <button className="btn btn-outline btn-sm" onClick={addQuestion}>＋ 添加题目</button>
              </div>
              {quizForm.questions.map((q, qIdx) => (
                <div key={qIdx} style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label>题目 {qIdx + 1}</label>
                    <input value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)} placeholder="请输入题目" />
                  </div>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                      <input type="radio" name={`correct-${qIdx}`} checked={q.correct_answer === oIdx} onChange={() => updateQuestion(qIdx, 'correct_answer', oIdx)} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{String.fromCharCode(65 + oIdx)}.</span>
                      <input style={{ flex: 1, padding: '4px 8px', fontSize: 13 }} value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} placeholder={`选项${String.fromCharCode(65 + oIdx)}`} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowQuizModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={createQuiz}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>新建证书模板</h3><button className="close-btn" onClick={() => setShowTemplateModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>模板名称</label><input value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="如：金色经典模板" /></div>
              <div className="form-row">
                <div className="form-group"><label>标题文字</label><input value={templateForm.title_text} onChange={e => setTemplateForm({ ...templateForm, title_text: e.target.value })} /></div>
                <div className="form-group"><label>印章文字</label><input value={templateForm.seal_text} onChange={e => setTemplateForm({ ...templateForm, seal_text: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>背景颜色</label><input type="color" value={templateForm.bg_color} onChange={e => setTemplateForm({ ...templateForm, bg_color: e.target.value })} /></div>
                <div className="form-group"><label>边框颜色</label><input type="color" value={templateForm.border_color} onChange={e => setTemplateForm({ ...templateForm, border_color: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>标题颜色</label><input type="color" value={templateForm.title_color} onChange={e => setTemplateForm({ ...templateForm, title_color: e.target.value })} /></div>
                <div className="form-group"><label>正文字体</label>
                  <select value={templateForm.font_family} onChange={e => setTemplateForm({ ...templateForm, font_family: e.target.value })}>
                    <option value="serif">衬线体 (Serif)</option>
                    <option value="sans-serif">无衬线体 (Sans-serif)</option>
                    <option value="cursive">手写体 (Cursive)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowTemplateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={createTemplate}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showReissueModal && (
        <div className="modal-overlay" onClick={() => setShowReissueModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>补发证书</h3><button className="close-btn" onClick={() => setShowReissueModal(false)}>✕</button></div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
                补发后，原证书将标记为"已撤销"，新证书将关联原证书，保留完整追溯链。
              </p>
              <div className="form-group">
                <label>补发原因（必填）</label>
                <textarea rows={3} value={reissueReason} onChange={e => setReissueReason(e.target.value)} placeholder="如：信息有误需更正、证书损毁等" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowReissueModal(false)}>取消</button>
              <button className="btn btn-warning" onClick={reissueCertificate} disabled={!reissueReason.trim()}>确认补发</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionStudentRow({ session, student, onMarkAbsent, onMakeup }) {
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, [session.id, student.id]);

  async function loadAttendance() {
    try {
      const data = await api.sessions.getAttendance(session.id);
      const found = data.find(a => a.student_id === student.id);
      setAttendance(found || null);
    } catch (e) {}
  }

  const statusLabel = {
    present: '已到',
    late: '迟到',
    absent: '缺课',
    makeup: '补签',
  };

  return (
    <tr>
      <td>{student.name}</td>
      <td>
        {attendance ? (
          <span className={`badge badge-${attendance.status}`}>{statusLabel[attendance.status]}</span>
        ) : (
          <span className="badge badge-absent">未签到</span>
        )}
      </td>
      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
        {attendance?.checkin_time ? new Date(attendance.checkin_time).toLocaleString('zh-CN') : '-'}
      </td>
      <td>
        <div className="actions-cell">
          {(!attendance || attendance.status === 'absent') && (
            <button className="btn btn-info btn-sm" onClick={() => onMakeup(session.id, student.id)}>补签</button>
          )}
          {attendance && attendance.status !== 'absent' && (
            <button className="btn btn-outline btn-sm" onClick={() => onMarkAbsent(session.id, student.id)}>标记缺课</button>
          )}
        </div>
      </td>
    </tr>
  );
}
