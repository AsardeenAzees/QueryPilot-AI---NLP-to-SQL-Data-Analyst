-- The supplied BALL_BY_BALL.csv contains match_id 1473495, while the
-- corresponding fixture in IPL_MATCH.csv uses a different match ID.
-- Preserve source identifiers and do not invent a parent match record.
ALTER TABLE ball_by_ball
  DROP CONSTRAINT IF EXISTS ball_by_ball_match_id_fkey;
