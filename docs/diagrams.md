# Mermaid диаграммууд (draw.io-д оруулах)

draw.io дээр: **Arrange → Insert → Advanced → Mermaid...** цэс рүү код хуулж Insert дарна.
(Эсвэл https://mermaid.live дээр шалгаад, SVG/PNG-ээр татаж болно.)

---

## 1. Use Case diagram

```mermaid
flowchart LR
    C([Customer])
    R([Receptionist])
    A([Admin])
    P([Payment System])

    subgraph SYS[Hotel Reservation System]
        UC1(Өрөө хайх)
        UC2(Сул эсэхийг шалгах)
        UC3(Захиалга хийх)
        UC4(Төлбөр төлөх)
        UC5(Захиалга цуцлах)
        UC6(Check-in)
        UC7(Check-out)
        UC8(Өрөө удирдах)
        UC9(Тайлан гаргах)
        UC10(Мэдэгдэл илгээх)
    end

    C --- UC1
    C --- UC3
    C --- UC4
    C --- UC5
    UC1 -. include .-> UC2
    UC3 -. include .-> UC2
    UC3 -. include .-> UC4
    UC3 -. include .-> UC10
    UC4 --- P
    R --- UC6
    R --- UC7
    R --- UC3
    A --- UC8
    A --- UC9
```

---

## 2. ER diagram

```mermaid
erDiagram
    CUSTOMERS ||--o{ RESERVATIONS : makes
    ROOMS ||--o{ RESERVATIONS : booked_in
    ROOM_TYPES ||--o{ ROOMS : classifies
    RESERVATIONS ||--o{ PAYMENTS : paid_by
    CUSTOMERS ||--o{ NOTIFICATIONS : receives

    CUSTOMERS {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar phone
        varchar password_hash
        timestamptz created_at
    }
    STAFF {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        enum role
    }
    ROOM_TYPES {
        bigint id PK
        varchar name UK
        text description
        numeric price_per_night
        smallint capacity
    }
    ROOMS {
        bigint id PK
        varchar room_no UK
        bigint room_type_id FK
        smallint floor
        enum status
    }
    RESERVATIONS {
        bigint id PK
        bigint customer_id FK
        bigint room_id FK
        date check_in
        date check_out
        enum status
        numeric total_price
        varchar idempotency_key UK
        timestamptz expires_at
    }
    PAYMENTS {
        bigint id PK
        bigint reservation_id FK
        numeric amount
        varchar method
        enum status
        varchar transaction_ref
        timestamptz paid_at
    }
    NOTIFICATIONS {
        bigint id PK
        bigint customer_id FK
        varchar type
        varchar channel
        text message
        timestamptz sent_at
    }
```

---

## 3. Sequence diagram: Өрөө захиалах

```mermaid
sequenceDiagram
    actor C as Customer
    participant UI as Frontend
    participant API as Backend API
    participant DB as PostgreSQL
    participant PAY as Payment Gateway
    participant N as Notification

    C->>UI: Огноо, төрөл сонгож хайх
    UI->>API: GET /rooms/search
    API->>DB: Сул өрөө хайх query
    DB-->>API: Сул өрөөнүүд
    API-->>UI: Үр дүн
    UI-->>C: Өрөөний жагсаалт

    C->>UI: Өрөө сонгож захиалах
    UI->>API: POST /reservations (Idempotency-Key)
    API->>DB: BEGIN, SELECT room FOR UPDATE
    API->>DB: INSERT reservation (PENDING, expires 15 мин)
    alt Огноо давхцсан
        DB-->>API: exclusion_violation
        API-->>UI: 409 Conflict
        UI-->>C: Өрөө эзлэгдсэн
    else Амжилттай
        DB-->>API: COMMIT OK
        API-->>UI: 201 reservation_id
        C->>UI: Төлбөр төлөх
        UI->>API: POST /payments
        API->>PAY: Charge
        alt Төлбөр амжилттай
            PAY-->>API: SUCCESS
            API->>DB: payment=PAID, reservation=CONFIRMED
            API->>N: Баталгаажуулалт илгээх
            N-->>C: Email / SMS
            API-->>UI: 200 CONFIRMED
        else Төлбөр амжилтгүй
            PAY-->>API: FAILED
            API->>DB: payment=FAILED
            API-->>UI: 402 Payment Failed
        end
    end
```

---

## 4. State diagram: Захиалгын төлөв

```mermaid
stateDiagram-v2
    [*] --> PENDING: Захиалга үүсгэх
    PENDING --> CONFIRMED: Төлбөр амжилттай
    PENDING --> EXPIRED: 15 минут өнгөрсөн
    PENDING --> CANCELLED: Хэрэглэгч цуцалсан
    CONFIRMED --> CANCELLED: Цуцлах (буцаалттай)
    CONFIRMED --> CHECKED_IN: Check-in
    CHECKED_IN --> CHECKED_OUT: Check-out
    EXPIRED --> [*]
    CANCELLED --> [*]
    CHECKED_OUT --> [*]
```

---

## 5. Component / Architecture diagram

```mermaid
flowchart TB
    U[Web / Mobile Client] --> GW[API Gateway / Express]
    GW --> AUTH[Auth Module - JWT]
    GW --> RM[Room Module]
    GW --> RES[Reservation Module]
    GW --> PAYM[Payment Module]
    GW --> CHK[Check-in/out Module]
    GW --> REP[Report Module]
    RES --> NOTI[Notification Service]
    PAYM --> EXT[Payment Gateway]
    AUTH --> DB[(PostgreSQL)]
    RM --> DB
    RES --> DB
    PAYM --> DB
    CHK --> DB
    REP --> DB
    JOB[Scheduler: EXPIRE job] --> DB
```
