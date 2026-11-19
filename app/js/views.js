// Rendering: the checklist rows, the progress header, the detail pane, the
// roadmap and the missables page. Views never fetch or store anything; boot.js
// owns the state and hands it in, and the views report clicks back through
// the callbacks they are given.
import { GRADES, KIND_LABELS } from "./data.js";
import { gradeEarned, gradeTotals, isMasked } from "./filters.js";
import { isEarned } from "./store.js";

function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function countWord(trophy) {
  if (trophy.count === null || trophy.count === undefined) return "";
  if (typeof trophy.count === "number" && trophy.count >= 1000) {
    return "$" + trophy.count.toLocaleString("en-US");
  }
  return String(trophy.count);
}

export function renderProgress(guide, state) {
  const earned = gradeEarned(guide.trophies, state);
  const totals = gradeTotals(guide.trophies);
  const totalEarned = state.earned.length;
  const total = guide.trophies.length;
  const pct = total === 0 ? 0 : Math.round((totalEarned / total) * 100);
  document.getElementById("progress-text").textContent =
    totalEarned + " of " + total + " earned";
  document.getElementById("progress-pct").textContent = pct + "%";
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("grade-counts").innerHTML = GRADES.map(
    (grade) => "<li>" + gradeWord(grade) + ": <b>" + earned[grade] + " / " + totals[grade] + "</b></li>",
  ).join("");
}

function rowFor(trophy, state, selectedId, onPick, onToggle) {
  const row = document.createElement("li");
  const masked = isMasked(trophy, state);
  const earned = isEarned(state, trophy.id);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "trophy-row" + (earned ? " earned" : "") + (trophy.id === selectedId ? " selected" : "");
  button.setAttribute("aria-pressed", earned ? "true" : "false");

  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = earned;
  box.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
  box.addEventListener("click", (event) => {
    event.stopPropagation();
    onToggle(trophy.id);
  });

  const body = document.createElement("span");
  const name = document.createElement("span");
  name.className = "trophy-name";
  name.textContent = masked ? "Hidden trophy" : trophy.name;
  const desc = document.createElement("span");
  desc.className = "trophy-desc";
  desc.textContent = masked
    ? "Hidden on PlayStation until earned — turn the spoiler setting off, or earn it, to reveal it."
    : trophy.description;
  const tags = document.createElement("span");
  tags.className = "trophy-tags";
  const gradeTag = document.createElement("span");
  gradeTag.className = "tag grade-" + trophy.grade;
  gradeTag.textContent = gradeWord(trophy.grade);
  tags.appendChild(gradeTag);
  const kindTag = document.createElement("span");
  kindTag.className = "tag";
  kindTag.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  // A missable trophy already carries its own red tag below, so the kind
  // tag would only repeat the word.
  if (trophy.kind !== "missable") tags.appendChild(kindTag);
  if (trophy.missable) {
    const missTag = document.createElement("span");
    missTag.className = "tag missable";
    missTag.textContent = "Missable";
    tags.appendChild(missTag);
  }
  if (trophy.hidden) {
    const hidTag = document.createElement("span");
    hidTag.className = "tag hidden-tag";
    hidTag.textContent = "Hidden";
    tags.appendChild(hidTag);
  }
  body.appendChild(name);
  body.appendChild(document.createElement("br"));
  body.appendChild(desc);
  body.appendChild(document.createElement("br"));
  body.appendChild(tags);

  const count = document.createElement("span");
  count.className = "trophy-count";
  const word = countWord(trophy);
  count.textContent = word === "" ? "" : "× " + word;

  button.appendChild(box);
  button.appendChild(body);
  button.appendChild(count);
  button.addEventListener("click", () => onPick(trophy.id));
  row.appendChild(button);
  return row;
}

export function renderList(guide, state, shown, selectedId, onPick, onToggle) {
  const list = document.getElementById("trophy-list");
  list.innerHTML = "";
  for (const trophy of shown) {
    list.appendChild(rowFor(trophy, state, selectedId, onPick, onToggle));
  }
  document.getElementById("empty-note").hidden = shown.length !== 0;
  document.getElementById("list-meta").textContent =
    "Showing " + shown.length + " of " + guide.trophies.length + " trophies" +
    (state.spoiler ? " · spoiler hiding on: hidden trophies stay masked until earned" : "");
}

