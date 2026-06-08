import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import StudentCheckin from './pages/StudentCheckin';
import StudentQuiz from './pages/StudentQuiz';
import StudentCert from './pages/StudentCert';
import CertificateDetail from './pages/CertificateDetail';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📋</div>
        培训签到证书
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">管理后台</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon">📊</span> 数据看板
        </NavLink>
        <NavLink to="/courses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon">📚</span> 课程管理
        </NavLink>
        <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon">👥</span> 学员管理
        </NavLink>
        <div className="sidebar-section">学员端</div>
        <NavLink to="/student/checkin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon">📱</span> 扫码签到
        </NavLink>
        <NavLink to="/student/quiz" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon">📝</span> 参加测验
        </NavLink>
        <NavLink to="/student/cert" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon">🏅</span> 我的证书
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/student/checkin" element={<StudentCheckin />} />
            <Route path="/student/quiz" element={<StudentQuiz />} />
            <Route path="/student/cert" element={<StudentCert />} />
            <Route path="/certificates/:id" element={<CertificateDetail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
