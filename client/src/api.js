const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(API_BASE + url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const api = {
  dashboard: () => request('/dashboard'),

  courses: {
    list: () => request('/courses'),
    get: (id) => request(`/courses/${id}`),
    create: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
    getStudents: (id) => request(`/courses/${id}/students`),
    addStudent: (id, student_id) => request(`/courses/${id}/students`, { method: 'POST', body: JSON.stringify({ student_id }) }),
    removeStudent: (courseId, studentId) => request(`/courses/${courseId}/students/${studentId}`, { method: 'DELETE' }),
  },

  sessions: {
    list: (courseId) => request(`/sessions/course/${courseId}`),
    get: (id) => request(`/sessions/${id}`),
    create: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
    getAttendance: (id) => request(`/sessions/${id}/attendance`),
  },

  checkin: {
    listCodes: (sessionId) => request(`/checkin/session/${sessionId}`),
    generateCode: (data) => request('/checkin', { method: 'POST', body: JSON.stringify(data) }),
    verify: (code, student_id) => request('/checkin/verify', { method: 'POST', body: JSON.stringify({ code, student_id }) }),
    makeup: (sessionId, data) => request(`/checkin/${sessionId}/makeup`, { method: 'PUT', body: JSON.stringify(data) }),
    markAbsent: (sessionId, data) => request(`/checkin/${sessionId}/mark-absent`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  students: {
    list: () => request('/students'),
    get: (id) => request(`/students/${id}`),
    create: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
    getCourses: (id) => request(`/students/${id}/courses`),
    getAttendance: (id, courseId) => request(`/students/${id}/attendance${courseId ? `?course_id=${courseId}` : ''}`),
    getGraduationStatus: (id, courseId) => request(`/students/${id}/graduation-status/${courseId}`),
  },

  quizzes: {
    list: (courseId) => request(`/quizzes/course/${courseId}`),
    get: (id) => request(`/quizzes/${id}`),
    create: (data) => request('/quizzes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/quizzes/${id}`, { method: 'DELETE' }),
    submit: (id, data) => request(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
    getAttempts: (id, studentId) => request(`/quizzes/${id}/attempts/${studentId}`),
  },

  templates: {
    list: (courseId) => request(`/templates/course/${courseId}`),
    get: (id) => request(`/templates/${id}`),
    create: (data) => request('/templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/templates/${id}`, { method: 'DELETE' }),
  },

  certificates: {
    listByCourse: (courseId) => request(`/certificates/course/${courseId}`),
    listByStudent: (studentId) => request(`/certificates/student/${studentId}`),
    get: (id) => request(`/certificates/${id}`),
    getHistory: (id) => request(`/certificates/${id}/history`),
    issue: (data) => request('/certificates/issue', { method: 'POST', body: JSON.stringify(data) }),
    reissue: (data) => request('/certificates/reissue', { method: 'POST', body: JSON.stringify(data) }),
    revoke: (id, reason) => request(`/certificates/${id}/revoke`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  },

  seed: () => request('/seed', { method: 'POST' }),
};
