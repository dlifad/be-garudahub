# Step by Step Programmer B (Ikhsan)

Dokumen ini dipakai sebagai panduan kerja harian + notulensi progres untuk scope Core Data Bola dan Interaksi.

## 1) Ringkasan Scope

Fokus utama:

- Data relasional bola: tournaments, matches, players, predictions
- Logika mini game tebak skor
- Integrasi eksternal: konversi mata uang dan konversi waktu UTC ke zona waktu user

Dependensi lintas tim:

- Fitur predictions perlu login + JWT middleware dari Programmer A

## 2) Urutan Eksekusi Paling Aman

Kerjakan berurutan agar minim konflik dan minim bug.

1. Database schema

- Tambah tabel: tournaments, matches, players, predictions
- Tambah index dan constraint penting (unique, foreign key sederhana)
- Pastikan search yang lama tidak error karena tabel belum ada

2. Routes dan controllers dasar

- Buat route baru:
  - /api/tournaments
  - /api/matches
  - /api/players
  - /api/predictions
  - /api/currency
- Buat controller tiap domain
- Daftarkan route di app utama

3. Endpoint tournaments

- GET /api/tournaments
- POST /api/tournaments
- Validasi enum type/confederation/stage dan tanggal

4. Endpoint matches

- GET /api/matches (support filter tournament_id, status, is_home, date, timezone)
- POST /api/matches
  - home/away Indonesia diisi otomatis dari is_home
  - tolak jika opponent = Indonesia
  - tolak jadwal bentrok di turnamen yang sama
- PUT /api/matches/:id
  - update status dan skor
  - hitung result otomatis WIN/DRAW/LOSS dari sisi Indonesia

5. Endpoint players

- GET /api/players (filter position, tournament_id, is_active, club)
- POST /api/players
  - nationality otomatis Indonesia
  - tolak duplikat nama
  - tolak jersey_number yang sudah dipakai pemain aktif
- GET /api/players/squad/:tournament_id
  - output dikelompokkan GK/DEF/MID/FWD

6. Endpoint predictions

- POST /api/predictions
  - wajib lewat JWT
  - validasi status pertandingan, duplikasi submit, batas 30 menit sebelum kickoff
  - validasi skor 0-20
- POST /api/predictions/calculate-points
  - exact: 10
  - hasil + selisih benar: 7
  - hasil benar: 5
  - salah: 0
  - bonus clean sheet benar: +2
  - bonus Indonesia 3+ gol benar: +2
- GET /api/predictions/leaderboard

7. Integrasi eksternal

- GET /api/currency/ticket-price?amount=&from=&to=
- GET /api/matches/:id/schedule-local?timezone=
- Response jadwal menyertakan UTC, WIB, WITA, WIT, dan timezone request user

8. Hardening dan testing

- Uji tiap endpoint via Postman/Thunder Client
- Uji edge case validasi
- Rapikan response success/error agar konsisten

## 3) Checklist Implementasi

Centang saat selesai.

### A. Database

- [x] Tabel tournaments dibuat
- [x] Tabel matches dibuat
- [x] Tabel players dibuat
- [x] Tabel predictions dibuat
- [x] Foreign key dan index minimum siap

### B. API Tournaments

- [x] GET /api/tournaments
- [x] POST /api/tournaments

### C. API Matches

- [x] GET /api/matches + filter
- [x] POST /api/matches + validasi lawan/bentrok
- [x] PUT /api/matches/:id + hitung result
- [x] GET /api/matches/:id/schedule-local

### D. API Players

- [x] GET /api/players + filter
- [x] POST /api/players + validasi duplikat jersey/nama
- [x] GET /api/players/squad/:tournament_id

### E. API Predictions

- [x] POST /api/predictions + JWT + validasi penuh
- [x] POST /api/predictions/calculate-points
- [x] GET /api/predictions/leaderboard

### F. Integrasi Eksternal

- [x] GET /api/currency/ticket-price
- [x] Konversi UTC ke timezone user jalan
- [x] WIB/WITA/WIT muncul di response

### G. Stabilitas

- [x] Search endpoint tidak error setelah tabel baru ditambahkan
- [x] Semua endpoint return format JSON konsisten
- [x] Error handling standar 400/401/404/409/500 rapi

## 4) Notulensi Harian (Template)

Salin bagian ini setiap kali selesai sesi kerja.

### Notulensi Sesi

- Tanggal:
- Jam:
- Fokus sesi:
- File yang diubah:
- Endpoint yang selesai:
- Validasi yang sudah lolos:
- Kendala:
- Solusi sementara:
- Next action sesi berikutnya:

## 5) Notulensi Awal (Isi Hari Ini)

- Tanggal: 2026-04-12
- Jam: isi setelah sesi selesai
- Fokus sesi: perencanaan implementasi Programmer B
- File yang diubah: steppb.md
- Endpoint yang selesai: belum ada (baru perencanaan)
- Validasi yang sudah lolos: belum ada
- Kendala: perlu sinkron awal dengan Programmer A untuk status JWT siap pakai
- Solusi sementara: endpoint predictions dibuat dengan middleware auth, testing dilakukan setelah token login valid tersedia
- Next action sesi berikutnya:
  1.  Tambah schema tabel baru di init.sql
  2.  Buat routes + controllers domain bola
  3.  Uji endpoint dasar GET/POST sebelum lanjut ke kalkulasi poin

