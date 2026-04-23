# Dokumentasi Akhir Alur Backend GarudaHub

## 0. Update Sesi Terbaru (2026-04-22)

Dokumentasi ini diperbarui berdasarkan pekerjaan sesi terbaru agar progres bisa dilanjutkan tanpa kehilangan konteks.

### 0.1 Yang sudah dikerjakan di sesi ini

1. Standardisasi data pemain di seed:

- `date_of_birth` sudah diformat ke `DD namabulan YYYY` pada data seed pemain.
- Field `current_club` di seed pemain sudah dihapus, dan nilai klub diseragamkan menggunakan field `club`.

2. Penambahan dan sinkronisasi data pemain:

- Data pemain tambahan berhasil dimasukkan ke `database/data/players.json`.
- Status yang tidak valid untuk constraint DB (`inactive`) sudah dinormalisasi ke status valid (`suspended`).

3. Sinkronisasi status skuad aktif timnas:

- Pemain yang dinyatakan aktif timnas diset `is_active = 1`.
- Pemain cedera diset `status = injured`.
- Pemain di luar daftar aktif diset nonaktif.

4. Verifikasi database:

- Seeder dijalankan ulang (`npm run seed`) dan berhasil.
- Verifikasi langsung ke SQLite menunjukkan data pemain terbaru sudah tersimpan.

### 0.2 Yang belum selesai / perlu dilanjutkan

1. Verifikasi endpoint via HTTP belum final:

- Server belum bisa dijalankan normal karena error kompatibilitas `uuid` (ESM vs `require`) pada middleware upload.

2. Pekerjaan lanjutan yang direkomendasikan:

- Perbaiki import `uuid` di middleware upload agar server start normal.
- Setelah server normal, lakukan verifikasi endpoint:
  - `GET /api/players`
  - `GET /api/players?tournament_id={id}`
  - endpoint lain yang terdampak data pemain.

3. Catatan operasional:

- Sumber kebenaran data pemain sesi ini adalah `database/data/players.json` + hasil `npm run seed` terakhir.

## 1. Status Akhir Implementasi

Backend untuk alur utama admin saat ini sudah siap dipakai untuk skenario:

1. Kelola master pemain.
2. Assign pemain ke turnamen.
3. Buat match per turnamen.
4. Isi lineup per match dari squad turnamen tersebut.
5. Input/update skor match.
6. Kelola prediction dan lihat leaderboard per turnamen.

Catatan penting:

- Lineup match tidak mengambil semua pemain global.
- Lineup match hanya menerima pemain yang sudah terdaftar di tournament_players untuk turnamen dari match terkait.

## 2. Struktur Relasi Data

Relasi yang dipakai:

1. players

- Menyimpan data master pemain (unik per pemain).

2. tournaments

- Menyimpan master turnamen.

3. tournament_players

- Junction table pemain ke turnamen.
- Tempat atribut yang bisa beda per turnamen, misalnya jersey_number dan status.

4. matches

- Setiap match milik satu turnamen (tournament_id).

5. match_lineups

- Junction pemain ke match.
- Pemain yang masuk harus berasal dari squad turnamen match tersebut.

6. predictions

- Prediksi skor user per match.
- Leaderboard bisa difilter per turnamen.

## 3. Alur Admin yang Direkomendasikan

### Step A - Siapkan data master pemain

1. Admin membuat/menjaga data pemain di master players.
2. Data ini bisa dari seed awal atau dari endpoint create/update player.

### Step B - Assign pemain ke turnamen

1. Admin memilih turnamen.
2. Admin assign pemain ke turnamen (tournament_players) dan isi jersey number.
3. Pada tahap ini squad turnamen terbentuk.

### Step C - Buat match untuk turnamen

1. Admin membuat match dan menentukan tournament_id.
2. Match otomatis terkait ke turnamen tersebut.

### Step D - Isi lineup untuk match tertentu

1. Admin membuka halaman detail match.
2. App mengambil daftar pemain berdasarkan squad turnamen match, bukan all players.
3. Admin memilih pemain yang tampil di match tersebut.
4. App kirim ke endpoint lineup per player.

### Step E - Tampilkan detail match dan lineup

1. Saat halaman detail match dibuka, app ambil GET lineup match.
2. Backend menampilkan starting XI dan substitutes sesuai input admin.

### Step F - Update hasil pertandingan

1. Admin update status match (misalnya finished) dan skor.
2. Data ini dipakai untuk evaluasi prediction points.

### Step G - Prediction dan leaderboard

1. User submit prediction per match.
2. Setelah match finished, poin prediction dihitung sesuai aturan.
3. Leaderboard dapat difilter by tournament_id.

## 4. Endpoint Kunci untuk Alur Admin

### Player dan squad turnamen

1. GET /api/players

- Ambil semua master pemain.

2. GET /api/players?tournament_id={id}

- Ambil pemain untuk turnamen tertentu (untuk selector lineup yang benar).

3. GET /api/players/squad/{tournament_id}

- Ambil squad turnamen per grup posisi.

4. POST /api/players/assign

- Assign pemain ke turnamen.

5. PATCH /api/players/assign

- Update jersey number assignment.

6. DELETE /api/players/assign

- Lepas pemain dari turnamen.

### Match dan lineup

1. POST /api/matches

- Buat match baru.

2. GET /api/matches/{id}

- Ambil detail match.

3. POST /api/matches/{id}/lineup

- Tambah atau update pemain pada lineup match.

4. GET /api/matches/{id}/lineup

- Ambil lineup match (starting XI dan substitutes).

5. DELETE /api/matches/{id}/lineup/{player_id}

- Hapus pemain dari lineup match.

6. PUT /api/matches/{id}

- Update status dan skor pertandingan.

### Tournament

1. GET /api/tournaments/{id}

- Detail turnamen (termasuk agregasi data yang dibutuhkan UI).

2. PATCH /api/tournaments/{id}

- Update atribut turnamen.

### Prediction

1. Endpoint prediction submit/update sesuai controller prediction.
2. GET /api/predictions/leaderboard?tournament_id={id}

- Leaderboard spesifik turnamen.

## 5. Aturan Validasi Penting

1. Pemain tidak boleh masuk lineup jika belum diassign ke turnamen match.
2. Nomor punggung unik per turnamen untuk pemain aktif.
3. Score valid hanya ketika update status finished (sesuai validasi controller).
4. Query list pemain untuk halaman lineup wajib berdasarkan tournament_id match.

## 6. Checklist Implementasi App (Frontend/Admin)

Gunakan checklist ini agar alur aman:

1. Di halaman set lineup, jangan panggil GET all players.
2. Ambil dulu tournament_id dari detail match.
3. Panggil GET /api/players?tournament_id={tournament_id}.
4. Tampilkan list pemain hasil filter tersebut.
5. Saat submit tiap pemain, kirim ke POST /api/matches/{id}/lineup.
6. Setelah submit, refresh dengan GET /api/matches/{id}/lineup.

## 7. Kesimpulan

Alur backend saat ini sudah sesuai desain relasional yang benar:

1. Master data pemain tetap bersih.
2. Hubungan pemain ke turnamen dikelola di tournament_players.
3. Hubungan pemain ke match dikelola di match_lineups.
4. Detail match hanya menampilkan pemain yang benar-benar dipilih untuk match itu.
5. Prediction berjalan di atas data match dan bisa difilter per turnamen.
