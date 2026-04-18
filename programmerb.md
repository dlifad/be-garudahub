bagiann yang harus saya kerjakan
Ikhsan (Programmer B): Fokus Core Data Bola & Interaksi

Ikhsan akan memegang kendali atas "nyawa" utama aplikasi GarudaHub, yaitu segala hal yang berkaitan dengan sepak bola.

Tanggung Jawab Utama: Data Relasional Bola (Jadwal, Turnamen, Pemain), Logika Mini Game (Tebak Skor), dan Integrasi Eksternal (Konversi Mata Uang & Waktu UTC).

Fokus: Memastikan jadwal pertandingan akurat, data pemain lengkap, dan logika tebak skor berjalan tanpa cela.

Ingat Titik Temu Penting: Ikhsan (Programmer B) sangat bergantung pada sistem Login dan Middleware JWT yang dibuat oleh Fadli (Programmer A) untuk fitur Tebak Skor. Jadi, Fadli harus memprioritaskan fitur Login di awal pengerjaan.

Programmer B (Fokus: Core Data Bola & Interaksi)
Tabel yang diurus: tournaments, matches, players, dan predictions.

Tugas Utama (API):

Data Relasional Bola: API untuk memanggil jadwal (matches), memfilter berdasarkan turnamen (tournaments), dan menampilkan daftar skuad (players).

Logika Mini Game: API predictions untuk tebak skor. (B bertugas membuat validasi, misalnya menolak tebakan jika status pertandingan sudah "Dimulai").

Integrasi Eksternal: Fungsi untuk menembak API publik konversi mata uang (untuk harga tiket) dan menangani zona waktu UTC.

API Documentation - Timnas Indonesia Senior
Oke, lebih spesifik sekarang! Ini dokumentasi yang sudah disesuaikan khusus untuk konteks Timnas Indonesia Senior.

🏆 TOURNAMENTS
Turnamen yang diikuti Timnas Indonesia Senior
GET /api/tournaments
jsonResponse 200:
{
"success": true,
"data": [
{
"id": 1,
"name": "AFF Championship 2024",
"type": "regional", // "regional" | "continental" | "world"
"confederation": "AFF", // AFF | AFC | FIFA
"stage": "Group Stage", // Group Stage | Knockout | Final
"indonesia_group": "A", // Grup yang diisi Indonesia
"start_date": "2024-12-01",
"end_date": "2024-12-31",
"host_country": "Thailand",
"logo_url": "https://...",
"is_active": true
}
]
}
Contoh turnamen yang relevan:

AFF Championship (Piala AFF)
AFC Asian Cup Qualification
FIFA World Cup Qualification (Ronde 3)
Friendly Match (Uji Coba)
ASEAN Games (cabang sepakbola)

POST /api/tournaments
jsonRequest Body:
{
"name": "FIFA World Cup Qualification 2026 - Ronde 3",
"type": "world",
"confederation": "AFC",
"stage": "Group Stage",
"indonesia_group": "C",
"start_date": "2025-03-01",
"end_date": "2025-11-30",
"host_country": "Various",
"logo_url": "https://..."
}

⚽ MATCHES
Pertandingan Timnas Indonesia di setiap turnamen

Catatan penting: Setiap match selalu melibatkan Indonesia, baik sebagai home maupun away.

GET /api/matches
Query Params:
ParamTypeKeterangantournament_idintFilter by turnamenstatusstringscheduled / ongoing / finishedis_homebooleantrue = Indonesia main kandangdatestringFormat: YYYY-MM-DDtimezonestringDefault: UTC, contoh: Asia/Jakarta
jsonResponse 200:
{
"success": true,
"data": [
{
"id": 1,
"tournament_id": 1,
"tournament_name": "AFF Championship 2024",
"matchday": 1,
"round": "Group Stage",
"is_home": true,
"home_team": "Indonesia",
"away_team": "Vietnam",
"home_team_flag": "🇮🇩",
"away_team_flag": "🇻🇳",
"match_date_utc": "2024-12-15T13:00:00Z",
"match_date_local": "2024-12-15T20:00:00+07:00",
"venue": "Stadion Utama GBK, Jakarta",
"status": "finished",
"home_score": 3,
"away_score": 1,
"indonesia_score": 3,
"opponent_score": 1,
"result": "WIN", // "WIN" | "DRAW" | "LOSS"
"ticket_price_idr": 150000
}
]
}
POST /api/matches
jsonRequest Body:
{
"tournament_id": 1,
"matchday": 1,
"round": "Group Stage",
"is_home": true,
"opponent": "Vietnam",
"opponent_flag": "🇻🇳",
"match_date_utc": "2024-12-15T13:00:00Z",
"venue": "Stadion Utama GBK, Jakarta", // nanti di arahkan ke db stadion karena ada db stadion
"ticket_price_idr": 150000 // nanti di arahkan ke db tiket karena ada db tiket
}
Validasi:
✅ home_team selalu otomatis = "Indonesia" jika is_home: true
✅ away_team selalu otomatis = "Indonesia" jika is_home: false
❌ Tolak jika opponent = "Indonesia" (tidak bisa lawan diri sendiri)
❌ Tolak jika match_date tumpang tindih dengan match lain di tournament yang sama
PUT /api/matches/:id — Update Skor & Status
jsonRequest Body:
{
"status": "finished",
"home_score": 3,
"away_score": 1
}

// Backend otomatis hitung:
// result = "WIN" jika indonesia_score > opponent_score
// result = "DRAW" jika sama
// result = "LOSS" jika indonesia_score < opponent_score

