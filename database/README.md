# Database Setup

File SQL duy nhat cua project:

- [travelconnect.sql](/database/travelconnect.sql)

## Import bang 1 lenh

Neu ban da tao database local MySQL va muon import thu cong:

```powershell
mysql -u root -p < database/travelconnect.sql
```

Neu MySQL cua ban chay o cong `3307`:

```powershell
mysql -h 127.0.0.1 -P 3307 -u root -p < database/travelconnect.sql
```

## Chay bang Docker

Project da duoc cau hinh de MySQL container tu dong nap file:

- `database/travelconnect.sql`

Lenh chay:

```powershell
docker compose up --build
```

Frontend va backend trong Docker da chay o che do dev reload:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

Neu muon nap lai DB tu dau:

```powershell
docker compose down -v
docker compose up --build
```

## Ghi chu

- Cac file SQL cu trong `backend/` va `backend/migrations/` da duoc loai bo.
- Khi cap nhat schema hoac data mau, chi can sua `database/travelconnect.sql`.
