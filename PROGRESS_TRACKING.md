# ✅ PROGRESS TRACKING & CHECKLIST

**Project:** Backend GarudaHub - Code Quality Fix & Enhancement
**Date Started:** 2026-04-18 (seeding)
**Current Phase:** P1 Implementation
**Target:** 100% Complete

---

## 📊 PHASE COMPLETION STATUS

```
PHASE 1: Bug Fix Kritis (P0)
████████████████████████████████ 100% ✅ DONE

PHASE 2: Missing Endpoints (P0)
████████████████████████████████ 100% ✅ DONE

PHASE 3: Coach in Match (P1)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0% ⏳ TODO

PHASE 4: Leaderboard Fixes (P1)
████████████████████████████████ 100% ✅ DONE

PHASE 5: Quality Improvements (P2)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0% ⏳ TODO

PHASE 6: New Features (P2)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0% ⏳ OPTIONAL

PHASE 7: Data & Testing (P2)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0% ⏳ TODO
```

**Overall Progress: 60% (12/20 tasks done)**

---

## ✅ COMPLETED TASKS (from Claude Sonnet)

### PHASE 1: BUG KRITIS (P0)

- [x] playerController.js - Move require to top
  - Status: ✅ VERIFIED
  - File: src/controllers/playerController.js
  - Note: Functions no longer reference undefined variables

### PHASE 2: MISSING ENDPOINTS (P0)

- [x] GET /players/:id + tournament list
  - Status: ✅ VERIFIED
  - Endpoint: GET /api/players/:id
  - Response: Include tournaments array
  - File: src/controllers/playerController.js

- [x] PATCH /players/:id - Update player data
  - Status: ✅ VERIFIED
  - Endpoint: PATCH /api/players/:id
  - Fields: club, caps, goals, photo_url, status, is_active
  - File: src/controllers/playerController.js

- [x] GET /tournaments/:id - Tournament detail
  - Status: ✅ VERIFIED
  - Endpoint: GET /api/tournaments/:id
  - Response: Tournament info with coaches
  - File: src/controllers/tournamentController.js

- [x] PATCH /tournaments/:id - Update tournament
  - Status: ✅ VERIFIED
  - Endpoint: PATCH /api/tournaments/:id
  - Fields: stage, logo_url, is_active, description
  - File: src/controllers/tournamentController.js

- [x] GET /matches/:id - Match detail
  - Status: ✅ VERIFIED
  - Endpoint: GET /api/matches/:id
  - Response: Full match data with result, scores
  - File: src/controllers/matchController.js

### PHASE 4: LEADERBOARD FIXES (P1)

- [x] Add tournament_id filter to leaderboard
  - Status: ✅ VERIFIED
  - Endpoint: GET /api/predictions/leaderboard?tournament_id=1
  - File: src/controllers/predictionController.js

- [x] Fix hardcode poin di correct_results
  - Status: ✅ VERIFIED
  - Change: IN (5,7,9,10,12,14) → >= 5
  - Reason: Remove impossible scoring values
  - File: src/controllers/predictionController.js

---

## ⏳ IN PROGRESS / TODO

### PHASE 3: ADD COACH TO MATCH (P1) - HIGH PRIORITY

**STATUS: READY TO IMPLEMENT**

- [ ] Step 3.1: Modify mapMatchRow function
  - File: src/controllers/matchController.js (lines 8-47)
  - Change: Add head_coach field to return object
  - Estimated: 10 min
- [ ] Step 3.2: Update getMatches query
  - File: src/controllers/matchController.js (lines 105-113)
  - Change: Add LEFT JOIN tournament_coaches
  - Estimated: 10 min
- [ ] Step 3.3: Update createMatch response query
  - File: src/controllers/matchController.js (lines 193-198)
  - Change: Add LEFT JOIN tournament_coaches
  - Estimated: 5 min
- [ ] Step 3.4: Update updateMatch response query
  - File: src/controllers/matchController.js (lines 280-285)
  - Change: Add LEFT JOIN tournament_coaches
  - Estimated: 5 min
- [ ] Step 3.5: (Optional) Update getLocalSchedule
  - File: src/controllers/matchController.js (lines 304-325)
  - Change: Add head_coach to response
  - Estimated: 5 min
- [ ] Testing Step 3
  - Test: GET /matches (verify head_coach in response)
  - Test: GET /matches/:id (verify head_coach in detail)
  - Test: GET /matches?tournament_id=1 (verify filtering works)
  - Estimated: 20 min

**Subtotal P1:** ~55 min

---

### PHASE 5: QUALITY IMPROVEMENTS (P2)

**STATUS: OPTIONAL ENHANCEMENTS**

- [ ] Step 5.1: Add player/match count to tournament detail
  - File: src/controllers/tournamentController.js
  - Add: total_players & total_matches fields
  - Estimated: 15 min
- [ ] Step 5.2: Add date validation to PATCH /tournaments/:id
  - File: src/controllers/tournamentController.js
  - Add: start_date < end_date check
  - Estimated: 10 min
- [ ] Step 5.3: Clarify existing player response
  - File: src/controllers/playerController.js
  - Add: player_already_existed flag
  - Estimated: 5 min

**Subtotal P2:** ~30 min

---

### PHASE 6: NEW FEATURES (P2)

**STATUS: OPTIONAL / NICE TO HAVE**

- [ ] Step 6.1: Create match_lineups table
  - File: database/init.sql
  - Create: Table with indices
  - Estimated: 20 min
- [ ] Step 6.2: Implement match lineup endpoints
  - File: src/controllers/matchController.js
  - Add: setMatchLineup, getMatchLineup, deleteMatchLineup
  - Estimated: 45 min
