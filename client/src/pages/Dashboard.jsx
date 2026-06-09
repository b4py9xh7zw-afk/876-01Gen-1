import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await api.dashboard();
      setStats(data);
      if (data.courseCount > 0) setSeeded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    try {
      await api.seed();
      setSeeded(true);
      loadDashboard();
    } catch (e) {
      alert('初始化失败: ' + e.message);
    }
  }

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>数据看板</h1>
          <p>培训签到证书平台总览</p>
        </div>
        {!seeded && (
          <button className="btn btn-primary" onClick={handleSeed}>
            🎬 初始化演示数据
          </button>
        )}
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">📚</div>
            <div className="stat-info">
              <h3>{stats.courseCount}</h3>
              <p>课程数量</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">👥</div>
            <div className="stat-info">
              <h3>{stats.studentCount}</h3>
              <p>学员总数</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info">📅</div>
            <div className="stat-info">
              <h3>{stats.sessionCount}</h3>
              <p>课次总数</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">🏅</div>
            <div className="stat-info">
              <h3>{stats.certCount}</h3>
              <p>有效证书</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon primary">✅</div>
            <div className="stat-info">
              <h3>{stats.todayCheckins}</h3>
              <p>今日签到</p>
            </div>
          </div>
        </div>
      )}

      {!seeded && (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🚀</div>
            <h3>欢迎使用培训签到证书平台</h3>
            <p>点击上方"初始化演示数据"按钮，快速体验完整功能</p>
            <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 480, margin: '20px auto 0' }}>
              <h4 style={{ marginBottom: 8, fontSize: 14 }}>平台功能：</h4>
              <ul style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 2, paddingLeft: 20 }}>
                <li>📚 主办方创建课程、课次、签到码</li>
                <li>📱 学员扫码签到，自动判定迟到</li>
                <li>📝 结业测验，通过后才算结业</li>
                <li>🏅 证书发放、补发，完整追溯历史</li>
                <li>🔄 迟到/缺课/补签状态全记录</li>
                <li>📜 旧证书失效原因可查</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
