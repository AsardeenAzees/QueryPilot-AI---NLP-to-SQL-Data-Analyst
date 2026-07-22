BEGIN;

CREATE TABLE IF NOT EXISTS teams (
  team_id bigint PRIMARY KEY,
  team_name text NOT NULL UNIQUE,
  team_short_name text,
  team_city text,
  home_venue text
);

CREATE TABLE IF NOT EXISTS player_info (
  player_id bigint PRIMARY KEY,
  player_name text NOT NULL,
  date_of_birth date,
  batting_hand text,
  bowling_skill text,
  country text,
  is_umpire boolean,
  UNIQUE (player_name, date_of_birth)
);

CREATE TABLE IF NOT EXISTS ipl_match (
  match_id bigint PRIMARY KEY,
  season_id integer NOT NULL,
  match_date date,
  match_number text,
  city text,
  venue text,
  team1 text NOT NULL,
  team2 text NOT NULL,
  toss_winner text,
  toss_decision text,
  match_winner text,
  result text,
  result_margin integer,
  player_of_match text,
  umpire1 text,
  umpire2 text,
  method text
);

CREATE TABLE IF NOT EXISTS ball_by_ball (
  match_id bigint NOT NULL REFERENCES ipl_match(match_id) ON DELETE CASCADE,
  season_id integer NOT NULL,
  innings_no smallint NOT NULL,
  over_no smallint NOT NULL,
  ball_no smallint NOT NULL,
  batter text NOT NULL,
  non_striker text,
  bowler text NOT NULL,
  team_batting text NOT NULL,
  team_bowling text NOT NULL,
  batter_runs smallint NOT NULL DEFAULT 0,
  extra_runs smallint NOT NULL DEFAULT 0,
  total_runs smallint NOT NULL DEFAULT 0,
  is_wicket boolean NOT NULL DEFAULT false,
  player_dismissed text,
  dismissal_kind text,
  fielder text,
  extras_type text,
  wides smallint NOT NULL DEFAULT 0,
  no_balls smallint NOT NULL DEFAULT 0,
  byes smallint NOT NULL DEFAULT 0,
  leg_byes smallint NOT NULL DEFAULT 0,
  penalty_runs smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (match_id, innings_no, over_no, ball_no)
);

CREATE INDEX IF NOT EXISTS idx_ball_match_id ON ball_by_ball(match_id);
CREATE INDEX IF NOT EXISTS idx_ball_season_id ON ball_by_ball(season_id);
CREATE INDEX IF NOT EXISTS idx_ball_batter ON ball_by_ball(batter);
CREATE INDEX IF NOT EXISTS idx_ball_bowler ON ball_by_ball(bowler);
CREATE INDEX IF NOT EXISTS idx_ball_team_batting ON ball_by_ball(team_batting);
CREATE INDEX IF NOT EXISTS idx_ball_team_bowling ON ball_by_ball(team_bowling);
CREATE INDEX IF NOT EXISTS idx_match_season_id ON ipl_match(season_id);
CREATE INDEX IF NOT EXISTS idx_match_date ON ipl_match(match_date);
CREATE INDEX IF NOT EXISTS idx_match_team1 ON ipl_match(team1);
CREATE INDEX IF NOT EXISTS idx_match_team2 ON ipl_match(team2);
CREATE INDEX IF NOT EXISTS idx_match_winner ON ipl_match(match_winner);

COMMIT;
