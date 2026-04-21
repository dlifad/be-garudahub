# 📊 VISUAL ARCHITECTURE & RELATIONSHIPS

## Entity Relationship Diagram

```
┌─────────────────┐
│   USERS         │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email           │
└────────┬────────┘
         │
         │ 1:N
         ├──────────────────────┐
         │                      │
    ┌────▼──────────┐      ┌────▼──────────────┐
    │  PREDICTIONS  │      │  TOURNAMENTS     │
    ├───────────────┤      ├──────────────────┤
    │ id (PK)       │      │ id (PK)          │
    │ user_id (FK)  │      │ name             │
    │ match_id (FK) │      │ type             │
    │ scores        │      │ stage (GROUP→K→F)│
    │ points_earned │      │ start_date       │
    └───────────────┘      │ end_date         │
                           └────┬─────────────┘
                                │ 1:N
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────▼──┐ ┌─────▼──┐ ┌────▼────────────┐
              │ MATCHES │ │ COACHES│ │TOURNAMENT_      │
              ├────────┤ ├────────┤ │PLAYERS (JOIN)   │
              │ id (PK)│ │ id(PK) │ ├─────────────────┤
              │ tournament_id│ name       │ tournament_id   │
              │ is_home     │ role       │ player_id       │
              │ opponent    │ is_active  │ jersey_number   │
              │ scores      │            │ status          │
              │ status      │            └────────┬────────┘
              │ result      │                     │ N:1
              └─────┬──────┘                      │
                    │ N:1                    ┌────▼──────────┐
                    │              ┌────────►│   PLAYERS      │
                    │              │         ├────────────────┤
                    │              │         │ id (PK)        │
                    │              N:1       │ name           │
              ┌─────▼─────────┐    │         │ position (GK..)│
              │ MATCH_LINEUPS │    │         │ current_club   │
              │ (OPTIONAL)    │────┘         │ caps, goals    │
              ├───────────────┤              │ photo_url      │
              │ match_id      │              └────────────────┘
              │ player_id     │
              │ is_starter    │
              │ jersey_number │
              └───────────────┘
```

---

## Data Flow Diagram

### **Skenario: App User Membuka Halaman Match Detail**

```
┌─────────────────────────────────────────────────────────┐
│ Frontend App                                             │
│ Halaman Match Detail (Match #1)                          │
└──────────────┬──────────────────────────────────────────┘
               │
               │ GET /api/matches/1
               │
┌──────────────▼──────────────────────────────────────────┐
│ Backend - matchController.js                            │
│ exports.getMatchById()                                   │
└──────────────┬──────────────────────────────────────────┘
               │
               │ SQL Query:
               │ SELECT m.*, t.name AS tournament_name,
               │        tc.name AS head_coach_name
               │ FROM matches m
               │ JOIN tournaments t ON t.id = m.tournament_id
               │ LEFT JOIN tournament_coaches tc
               │   ON tc.tournament_id = t.id
               │   AND tc.role = 'head_coach'
               │   AND tc.is_active = 1
               │ WHERE m.id = 1
               │
┌──────────────▼──────────────────────────────────────────┐
│ Database                                                 │
│                                                          │
│ ┌─ matches table                                        │
│ │  id: 1, tournament_id: 1,                            │
│ │  home_team: Indonesia, away_team: Vietnam           │
│ │  scores: 1-0, status: finished                      │
│ │                                                      │
│ ├─ tournaments table                                   │
│ │  id: 1, name: "Piala AFF 2024"                     │
│ │  stage: "Group Stage"                               │
│ │                                                      │
│ └─ tournament_coaches table                            │
│    id: 5, tournament_id: 1,                           │
│    name: "Shin Tae-yong", role: 'head_coach'         │
│    is_active: 1                                        │
└──────────────┬──────────────────────────────────────────┘
               │
               │ Database joins & returns row with:
               │ {
               │   id: 1, tournament_name: "Piala AFF 2024",
               │   head_coach_name: "Shin Tae-yong",
               │   home_team: "Indonesia", away_team: "Vietnam",
               │   ...
               │ }
               │
┌──────────────▼──────────────────────────────────────────┐
│ Backend - mapMatchRow()                                  │
│ Transforms row → {                                       │
│   id: 1,                                                │
│   tournament_name: "Piala AFF 2024",                   │
│   head_coach: "Shin Tae-yong",  ← ✅ NEW FIELD         │
│   home_team: "Indonesia",                               │
│   away_team: "Vietnam",                                │
│   result: "WIN",                                        │
│   status: "finished",                                  │
│   ...                                                   │
│ }                                                       │
└──────────────┬──────────────────────────────────────────┘
               │
               │ 200 OK + JSON Response
               │
┌──────────────▼──────────────────────────────────────────┐
│ Frontend App                                             │
│ Displays:                                                │
│ ┌────────────────────────────────────┐                 │
│ │ Indonesia 1 - 0 Vietnam            │                 │
│ │ Pelatih: Shin Tae-yong  ← ✅ SHOWN │                 │
│ │ Status: Finished                   │                 │
│ │ [Map] [Squad] [Lineup]             │                 │
│ └────────────────────────────────────┘                 │
└────────────────────────────────────────────────────────┘
```

