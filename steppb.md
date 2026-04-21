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

Status riil per 2026-04-19: gunakan label `DONE`, `PARTIAL`, atau `BELUM` agar notulensi tidak misleading.

### A. Database

- [DONE] Tabel tournaments dibuat
- [DONE] Tabel matches dibuat
- [DONE] Tabel players dibuat
- [DONE] Tabel predictions dibuat
- [DONE] Foreign key dan index minimum siap

### B. API Tournaments

- [DONE] GET /api/tournaments
- [DONE] POST /api/tournaments
- [DONE] GET /api/tournaments/:tournament_id/coaches (tambahan scope terbaru)
- [DONE] POST /api/tournaments/:tournament_id/coaches (tambahan scope terbaru)

### C. API Matches

- [DONE] GET /api/matches + filter
- [DONE] POST /api/matches + validasi lawan/bentrok
- [DONE] PUT /api/matches/:id + hitung result
- [DONE] GET /api/matches/:id/schedule-local

### D. API Players

- [PARTIAL] GET /api/players + filter
- [PARTIAL] POST /api/players + validasi duplikat jersey/nama
- [PARTIAL] GET /api/players/squad/:tournament_id
- [PARTIAL] POST /api/players/assign (assign pemain ke turnamen)
- [PARTIAL] DELETE /api/players/assign (drop squad)
- [PARTIAL] PATCH /api/players/assign (ubah nomor punggung)
- Catatan update: blocker urutan deklarasi route players sudah diperbaiki, lanjutkan smoke test endpoint players untuk validasi final.

### E. API Predictions

- [DONE] POST /api/predictions + JWT + validasi penuh
- [DONE] POST /api/predictions/calculate-points
- [DONE] GET /api/predictions/leaderboard

### F. Integrasi Eksternal

- [DONE] GET /api/currency/ticket-price
- [DONE] Konversi UTC ke timezone user jalan
- [DONE] WIB/WITA/WIT muncul di response

### G. Stabilitas

- [DONE] Search endpoint tidak error setelah tabel baru ditambahkan
- [PARTIAL] Semua endpoint return format JSON konsisten
- [PARTIAL] Error handling standar 400/401/404/409/500 rapi
- Catatan update: endpoint search sudah diseragamkan ke wrapper `success/data`, tinggal audit endpoint lain jika masih beda gaya response.

## 3.1) Step Revisi Prioritas (Wajib)

Kerjakan berurutan agar notulensi dan implementasi sinkron.

1. Perbaiki route players dulu (blocker)

- Rapikan urutan deklarasi `router` dan pendaftaran route di file route players.
- Validasi server bisa boot tanpa error import route.

2. Stabilkan kontrak API players

- Uji ulang GET /api/players, POST /api/players, GET /api/players/squad/:tournament_id.
- Uji endpoint assign/unassign/update jersey dengan skenario sukses + gagal.
- Tegaskan aturan create master player vs assign ke tournament di dokumentasi.

3. Rapikan konsistensi response

- Samakan format response endpoint search agar ada wrapper standar (`success`, `data`, `message` saat perlu).
- Audit endpoint lain yang masih beda gaya response.

4. Rapikan seed roster

- Pastikan players.json diperlakukan sebagai sumber data gabungan: master player + assignment turnamen.
- Dokumentasikan bahwa seeder players skip saat tournament_players sudah berisi data.
- Tambahkan prosedur refresh data demo (clear + reseed atau upsert strategy).

5. Validasi E2E dan update notulensi

- Jalankan test manual untuk semua endpoint di Test Plan.
- Update checklist status dari PARTIAL/BELUM ke DONE hanya setelah lulus uji.

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

## 9) Notulensi Update (2026-04-19) - Audit Ulang Kesesuaian

- Tanggal: 2026-04-19
- Jam: sesi audit dan koreksi notulensi
- Fokus sesi: verifikasi realisasi endpoint vs checklist, khusus domain tournament/player/match/prediction/currency
- File yang diubah:
  - steppb.md
- Temuan utama:
  - Tournament, Match, Prediction, Currency: implementasi inti sudah berjalan sesuai scope.
  - Players: fitur baru assign/unassign/update jersey sudah dibuat, route players sudah dirapikan, status tetap PARTIAL sampai smoke test lulus.
  - Stabilitas: endpoint search sudah diseragamkan, status naik jadi PARTIAL sambil audit endpoint lain.
- Kendala:
  - Notulensi sebelumnya terlalu cepat menandai semua selesai.
- Solusi sementara:
  - Checklist diubah jadi status riil DONE/PARTIAL/BELUM.
  - Dibuat Step Revisi Prioritas agar progres berikutnya terarah.
- Next action sesi berikutnya:
  1. Smoke test API players (GET/POST/squad/assign/unassign/patch jersey)
  2. Audit endpoint lain untuk konsistensi response JSON
  3. Uji E2E ulang dan naikkan status PARTIAL ke DONE setelah lolos

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
