# Backend (Node.js + Express + PostgreSQL)

## Эхлүүлэх
1. `npm install`
2. `.env.example` -> `.env` болгож хуулаад `DATABASE_URL` дахь нууц үгээ засна
3. Өгөгдлийн сан: `db/schema.sql`-ийг PostgreSQL-д ачаална
4. `npm run seed`   (жишээ өгөгдөл)
5. `npm run dev`    -> http://localhost:3000
6. Өөр цонхонд `npm run test:concurrency`  (зэрэг захиалгын тест)

## Бүтэц
```
backend/
├── db/schema.sql            # хүснэгтүүд + давхар захиалгын exclusion constraint
├── scripts/
│   ├── seed.js              # жишээ өгөгдөл
│   └── concurrency-test.js  # давхар захиалгын тест
└── src/
    ├── server.js            # эхлэх цэг
    ├── app.js               # express тохиргоо, frontend-ийг үйлчилнэ
    ├── config/db.js         # PostgreSQL холболт
    ├── middlewares/         # auth (JWT, RBAC), error
    ├── modules/             # auth, rooms, reservations, payments, checkin, reports ...
    └── jobs/expirePending.js
```

## Нэвтрэх хэрэглэгчид (seed)
| Эрх | Email | Нууц үг |
|---|---|---|
| Админ | admin@hotel.mn | admin123 |
| Ресепшн | reception@hotel.mn | recep123 |
| Зочин | demo@hotel.mn | demo123 |