export function renderDetail(guide, state, trophyId, onToggle) {
  const empty = document.getElementById("detail-empty");
  const detail = document.getElementById("detail");
  if (trophyId === null || trophyId === undefined) {
    empty.hidden = false;
    detail.hidden = true;
    return;
  }
  const trophy = guide.byId.get(trophyId);
  if (!trophy) {
    empty.hidden = false;
    detail.hidden = true;
    return;
  }
  const masked = isMasked(trophy, state);
  const earned = isEarned(state, trophy.id);
  empty.hidden = true;
  detail.hidden = false;
  const gradeEl = document.getElementById("detail-grade");
  gradeEl.textContent = gradeWord(trophy.grade) + " trophy" + (trophy.hidden ? " · Hidden" : "");
  gradeEl.className = "detail-grade grade-" + trophy.grade;
  document.getElementById("detail-name").textContent = masked ? "Hidden trophy" : trophy.name;
  document.getElementById("detail-desc").textContent = masked
    ? "This trophy is hidden on PlayStation until you earn it. Its name and description stay masked while the spoiler setting is on."
    : trophy.description;
  const facts = document.getElementById("detail-facts");
  facts.innerHTML = "";
  const factRows = [
    ["Kind", KIND_LABELS[trophy.kind] ?? trophy.kind],
    ["Missable", trophy.missable ? "Yes — see the Missables page" : "No"],
    ["Roadmap stage", trophy.stage + " — " + (guide.roadmap[trophy.stage - 1]?.title ?? "")],
  ];
  if (trophy.count !== null && trophy.count !== undefined) {
    factRows.push(["Tracked count", countWord(trophy)]);
  }
  for (const [term, value] of factRows) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = value;
    facts.appendChild(dt);
    facts.appendChild(dd);
  }
  document.getElementById("detail-guide").textContent = masked
    ? "The guide stays hidden with the trophy. Earn it first, or turn the spoiler setting off to read it."
    : trophy.guide;
  const sources = document.getElementById("detail-sources");
  sources.innerHTML = "";
  if (masked) {
    const li = document.createElement("li");
    li.textContent = "Sources are listed with the guide once the trophy is revealed.";
    sources.appendChild(li);
  } else {
    for (const source of trophy.sources) {
      const li = document.createElement("li");
      li.textContent = source;
      sources.appendChild(li);
    }
  }
  const toggle = document.getElementById("detail-toggle");
  toggle.textContent = earned ? "✓ Earned — click to unmark" : "Mark as earned";
  toggle.classList.toggle("earned", earned);
  toggle.onclick = () => onToggle(trophy.id);
}

export function renderRoadmap(guide, state) {
  const list = document.getElementById("roadmap-list");
  list.innerHTML = "";
  for (const stage of guide.roadmap) {
    const item = document.createElement("li");
    item.className = "roadmap-stage";
    const head = document.createElement("h3");
    head.textContent = "Stage " + stage.stage + ": " + stage.title + " ";
    const hours = document.createElement("span");
    hours.className = "stage-hours";
    hours.textContent = "· " + stage.hours;
    head.appendChild(hours);
    const body = document.createElement("p");
    body.textContent = stage.body;
    const chips = document.createElement("ul");
    chips.className = "stage-trophies";
    for (const trophy of guide.trophies.filter((t) => t.stage === stage.stage)) {
      const chip = document.createElement("li");
      chip.textContent = (isEarned(state, trophy.id) ? "✓ " : "") + trophy.name;
      if (isEarned(state, trophy.id)) chip.className = "done";
      chips.appendChild(chip);
    }
    item.appendChild(head);
    item.appendChild(body);
    item.appendChild(chips);
    list.appendChild(item);
  }
}

const SAFE_NOTES = [
  ["Kenton goes quiet — then returns.", "Kenton disappears after Chapter 1 and comes back later in the story, so his treasure diving strand is not missable."],
  ["The bowling robbery comes back.", "Let's Go Bowling takes all 3 key valuables from the Kingpin Bowling gang operation in Port Gellhorn, and the robbery returns later if you miss anything."],
  ["Optional missions disappear — there are more than enough.", "Many optional missions vanish after a while, but there are far more than the 100 the checklist needs."],
  ["Some fences leave for good.", "No fence that leaves has a trophy quest attached."],
  ["A few magazine collectibles sit in story buildings that close off.", "Those collectibles also spawn elsewhere, so nothing is locked away."],
  ["Quests with an hourglass icon can fail on a timer.", "None of them is tied to a trophy."],
];

export function renderMissables(guide, state, onPick, onToggle) {
  const list = document.getElementById("missable-list");
  list.innerHTML = "";
  for (const trophy of guide.trophies.filter((t) => t.missable)) {
    list.appendChild(rowFor(trophy, state, null, onPick, onToggle));
  }
  const safe = document.getElementById("safe-list");
  safe.innerHTML = "";
  for (const [title, note] of SAFE_NOTES) {
    const li = document.createElement("li");
    const b = document.createElement("b");
    b.textContent = title + " ";
    li.appendChild(b);
    li.appendChild(document.createTextNode(note));
    safe.appendChild(li);
  }
}
