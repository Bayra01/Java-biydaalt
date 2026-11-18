const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils');

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Нэвтрээгүй байна'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role }
    next();
  } catch (e) {
    next(new HttpError(401, 'Token буруу эсвэл хугацаа дууссан'));
  }
}

// RBAC: role('ADMIN'), role('RECEPTIONIST','ADMIN') ...
const role = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new HttpError(403, 'Таны эрх хүрэхгүй байна'));

module.exports = { auth, role };
