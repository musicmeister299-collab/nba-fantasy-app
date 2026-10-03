const BASE_URL = "https://api.balldontlie.io/v1";

export async function bdlFetch<T>(path: string): Promise<T> {
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) throw new Error("BALLDONTLIE_API_KEY is not configured");

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: key },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`BALLDONTLIE ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export type Team = {
  id: number; conference: string; division: string; city: string;
  name: string; full_name: string; abbreviation: string;
};

export type Player = {
  id: number; first_name: string; last_name: string; position: string | null;
  height: string | null; weight: string | null; jersey_number: string | null;
  college: string | null; country: string | null; draft_year: number | null;
  draft_round: number | null; draft_number: number | null; team?: Team;
};

export type Stat = {
  id: number; min: string; fgm: number; fga: number; fg_pct: number;
  fg3m: number; fg3a: number; fg3_pct: number; ftm: number; fta: number;
  ft_pct: number; oreb: number; dreb: number; reb: number; ast: number;
  stl: number; blk: number; turnover: number; pf: number; pts: number;
  plus_minus: number; player: Player; team: Team; game: Game;
};

export type Game = {
  id: number; date: string; season: number; status: string; postseason: boolean;
  home_team: Team; visitor_team: Team; home_team_score: number; visitor_team_score: number;
};
