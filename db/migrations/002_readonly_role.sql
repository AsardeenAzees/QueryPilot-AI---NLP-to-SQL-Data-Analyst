-- Run as the database owner after replacing the placeholder password.
-- Keep this role's URL in DATABASE_URL and the owner URL in DATABASE_ADMIN_URL.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'querypilot_reader') THEN
    CREATE ROLE querypilot_reader LOGIN PASSWORD 'QueryPilotReader2026Strong';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE neondb TO querypilot_reader;
GRANT USAGE ON SCHEMA public TO querypilot_reader;
GRANT SELECT ON teams, player_info, ipl_match, ball_by_ball TO querypilot_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO querypilot_reader;
ALTER ROLE querypilot_reader SET statement_timeout = '5s';
ALTER ROLE querypilot_reader SET default_transaction_read_only = on;