👤 PLAYERS
Khusus skuad Timnas Indonesia Senior
GET /api/players
Query Params:
ParamTypeKeteranganpositionstringGK / DEF / MID / FWDtournament_idintSkuad yang dipanggil untuk turnamen tertentuis_activebooleanPemain aktif di timnas saat iniclubstringFilter by klub saat ini
jsonResponse 200:
{
"success": true,
"data": [
{
"id": 1,
"name": "Maarten Paes",
"nickname": "Maarten",
"position": "GK",
"jersey_number": 1,
"date_of_birth": "1998-05-14",
"nationality": "Indonesia",
"is_naturalized": true,
"current_club": "FC Dallas",
"club_country": "USA",
"caps": 18, // jumlah penampilan di timnas
"goals": 0,
"photo_url": "https://...",
"is_active": true,
"status": "active" // "active" | "injured" | "suspended"
},
{
"id": 2,
"name": "Jay Idzes",
"nickname": "Jay",
"position": "DEF",
"jersey_number": 5,
"date_of_birth": "2000-06-21",
"nationality": "Indonesia",
"is_naturalized": true,
"current_club": "Venezia FC",
"club_country": "Italy",
"caps": 22,
"goals": 2,
"photo_url": "https://...",
"is_active": true,
"status": "active"
}
]
}
POST /api/players — Tambah Pemain ke Skuad
jsonRequest Body:
{
"name": "Egy Maulana Vikri",
"nickname": "Egy",
"position": "MID",
"jersey_number": 10,
"date_of_birth": "2000-07-07",
"is_naturalized": false,
"current_club": "Lechia Gdansk",
"club_country": "Poland",
"caps": 45,
"goals": 8,
"photo_url": "https://...",
"is_active": true
}
Validasi:
❌ Tolak jika jersey_number sudah dipakai pemain aktif lain
❌ Tolak jika nama sudah ada (cek duplikat)
✅ nationality otomatis = "Indonesia"
GET /api/players/squad/:tournament_id
Ambil skuad yang dipanggil untuk turnamen tertentu.
jsonResponse 200:
{
"success": true,
"tournament": "AFF Championship 2024",
"head_coach": "Shin Tae-yong",
"total_players": 23,
"squad": {
"GK": [...], // 3 pemain
"DEF": [...], // 6-7 pemain
"MID": [...], // 6-7 pemain
"FWD": [...], // 4-5 pemain
}
}

🎯 PREDICTIONS
Mini game tebak skor pertandingan Timnas Indonesia
POST /api/predictions — Submit Prediksi
jsonRequest Body:
{
"user_id": 42,
"match_id": 7,
"predicted_indonesia_score": 2,
"predicted_opponent_score": 0
}
Validasi lengkap:
❌ Status match "ongoing" / "finished"
→ 400: "Prediksi sudah ditutup, pertandingan sedang/sudah berlangsung"

❌ User sudah pernah submit prediksi untuk match ini
→ 409: "Kamu sudah mengirim prediksi untuk pertandingan ini"

❌ Prediksi dikirim < 30 menit sebelum kickoff
→ 400: "Prediksi ditutup 30 menit sebelum pertandingan"

❌ Skor prediksi < 0 atau > 20
→ 400: "Skor prediksi tidak valid"

❌ match_id bukan pertandingan Timnas Indonesia
→ 404: "Pertandingan tidak ditemukan"
jsonResponse 201:
{
"success": true,
"message": "Prediksi kamu tersimpan! 🇮🇩",
"data": {
"id": 99,
"user_id": 42,
"match_id": 7,
"match_info": "Indonesia vs Vietnam - AFF 2024",
"predicted_indonesia_score": 2,
"predicted_opponent_score": 0,
"prediction_summary": "Indonesia Menang 2-0",
"submitted_at": "2024-12-14T10:00:00Z",
"deadline": "2024-12-15T12:30:00Z",
"points_earned": null
}
}
POST /api/predictions/calculate-points
Hitung poin setelah match selesai.
jsonRequest Body:
{ "match_id": 7 }
Sistem Poin:
🥇 Tebak skor EXACT (2-0 vs 2-0) → 10 poin
🥈 Tebak hasil benar + selisih gol benar → 7 poin
🥉 Tebak hasil benar (menang/draw/kalah) → 5 poin
❌ Salah semua → 0 poin

Bonus:
⭐ Tebak Indonesia clean sheet (0 kebobolan) → +2 poin
⭐ Tebak Indonesia cetak 3+ gol (benar) → +2 poin
GET /api/predictions/leaderboard
Papan skor user dengan poin terbanyak.
jsonResponse 200:
{
"success": true,
"data": [
{
"rank": 1,
"user_id": 42,
"username": "GarудaFan99",
"total_points": 87,
"total_predictions": 12,
"correct_results": 9,
"exact_scores": 3
}
]
}

🌐 INTEGRASI EKSTERNAL
GET /api/currency/ticket-price
Konversi harga tiket dari IDR ke mata uang lain (untuk fans luar negeri).
jsonQuery: ?amount=150000&from=IDR&to=USD

Response:
{
"success": true,
"from": "IDR",
"to": "USD",
"amount": 150000,
"converted": 9.20,
"rate": 16300,
"fetched_at": "2026-04-12T10:00:00Z"
}
GET /api/matches/:id/schedule-local
Konversi jadwal match ke timezone user (penting untuk fans di luar WIB).
jsonQuery: ?timezone=Asia/Makassar

Response:
{
"success": true,
"match": "Indonesia vs Vietnam",
"utc": "2024-12-15T13:00:00Z",
"wib": "2024-12-15T20:00:00+07:00",
"wita": "2024-12-15T21:00:00+08:00",
"wit": "2024-12-15T22:00:00+09:00",
"requested_timezone": "Asia/Makassar",
"local": "2024-12-15T21:00:00+08:00"
}

💡 Langsung sediakan WIB/WITA/WIT karena mayoritas user adalah fans Indonesia.
