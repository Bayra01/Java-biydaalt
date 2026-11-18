// Жишээ өгөгдөл: node scripts/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

(async () => {
  const h = (p) => bcrypt.hashSync(p, 10);
  await pool.query(
    `INSERT INTO staff(full_name,email,password_hash,role) VALUES
     ('Admin','admin@hotel.mn',$1,'ADMIN'),
     ('Reception','reception@hotel.mn',$2,'RECEPTIONIST')
     ON CONFLICT (email) DO NOTHING`, [h('admin123'), h('recep123')]);
  await pool.query(
    `INSERT INTO customers(full_name,email,phone,password_hash)
     VALUES ('Demo Customer','demo@hotel.mn','99112233',$1)
     ON CONFLICT (email) DO NOTHING`, [h('demo123')]);
  await pool.query(
    `INSERT INTO room_types(name,description,price_per_night,capacity) VALUES
     ('Standard','Стандарт өрөө',80000,2),
     ('Deluxe','Өргөн, үзэмжтэй өрөө',120000,3),
     ('Suite','Люкс өрөө',250000,4)
     ON CONFLICT (name) DO NOTHING`);
  const types = await pool.query('SELECT id,name FROM room_types');
  const id = Object.fromEntries(types.rows.map((t) => [t.name, t.id]));
  const rooms = [
    ['101','Standard',1],['102','Standard',1],['103','Standard',1],['104','Standard',1],['105','Standard',1],
    ['201','Deluxe',2],['202','Deluxe',2],['203','Deluxe',2],['204','Deluxe',2],
    ['301','Suite',3],['302','Suite',3]
  ];
  for (const [no, type, floor] of rooms) {
    await pool.query(
      'INSERT INTO rooms(room_no,room_type_id,floor) VALUES ($1,$2,$3) ON CONFLICT (room_no) DO NOTHING',
      [no, id[type], floor]);
  }
  console.log('Seed дууслаа.');
  console.log('Admin:      admin@hotel.mn / admin123');
  console.log('Reception:  reception@hotel.mn / recep123');
  console.log('Customer:   demo@hotel.mn / demo123');
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
