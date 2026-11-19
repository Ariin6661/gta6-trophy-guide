// Saved progress: which trophies are earned and whether spoilers stay hidden.
// Everything lives in localStorage under one key, and export/import move the
// same JSON shape in and out of a file, so a player can back it up or move it.
const STORAGE_KEY = "gta6-trophy-guide-v1";

export function blankState() {
  return { earned: [], spoiler: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return blankState();
    return {
      earned: Array.isArray(parsed.earned)
        ? parsed.earned.filter((id) => Number.isInteger(id))
        : [],
      spoiler: Boolean(parsed.spoiler),
    };
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A full or blocked store must not break the guide; progress just
    // does not survive a reload in that case.
  }
}

export function isEarned(state, trophyId) {
  return state.earned.includes(trophyId);
}

export function toggleEarned(state, trophyId) {
  const next = { ...state, earned: [...state.earned] };
  const at = next.earned.indexOf(trophyId);
  if (at === -1) next.earned.push(trophyId);
  else next.earned.splice(at, 1);
  saveState(next);
  return next;
}

export function exportFile(state) {
  const payload = {
    app: "gta6-trophy-guide",
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gta6-trophy-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload.earned.length;
}

// Reads an exported progress file and returns a state, or throws a plain
// message when the file is not one of ours.
export async function importFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.earned)) {
    throw new Error("That file is not a trophy progress export.");
  }
  const state = {
    earned: parsed.earned.filter((id) => Number.isInteger(id)),
    spoiler: Boolean(parsed.spoiler),
  };
  saveState(state);
  return state;
}
