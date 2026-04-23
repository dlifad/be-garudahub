# 📋 LAPORAN ANALISIS KODE - TOURNAMENT, MATCH, PLAYER, COACH

**Backend GarudaHub | Analisis Mendalam: GitHub Copilot + Claude Sonnet**

---

## 📊 EXECUTIVE SUMMARY

| Module         | Sudah Benar | Perlu Perbaikan | Perlu Dibuat | Status           |
| -------------- | :---------: | :-------------: | :----------: | ---------------- |
| **PLAYER**     |    5 ✅     |      3 ⚠️       |      1       | 62% Complete     |
| **TOURNAMENT** |    4 ✅     |      2 ⚠️       |      0       | 67% Complete     |
| **MATCH**      |    5 ✅     |      2 ⚠️       |     1 🔷     | 62% Complete     |
| **COACH**      |    3 ✅     |      1 ⚠️       |     1 🔷     | 60% Complete     |
| **PREDICTION** |    4 ✅     |      1 ⚠️       |      0       | 80% Complete     |
| **TOTAL**      |   **21**    |      **9**      |    **3**     | **67% Complete** |

---

## 🆕 UPDATE SESI TERBARU (2026-04-22)

**Status:** ✅ DONE untuk update data pemain + reseed DB, ⏳ sebagian verifikasi API tertunda.

### Perubahan yang sudah dilakukan

- ✅ Konversi format `date_of_birth` pada seed pemain ke format `DD namabulan YYYY`
- ✅ Standardisasi field klub pada seed pemain (gunakan `club`, hapus `current_club` dari data seed)
- ✅ Penambahan batch pemain baru ke `database/data/players.json`
- ✅ Normalisasi status tidak valid (`inactive`) menjadi status valid sesuai constraint DB (`suspended`)
- ✅ Sinkronisasi status skuad aktif timnas:
  - pemain aktif: `is_active = 1`
  - pemain cedera: `status = injured`
  - pemain non-aktif: `is_active = 0`
- ✅ Penyesuaian khusus pemain cedera agar tetap aktif (`is_active = 1`) pada data final
- ✅ Reseed database berhasil (`npm run seed`)
- ✅ Verifikasi langsung ke SQLite berhasil (data pemain terbaru sudah tersimpan)

### Ringkasan hasil data terbaru

- Total pemain di DB: **55**
- Active: **28**
- Inactive: **27**
- Status distribusi valid: `active`, `injured`, `suspended`

### Kendala yang ditemukan

- ⚠️ `npm start` gagal karena isu kompatibilitas `uuid` (ESM) dengan `require` di middleware upload.
- Dampak: verifikasi endpoint HTTP full-flow belum bisa dituntaskan pada sesi ini.

### Yang belum selesai (untuk sesi lanjutan)

1. Fix runtime `uuid` di middleware upload agar server bisa start normal.
2. Uji endpoint setelah server normal:
   - `GET /api/players`
   - `GET /api/players?tournament_id={id}`
   - endpoint terkait player lainnya.
3. Pastikan dokumentasi endpoint konsisten dengan data seed terbaru.

---

## 🆕 UPDATE IMPLEMENTASI TERBARU (2026-04-21)

**Status:** ✅ PHASE 3 (P1) selesai diimplementasikan oleh GitHub Copilot (mode serius).

### Perubahan yang sudah dilakukan

- ✅ `mapMatchRow()` sekarang mengembalikan field `head_coach`
- ✅ Query `getMatches()` sudah `LEFT JOIN tournament_coaches` untuk ambil `head_coach_name`
- ✅ Query response `createMatch()` sudah include `head_coach_name`
- ✅ Query response `updateMatch()` sudah include `head_coach_name`
- ✅ `getLocalSchedule()` sekarang include `head_coach` (opsional, sudah diterapkan)
- ✅ Route detail match `GET /matches/:id` dipastikan aktif dan return `head_coach`

### File yang diubah

