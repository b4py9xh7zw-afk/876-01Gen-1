const { v4: uuidv4 } = require('uuid');

function generateCode(prefix = 'CK') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateCertNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${y}${m}${d}-${rand}`;
}

function uuid() {
  return uuidv4();
}

function parseAttendanceStatus(status) {
  const valid = ['present', 'late', 'absent', 'makeup'];
  return valid.includes(status) ? status : 'absent';
}

function parseCertStatus(status) {
  const valid = ['active', 'revoked', 'reissued'];
  return valid.includes(status) ? status : 'active';
}

module.exports = { generateCode, generateCertNumber, uuid, parseAttendanceStatus, parseCertStatus };
