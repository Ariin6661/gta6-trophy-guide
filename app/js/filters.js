// Filtering and counting for the checklist. A trophy passes when it matches
// every active filter at once; the search looks at name and description, and
// a hidden trophy keeps its real name searchable even while spoilers hide it
// on screen (the name is in the data either way).
export function visibleTrophies(trophies, state, criteria) {
  const needle = criteria.search.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (criteria.grade !== "all" && trophy.grade !== criteria.grade) return false;
    if (criteria.kind !== "all" && trophy.kind !== criteria.kind) return false;
    if (criteria.earned === "earned" && !state.earned.includes(trophy.id)) return false;
    if (criteria.earned === "unearned" && state.earned.includes(trophy.id)) return false;
    if (needle) {
      const haystack = (trophy.name + " " + trophy.description).toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function gradeTotals(trophies) {
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) totals[trophy.grade] += 1;
  return totals;
}

export function gradeEarned(trophies, state) {
  const earned = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    if (state.earned.includes(trophy.id)) earned[trophy.grade] += 1;
  }
  return earned;
}

// Spoiler rule: a hidden trophy stays masked while the spoiler setting is on
// and the trophy is not earned yet. The platinum is never masked.
export function isMasked(trophy, state) {
  return state.spoiler && trophy.hidden && !state.earned.includes(trophy.id);
}