---

## Coach Assignment Flow

### **Scenario 1: Add Head Coach to Tournament**

```
Admin/User sends:
POST /api/tournaments/1/coaches
{
  "name": "Shin Tae-yong",
  "role": "head_coach",
  "start_date": "2024-01-01"
}
  ↓
Controller checks:
✓ Tournament exists
✓ Role is valid (head_coach)
✓ Name not empty
  ↓
If role = head_coach AND is_active = 1:
  UPDATE tournament_coaches
  SET is_active = 0
  WHERE tournament_id = 1 AND role = 'head_coach' AND is_active = 1

  (Automatically deactivate previous head coach)
  ↓
INSERT INTO tournament_coaches
(tournament_id, name, role, is_active, start_date)
VALUES (1, 'Shin Tae-yong', 'head_coach', 1, '2024-01-01')
  ↓
✅ Response: Head coach added successfully
   All future GET /matches?tournament_id=1
   will include: "head_coach": "Shin Tae-yong"
```

### **Scenario 2: Change Head Coach Mid-Tournament**

```
Admin adds NEW head coach:
POST /api/tournaments/1/coaches
{
  "name": "Indra Sjafri",
  "role": "head_coach",
  "start_date": "2024-05-01"
}
  ↓
System automatically:
  ↓
UPDATE tournament_coaches
SET is_active = 0, end_date = '2024-05-01'
WHERE tournament_id = 1
  AND role = 'head_coach'
  AND is_active = 1

Result:
  Old: Shin Tae-yong (is_active: 0, end_date: '2024-05-01')
  New: Indra Sjafri (is_active: 1, start_date: '2024-05-01')
  ↓
✅ GET /matches?tournament_id=1
   Returns head_coach: "Indra Sjafri"

✅ GET /tournaments/1/coaches
   Returns full history with both coaches
```

---

## Player Multi-Tournament Assignment

```
┌─────────────────────────────────────────────────────┐
│ Player: Jordi Amat                                  │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼──────────────┐ ┌──▼─────────────────┐
    │ TOURNAMENT 1      │ │ TOURNAMENT 2       │
    │ Piala AFF 2024    │ │ FIFA WCQ 2027      │
    ├──────────────────┤ ├────────────────────┤
    │ Jersey #4        │ │ Jersey #5          │
    │ Status: Active   │ │ Status: Active     │
    │ Matches: 3/5     │ │ Matches: 1/10      │
    └────────────────┬─┘ └─┬───────────────────┘
                    │     │
    Tournament_players table (Junction):
    ┌─────────────────────────────┐
    │ tournament_id │ player_id   │
    ├───────────────┼─────────────┤
    │      1        │    2 (Amat) │ jersey: 4
    │      2        │    2 (Amat) │ jersey: 5
    └─────────────────────────────┘
    ↓
    Benefits:
    - ✅ Satu player bisa multiple tournaments
    - ✅ Jersey number bisa berbeda per tournament
    - ✅ Status & is_active per tournament
    - ✅ Fleksibel jika pemain injury di tournament 1, masih bisa main di tournament 2
```

---

## Player-Match-Coach Relationship

### **Current State:**

```
┌──────────────────────────────────────────────────────┐
│ TOURNAMENT LEVEL (Sudah ada)                         │
│                                                      │
│ Tournament 1: Piala AFF 2024                        │
│ ├─ Head Coach: Shin Tae-yong                        │
│ ├─ Players:                                         │
│ │  ├─ Jordi Amat (DEF, #4)                         │
│ │  ├─ Nadeo Argawinata (GK, #1)                    │
│ │  └─ ... (25 pemain lainnya)                      │
│ │                                                  │
│ └─ Matches:                                        │
│    ├─ Match 1: IDN 1-0 VIE (Head Coach: Shin)     │
│    ├─ Match 2: IDN 2-1 MYS (Head Coach: Shin)     │
│    └─ Match 3: IDN 0-2 THA (Head Coach: Shin)     │
└──────────────────────────────────────────────────────┘

Problem: Tidak tahu pemain mana yang main di Match 1, 2, 3
         Hanya tahu pemain ada di tournament, bukan per-match
```

### **If match_lineups Added (P2 Feature):**

