# 🚀 ACTION PLAN IMPLEMENTASI - STEP BY STEP

**Status: READY TO IMPLEMENT**
**Priority: P1 - High (Blocking Feature)**
**Estimated Time: 2-3 jam**

---

## 📍 CURRENT STATE

✅ **DONE by Claude Sonnet:**

- playerController.js require fix
- GET /players/:id + tournament list
- PATCH /players/:id
- GET /tournaments/:id + PATCH
- GET /matches/:id
- Leaderboard improvements

⏳ **NEXT: Add Head Coach to Match Endpoints**

---

# PHASE 3: ADD COACH TO MATCH (IMPLEMENTATION GUIDE)

## 🎯 OBJECTIVE

Make head_coach visible when fetching matches, so app can display coach info alongside team info.

**Current Problem:**

```
GET /matches response:
{
  id: 1,
  tournament_name: "Piala AFF 2024",
  home_team: "Indonesia",
  away_team: "Vietnam",
  head_coach: null  ← ❌ MISSING
}
```

**Target:**

```
GET /matches response:
{
  id: 1,
  tournament_name: "Piala AFF 2024",
  head_coach: "Shin Tae-yong",  ← ✅ ADDED
  home_team: "Indonesia",
  away_team: "Vietnam"
}
```

---

## ✔️ IMPLEMENTATION STEPS

### STEP 1: Backup current matchController.js

```bash
# In terminal:
cd src/controllers
cp matchController.js matchController.js.backup
```

---

### STEP 2: Modify mapMatchRow function

**File:** `src/controllers/matchController.js`

**Current Code (Lines 8-47):**

```javascript
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

**Change to:**

```javascript
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
    head_coach: row.head_coach_name || null, // ← ADD THIS LINE
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

---

### STEP 3: Update getMatches query

**File:** `src/controllers/matchController.js`

**Current Query (Lines 105-113):**

```javascript
const rows = await all(
  `SELECT m.*, t.name AS tournament_name
   FROM matches m
   JOIN tournaments t ON t.id = m.tournament_id
   ${whereClause}
   ORDER BY m.match_date_utc ASC`,
  params,
);
```

**Change to:**