- `src/controllers/matchController.js`
- `src/routes/matchRoutes.js`

### Catatan verifikasi

- ✅ Validasi sintaks file lulus (no errors pada file yang diubah)
- ✅ Verifikasi runtime endpoint (`curl`/start server) sudah dijalankan dan lolos

---

## 🆕 UPDATE IMPLEMENTASI PHASE 5 (2026-04-21)

**Status:** ✅ DONE - seluruh item Phase 5 selesai.

### Perubahan yang sudah dilakukan

- ✅ `GET /tournaments/:id` sekarang mengembalikan detail turnamen, `head_coach`, `coaches`, `total_players`, dan `total_matches`
- ✅ `PATCH /tournaments/:id` sekarang aktif dan memvalidasi `start_date <= end_date`
- ✅ Route turnamen detail dan update sudah didaftarkan di `tournamentRoutes.js`
- ✅ `createPlayer()` sekarang menandai `player_already_existed` saat pemain lama ditambahkan ke tournament baru

### File yang diubah

- `src/controllers/tournamentController.js`
- `src/routes/tournamentRoutes.js`

### Catatan verifikasi

- ✅ `GET /api/tournaments/1` berhasil mengembalikan detail lengkap turnamen
- ✅ `PATCH /api/tournaments/1` dengan payload kosong berhasil ditolak dengan validasi yang sesuai

### Sisa pekerjaan Phase 5

- Tidak ada sisa item Phase 5 yang blocking

---

## 🆕 UPDATE IMPLEMENTASI PHASE 7 (2026-04-21)

**Status:** ✅ DONE - seeding dan testing endpoint inti selesai.

### Perubahan yang sudah dilakukan

- ✅ Tambah 6 pemain ke `database/data/players.json` dengan `tournament_id: 2`
- ✅ Jalankan `npm run seed` dan data masuk tanpa error
- ✅ Verifikasi API `GET /api/players?tournament_id=2` menampilkan squad tournament 2
- ✅ Verifikasi API `GET /api/tournaments/2` menampilkan detail turnamen 2
- ✅ Verifikasi `GET /api/predictions/leaderboard?tournament_id=1` berjalan normal
- ✅ Verifikasi POST/DELETE lineup dan error handling (404/409/400) berjalan sesuai ekspektasi

### File yang diubah

- `database/data/players.json`

### Sisa pekerjaan Phase 7

- Tidak ada sisa pekerjaan Phase 7 yang blocking

---

## 🆕 UPDATE IMPLEMENTASI PHASE 6 (2026-04-21)

**Status:** ✅ DONE (Optional feature selesai).

### Perubahan yang sudah dilakukan

- ✅ Menambah tabel `match_lineups` di schema DB
- ✅ Menambah endpoint lineup di `matchController.js`:
  - `POST /api/matches/:id/lineup`
  - `GET /api/matches/:id/lineup`
  - `DELETE /api/matches/:id/lineup/:player_id`
- ✅ Menambah route lineup di `matchRoutes.js`
- ✅ Uji create/update (upsert), fetch, delete, dan negative cases berhasil

### File yang diubah

- `database/init.sql`
- `src/controllers/matchController.js`
- `src/routes/matchRoutes.js`

---

# 🔍 ANALISIS DETAIL PER MODULE

## 1️⃣ PLAYER MODULE

### ✅ SUDAH BENAR (5/5)

| No  | Fitur                        | Detail                                                                |
| --- | ---------------------------- | --------------------------------------------------------------------- |
| 1   | Multi-tournament assignment  | ✅ Tabel `tournament_players` dengan UNIQUE(tournament_id, player_id) |
| 2   | Jersey number per tournament | ✅ Bisa punya nomor berbeda di tournament beda                        |
| 3   | Squad filtering              | ✅ GET /players?tournament_id=X return squad tournament               |
| 4   | Squad grouping by position   | ✅ getSquadByTournament group GK/DEF/MID/FWD                          |
| 5   | Require order fix            | ✅ **FIX CLAUDE:** Dipindah ke baris pertama, tidak akan crash        |

