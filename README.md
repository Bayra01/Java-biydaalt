# Зочид буудлын захиалгын систем

```
hotel-reservation/
├── backend/    Node.js + Express + PostgreSQL (API, давхар захиалгын хамгаалалт)
├── frontend/   HTML + CSS + JS модулиуд (нэвтрэх, захиалах, төлөх, ажилтны самбар)
└── docs/       Диаграммууд (Mermaid), API endpoint жагсаалт
```

## Ажиллуулах
1. PostgreSQL дээр `hotel` өгөгдлийн сан үүсгээд `backend/db/schema.sql`-ийг ачаална
2. `cd backend` -> `npm install` -> `.env` тохируулах -> `npm run seed` -> `npm run dev`
3. Browser дээр http://localhost:3000 нээнэ (frontend-ийг backend үйлчилнэ)

Дэлгэрэнгүйг `backend/README.md`, `frontend/README.md`-с үзнэ үү.
