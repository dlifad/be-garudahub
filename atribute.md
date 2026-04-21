Tournament:
id, name, type, confederation, stage, indonesia_group, start_date, end_date, host_country, logo_url, season, description, is_active, created_at
Sumber: init.sql, dipakai di tournamentController.js

Player (master):
id, name, nickname, position, date_of_birth, nationality, is_naturalized, current_club, club, club_country, caps, goals, photo_url, is_active, status, created_at
Sumber: init.sql, dipakai di playerController.js

Relasi Player ke Tournament (squad per turnamen):
tournament_players: id, tournament_id, player_id, jersey_number, is_active, status, created_at
Ini yang bikin 1 pemain bisa main di beberapa turnamen, dan nomor punggung bisa beda per turnamen.

Match:
id, tournament_id, matchday, round, is_home, home_team, away_team, opponent, opponent_flag, home_team_flag, away_team_flag, match_date_utc, venue, stadium_name, status, home_score, away_score, ticket_price_idr, created_at
Sumber: init.sql, logic di matchController.js

Prediction:
id, user_id, match_id, predicted_indonesia_score, predicted_opponent_score, points_earned, created_at
UNIQUE(user_id, match_id)
Sumber: init.sql, logic di predictionController.js