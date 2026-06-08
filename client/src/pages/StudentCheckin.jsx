import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function StudentCheckin() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    loadStudents();
    return () => {
      if (scanner) scanner.clear();
    };
  }, []);

  async function loadStudents() {
    try {
      const data = await api.students.list();
      setStudents(data);
    } catch (e) { console.error(e); }
  }

  async function handleCheckin() {
    if (!selectedStudent || !code.trim()) return;
    setError('');
    setResult(null);
    try {
      const data = await api.checkin.verify(code.trim().toUpperCase(), selectedStudent);
      setResult(data);
    } catch (e) {
      setError(e.message);
    }
  }

  function startScanner() {
    setScanning(true);
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const s = new Html5Qrcode('qr-reader');
      setScanner(s);
      s.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.type === 'checkin' && parsed.code) {
              setCode(parsed.code);
              s.stop().then(() => setScanning(false));
            }
          } catch {
            setCode(decodedText);
            s.stop().then(() => setScanning(false));
          }
        },
        () => {}
      ).catch(() => {
        setScanning(false);
        setError('无法启动摄像头，请手动输入签到码');
      });
    });
  }

  function stopScanner() {
    if (scanner) {
      scanner.stop().then(() => setScanning(false)).catch(() => setScanning(false));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>扫码签到</h1>
          <p>扫描签到二维码或手动输入签到码完成签到</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label>选择身份</label>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            <option value="">-- 请选择学员 --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>签到码</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="输入签到码，如 CK-ABC123"
              style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.1em' }}
            />
            <button className="btn btn-primary" onClick={handleCheckin} disabled={!selectedStudent || !code.trim()}>
              签到
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          {!scanning ? (
            <button className="btn btn-outline btn-lg" onClick={startScanner} style={{ width: '100%' }}>
              📱 扫描二维码签到
            </button>
          ) : (
            <div>
              <div id="qr-reader" style={{ width: '100%' }}></div>
              <button className="btn btn-outline" onClick={stopScanner} style={{ marginTop: 8 }}>取消扫描</button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: 12, background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 6, fontSize: 14 }}>
            ❌ {error}
          </div>
        )}

        {result && (
          <div style={{ padding: 16, background: result.late ? 'var(--warning-bg)' : 'var(--success-bg)', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{result.late ? '⏰' : '✅'}</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: result.late ? 'var(--warning)' : 'var(--success)' }}>
              {result.late ? '签到成功（迟到）' : '签到成功'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
              签到时间: {new Date(result.checkin_time).toLocaleString('zh-CN')}
            </p>
            {result.late && (
              <p style={{ fontSize: 13, color: 'var(--warning)', marginTop: 4 }}>
                您已超过迟到阈值，本次签到记为迟到
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
