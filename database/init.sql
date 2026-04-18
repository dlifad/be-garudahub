CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    profile_photo TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    verification_expires_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchandise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    sizes TEXT,
    shopee_url TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('regional', 'continental', 'world')),
    confederation TEXT NOT NULL CHECK(confederation IN ('AFF', 'AFC', 'FIFA')),
    stage TEXT NOT NULL CHECK(stage IN ('Group Stage', 'Knockout', 'Final')),
    indonesia_group TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    host_country TEXT,
    logo_url TEXT,
    season TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    matchday INTEGER,
    round TEXT,
    is_home INTEGER NOT NULL CHECK(is_home IN (0, 1)),
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    opponent TEXT NOT NULL,
    opponent_flag TEXT,
    home_team_flag TEXT DEFAULT '🇮🇩',
    away_team_flag TEXT,
    match_date_utc TEXT NOT NULL,
    venue TEXT,
    stadium_name TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'ongoing', 'finished')),
    home_score INTEGER,
    away_score INTEGER,
    ticket_price_idr INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    name TEXT NOT NULL,
    nickname TEXT,
    position TEXT NOT NULL CHECK(position IN ('GK', 'DEF', 'MID', 'FWD')),
    jersey_number INTEGER NOT NULL,
    date_of_birth TEXT,
    nationality TEXT NOT NULL DEFAULT 'Indonesia',
    is_naturalized INTEGER DEFAULT 0,
    current_club TEXT,
    club TEXT,
    club_country TEXT,
    caps INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    photo_url TEXT,
    is_active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'injured', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    match_id INTEGER NOT NULL,
    predicted_indonesia_score INTEGER NOT NULL,
    predicted_opponent_score INTEGER NOT NULL,
    points_earned INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, match_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournaments_name_dates
ON tournaments(name, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_matches_tournament
ON matches(tournament_id);

CREATE INDEX IF NOT EXISTS idx_matches_status
ON matches(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_schedule_overlap
ON matches(tournament_id, match_date_utc);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_name_unique
ON players(name);

CREATE INDEX IF NOT EXISTS idx_players_position
ON players(position);

CREATE INDEX IF NOT EXISTS idx_predictions_match
ON predictions(match_id);