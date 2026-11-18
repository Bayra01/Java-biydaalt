const pool = require('../config/db');

// Мэдэгдлийг DB-д хадгалж, console-д хэвлэнэ (бодит системд SMTP/SMS холбоно)
async function notify(customerId, type, message) {
  try {
    await pool.query(
      `INSERT INTO notifications(customer_id, type, channel, message, sent_at)
       VALUES ($1,$2,'EMAIL',$3, now())`,
      [customerId, type, message]
    );
    console.log(`[NOTIFY] customer=${customerId} type=${type}: ${message}`);
  } catch (e) {
    console.error('Notification алдаа:', e.message);
  }
}

module.exports = { notify };
