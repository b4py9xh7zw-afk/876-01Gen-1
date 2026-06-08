import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [gradStatus, setGradStatus] = useState(null);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const s = await api.students.get(id);
      setStudent(s);
      const c = await api.students.getCourses(id);
      setCourses(c);
      if (c.length > 0) {
        setSelectedCourse(c[0].id);
      }
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (selectedCourse) {
      loadCourseData();
    }
  }, [selectedCourse]);

  async function loadCourseData() {
    try {
      const [gs, att] = await Promise.all([
        api.students.getGraduationStatus(id, selectedCourse),
        api.students.getAttendance(id, selectedCourse),
      ]);
      setGradStatus(gs);
      setAttendance(att);
    } catch (e) { console.error(e); }
  }

  if (!student) return <div>加载中...</div>;

  const statusLabel = { present: '已到', late: '迟到', absent: '缺课', makeup: '补签' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{student.name}</h1>
          <p>{student.phone || ''} {student.email || ''}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2>已报名课程</h2></div>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>尚未报名任何课程</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {courses.map(c => (
              <button
                key={c.id}
                className={`btn ${selectedCourse === c.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedCourse(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {gradStatus && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon info">📅</div>
              <div className="stat-info">
                <h3>{gradStatus.attended_sessions}/{gradStatus.total_sessions}</h3>
                <p>出勤课次</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">⏰</div>
              <div className="stat-info">
                <h3>{gradStatus.late_count}</h3>
                <p>迟到次数</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger">❌</div>
              <div className="stat-info">
                <h3>{gradStatus.absent_count}</h3>
                <p>缺课次数</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon primary">🔄</div>
              <div className="stat-info">
                <h3>{gradStatus.makeup_count}</h3>
                <p>补签次数</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h2>结业状态</h2></div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>出勤达标：</span>
                <span className={`badge ${gradStatus.attendance_passed ? 'badge-passed' : 'badge-failed'}`}>
                  {gradStatus.attendance_passed ? '✓ 通过' : '✗ 未通过'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>测验通过：</span>
                <span className={`badge ${gradStatus.quiz_passed ? 'badge-passed' : 'badge-failed'}`}>
                  {gradStatus.quiz_passed ? '✓ 通过' : '✗ 未通过'} ({gradStatus.passed_quizzes}/{gradStatus.total_quizzes})
                </span>
              </div>
              <div>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>结业：</span>
                <span className={`badge ${gradStatus.graduated ? 'badge-passed' : 'badge-failed'}`}>
                  {gradStatus.graduated ? '✓ 已结业' : '✗ 未结业'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>证书：</span>
                <span className={`badge ${gradStatus.has_certificate ? 'badge-active' : 'badge-absent'}`}>
                  {gradStatus.has_certificate ? '🏅 已发证' : '未发证'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2>出勤记录</h2></div>
            <div className="timeline">
              {attendance.map(a => (
                <div key={a.id} className={`timeline-item ${a.status}`}>
                  <h4>{a.session_name}</h4>
                  <p>
                    <span className={`badge badge-${a.status}`}>{statusLabel[a.status]}</span>
                    {a.checkin_time && <span style={{ marginLeft: 8, fontSize: 12 }}>签到时间: {new Date(a.checkin_time).toLocaleString('zh-CN')}</span>}
                    {a.makeup_reason && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--info)' }}>补签原因: {a.makeup_reason}</span>}
                  </p>
                </div>
              ))}
              {attendance.length === 0 && <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>暂无出勤记录</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
