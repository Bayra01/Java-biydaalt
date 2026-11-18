# Зочид буудлын захиалгын систем: Folder structure ба API

## 1. Folder structure (Node.js + Express + PostgreSQL)

```
hotel-reservation/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # PostgreSQL pool
│   │   │   └── env.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   └── auth.service.js
│   │   │   ├── customers/
│   │   │   ├── rooms/
│   │   │   │   ├── room.routes.js
│   │   │   │   ├── room.controller.js
│   │   │   │   ├── room.service.js
│   │   │   │   └── room.repository.js
│   │   │   ├── reservations/
│   │   │   │   ├── reservation.routes.js
│   │   │   │   ├── reservation.controller.js
│   │   │   │   ├── reservation.service.js     # transaction, lock, давхцал шалгах
│   │   │   │   └── reservation.repository.js
│   │   │   ├── payments/
│   │   │   ├── checkin/
│   │   │   ├── notifications/
│   │   │   └── reports/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js        # JWT шалгах
│   │   │   ├── role.middleware.js        # RBAC
│   │   │   ├── idempotency.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── jobs/
│   │   │   └── expirePending.job.js      # PENDING -> EXPIRED
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   └── dateRange.js
│   │   ├── app.js
│   │   └── server.js
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── tests/
│   │   ├── reservation.concurrency.test.js   # зэрэг захиалгын тест
│   │   └── ...
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/        # Search, RoomDetail, Booking, Payment, MyBookings, Admin
│   │   ├── components/
│   │   ├── services/     # api.js
│   │   └── App.jsx
│   └── package.json
├── docs/
│   └── diagrams.md
└── README.md
```

## 2. API endpoint жагсаалт

Auth: **P** = Public, **C** = Customer, **R** = Receptionist, **A** = Admin

### Auth / Customer
| Method | Endpoint | Тайлбар | Эрх |
|---|---|---|---|
| POST | /api/auth/register | Бүртгүүлэх | P |
| POST | /api/auth/login | Нэвтрэх (JWT) | P |
| GET | /api/customers/me | Миний мэдээлэл | C |
| PUT | /api/customers/me | Мэдээлэл засах | C |
| GET | /api/customers | Хэрэглэгчдийн жагсаалт | R, A |

### Room management
| Method | Endpoint | Тайлбар | Эрх |
|---|---|---|---|
| GET | /api/room-types | Өрөөний төрлүүд | P |
| GET | /api/rooms/search?checkIn=&checkOut=&type=&guests= | Өрөө хайх + сул эсэх | P |
| GET | /api/rooms/:id/availability?checkIn=&checkOut= | Нэг өрөөний сул эсэх | P |
| GET | /api/rooms/:id | Өрөөний дэлгэрэнгүй | P |
| POST | /api/rooms | Өрөө нэмэх | A |
| PUT | /api/rooms/:id | Өрөө засах | A |
| PATCH | /api/rooms/:id/status | Статус солих (засвар) | A |
| DELETE | /api/rooms/:id | Өрөө устгах | A |

### Reservation
| Method | Endpoint | Тайлбар | Эрх |
|---|---|---|---|
| POST | /api/reservations | Захиалга үүсгэх (Header: Idempotency-Key) | C, R |
| GET | /api/reservations/my | Миний захиалгууд | C |
| GET | /api/reservations/:id | Захиалгын дэлгэрэнгүй | C, R |
| GET | /api/reservations | Бүх захиалга (шүүлттэй) | R, A |
| POST | /api/reservations/:id/cancel | Захиалга цуцлах | C, R |

### Payment
| Method | Endpoint | Тайлбар | Эрх |
|---|---|---|---|
| POST | /api/payments | Төлбөр төлөх | C, R |
| GET | /api/payments/:id | Төлбөрийн мэдээлэл | C, R |
| POST | /api/payments/:id/refund | Буцаалт хийх | R, A |
| POST | /api/payments/webhook | Payment gateway callback | Gateway |

### Check-in / Check-out
| Method | Endpoint | Тайлбар | Эрх |
|---|---|---|---|
| POST | /api/reservations/:id/check-in | Check-in хийх | R |
| POST | /api/reservations/:id/check-out | Check-out хийх | R |
| GET | /api/checkin/today | Өнөөдрийн ирэх/гарах | R |

### Notification / Report
| Method | Endpoint | Тайлбар | Эрх |
|---|---|---|---|
| GET | /api/notifications/my | Миний мэдэгдлүүд | C |
| GET | /api/reports/occupancy?from=&to= | Өрөөний ашиглалтын хувь | A |
| GET | /api/reports/revenue?from=&to= | Орлогын тайлан | A |
| GET | /api/reports/reservations?from=&to= | Захиалгын статистик | A |

### HTTP статус кодууд
- `201` үүсгэсэн, `200` амжилттай
- `400` буруу өгөгдөл, `401` нэвтрээгүй, `403` эрхгүй
- `404` олдсонгүй
- `409` Conflict: өрөө эзлэгдсэн (давхар захиалга)
- `402` төлбөр амжилтгүй

## 3. Захиалга үүсгэх үеийн кодын санаа (reservation.service.js)

```js
async function createReservation(data, idemKey) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. Idempotency: ижил түлхүүртэй захиалга байвал буцаана
    const dup = await client.query(
      'SELECT * FROM reservations WHERE idempotency_key = $1', [idemKey]);
    if (dup.rows[0]) { await client.query('COMMIT'); return dup.rows[0]; }

    // 2. Өрөөг түгжих
    await client.query('SELECT id FROM rooms WHERE id = $1 FOR UPDATE', [data.roomId]);

    // 3. Бичлэг оруулах (давхцвал DB constraint алдаа өгнө)
    const r = await client.query(
      `INSERT INTO reservations
         (customer_id, room_id, check_in, check_out, total_price,
          idempotency_key, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6, now() + interval '15 minutes')
       RETURNING *`,
      [data.customerId, data.roomId, data.checkIn, data.checkOut,
       data.totalPrice, idemKey]);
    await client.query('COMMIT');
    return r.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23P01') throw new ConflictError('Өрөө энэ хугацаанд эзлэгдсэн');
    throw e;
  } finally {
    client.release();
  }
}
```


---
## Тайлангийн endpoint-ууд (зөвхөн ADMIN)
Бүгд `?from=YYYY-MM-DD&to=YYYY-MM-DD` авна (from < to, хамгийн ихдээ 366 хоног).

| Method | Endpoint | Тайлбар |
|---|---|---|
| GET | /api/reports/occupancy | Өрөөний ашиглалтын хувь (нийт) |
| GET | /api/reports/revenue | Орлого + өдрийн орлого (төлөгдсөн төлбөрөөр) |
| GET | /api/reports/reservations | Захиалгын төлвөөр статистик |
| GET | /api/reports/reservations-list | Захиалгын дэлгэрэнгүй жагсаалт (хамгийн ихдээ 2000 мөр) |
| GET | /api/reports/payments | Төлбөрийн гүйлгээ + хэлбэр/төлвөөр бүлэглэсэн нийлбэр |
| GET | /api/reports/rooms | Өрөө бүрийн захиалгат шөнө, ашиглалт %, хуваарилсан орлого |
| GET | /api/reports/customers | Төлсөн дүнгээр эрэмбэлсэн эхний 50 зочин |