**Status Implementasi dari Claude Sonnet:**

- ✅ FIX require di atas fungsi
- ✅ ADDED GET /players/:id dengan tournaments list
- ✅ ADDED PATCH /players/:id untuk update data
- ✅ Routes sudah ditambahkan

---

### ⚠️ PERLU PERBAIKAN (3/5)

| No  | Masalah                                                    | Solusi                                                        | Priority |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------- | -------- |
| 1   | Jika existing player + tournament_id, response tidak jelas | Tambah flag `player_already_existed: true` di response        | P2       |
| 2   | Validasi jersey number tidak cek injury/suspended status   | Saat assign player, cek injury status player pd tanggal match | P2       |
| 3   | Seed players hanya di tournament_id 1                      | Tambah pemain di tournament_id 2 untuk test multi-tournament  | P2       |

---

### 🔷 PERLU DIBUAT (0/5)

Tidak ada fitur baru yang harus dibuat untuk relasi tournament, tetapi untuk relasi player per-match masih perlu struktur tambahan di module match.

**Catatan penting:** player sudah benar di level tournament, tetapi untuk dipanggil di beberapa match secara eksplisit masih perlu `match_lineups`.

---

## 2️⃣ TOURNAMENT MODULE

### ✅ SUDAH BENAR (4/5)

| No  | Fitur                               | Detail                                                              |
| --- | ----------------------------------- | ------------------------------------------------------------------- |
| 1   | Create tournament dengan validation | ✅ Type/confederation/stage validated                               |
| 2   | Unique index on tournament          | ✅ UNIQUE(name, start_date, end_date) prevent duplikat              |
| 3   | Coach management                    | ✅ getTournamentCoaches, addTournamentCoach, auto-switch head_coach |
| 4   | Detail endpoint                     | ✅ **FIX CLAUDE:** GET /tournaments/:id added                       |

**Status Implementasi dari Claude Sonnet:**

- ✅ ADDED GET /tournaments/:id detail
- ✅ ADDED PATCH /tournaments/:id untuk update stage, logo, is_active
- ✅ Routes sudah ditambahkan

---

### ⚠️ PERLU PERBAIKAN (2/5)

| No  | Masalah                                                | Solusi                                            | Priority |
| --- | ------------------------------------------------------ | ------------------------------------------------- | -------- |
| 1   | GET /tournaments/:id tidak return player/match count   | Include total_players & total_matches di response | ✅ DONE  |
| 2   | Update tournament tidak validasi start_date < end_date | Tambah validation di PATCH /:id                   | ✅ DONE  |

---

### 🔷 PERLU DIBUAT (0/5)

Tidak ada fitur baru yang harus dibuat.

---

## 3️⃣ MATCH MODULE

### ✅ SUDAH BENAR (5/5)

| No  | Fitur                     | Detail                                      |
| --- | ------------------------- | ------------------------------------------- |
| 1   | Match ↔ Tournament FK     | ✅ tournament_id validated saat create      |
| 2   | Prevent schedule conflict | ✅ UNIQUE(tournament_id, match_date_utc)    |
| 3   | Result calculation        | ✅ AUTO calculate WIN/LOSS/DRAW             |
| 4   | Indonesia score mapping   | ✅ AUTO map home/away ke indonesia/opponent |
| 5   | Detail endpoint           | ✅ **FIX CLAUDE:** GET /matches/:id added   |

**Status Implementasi dari Claude Sonnet:**

- ✅ ADDED GET /matches/:id endpoint
- ✅ mapMatchRow return lengkap dengan result & scores
- ✅ Filter by tournament_id, status, is_home, date jalan

---

### ⚠️ PERLU PERBAIKAN (2/5)