```javascript
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

**Why this works:**

- `LEFT JOIN` = include matches even if no active head_coach
- `tc.role = 'head_coach'` = hanya ambil yang head_coach, bukan assistant/caretaker
- `tc.is_active = 1` = hanya ambil head_coach yang masih aktif
- `tc.name AS head_coach_name` = alias untuk mapMatchRow

---

### STEP 4: Update createMatch response

**File:** `src/controllers/matchController.js`

**Current Query (Lines 193-198):**

```javascript
const created = await get(
  `SELECT m.*, t.name AS tournament_name
   FROM matches m
   JOIN tournaments t ON t.id = m.tournament_id
   WHERE m.id = ?`,
  [inserted.lastID],
);
```

**Change to:**

```javascript
const created = await get(
  `SELECT m.*, t.name AS tournament_name,
          tc.name AS head_coach_name
   FROM matches m
   JOIN tournaments t ON t.id = m.tournament_id
   LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id 
     AND tc.role = 'head_coach' AND tc.is_active = 1
   WHERE m.id = ?`,
  [inserted.lastID],
);
```

---

### STEP 5: Update updateMatch response

**File:** `src/controllers/matchController.js`

**Current Query (Lines 280-285):**

```javascript
const updated = await get(
  `SELECT m.*, t.name AS tournament_name
   FROM matches m
   JOIN tournaments t ON t.id = m.tournament_id
   WHERE m.id = ?`,
  [id],
);
```

**Change to:**

```javascript
const updated = await get(
  `SELECT m.*, t.name AS tournament_name,
          tc.name AS head_coach_name
   FROM matches m
   JOIN tournaments t ON t.id = m.tournament_id
   LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id 
     AND tc.role = 'head_coach' AND tc.is_active = 1
   WHERE m.id = ?`,
  [id],
);
```

---

### STEP 6: Update getLocalSchedule (Optional - jika ingin coach info di sini juga)

**File:** `src/controllers/matchController.js`

**Current Code (Lines 304-325):**

```javascript
exports.getLocalSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const timezone = req.query.timezone || "Asia/Jakarta";

    if (!isValidTimezone(timezone)) {
      return res
        .status(400)
        .json({ success: false, message: "timezone tidak valid" });
    }

    const row = await get("SELECT * FROM matches WHERE id = ?", [id]);
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    const matchName = `${row.home_team} vs ${row.away_team}`;

    return res.json({
      success: true,
      match: matchName,
      utc: row.match_date_utc,
      wib: formatWithOffset(row.match_date_utc, "Asia/Jakarta"),
      wita: formatWithOffset(row.match_date_utc, "Asia/Makassar"),
      wit: formatWithOffset(row.match_date_utc, "Asia/Jayapura"),
      requested_timezone: timezone,
      local: formatWithOffset(row.match_date_utc, timezone),
    });
  } catch (error) {
    // ...
  }
};
```

**Change to (Optional):**

```javascript
exports.getLocalSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const timezone = req.query.timezone || "Asia/Jakarta";

    if (!isValidTimezone(timezone)) {
      return res
        .status(400)
        .json({ success: false, message: "timezone tidak valid" });
    }

    const row = await get(
      `SELECT m.*, tc.name AS head_coach_name
       FROM matches m
       LEFT JOIN tournaments t ON t.id = m.tournament_id
       LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id 
         AND tc.role = 'head_coach' AND tc.is_active = 1
       WHERE m.id = ?`,
      [id],
    );
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    const matchName = `${row.home_team} vs ${row.away_team}`;

    return res.json({
      success: true,
      match: matchName,
      head_coach: row.head_coach_name || null, // ← ADD THIS
      utc: row.match_date_utc,
      wib: formatWithOffset(row.match_date_utc, "Asia/Jakarta"),
      wita: formatWithOffset(row.match_date_utc, "Asia/Makassar"),
      wit: formatWithOffset(row.match_date_utc, "Asia/Jayapura"),
      requested_timezone: timezone,
      local: formatWithOffset(row.match_date_utc, timezone),
    });
  } catch (error) {
    // ...
  }
};
```

---

## ✅ VERIFICATION CHECKLIST

After implementing, verify:

- [ ] matchController.js saves without syntax error
- [ ] Server starts: `npm start` or `npm run dev`
- [ ] Test GET /matches

  ```bash
  curl http://localhost:3000/api/matches
  ```

  Response should include `"head_coach": "Shin Tae-yong"` or `null`

- [ ] Test GET /matches/:id (replace 1 with actual match id)

  ```bash
  curl http://localhost:3000/api/matches/1
  ```

  Response should include head_coach

- [ ] Test GET /matches?tournament_id=1

  ```bash
  curl http://localhost:3000/api/matches?tournament_id=1
  ```

  All matches in response should have head_coach field

- [ ] Test filter
  ```bash
  curl http://localhost:3000/api/matches?tournament_id=1&status=scheduled
  ```
  Should still include head_coach

---

## 🐛 TROUBLESHOOTING

**Issue: head_coach always null**

- Check: Apakah ada tournament_coaches dengan role='head_coach' dan is_active=1?
  ```bash
  sqlite3 database/db.sqlite
  SELECT * FROM tournament_coaches WHERE role='head_coach';
  ```
- Jika kosong: Add coach terlebih dahulu via POST /tournaments/:id/coaches

**Issue: Error "column tc.name not found"**

- Periksa: Spelling LEFT JOIN, alias tc, column name
- Pastikan bracket dan syntax SQL benar

**Issue: Server crash after change**

- Restore backup: `cp matchController.js.backup matchController.js`
- Check for typos in SQL query

---

## 📊 EXPECTED RESULTS

**Before:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tournament_id": 1,
      "tournament_name": "Piala AFF 2024",
      "matchday": 1,
      "home_team": "Indonesia",
      "away_team": "Vietnam",
      "match_date_utc": "2024-01-10T14:00:00Z",
      "status": "scheduled"
    }
  ]
}
```

**After:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tournament_id": 1,
      "tournament_name": "Piala AFF 2024",
      "head_coach": "Shin Tae-yong", // ← NEW FIELD
      "matchday": 1,
      "home_team": "Indonesia",
      "away_team": "Vietnam",
      "match_date_utc": "2024-01-10T14:00:00Z",
      "status": "scheduled"
    }
  ]
}
```

---

## ⏱️ TIME BREAKDOWN

| Task                                       | Time        |
| ------------------------------------------ | ----------- |
| Step 1-2: Modify mapMatchRow               | 10 min      |
| Step 3: Update getMatches                  | 10 min      |
| Step 4-5: Update create/update             | 10 min      |
| Step 6: Update getLocalSchedule (optional) | 5 min       |
| Testing & verification                     | 30 min      |
| **Total**                                  | **~65 min** |

---

## 📝 NOTES

- **SQL JOIN Type:** LEFT JOIN digunakan agar match tetap ditampilkan meskipun belum ada head_coach
- **Performance:** Index sudah ada di tournament_coaches, seharusnya query cepat
- **Backward Compatible:** Response lama akan punya field baru `head_coach`, tidak akan break existing client
- **NULL Handling:** Jika tournament tidak punya head_coach, field akan null (aman)

---

**Ready to implement? Hubungi untuk confirmasi!**
**Generated: 2026-04-21**
