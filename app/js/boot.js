// Entry point: loads the guide data, reads the saved state, renders the first
// view, and wires every control. No network beyond the app's own files.
import { loadGuideData } from "./data.js";
import { exportFile, importFile, isEarned, loadState, saveState, toggleEarned } from "./store.js";
import { visibleTrophies } from "./filters.js";
import { renderDetail, renderList, renderMissables, renderProgress, renderRoadmap } from "./views.js";

const criteria = { search: "", grade: "all", kind: "all", earned: "all" };
let guide = null;
let state = loadState();
let selectedId = null;
let currentView = "checklist";

function statusLine(message) {
  document.getElementById("status-line").textContent = message;
}

function refresh() {
  renderProgress(guide, state);
  const shown = visibleTrophies(guide.trophies, state, criteria);
  renderList(guide, state, shown, selectedId, pickTrophy, flipEarned);
  renderDetail(guide, state, selectedId, flipEarned);
  renderRoadmap(guide, state);
  renderMissables(guide, state, pickTrophy, flipEarned);
}

function pickTrophy(id) {
  selectedId = id;
  renderList(guide, state, visibleTrophies(guide.trophies, state, criteria), selectedId, pickTrophy, flipEarned);
  renderDetail(guide, state, selectedId, flipEarned);
}

function flipEarned(id) {
  state = toggleEarned(state, id);
  const trophy = guide.byId.get(id);
  statusLine(isEarned(state, id)
    ? "Marked as earned: " + trophy.name + "."
    : "Unmarked: " + trophy.name + ".");
  refresh();
}

function showView(name) {
  currentView = name;
  for (const tab of document.querySelectorAll(".tab")) {
    const active = tab.dataset.view === name;
    tab.classList.toggle("active", active);
    if (active) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }
  document.getElementById("view-checklist").hidden = name !== "checklist";
  document.getElementById("detail-panel").hidden = name !== "checklist";
  document.getElementById("view-roadmap").hidden = name !== "roadmap";
  document.getElementById("view-missables").hidden = name !== "missables";
}

async function start() {
  try {
    guide = await loadGuideData();
  } catch (error) {
    document.getElementById("list-meta").textContent = "The trophy data could not be loaded: " + error.message;
    return;
  }

  document.getElementById("search").addEventListener("input", (event) => {
    criteria.search = event.target.value;
    refresh();
  });
  document.getElementById("grade-filter").addEventListener("change", (event) => {
    criteria.grade = event.target.value;
    refresh();
  });
  document.getElementById("kind-filter").addEventListener("change", (event) => {
    criteria.kind = event.target.value;
    refresh();
  });
  document.getElementById("earned-filter").addEventListener("change", (event) => {
    criteria.earned = event.target.value;
    refresh();
  });

  const spoilerBox = document.getElementById("spoiler-toggle");
  spoilerBox.checked = state.spoiler;
  spoilerBox.addEventListener("change", () => {
    state = { ...state, spoiler: spoilerBox.checked };
    saveState(state);
    statusLine(state.spoiler
      ? "Spoiler hiding on: hidden story trophies stay masked until earned."
      : "Spoiler hiding off: every trophy name and description is shown.");
    refresh();
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const count = exportFile(state);
    statusLine("Exported progress for " + count + " earned trophies as JSON.");
  });
  const importInput = document.getElementById("import-file");
  document.getElementById("import-btn").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async () => {
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    try {
      state = await importFile(file);
      spoilerBox.checked = state.spoiler;
      statusLine("Imported progress: " + state.earned.length + " trophies earned.");
    } catch (error) {
      statusLine("Import failed: " + error.message);
    }
    importInput.value = "";
    refresh();
  });

  for (const tab of document.querySelectorAll(".tab")) {
    tab.addEventListener("click", () => showView(tab.dataset.view));
  }

  showView("checklist");
  refresh();
  statusLine(state.earned.length === 0
    ? "Loaded all 55 trophies. Tick a trophy to mark it earned — progress is saved in this browser."
    : "Loaded all 55 trophies. " + state.earned.length + " already earned.");
}

start();
