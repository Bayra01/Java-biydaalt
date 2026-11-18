# Frontend (HTML + CSS + JavaScript модулиуд, нэмэлт сан шаардлагагүй)

Backend ажиллаж байхад http://localhost:3000 хаягаар нээгдэнэ (backend нь энэ хавтсыг үйлчилдэг).

## Бүтэц
```
frontend/
├── index.html                 # зөвхөн хуудасны араг ясыг агуулна
├── css/
│   ├── base.css               # өнгө (light/dark), фонт, үндсэн загвар
│   ├── layout.css             # header, цэс, grid
│   ├── components.css         # card, form, button, badge, table, toast ...
│   ├── pages.css              # нэвтрэх, stepper, өрөөний карт, төлбөр, тайлан
│   └── print.css              # хэвлэх / PDF-ийн загвар
└── js/
    ├── main.js                # эхлэх цэг: event-үүд, init
    ├── config.js              # API зам, төлөв/эрхийн нэрс
    ├── state.js               # нэгдсэн төлөв (хэрэглэгч, захиалгын урсгал)
    ├── api.js                 # backend руу хүсэлт илгээх цорын ганц газар
    ├── auth.js                # нэвтрэх, бүртгүүлэх, гарах
    ├── router.js              # хуудас солих (go) ба зурах (render)
    ├── utils.js               # esc (XSS), money, isoDay, badge ...
    ├── csv.js                 # CSV үүсгэх/татах (BOM, CSV injection хамгаалалт)
    ├── reportDefs.js          # тайлан бүрийн баганын тодорхойлолт (хүснэгт + CSV нэг эх сурвалжтай)
    ├── components/            # header, stepper, timer, resTable, toast, common
    ├── views/                 # auth, book, my (захиалга+мэдэгдэл), staff (самбар), reports (тайлан)
    └── actions/               # booking.js, staff.js, reports.js, index.js (товч -> функц)
```

## Хэрхэн ажилладаг вэ
- **views/** — зөвхөн HTML мөр буцаадаг цэвэр функцүүд (төлвөөс HTML үүсгэнэ).
- **actions/** — товч дарагдахад юу хийхийг тодорхойлно (API дуудаад төлөв өөрчилнө).
- **router.js** — `go(view)` өгөгдөл татаж, `render()` дэлгэц шинэчилнэ.
- Товч бүр `data-act="нэр"` атрибуттай. `main.js` нэг listener-ээр барьж, `actions/index.js` дахь `ACT[нэр]` функцийг дуудна.

## Шинэ зүйл нэмэх
- Шинэ хуудас: `views/` дотор файл нэмээд `router.js`-ийн `VIEWS`-д бүртгэнэ.
- Шинэ товч: HTML-д `data-act="xxx"` тавиад `actions/index.js`-ийн `ACT`-д `xxx` нэмнэ.

## Тайлангийн хэсэг (зөвхөн админ)
5 төрөл: **Тойм · Захиалга · Төлбөр · Өрөө · Зочид**. Хугацааг гараар эсвэл бэлэн сонголтоор (7/30/90 хоног, энэ сар) тохируулна.
- **CSV татах** — Excel-д кирилл зөв нээгдэнэ (UTF-8 BOM). Зочны нэр `=`, `+`, `-`, `@`-ээр эхэлвэл томьёо болохоос сэргийлж хамгаалсан.
- **Хэвлэх / PDF** — `window.print()`; цэс, товчийг нууж, гарчиг + хугацаа + хэн хэвлэснийг нэмнэ (`css/print.css`). Хэвлэх цонхноос "PDF болгон хадгалах"-ыг сонгоно.
- Шинэ тайлан нэмэх: `reportDefs.js`-д баганыг тодорхойлоод, `router.js`-ийн `LOADERS.reports`, `views/reports.view.js`-д нэмнэ.