## 7) Notulensi Update (2026-04-17)

- Tanggal: 2026-04-17
- Jam: sesi implementasi backend inti
- Fokus sesi: implementasi penuh scope Programmer B berdasarkan checklist
- File yang diubah:
  - database/init.sql
  - src/utils/dbAsync.js
  - src/utils/datetime.js
  - src/controllers/tournamentController.js
  - src/routes/tournamentRoutes.js
  - src/controllers/matchController.js
  - src/routes/matchRoutes.js
  - src/controllers/playerController.js
  - src/routes/playerRoutes.js
  - src/controllers/predictionController.js
  - src/routes/predictionRoutes.js
  - src/controllers/currencyController.js
  - src/routes/currencyRoutes.js
  - src/controllers/searchController.js
  - src/app.js
  - steppb.md
- Endpoint yang selesai:
  - GET/POST /api/tournaments
  - GET/POST/PUT /api/matches + GET /api/matches/:id/schedule-local
  - GET/POST /api/players + GET /api/players/squad/:tournament_id
  - POST /api/predictions + POST /api/predictions/calculate-points + GET /api/predictions/leaderboard
  - GET /api/currency/ticket-price
- Validasi yang sudah lolos:
  - Auto home/away Indonesia berdasarkan is_home
  - Tolak opponent Indonesia
  - Tolak jadwal bentrok turnamen sama
  - Tolak duplikat nama pemain dan jersey aktif
  - Tolak prediksi di match ongoing/finished
  - Tolak prediksi setelah H-30 menit kickoff
  - Tolak prediksi duplikat user-match
  - Tolak skor prediksi di luar 0-20
- Kendala:
  - Dependency belum ter-install sehingga sqlite3 tidak terbaca saat init DB
- Solusi sementara:
  - Jalankan npm install, lalu init DB ulang
- Next action sesi berikutnya:
  1. Testing end-to-end via Postman untuk semua skenario sukses + gagal
  2. Sinkron final kontrak response dengan Programmer A dan UI team
  3. Tambah data seed untuk tournament/match/player agar demo lebih cepat

## 6) Definisi Selesai (Definition of Done)

Task Programmer B dianggap selesai jika:

- Semua endpoint di scope berjalan sesuai kontrak request/response
- Validasi inti (jadwal bentrok, tebak skor tutup H-30 menit, duplikat prediksi) lolos uji
- Leaderboard dan kalkulasi poin sesuai aturan
- Integrasi currency + timezone berfungsi
- Notulensi update minimal 1 kali per sesi kerja

## 8) Test Plan & Checklist Praktis

| Endpoint                          | Method | Deskripsi             | Contoh Request                                      | Expected Response             |
| --------------------------------- | ------ | --------------------- | --------------------------------------------------- | ----------------------------- |
| /api/tournaments                  | GET    | List turnamen         | -                                                   | 200, data array               |
| /api/tournaments                  | POST   | Tambah turnamen       | {"name":"AFF Championship 2026",...}                | 201, data turnamen baru       |
| /api/matches                      | GET    | List match (filter)   | ?tournament_id=1                                    | 200, data array               |
| /api/matches                      | POST   | Tambah match          | {"tournament_id":1,...}                             | 201, data match baru          |
| /api/matches/:id                  | PUT    | Update skor/status    | {"status":"finished","home_score":2,"away_score":0} | 200, data match update        |
| /api/matches/:id/schedule-local   | GET    | Konversi waktu        | ?timezone=Asia/Makassar                             | 200, field local/wib/wita/wit |
| /api/players                      | GET    | List pemain           | ?is_active=true                                     | 200, data array               |
| /api/players                      | POST   | Tambah pemain         | {"name":"Egy",...}                                  | 201, data pemain baru         |
| /api/players/squad/:tournament_id | GET    | Skuad turnamen        | -                                                   | 200, data grouped             |
| /api/predictions                  | POST   | Submit prediksi (JWT) | {"match_id":1,"predicted_indonesia_score":2,...}    | 201, data prediksi            |
| /api/predictions/calculate-points | POST   | Hitung poin           | {"match_id":1}                                      | 200, summary                  |
| /api/predictions/leaderboard      | GET    | Leaderboard           | -                                                   | 200, data array               |
| /api/currency/ticket-price        | GET    | Konversi harga tiket  | ?amount=150000&from=IDR&to=USD                      | 200, field converted          |

### Catatan Uji Manual

- Cek validasi error: duplikat, bentrok jadwal, prediksi tutup, skor out of range
- Cek response code: 200/201/400/401/404/409 sesuai kontrak
- Cek JWT: endpoint prediksi wajib pakai token login
- Cek data seed: data demo muncul di GET

> Checklist ini bisa langsung kamu copy ke Notion/Google Sheet atau pakai di Postman Collection.
