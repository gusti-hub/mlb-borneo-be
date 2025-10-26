# MLB Dashboard Backend

Backend API untuk Sistem Informasi Website Dashboard Operasional PT. Multi Line Borneo.

## 🚀 Fitur

- **Dashboard API** - Endpoint untuk menampilkan data dashboard yang sudah dikalkulasi
- **Scheduled Calculations** - Kalkulasi otomatis setiap hari jam 2 pagi
- **Manual Trigger** - Endpoint untuk trigger kalkulasi ad-hoc dari frontend
- **Activities CRUD** - Endpoint untuk mengelola data activities
- **File Upload** - Support upload attachment untuk setiap activity
- **PostgreSQL Database** - Menggunakan database PostgreSQL

## 📋 Prerequisites

- Node.js (v16 atau lebih baru)
- PostgreSQL database (bisa menggunakan Supabase gratis)
- npm atau yarn

## 🛠️ Setup Database (Supabase)

1. Buka https://supabase.com
2. Sign up dengan email atau GitHub
3. Buat project baru
4. Catat **Database Password** yang Anda buat
5. Di dashboard Supabase, klik **Project Settings** → **Database**
6. Catat **Connection String** (format: postgresql://postgres:[password]@[host]:5432/postgres)

## 📦 Instalasi

1. Clone repository atau buka folder backend
```bash
cd mlb-dashboard-backend
```

2. Install dependencies
```bash
npm install
```

3. Copy file .env.example menjadi .env
```bash
cp .env.example .env
```

4. Edit file .env dengan kredensial database Anda
```env
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

5. Jalankan migration untuk membuat tabel
```bash
npm run migrate
```

## 🎯 Menjalankan Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di http://localhost:5000

## 📍 API Endpoints

### Dashboard
- `GET /api/dashboard/data` - Get dashboard data (dari hasil kalkulasi)
- `POST /api/dashboard/calculate` - Trigger kalkulasi manual
- `GET /api/dashboard/pic/:picId/performance` - Get performance detail PIC

### Activities
- `GET /api/activities` - Get all activities (support filter)
- `GET /api/activities/:id` - Get activity by ID
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Attachments
- `POST /api/attachments/:activityId` - Upload file untuk activity
- `GET /api/attachments/:activityId` - Get all attachments untuk activity
- `DELETE /api/attachments/:attachmentId` - Delete attachment

### Health Check
- `GET /api/health` - Check API status

## 🕐 Scheduled Jobs

Backend menggunakan node-cron untuk menjalankan kalkulasi otomatis:
- **Schedule**: Setiap hari jam 2:00 pagi
- **Fungsi**: Menghitung semua metrik dashboard dan menyimpannya ke database

## 📊 Database Schema

### Tables
- `vessels` - Data kapal
- `pics` - Data PIC (Person In Charge)
- `shippers` - Data shipper/trader
- `buyers` - Data buyer/trader
- `loading_ports` - Data loading port
- `discharging_ports` - Data discharging port
- `activities` - Master data transaksi/aktivitas
- `dashboard_results` - Hasil kalkulasi dashboard (untuk performa)
- `appointments` - Detail appointment (relasi dengan activities)
- `attachments` - File attachments (relasi dengan activities)

## 🔧 Troubleshooting

### Error koneksi database
- Pastikan kredensial database sudah benar di file .env
- Pastikan Supabase project masih aktif
- Cek connection string format: postgresql://postgres:[password]@[host]:5432/postgres

### Migration gagal
- Hapus semua tabel di database dan jalankan ulang migration
- Atau manual drop tabel yang konflik

### Port sudah digunakan
- Ubah PORT di file .env ke port lain (misal 5001)

## 📝 Catatan

- Data PIC default: Alda, Andri, Bayu (sudah diinsert otomatis saat migration)
- Folder uploads akan dibuat otomatis untuk menyimpan file attachment
- Scheduled calculation berjalan otomatis saat server start
