// Loads the trophy data file and hands back a shaped copy the views can use.
// The file lives under app/, so this fetch never leaves the app's own server.
export async function loadGuideData() {
  const response = await fetch("data/trophies.json");
  if (!response.ok) {
    throw new Error("Could not load data/trophies.json (" + response.status + ")");
  }
  const raw = await response.json();
  const trophies = raw.trophies.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    grade: entry.grade,
    hidden: Boolean(entry.hidden),
    kind: entry.kind,
    missable: Boolean(entry.missable),
    count: entry.count ?? null,
    stage: entry.stage,
    guide: entry.guide,
    sources: Array.isArray(entry.sources) ? entry.sources : [],
  }));
  return {
    game: raw.game,
    platform: raw.platform,
    trophies,
    roadmap: raw.roadmap ?? [],
    facts: raw.facts ?? {},
    byId: new Map(trophies.map((trophy) => [trophy.id, trophy])),
  };
}

export const GRADES = ["platinum", "gold", "silver", "bronze"];

export const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  online: "Online",
};

export const STAGE_TITLES = {
  1: "Play the story",
  2: "Side strands",
  3: "Activities and challenges",
  4: "Robberies and money",
  5: "Collectibles and exploration",
  6: "The long cleanup and the platinum",
};
