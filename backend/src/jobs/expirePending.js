const cron = require('node-cron');
const pool = require('../config/db');

// Минут тутам: хугацаа дууссан PENDING захиалгыг EXPIRED болгож өрөөг чөлөөлнө
function start() {
  cron.schedule('* * * * *', async () => {
    try {
      const r = await pool.query(
        "UPDATE reservations SET status='EXPIRED' WHERE status='PENDING' AND expires_at < now()");
      if (r.rowCount) console.log(`[JOB] ${r.rowCount} захиалгын хугацаа дууссан -> EXPIRED`);
    } catch (e) {
      console.error('[JOB] алдаа:', e.message);
    }
  });
}

module.exports = { start };
