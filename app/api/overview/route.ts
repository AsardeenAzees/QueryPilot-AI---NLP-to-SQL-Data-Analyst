import { NextResponse } from "next/server";
import { executeReadOnlyQuery } from "@/lib/db/neon";

export const revalidate = 3600;

export async function GET() {
  try {
    const { rows } = await executeReadOnlyQuery(`
      SELECT
        (SELECT MIN(season_id)::text || '–' || MAX(season_id)::text FROM ipl_match) AS seasons,
        (SELECT COUNT(*) FROM ipl_match) AS matches,
        (SELECT COUNT(*) FROM ball_by_ball) AS deliveries,
        (SELECT COUNT(*) FROM player_info WHERE is_umpire IS NOT TRUE) AS players
      FROM ipl_match LIMIT 1
    `);
    return NextResponse.json(rows[0] ?? {}, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ seasons: null, matches: null, deliveries: null, players: null });
  }
}
