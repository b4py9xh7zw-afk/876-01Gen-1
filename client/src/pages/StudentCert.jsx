import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function StudentCert() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [certificates, setCertificates] = useState([]);

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
      loadCertificates();
    }
  }, [selectedStudent]);

  async function loadCertificates() {
    try {
      const data = await api.certificates.listByStudent(selectedStudent);
      setCertificates(data);
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>我的证书</h1>
          <p>查看已获得的结业证书及补发记录</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
        <div className="form-group">
          <label>选择身份</label>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            <option value="">-- 请选择学员 --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedStudent && (
        <div className="card"><div className="empty-state"><div className="icon">🏅</div><h3>请选择学员身份</h3></div></div>
      )}

      {selectedStudent && certificates.length === 0 && (
        <div className="card"><div className="empty-state"><div className="icon">🏅</div><h3>暂无证书</h3><p>完成课程签到和测验后可获得结业证书</p></div></div>
      )}

      {certificates.map(c => (
        <CertificateCard key={c.id} cert={c} />
      ))}
    </div>
  );
}

function CertificateCard({ cert }) {
  const [history, setHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showHistory && cert.reissue_parent_id) {
      loadHistory();
    }
  }, [showHistory]);

  async function loadHistory() {
    try {
      const data = await api.certificates.getHistory(cert.id);
      setHistory(data);
    } catch (e) { console.error(e); }
  }

  const statusLabel = {
    active: '✅ 有效',
    revoked: '❌ 已撤销',
    reissued: '🔄 已补发',
  };

  return (
    <div className="card">
      <div className="certificate-preview" style={{ borderColor: '#c9a84c', background: '#fffef5' }}>
        <div className="cert-title">结业证书</div>
        <div className="cert-body">
          兹证明 <span className="cert-name">{cert.student_name || '学员'}</span> 完成
          <br />
          <strong>{cert.course_name || '课程'}</strong> 的全部学习内容
          <br />
          准予结业
        </div>
        <div className="cert-seal">{new Date(cert.issue_date).toLocaleDateString('zh-CN')}</div>
        <div className="cert-number">{cert.cert_number}</div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={`badge badge-${cert.status}`} style={{ fontSize: 13, padding: '4px 12px' }}>
          {statusLabel[cert.status]}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {(cert.reissue_parent_id || cert.reissue_reason) && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowHistory(!showHistory)}>
              📜 查看追溯记录
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/certificates/${cert.id}`)}>
            查看详情
          </button>
        </div>
      </div>

      {cert.revoke_reason && (
        <div style={{ marginTop: 8, padding: 8, background: 'var(--danger-bg)', borderRadius: 4, fontSize: 13, color: 'var(--danger)' }}>
          撤销原因：{cert.revoke_reason}
        </div>
      )}

      {cert.reissue_reason && (
        <div style={{ marginTop: 8, padding: 8, background: 'var(--warning-bg)', borderRadius: 4, fontSize: 13, color: 'var(--warning)' }}>
          补发原因：{cert.reissue_reason}
        </div>
      )}

      {showHistory && history && (
        <div className="cert-history">
          <h4>证书追溯链</h4>
          {history.parent_history.map(p => (
            <div key={p.id} className="cert-history-item">
              <span className={`badge badge-revoked`} style={{ fontSize: 11 }}>已撤销</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.cert_number}</span>
              <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>原因: {p.revoke_reason}</span>
              <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>{new Date(p.revoke_date).toLocaleString('zh-CN')}</span>
            </div>
          ))}
          <div className="cert-history-item">
            <span className="badge badge-active" style={{ fontSize: 11 }}>当前有效</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{cert.cert_number}</span>
            <span style={{ color: 'var(--success)', fontSize: 12 }}>当前证书</span>
          </div>
        </div>
      )}
    </div>
  );
}
