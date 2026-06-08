import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const data = await api.courses.list();
      setCourses(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      await api.courses.create(form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      loadCourses();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此课程？')) return;
    try {
      await api.courses.delete(id);
      loadCourses();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>课程管理</h1>
          <p>管理培训课程及其课次、签到码、测验和证书</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ＋ 新建课程
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">📚</div>
            <h3>暂无课程</h3>
            <p>点击"新建课程"开始创建</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {courses.map(c => (
            <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/courses/${c.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{c.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>{c.description || '暂无描述'}</p>
                </div>
                <span className={`badge ${c.status === 'active' ? 'badge-active' : 'badge-revoked'}`}>
                  {c.status === 'active' ? '进行中' : '已结束'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--gray-500)' }}>
                <span>👥 {c.student_count || 0} 学员</span>
                <span>📅 {c.session_count || 0} 课次</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/courses/${c.id}`)}>
                  管理详情
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建课程</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>课程名称</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="请输入课程名称" />
              </div>
              <div className="form-group">
                <label>课程描述</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="请输入课程描述" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