```
┌──────────────────────────────────────────────────────┐
│ MATCH LEVEL (Optional new feature)                   │
│                                                      │
│ Match 1: Indonesia 1-0 Vietnam                       │
│ ├─ Head Coach: Shin Tae-yong                         │
│ ├─ Formation: 4-3-3                                  │
│ ├─ Starting XI:                                      │
│ │  ├─ GK: Nadeo Argawinata (#1)                     │
│ │  ├─ DEF: Jordi Amat (#4) ← Main di match 1       │
│ │  ├─ DEF: Ricky Fajri (#3)                         │
│ │  └─ ... (8 pemain lainnya)                        │
│ │                                                  │
│ └─ Substitutes:                                     │
│    ├─ MID: Witan Sulaeman (#15)                    │
│    └─ ... (4 substitute lainnya)                    │
│                                                     │
│ Match 2: Indonesia 2-1 Malaysia                      │
│ ├─ Head Coach: Shin Tae-yong                         │
│ ├─ Starting XI:                                      │
│ │  ├─ GK: Nadeo Argawinata (#1)                     │
│ │  ├─ DEF: Ricky Fajri (#3) ← Amat ganti di match 2│
│ │  └─ ...                                           │
│ │                                                  │
│ └─ Substitutes: ...                                 │
└──────────────────────────────────────────────────────┘

Benefit: Tahu exactly siapa main di setiap match
```

---

## Query Relationship Chain

### **Simple (Current):**

```
User GET /api/matches/1
  ↓
Query: SELECT m.*, t.name, tc.name AS head_coach_name
       FROM matches m
       JOIN tournaments t
       LEFT JOIN tournament_coaches tc
  ↓
Response includes: tournament_name, head_coach
```

### **Complex (With match_lineups):**

```
User GET /api/matches/1/lineup
  ↓
Query: SELECT mp.*, p.name, p.position
       FROM match_players mp
       JOIN players p
       WHERE mp.match_id = 1
       ORDER BY mp.is_starting_eleven DESC
  ↓
Response includes:
{
  starting_xi: [...11 players...],
  substitutes: [...players...],
  formations: "4-3-3"
}
```

---

## Implementation Checklist Visualization

```
┌─────────────────────────────────────────────────────────┐
│ PHASE COMPLETION CHART                                  │
├─────────────────────────────────────────────────────────┤
│ P0: Bug Kritis                                          │
│ ████████████████████████████████ 100% ✅ DONE          │
│                                                         │
│ P0: Missing Endpoints                                  │
│ ████████████████████████████████ 100% ✅ DONE          │
│                                                         │
│ P1: Coach in Match                                     │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%  ⏳ TODO          │
│ └─ mapMatchRow: ░░░░░ 0%                              │
│ └─ getMatches: ░░░░░ 0%                               │
│ └─ createMatch: ░░░░░ 0%                              │
│ └─ updateMatch: ░░░░░ 0%                              │
│ └─ Testing: ░░░░░ 0%                                   │
│                                                         │
│ P1: Leaderboard                                        │
│ ████████████████████████████████ 100% ✅ DONE          │
│                                                         │
│ P2: Quality Improvements                               │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%  ⏳ TODO          │
│                                                         │
│ P2: Data & Testing                                     │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%  ⏳ TODO          │
│                                                         │
│ P3: New Features (Optional)                            │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%  🔷 OPTIONAL     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ OVERALL: ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 60% │
│ Ready to start Phase 3 ✨                              │
└─────────────────────────────────────────────────────────┘
```

---

## Next Steps Flowchart

```
┌─────────────────────────────────────────────────────────┐
│ START: Phase 3 Implementation                           │
│ "Add Coach to Match Endpoints"                          │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
        ┌─────────────┐
        │ Read Docs   │
        │ - LAPORAN   │
        │ - IMPLEMENT │
        │ - TRACKING  │
        └────┬────────┘
             │
             ▼
    ┌───────────────────┐
    │ Backup original   │
    │ matchController   │
    └────┬──────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Modify 4 functions   │
    │ - mapMatchRow        │
    │ - getMatches         │
    │ - createMatch        │
    │ - updateMatch        │
    └────┬─────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Start server         │
    │ npm start            │
    └────┬─────────────────┘
         │
         ├─ Error? ──► Restore backup ──┐
         │                              │
         ├─ OK? ──► Test endpoints      │
         │          curl tests          │
         │                              │
         ▼                              │
    ┌──────────────────────┐            │
    │ Verify Results       │            │
    │ head_coach field     │            │
    │ showing in response  │            │
    └────┬─────────────────┘            │
         │                              │
         ├─ Success? ──► ✅ DONE        │
         │                              │
         └─ Bug? ──────────────────────┘

         ▼
    ┌──────────────────────┐
    │ Update PROGRESS_     │
    │ TRACKING.md          │
    │ Mark Step 3 DONE     │
    └────┬─────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Start Phase 5        │
    │ (Quality improve)    │
    └──────────────────────┘
```

---

**Ready to implement? Let's go! 🚀**
