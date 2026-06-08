import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await api.students.list();
      setStudents(data);
    } catch (e) { console.error(e); }
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      await api.students.create(form);
      setShowModal(false);
      setForm({ name: '', phone: '', email: '' });
      loadStudents();
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此学员？')) return;
    try { await api.students.delete(id); loadStudents(); } catch (e) { alert(e.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>学员管理</h1>
          <p>管理所有学员信息</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ 新建学员</button>
      </div>

      {students.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="icon">👥</div><h3>暂无学员</h3></div></div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr><th>姓名</th><th>电话</th><th>邮箱</th><th>注册时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td><a href="#" onClick={e => { e.preventDefault(); navigate(`/students/${s.id}`); }} style={{ fontWeight: 600 }}>{s.name}</a></td>
                  <td>{s.phone || '-'}</td>
                  <td>{s.email || '-'}</td>
                  <td>{new Date(s.created_at).toLocaleDateString('zh-CN')}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/students/${s.id}`)}>详情</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>新建学员</h3><button className="close-btn" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>姓名</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="请输入姓名" /></div>
              <div className="form-group"><label>电话</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="请输入电话" /></div>
              <div className="form-group"><label>邮箱</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="请输入邮箱" /></div>
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