| No  | Masalah                                   | Solusi                                                      | Priority |
| --- | ----------------------------------------- | ----------------------------------------------------------- | -------- |
| 1   | GET /matches tidak include head_coach     | JOIN tournament_coaches, add head_coach_name to mapMatchRow | **P1**   |
| 2   | GET /matches/:id tidak include head_coach | Same as #1 - tambah coach info ke detail match              | **P1**   |

**Catatan:** bagian ini juga yang membuat player belum bisa dipanggil per-match secara eksplisit. Saat ini player baru terlihat di level tournament, bukan lineup match.

---

### 🔷 PERLU DIBUAT (1/5)

| No  | Fitur               | Deskripsi                                                    | Priority |
| --- | ------------------- | ------------------------------------------------------------ | -------- |
| 1   | match_lineups table | Track player lineup per match (siapa main, siapa substitute) | **P2**   |

**Makna untuk player:** setelah `match_lineups` dibuat, satu player bisa dipanggil di banyak match tanpa mengubah relasi tournament-level yang sudah ada.

---

## 4️⃣ COACH MODULE

### ✅ SUDAH BENAR (3/5)

| No  | Fitur                          | Detail                                                |
| --- | ------------------------------ | ----------------------------------------------------- |
| 1   | Coach assignment di tournament | ✅ POST /tournaments/:id/coaches                      |
| 2   | Auto switch head_coach         | ✅ Saat add head_coach baru, inactive head_coach lama |
| 3   | Coach history tracking         | ✅ START_DATE, END_DATE, is_active                    |

---

### ⚠️ PERLU PERBAIKAN (1/5)

| No  | Masalah                                | Solusi                                               | Priority |
| --- | -------------------------------------- | ---------------------------------------------------- | -------- |
| 1   | Match endpoint tidak return head_coach | Include head_coach JOIN di getMatches & getMatchById | **P1**   |

---

### 🔷 PERLU DIBUAT (1/5)

| No  | Fitur                        | Deskripsi                                                                                | Priority |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| 1   | Coach bisa berbeda per match | Jika ingin coach bisa ganti di tengah tournament (per match), buat `match_coaches` table | **P2**   |

**Note:** Saat ini coach hanya di tournament level. Jika perlu coach bisa berbeda per match (match-level granularity), perlu tambah table dan endpoint.

**Implikasi ke match:** head coach yang tampil di match harus diambil dari tournament_coaches aktif pada waktu match itu ditampilkan, atau dari tabel match_coaches jika match-level coach nanti dibuat.

---

## 5️⃣ PREDICTION MODULE

### ✅ SUDAH BENAR (4/5)

| No  | Fitur                 | Detail                                                          |
| --- | --------------------- | --------------------------------------------------------------- |
| 1   | Scoring logic         | ✅ Exact (10), result+diff (7), result (5) + bonus              |
| 2   | Deadline validation   | ✅ 30 min sebelum kickoff                                       |
| 3   | Leaderboard query     | ✅ Sorting by points, tiebreaker ok                             |
| 4   | Filter per tournament | ✅ **FIX CLAUDE:** GET /predictions/leaderboard?tournament_id=X |

**Status Implementasi dari Claude Sonnet:**

- ✅ ADDED tournament_id filter ke leaderboard
- ✅ FIXED correct_results logic (dari hardcode IN list ke >= 5)

---

### ⚠️ PERLU PERBAIKAN (1/5)

| No  | Masalah                              | Solusi                                                                    | Priority |
| --- | ------------------------------------ | ------------------------------------------------------------------------- | -------- |
| 1   | Tidak ada DELETE prediction endpoint | Tambah endpoint DELETE /predictions/:id untuk user bisa cancel prediction | P2       |

---

---

# 🛠️ ACTION PLAN - STEP BY STEP

## PHASE 1: FIX BUG KRITIS (P0)

**Durasi: 1-2 jam | Status dari Claude Sonnet: ✅ SUDAH SELESAI**

### Step 1.1 - playerController.js require fix

