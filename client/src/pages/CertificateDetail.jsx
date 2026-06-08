import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export default function CertificateDetail() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    loadCert();
  }, [id]);

  async function loadCert() {
    try {
      const data = await api.certificates.get(id);
      setCert(data);
      const hist = await api.certificates.getHistory(id);
      setHistory(hist);
    } catch (e) { console.error(e); }
  }

  if (!cert) return <div>加载中...</div>;

  const statusLabel = {
    active: '✅ 有效',
    revoked: '❌ 已撤销',
    reissued: '🔄 已补发',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>证书详情</h1>
          <p>证书编号: {cert.cert_number}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="certificate-preview" style={{
          borderColor: cert.border_color || '#c9a84c',
          background: cert.bg_color || '#fffef5',
        }}>
          <div className="cert-title" style={{ color: cert.title_color || '#c9a84c', fontFamily: cert.font_family || 'serif' }}>
            {cert.title_text || '结业证书'}
          </div>
          <div className="cert-body" style={{ color: cert.body_color || '#333', fontFamily: cert.font_family || 'serif' }}>
            兹证明 <span className="cert-name">{cert.student_name}</span> 完成
            <br />
            <strong>{cert.course_name}</strong> 的全部学习内容
            <br />
            成绩合格，准予结业
          </div>
          <div className="cert-seal">
            {cert.seal_text && <div style={{ marginBottom: 4 }}>{cert.seal_text}</div>}
            {new Date(cert.issue_date).toLocaleDateString('zh-CN')}
          </div>
          <div className="cert-number">{cert.cert_number}</div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>证书状态</div>
            <span className={`badge badge-${cert.status}`} style={{ fontSize: 14, padding: '4px 12px', marginTop: 4 }}>
              {statusLabel[cert.status]}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>发放日期</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>{new Date(cert.issue_date).toLocaleString('zh-CN')}</div>
          </div>
        </div>

        {cert.revoke_date && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--danger-bg)', borderRadius: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>撤销信息</div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
              撤销时间: {new Date(cert.revoke_date).toLocaleString('zh-CN')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              撤销原因: {cert.revoke_reason}
            </div>
          </div>
        )}

        {cert.reissue_reason && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--warning-bg)', borderRadius: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>补发信息</div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
              补发原因: {cert.reissue_reason}
            </div>
          </div>
        )}
      </div>

      {history && (history.parent_history.length > 0 || history.reissued_children.length > 0) && (
        <div className="card" style={{ maxWidth: 640, margin: '16px auto 0' }}>
          <div className="card-header"><h2>证书追溯链</h2></div>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
            可追溯此证书的补发历史，查看每次补发的原因和对应的旧证书。
          </p>

          {history.parent_history.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--gray-700)' }}>前身证书（被替换）</h4>
              {history.parent_history.map(p => (
                <div key={p.id} className="cert-history-item">
                  <span className="badge badge-revoked" style={{ fontSize: 11 }}>已撤销</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.cert_number}</span>
                  <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>
                    {p.student_name} · {p.course_name}
                  </span>
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>原因: {p.revoke_reason}</span>
                  <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>{new Date(p.revoke_date).toLocaleString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}

          <div className="cert-history-item" style={{ background: 'var(--success-bg)' }}>
            <span className="badge badge-active" style={{ fontSize: 11 }}>
              {cert.status === 'active' ? '当前有效' : statusLabel[cert.status]}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{cert.cert_number}</span>
            <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>
              {cert.student_name} · {cert.course_name}
            </span>
          </div>

          {history.reissued_children.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--gray-700)' }}>补发的新证书</h4>
              {history.reissued_children.map(c => (
                <div key={c.id} className="cert-history-item">
                  <span className="badge badge-active" style={{ fontSize: 11 }}>有效</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.cert_number}</span>
                  <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>{c.student_name}</span>
                  <span style={{ color: 'var(--warning)', fontSize: 12 }}>补发原因: {c.reissue_reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