- [ ] Step 6.3: Add match lineup routes
  - File: src/routes/matchRoutes.js
  - Add: POST/GET/DELETE /matches/:id/lineup
  - Estimated: 10 min

**Subtotal P3:** ~75 min (Optional)

---

### PHASE 7: DATA & TESTING (P2)

**STATUS: VALIDATION & SEEDING**

- [ ] Step 7.1: Extend seed data to tournament_id 2
  - File: database/data/players.json
  - Action: Add some players to tournament 2
  - Estimated: 15 min
- [ ] Step 7.2: Run database seed
  - Command: npm run seed
  - Verify: Data inserted correctly
  - Estimated: 10 min
- [ ] Step 7.3: Complete endpoint testing
  - Test: All GET endpoints
  - Test: All POST/PATCH endpoints
  - Test: Error handling
  - Estimated: 30 min

**Subtotal P4:** ~55 min

---

## 📋 QUICK REFERENCE - FILES TO MODIFY

### High Priority (P1)

| File                               | Lines   | Change                                         |
| ---------------------------------- | ------- | ---------------------------------------------- |
| src/controllers/matchController.js | 8-47    | Add head_coach to mapMatchRow                  |
| src/controllers/matchController.js | 105-113 | Add LEFT JOIN tournament_coaches in getMatches |
| src/controllers/matchController.js | 193-198 | Add LEFT JOIN in createMatch                   |
| src/controllers/matchController.js | 280-285 | Add LEFT JOIN in updateMatch                   |

### Medium Priority (P2)

| File                                    | Lines             | Change                            |
| --------------------------------------- | ----------------- | --------------------------------- |
| src/controllers/tournamentController.js | getTournamentById | Add total_players & matches count |
| src/controllers/tournamentController.js | updateTournament  | Add date validation               |
| src/controllers/playerController.js     | createPlayer      | Add player_already_existed flag   |
| database/data/players.json              | All               | Add entries for tournament_id=2   |

### Optional (P3)

| File                               | Lines | Change                  |
| ---------------------------------- | ----- | ----------------------- |
| database/init.sql                  | End   | Add match_lineups table |
| src/controllers/matchController.js | New   | Add lineup functions    |
| src/routes/matchRoutes.js          | End   | Add lineup routes       |

---

## 🎯 DAILY TARGETS

### Day 1 (Today - 2026-04-21)

- [ ] 08:00-09:00 - Review this checklist & implementation guide
- [ ] 09:00-10:00 - Implement Step 3.1-3.4 (mapMatchRow + queries)
- [ ] 10:00-10:30 - Test Step 3 endpoints
- [ ] **Status:** Ready to move to Phase 5

### Day 2 (2026-04-22)

- [ ] Phase 5: Quality improvements (30 min)
- [ ] Phase 7: Data seeding & testing (55 min)
- [ ] **Status:** All P1 + P2 complete

### Day 3 (2026-04-23) - Optional

- [ ] Phase 6: match_lineups feature (75 min)
- [ ] **Status:** Full feature complete

---

## 📊 ESTIMATED TIME BREAKDOWN

| Phase          | Status      | Time   | Running Total |
| -------------- | ----------- | ------ | ------------- |
| P0 Bugs        | ✅ DONE     | 1h 30m | 1h 30m        |
| P0 Endpoints   | ✅ DONE     | 2h     | 3h 30m        |
| P1 Coach       | ⏳ TODO     | 1h     | 4h 30m        |
| P1 Leaderboard | ✅ DONE     | 45m    | 5h 15m        |
| P2 Quality     | ⏳ TODO     | 30m    | 5h 45m        |
| P2 Data & Test | ⏳ TODO     | 55m    | 6h 40m        |
| P3 Features    | 🔷 OPTIONAL | 1h 15m | 7h 55m        |

**Critical Path (P0+P1): ~4.5 hours**
**With P2: ~6.5 hours**
**With P3: ~8 hours**

---

## 🐛 KNOWN ISSUES TO FIX

### Critical (P0)

- [x] playerController require order - **FIXED**

### High (P1)

- [ ] Match endpoint doesn't include head_coach - **IN PROGRESS**
- [ ] Leaderboard correct_results hardcode - **FIXED**

### Medium (P2)

- [ ] Tournament detail missing counts
- [ ] PATCH tournament date validation
- [ ] Player response not clear when exists
- [ ] Seed data incomplete for multi-tournament

### Low (P3)

- [ ] Match lineups not tracked
- [ ] Coach per-match not supported

---

## ✅ VERIFICATION TESTS

### After Phase 3 Implementation

```bash
# Test 1: GET all matches with coach
curl http://localhost:3000/api/matches
# Expected: Response includes head_coach field

# Test 2: GET specific match with coach
curl http://localhost:3000/api/matches/1
# Expected: Response includes head_coach field

# Test 3: Filter by tournament with coach
curl http://localhost:3000/api/matches?tournament_id=1
# Expected: All matches have head_coach field

# Test 4: Multiple filters
curl "http://localhost:3000/api/matches?tournament_id=1&status=scheduled"
# Expected: Filtered results include head_coach
```

---

## 📝 NOTES & REMINDERS

- **Backup First:** Always backup files before major changes
- **Test After Change:** Run tests after each modification
- **Document Changes:** Update relevant documentation
- **Commit Often:** Git commit after each phase
- **Communication:** Inform team when phases complete

---

## 🔗 RELATED DOCUMENTS

- **Full Analysis:** LAPORAN_ANALISIS_LENGKAP.md
- **Implementation Guide:** STEP_BY_STEP_IMPLEMENTATION.md
- **Latest Notes:** catatanterakhir.md

---

**Last Updated:** 2026-04-21
**Status:** READY TO IMPLEMENT
**Next Action:** Start Phase 3 (Add Coach to Match)