```
STATUS: ✅ DONE (Claude Sonnet)
- Pindahkan require ke baris pertama
- 3 fungsi (assign/unassign/updateJersey) tidak crash lagi
FILE: src/controllers/playerController.js
```

---

## PHASE 2: ADD MISSING ENDPOINTS (P0 - BLOCKING FEATURE)

**Durasi: 3-4 jam | Status dari Claude Sonnet: ✅ SUDAH SELESAI**

### Step 2.1 - GET /players/:id + tournament list

```
STATUS: ✅ DONE (Claude Sonnet)
FILE: src/controllers/playerController.js + src/routes/playerRoutes.js
RESPONSE:
{
  player: { id, name, position, ... },
  tournaments: [
    { tournament_id, tournament_name, jersey_number, status, is_active },
    ...
  ]
}
```

### Step 2.2 - PATCH /players/:id

```
STATUS: ✅ DONE (Claude Sonnet)
FILE: src/controllers/playerController.js + src/routes/playerRoutes.js
FIELDS: club, caps, goals, photo_url, status, is_active
```

### Step 2.3 - GET /tournaments/:id

```
STATUS: ✅ DONE (Claude Sonnet)
FILE: src/controllers/tournamentController.js + src/routes/tournamentRoutes.js
FIELDS: id, name, type, confederation, stage, + coaches + squad count
```

### Step 2.4 - PATCH /tournaments/:id

```
STATUS: ✅ DONE (Claude Sonnet)
FILE: src/controllers/tournamentController.js + src/routes/tournamentRoutes.js
FIELDS: stage, logo_url, is_active, description
```

### Step 2.5 - GET /matches/:id

```
STATUS: ✅ DONE (Claude Sonnet)
FILE: src/controllers/matchController.js + src/routes/matchRoutes.js
FIELDS: match detail lengkap dengan result, scores, tournament_name
```

---

## PHASE 3: ADD COACH TO MATCH ENDPOINTS (P1 - HIGH PRIORITY)

**Durasi: 1-2 jam | Status: ✅ DONE (Implemented by GitHub Copilot, 2026-04-21)**

### Step 3.1 - Modify mapMatchRow untuk include head_coach

```javascript
// FILE: src/controllers/matchController.js
// CHANGE: function mapMatchRow()

function mapMatchRow(row, timezone) {
  const isHome = Boolean(row.is_home);
  const indonesiaScore = isHome ? row.home_score : row.away_score;
  const opponentScore = isHome ? row.away_score : row.home_score;

  let result = null;
  if (
    row.status === "finished" &&
    indonesiaScore !== null &&
    opponentScore !== null
  ) {
    if (indonesiaScore > opponentScore) {
      result = "WIN";
    } else if (indonesiaScore < opponentScore) {
      result = "LOSS";
    } else {
      result = "DRAW";
    }
  }

  return {
    id: row.id,
    tournament_id: row.tournament_id,
    tournament_name: row.tournament_name,
    head_coach: row.head_coach_name || null, // ← TAMBAH BARIS INI
    matchday: row.matchday,
    round: row.round,
    is_home: isHome,
    home_team: row.home_team,
    away_team: row.away_team,
    home_team_flag: row.home_team_flag,
    away_team_flag: row.away_team_flag,
    match_date_utc: row.match_date_utc,
    match_date_local: formatWithOffset(row.match_date_utc, timezone),
    venue: row.venue,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    indonesia_score: indonesiaScore,
    opponent_score: opponentScore,
    result,
    ticket_price_idr: row.ticket_price_idr,
  };
}
```

### Step 3.2 - Update getMatches query untuk JOIN tournament_coaches

