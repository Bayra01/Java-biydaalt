-- Зочид буудлын захиалгын систем - PostgreSQL схем
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ENUM төрлүүд
CREATE TYPE room_status        AS ENUM ('AVAILABLE','OCCUPIED','MAINTENANCE');
CREATE TYPE reservation_status AS ENUM ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED','EXPIRED');
CREATE TYPE payment_status     AS ENUM ('PENDING','PAID','FAILED','REFUNDED');
CREATE TYPE staff_role         AS ENUM ('RECEPTIONIST','ADMIN');

-- Хэрэглэгчид
CREATE TABLE customers (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ажилтнууд (ресепшн, админ)
CREATE TABLE staff (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          staff_role NOT NULL DEFAULT 'RECEPTIONIST'
);

-- Өрөөний төрөл
CREATE TABLE room_types (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,   -- Standard, Deluxe, Suite
    description     TEXT,
    price_per_night NUMERIC(12,2) NOT NULL CHECK (price_per_night > 0),
    capacity        SMALLINT NOT NULL CHECK (capacity > 0)
);

-- Өрөө
CREATE TABLE rooms (
    id           BIGSERIAL PRIMARY KEY,
    room_no      VARCHAR(10) NOT NULL UNIQUE,
    room_type_id BIGINT NOT NULL REFERENCES room_types(id),
    floor        SMALLINT,
    status       room_status NOT NULL DEFAULT 'AVAILABLE'
);

-- Захиалга
CREATE TABLE reservations (
    id              BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    room_id         BIGINT NOT NULL REFERENCES rooms(id),
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    status          reservation_status NOT NULL DEFAULT 'PENDING',
    total_price     NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    idempotency_key VARCHAR(100) UNIQUE,
    expires_at      TIMESTAMPTZ,                    -- PENDING төлөвийн хугацаа
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_dates CHECK (check_out > check_in),

    -- ДАВХАР ЗАХИАЛГЫГ DB ТҮВШИНД ХОРИГЛОХ:
    -- Нэг өрөөний идэвхтэй захиалгуудын огноо давхцаж болохгүй.
    -- '[)' => check_out өдөр дараагийн захиалгын check_in өдөртэй давхцахгүй.
    CONSTRAINT no_overlap EXCLUDE USING gist (
        room_id WITH =,
        daterange(check_in, check_out, '[)') WITH &&
    ) WHERE (status IN ('PENDING','CONFIRMED','CHECKED_IN'))
);

-- Төлбөр
CREATE TABLE payments (
    id             BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id),
    amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method         VARCHAR(30) NOT NULL,            -- CARD, QPAY, CASH
    status         payment_status NOT NULL DEFAULT 'PENDING',
    transaction_ref VARCHAR(100),
    paid_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Мэдэгдэл
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    type        VARCHAR(30) NOT NULL,               -- CONFIRMATION, CANCELLATION, REMINDER
    channel     VARCHAR(10) NOT NULL DEFAULT 'EMAIL',
    message     TEXT NOT NULL,
    sent_at     TIMESTAMPTZ
);

-- Индексүүд
CREATE INDEX idx_rooms_type          ON rooms(room_type_id);
CREATE INDEX idx_res_customer        ON reservations(customer_id);
CREATE INDEX idx_res_status_expires  ON reservations(status, expires_at);
CREATE INDEX idx_payments_res        ON payments(reservation_id);

-- ============ Жишээ query-ууд ============

-- 1) Өрөө хайх + сул эсэхийг шалгах ($1=check_in, $2=check_out, $3=төрөл)
-- SELECT r.id, r.room_no, t.name, t.price_per_night
-- FROM rooms r
-- JOIN room_types t ON t.id = r.room_type_id
-- WHERE r.status <> 'MAINTENANCE'
--   AND ($3::bigint IS NULL OR t.id = $3)
--   AND NOT EXISTS (
--       SELECT 1 FROM reservations x
--       WHERE x.room_id = r.id
--         AND x.status IN ('PENDING','CONFIRMED','CHECKED_IN')
--         AND daterange(x.check_in, x.check_out, '[)') && daterange($1, $2, '[)')
--   );

-- 2) Захиалга үүсгэх (transaction + row lock)
-- BEGIN;
-- SELECT id FROM rooms WHERE id = $1 FOR UPDATE;
-- INSERT INTO reservations(customer_id, room_id, check_in, check_out,
--                          total_price, idempotency_key, expires_at)
-- VALUES ($2, $1, $3, $4, $5, $6, now() + interval '15 minutes');
-- COMMIT;   -- давхцвал exclusion_violation (23P01) алдаа буцна

-- 3) Хугацаа дууссан PENDING захиалгыг чөлөөлөх (scheduler, минут тутам)
-- UPDATE reservations SET status = 'EXPIRED'
-- WHERE status = 'PENDING' AND expires_at < now();
