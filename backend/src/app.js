require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();
app.use(cors());
app.use(express.json());

// Frontend (../frontend хавтас) - browser дээр http://localhost:3000 нээхэд харагдана
const frontendDir = process.env.FRONTEND_DIR || path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./modules/auth.routes'));
app.use('/api/customers', require('./modules/customers.routes'));
app.use('/api', require('./modules/rooms.routes'));
app.use('/api', require('./modules/checkin.routes'));
app.use('/api/reservations', require('./modules/reservations.routes'));
app.use('/api/payments', require('./modules/payments.routes'));
app.use('/api/notifications', require('./modules/notifications.routes'));
app.use('/api/reports', require('./modules/reports.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