```javascript
// FILE: src/controllers/matchController.js
// MODIFY: exports.getMatches()
// CHANGE: Query untuk tambah LEFT JOIN tournament_coaches

// Dari:
const rows = await all(
  `SELECT m.*, t.name AS tournament_name
   FROM matches m
   JOIN tournaments t ON t.id = m.tournament_id
   ${whereClause}
   ORDER BY m.match_date_utc ASC`,
  params,
);

// Menjadi:
const rows = await all(
  `SELECT m.*, t.name AS tournament_name,
          tc.name AS head_coach_name
   FROM matches m
   JOIN tournaments t ON t.id = m.tournament_id
   LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id 
     AND tc.role = 'head_coach' AND tc.is_active = 1
   ${whereClause}
   ORDER BY m.match_date_utc ASC`,
  params,
);
```

### Step 3.3 - Update getLocalSchedule juga (jika perlu coach)

```javascript
// FILE: src/controllers/matchController.js
// OPTIONAL: Jika mau getLocalSchedule juga return coach
// Tambah ke response object:
head_coach: row.head_coach_name || null;
```

---

## PHASE 4: FIX LEADERBOARD (P1 - HIGH PRIORITY)

**Durasi: 30 min | Status dari Claude Sonnet: ✅ SUDAH SELESAI**

### Step 4.1 - Filter leaderboard per tournament

```
STATUS: ✅ DONE (Claude Sonnet)
FILE: src/controllers/predictionController.js
QUERY: Sudah support ?tournament_id parameter
```

### Step 4.2 - Fix hardcode poin di correct_results

```
STATUS: ✅ DONE (Claude Sonnet)
FILE: src/controllers/predictionController.js
CHANGE: FROM IN (5, 7, 9, 10, 12, 14) TO >= 5
REASON: 9 & 14 tidak mungkin terjadi dalam scoring system
```

---

## PHASE 5: QUALITY IMPROVEMENTS (P2 - MEDIUM PRIORITY)

**Durasi: 2-3 jam | Status: ⏳ OPTIONAL**

### Step 5.1 - Add player count & match count ke GET /tournaments/:id

```javascript
// FILE: src/controllers/tournamentController.js
// MODIFY: getTournamentById (buat fungsi baru atau extend GET /:id)

const total_players = await get(
  `SELECT COUNT(*) as count
   FROM tournament_players
   WHERE tournament_id = ? AND is_active = 1`,
  [tournamentId]
);

const total_matches = await get(
  `SELECT COUNT(*) as count
   FROM matches
   WHERE tournament_id = ?`,
  [tournamentId]
);

// Include di response:
{
  tournament: { ...data },
  total_players: total_players.count,
  total_matches: total_matches.count,
  squad: { GK: [...], DEF: [...] }
}
```

### Step 5.2 - Add update validation di PATCH /tournaments/:id

```javascript
// FILE: src/controllers/tournamentController.js
// Saat update stage, validate:
// - Jika stage diubah ke Knockout: harus ada players di squad
// - Jika stage diubah ke Final: harus ada matches di tournament
// - start_date < end_date validation
```

### Step 5.3 - Clarify existing player response di createPlayer

```javascript
// FILE: src/controllers/playerController.js
// Jika player sudah ada dan ada tournament_id:
// Tambah flag di response:
{
  success: true,
  player_already_existed: true,
  message: "Pemain sudah ada, ditambahkan ke tournament"
}
```

---

## PHASE 6: NEW FEATURES (P2 - OPTIONAL/NICE TO HAVE)

**Durasi: 4-5 jam | Status: ⏳ OPTIONAL**

### Step 6.1 - Create match_lineups table

```sql
-- FILE: database/init.sql
-- TAMBAH TABLE:

CREATE TABLE IF NOT EXISTS match_lineups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    tournament_id INTEGER NOT NULL,
    is_starting_eleven INTEGER DEFAULT 1,
    jersey_number INTEGER,
    position TEXT CHECK(position IN ('GK', 'DEF', 'MID', 'FWD')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    UNIQUE(match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_lineups_match
ON match_lineups(match_id);

CREATE INDEX IF NOT EXISTS idx_match_lineups_player
ON match_lineups(player_id);
```

### Step 6.2 - Endpoints untuk match lineup

```javascript
// FILE: src/controllers/matchController.js
// TAMBAH FUNGSI:

exports.setMatchLineup = async (req, res) => {
  // POST /matches/:id/lineup
  // Assign players ke match, starting eleven vs substitutes
};

exports.getMatchLineup = async (req, res) => {
  // GET /matches/:id/lineup
  // Return starting XI + substitutes
};

exports.deleteMatchLineup = async (req, res) => {
  // DELETE /matches/:id/lineup/:player_id
  // Remove player dari match lineup
};

// FILE: src/routes/matchRoutes.js
// TAMBAH ROUTES:
router.post("/:id/lineup", matchController.setMatchLineup);
router.get("/:id/lineup", matchController.getMatchLineup);
router.delete("/:id/lineup/:player_id", matchController.deleteMatchLineup);
```

### Step 6.3 - Endpoints untuk match coaches (optional)

```javascript
// Jika ingin coach bisa berbeda per match:
// Buat match_coaches table
// Endpoints: POST/GET/DELETE /matches/:id/coach
// Tapi ini OPTIONAL (nice to have, bukan blocking)
```

---

## PHASE 7: DATA SEEDING & TESTING (P2)

**Durasi: 1-2 jam | Status: ⏳ IN PROGRESS**

### Step 7.1 - Add players ke tournament_id 2

```
FILE: database/data/players.json
ACTION: Duplikasi beberapa pemain ke tournament_id 2
PURPOSE: Test multi-tournament scenario
```

### Step 7.2 - Test all endpoints

```
GET /players
GET /players/:id (with tournaments)
PATCH /players/:id
GET /tournaments
GET /tournaments/:id (with counts)
PATCH /tournaments/:id
GET /matches (with head_coach)
GET /matches/:id (with head_coach)
GET /tournaments/:id/coaches
POST /tournaments/:id/coaches
GET /predictions/leaderboard?tournament_id=1
```

---

# 📋 SUMMARY - PRIORITAS IMPLEMENTASI

## DONE ✅ (dari Claude Sonnet)

- [x] Fix playerController.js require
- [x] GET /players/:id + tournament list
- [x] PATCH /players/:id
- [x] GET /tournaments/:id
- [x] PATCH /tournaments/:id
- [x] GET /matches/:id
- [x] Leaderboard filter tournament_id
- [x] Leaderboard correct_results fix

## TODO ⏳ (Remaining Work)

### P1 - HIGH (Perlu dikerjakan segera)

- [x] Step 3.1: Modify mapMatchRow add head_coach
- [x] Step 3.2: Update getMatches query JOIN tournament_coaches
- [x] Step 3.3: Update getLocalSchedule (optional)

**P1 Status:** ✅ Completed

### P2 - MEDIUM (Bisa dikerjakan setelah P1)

- [ ] Step 5.1: Add player/match count ke tournament detail
- [ ] Step 5.2: Add validation di PATCH /tournaments/:id
- [ ] Step 5.3: Clarify existing player response
- [ ] Step 7.1: Seed data untuk tournament 2
- [ ] Step 7.2: Test all endpoints

### P3 - OPTIONAL (Nice to have)

- [ ] Step 6.1-6.3: match_lineups table & endpoints
- [ ] Coach per-match feature

---

# 🎯 REKOMENDASI URUTAN KERJA

1. **Hari 1 (Done ✅)** - Fix P0 bugs dari Claude Sonnet
2. **Hari 2 (Done ✅)** - Add missing endpoints dari Claude Sonnet
3. **Hari 3 (Done ✅)** - Implement Step 3.1 & 3.2 (Add coach to match)
4. **Hari 4 (Next)** - Complete Step 5.x (quality improvements)
5. **Hari 5** - Data seeding & testing
6. **Hari 6** - Optional: match_lineups feature

---

**Generated: 2026-04-21**
