// -------------------- Storage Keys --------------------
const LS_PLANS = "wt_plans_v2";
const LS_LOGS  = "wt_logs_v2";

// -------------------- State --------------------
let plans = []; // [{ id, name, exercises: [{id, name}] }]
let logs = [];  // [{ id, dateISO, planId, planName, exerciseId, exerciseName, weight, reps }]

let expandedPlans = new Set(); // planId expanded/collapsed
let activeFilters = {
  text: "",
  planId: "",
  exerciseId: "",
};

// Chart
let chartInstance = null;

// -------------------- Utilities --------------------
function uid(prefix="id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function normalize(s) {
  return (s || "").trim().toLowerCase();
}

function formatDate(dateISO) {
  try {
    return new Date(dateISO).toLocaleString();
  } catch {
    return String(dateISO);
  }
}

function calcVolume(weight, reps) {
  return Number(weight) * Number(reps);
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str) ?? fallback;
  } catch {
    return fallback;
  }
}

// -------------------- Load/Save --------------------
function loadData() {
  plans = safeJsonParse(localStorage.getItem(LS_PLANS), []);
  logs  = safeJsonParse(localStorage.getItem(LS_LOGS), []);

  // default expansion: expand all plans once
  expandedPlans = new Set(plans.map(p => p.id));
}

function savePlans() {
  localStorage.setItem(LS_PLANS, JSON.stringify(plans));
}

function saveLogs() {
  localStorage.setItem(LS_LOGS, JSON.stringify(logs));
}

// -------------------- DOM Helpers --------------------
function el(id) { return document.getElementById(id); }

// -------------------- Plans CRUD --------------------
function addPlan() {
  const name = el("planName").value.trim();
  if (!name) return;

  const exists = plans.some(p => normalize(p.name) === normalize(name));
  if (exists) {
    alert("Plan already exists");
    return;
  }

  const plan = { id: uid("plan"), name, exercises: [] };
  plans.push(plan);
  expandedPlans.add(plan.id);

  savePlans();
  renderAll();

  el("planName").value = "";
}

function deletePlan(planId) {
  const plan = plans.find(p => p.id === planId);
  if (!plan) return;

  const ok = confirm(`Delete plan "${plan.name}"?\nThis will also delete its logs.`);
  if (!ok) return;

  plans = plans.filter(p => p.id !== planId);
  logs = logs.filter(l => l.planId !== planId);
  expandedPlans.delete(planId);

  // If filters point to deleted things
  if (activeFilters.planId === planId) activeFilters.planId = "";
  if (activeFilters.exerciseId) {
    // could point to deleted exercise
    const stillExists = plans.some(p => p.exercises.some(x => x.id === activeFilters.exerciseId));
    if (!stillExists) activeFilters.exerciseId = "";
  }

  savePlans();
  saveLogs();
  renderAll();
}

function renamePlan(planId) {
  const plan = plans.find(p => p.id === planId);
  if (!plan) return;

  const next = prompt("New plan name:", plan.name);
  if (!next) return;

  const name = next.trim();
  if (!name) return;

  const exists = plans.some(p => p.id !== planId && normalize(p.name) === normalize(name));
  if (exists) {
    alert("Another plan already has that name.");
    return;
  }

  // Update plan name and also update logs' planName snapshot
  plan.name = name;
  logs = logs.map(l => l.planId === planId ? { ...l, planName: name } : l);

  savePlans();
  saveLogs();
  renderAll();
}

// -------------------- Exercises CRUD --------------------
function addExerciseToPlan() {
  const planId = el("planForExerciseSelect").value;
  const exName = el("exerciseName").value.trim();

  if (!planId) {
    alert("Select a plan first");
    return;
  }
  if (!exName) return;

  const plan = plans.find(p => p.id === planId);
  if (!plan) return;

  const exists = plan.exercises.some(x => normalize(x.name) === normalize(exName));
  if (exists) {
    alert("Exercise already exists in this plan");
    return;
  }

  plan.exercises.push({ id: uid("ex"), name: exName });
  expandedPlans.add(planId);

  savePlans();
  renderAll();

  el("exerciseName").value = "";
}

function deleteExercise(planId, exerciseId) {
  const plan = plans.find(p => p.id === planId);
  if (!plan) return;

  const ex = plan.exercises.find(x => x.id === exerciseId);
  if (!ex) return;

  const ok = confirm(`Delete exercise "${ex.name}" from "${plan.name}"?\nLogs for this exercise will also be deleted.`);
  if (!ok) return;

  plan.exercises = plan.exercises.filter(x => x.id !== exerciseId);
  logs = logs.filter(l => !(l.planId === planId && l.exerciseId === exerciseId));

  if (activeFilters.exerciseId === exerciseId) activeFilters.exerciseId = "";

  savePlans();
  saveLogs();
  renderAll();
}

function renameExercise(planId, exerciseId) {
  const plan = plans.find(p => p.id === planId);
  if (!plan) return;

  const ex = plan.exercises.find(x => x.id === exerciseId);
  if (!ex) return;

  const next = prompt("New exercise name:", ex.name);
  if (!next) return;

  const name = next.trim();
  if (!name) return;

  const exists = plan.exercises.some(x => x.id !== exerciseId && normalize(x.name) === normalize(name));
  if (exists) {
    alert("Another exercise already has that name in this plan.");
    return;
  }

  ex.name = name;

  // Update logs' exerciseName snapshot
  logs = logs.map(l => (l.planId === planId && l.exerciseId === exerciseId) ? { ...l, exerciseName: name } : l);

  savePlans();
  saveLogs();
  renderAll();
}

// -------------------- Expand/Collapse --------------------
function togglePlan(planId) {
  if (expandedPlans.has(planId)) expandedPlans.delete(planId);
  else expandedPlans.add(planId);
  renderPlans();
}

function expandAll() {
  expandedPlans = new Set(plans.map(p => p.id));
  renderPlans();
}

function collapseAll() {
  expandedPlans = new Set();
  renderPlans();
}

// -------------------- Logs CRUD --------------------
function addLog(e) {
  e.preventDefault();

  const planId = el("planSelect").value;
  const exerciseId = el("exerciseSelect").value;
  const weight = Number(el("weight").value);
  const reps = Number(el("reps").value);

  if (!planId) return alert("Select a plan");
  if (!exerciseId) return alert("Select an exercise");

  const plan = plans.find(p => p.id === planId);
  if (!plan) return alert("Plan not found (try refresh)");

  const ex = plan.exercises.find(x => x.id === exerciseId);
  if (!ex) return alert("Exercise not found (try refresh)");

  const log = {
    id: uid("log"),
    dateISO: new Date().toISOString(),
    planId,
    planName: plan.name, // snapshot for display even if renamed later (we update on rename anyway)
    exerciseId,
    exerciseName: ex.name,
    weight,
    reps
  };

  logs.push(log);
  saveLogs();

  renderLogs();
  renderStats();
  updateSuggestion();
  refreshChart();

  el("logForm").reset();
  // keep plan selection if you want: comment out next line to keep selection
  el("planSelect").value = planId;
  onPlanChanged(); // rebuild exercises dropdown for current plan
}

function deleteLog(logId) {
  logs = logs.filter(l => l.id !== logId);
  saveLogs();
  renderLogs();
  renderStats();
  updateSuggestion();
  refreshChart();
}

function clearAllLogs() {
  const ok = confirm("Clear ALL logs? Plans and exercises will stay.");
  if (!ok) return;

  logs = [];
  saveLogs();
  renderLogs();
  renderStats();
  updateSuggestion();
  refreshChart();
}

// -------------------- Filters --------------------
function applyFilters() {
  activeFilters.text = normalize(el("filterText").value);
  activeFilters.planId = el("filterPlan").value;
  activeFilters.exerciseId = el("filterExercise").value;

  renderLogs();
  renderStats();
  refreshChart();
}

function resetFilters() {
  activeFilters = { text: "", planId: "", exerciseId: "" };
  el("filterText").value = "";
  el("filterPlan").value = "";
  el("filterExercise").value = "";
  renderAll();
}

function filterLogs(logList) {
  return logList.filter(l => {
    if (activeFilters.planId && l.planId !== activeFilters.planId) return false;
    if (activeFilters.exerciseId && l.exerciseId !== activeFilters.exerciseId) return false;
    if (activeFilters.text) {
      const t = activeFilters.text;
      const hay = normalize(`${l.exerciseName} ${l.planName}`);
      if (!hay.includes(t)) return false;
    }
    return true;
  });
}

// -------------------- Suggestions (Smart) --------------------
// Simple rule:
// - If last 2 logs for this exercise have reps >= 8 with same weight -> suggest +2.5kg
// - If reps were low (<5) -> suggest keep weight
function updateSuggestion() {
  const planId = el("planSelect").value;
  const exerciseId = el("exerciseSelect").value;
  const box = el("suggestBox");
  box.innerHTML = "";

  if (!planId || !exerciseId) return;

  const relevant = logs
    .filter(l => l.planId === planId && l.exerciseId === exerciseId)
    .slice()
    .sort((a,b) => b.dateISO.localeCompare(a.dateISO)); // newest first

  if (relevant.length === 0) {
    box.innerHTML = `<strong>Suggestion</strong> No previous logs for this exercise yet. Start with a comfortable weight.`;
    return;
  }

  const last = relevant[0];
  const lastVol = calcVolume(last.weight, last.reps);

  // find last two with same weight
  const sameWeight = relevant.filter(x => x.weight === last.weight);
  const repsGood = sameWeight.length >= 2 && sameWeight[0].reps >= 8 && sameWeight[1].reps >= 8;

  let suggestion = "";
  if (repsGood) {
    const nextW = Math.round((last.weight + 2.5) * 2) / 2; // keep .5 increments
    suggestion = `You're consistent at ${last.weight}kg. Try ${nextW}kg next time (small progressive overload).`;
  } else if (last.reps < 5) {
    suggestion = `Reps were low last time. Keep ${last.weight}kg and aim for +1 rep.`;
  } else {
    suggestion = `Aim to beat last time: ${last.weight}kg × ${last.reps} (Volume ${lastVol}). Add 1 rep or improve form.`;
  }

  box.innerHTML = `<strong>Suggestion</strong> ${suggestion}`;
}

// -------------------- Rendering (Plans) --------------------
function renderPlanDropdowns() {
  const planSelect = el("planSelect");
  const planForEx = el("planForExerciseSelect");
  const filterPlan = el("filterPlan");

  const planOptionsHtml = (plans.length === 0)
    ? `<option value="">No Plans</option>`
    : `<option value="">Select Plan</option>` + plans.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  // For log form
  planSelect.innerHTML = `<option value="">Select Plan</option>` + plans.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  // For adding exercise
  planForEx.innerHTML = `<option value="">Select Plan</option>` + plans.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  // For filters
  filterPlan.innerHTML = `<option value="">All Plans</option>` + plans.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  // keep selected filter plan if possible
  if (activeFilters.planId) filterPlan.value = activeFilters.planId;
}

function renderExerciseDropdownsForPlan(planId) {
  const exSelect = el("exerciseSelect");
  exSelect.innerHTML = `<option value="">Select Exercise</option>`;

  if (!planId) return;

  const plan = plans.find(p => p.id === planId);
  if (!plan) return;

  plan.exercises.forEach(x => {
    exSelect.innerHTML += `<option value="${x.id}">${x.name}</option>`;
  });

  // Also update filter exercise list based on chosen filter plan (optional)
}

function renderFilterExerciseDropdown() {
  const filterEx = el("filterExercise");
  const planId = el("filterPlan").value || activeFilters.planId;

  let exercises = [];
  if (planId) {
    const plan = plans.find(p => p.id === planId);
    exercises = plan ? plan.exercises : [];
  } else {
    // all exercises across all plans (unique by id)
    const map = new Map();
    plans.forEach(p => p.exercises.forEach(x => map.set(x.id, { id:x.id, name:x.name, planName:p.name })));
    exercises = Array.from(map.values());
  }

  filterEx.innerHTML = `<option value="">All Exercises</option>` + exercises.map(x => {
    const label = x.planName ? `${x.name} — ${x.planName}` : x.name;
    return `<option value="${x.id}">${label}</option>`;
  }).join("");

  if (activeFilters.exerciseId) filterEx.value = activeFilters.exerciseId;
}

function renderPlans() {
  const container = el("plansContainer");
  container.innerHTML = "";

  if (plans.length === 0) {
    container.innerHTML = `<div class="muted">No plans yet. Create a plan above.</div>`;
    return;
  }

  plans.forEach(plan => {
    const isExpanded = expandedPlans.has(plan.id);

    const wrapper = document.createElement("div");
    wrapper.className = "plan-card";

    const header = document.createElement("div");
    header.className = "plan-header";

    const title = document.createElement("div");
    title.className = "plan-title";
    title.innerHTML = `
      <strong>${plan.name}</strong>
      <span class="badge">${plan.exercises.length} exercises</span>
    `;

    const actions = document.createElement("div");
    actions.className = "plan-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "small-btn";
    toggleBtn.textContent = isExpanded ? "Collapse" : "Expand";
    toggleBtn.onclick = () => togglePlan(plan.id);

    const renameBtn = document.createElement("button");
    renameBtn.className = "small-btn";
    renameBtn.textContent = "Rename";
    renameBtn.onclick = () => renamePlan(plan.id);

    const delBtn = document.createElement("button");
    delBtn.className = "small-btn danger";
    delBtn.textContent = "Delete Plan";
    delBtn.onclick = () => deletePlan(plan.id);

    actions.appendChild(toggleBtn);
    actions.appendChild(renameBtn);
    actions.appendChild(delBtn);

    header.appendChild(title);
    header.appendChild(actions);

    wrapper.appendChild(header);

    if (isExpanded) {
      const list = document.createElement("ul");
      list.className = "exercise-list";

      if (plan.exercises.length === 0) {
        const empty = document.createElement("div");
        empty.className = "muted";
        empty.style.marginTop = "8px";
        empty.textContent = "No exercises yet. Add one above.";
        wrapper.appendChild(empty);
      } else {
        plan.exercises.forEach(ex => {
          const item = document.createElement("li");
          item.className = "exercise-item";

          const left = document.createElement("div");
          left.innerHTML = `<strong>${ex.name}</strong> <span class="muted">(${plan.name})</span>`;

          const btns = document.createElement("div");
          btns.className = "row";

          const ren = document.createElement("button");
          ren.className = "small-btn";
          ren.textContent = "Rename";
          ren.onclick = () => renameExercise(plan.id, ex.id);

          const del = document.createElement("button");
          del.className = "small-btn danger";
          del.textContent = "Delete";
          del.onclick = () => deleteExercise(plan.id, ex.id);

          btns.appendChild(ren);
          btns.appendChild(del);

          item.appendChild(left);
          item.appendChild(btns);

          list.appendChild(item);
        });

        wrapper.appendChild(list);
      }
    }

    container.appendChild(wrapper);
  });
}

// -------------------- Rendering (Logs + Stats) --------------------
function renderLogs() {
  const list = el("history");
  list.innerHTML = "";

  const filtered = filterLogs(logs)
    .slice()
    .sort((a,b) => b.dateISO.localeCompare(a.dateISO)); // newest first

  if (filtered.length === 0) {
    list.innerHTML = `<li><div class="muted">No logs match your filters.</div></li>`;
    return;
  }

  filtered.forEach(l => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.className = "left";

    const volume = calcVolume(l.weight, l.reps);

    left.innerHTML = `
      <div>
        <strong>${l.exerciseName}</strong>
        <span class="badge">${l.planName}</span>
      </div>
      <div class="muted">${formatDate(l.dateISO)}</div>
      <div>${l.weight}kg × ${l.reps} <span class="muted">(Volume: ${volume})</span></div>
    `;

    const right = document.createElement("div");
    const del = document.createElement("button");
    del.className = "danger";
    del.textContent = "Delete";
    del.onclick = () => deleteLog(l.id);

    right.appendChild(del);

    li.appendChild(left);
    li.appendChild(right);

    list.appendChild(li);
  });
}

function renderStats() {
  const filtered = filterLogs(logs);

  el("statTotalLogs").textContent = String(filtered.length);

  const totalVolume = filtered.reduce((sum, l) => sum + calcVolume(l.weight, l.reps), 0);
  el("statTotalVolume").textContent = String(totalVolume);

  const uniqueEx = new Set(filtered.map(l => l.exerciseId));
  el("statUniqueExercises").textContent = String(uniqueEx.size);

  const last = filtered.slice().sort((a,b) => b.dateISO.localeCompare(a.dateISO))[0];
  el("statLastWorkout").textContent = last ? formatDate(last.dateISO) : "—";
}

// -------------------- Chart --------------------
function refreshChart() {
  const planId = el("planSelect").value || activeFilters.planId;
  const exId = el("exerciseSelect").value || activeFilters.exerciseId;
  const metric = el("chartMetric").value;

  const ctx = el("progressChart").getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (!planId || !exId) {
    // No selection
    chartInstance = new Chart(ctx, {
      type: "line",
      data: { labels: ["Select plan+exercise"], datasets: [{ label: "Progress", data: [0] }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
    return;
  }

  const series = logs
    .filter(l => l.planId === planId && l.exerciseId === exId)
    .slice()
    .sort((a,b) => a.dateISO.localeCompare(b.dateISO)); // oldest -> newest

  const labels = series.map(l => new Date(l.dateISO).toLocaleDateString());
  const data = series.map(l => metric === "volume" ? calcVolume(l.weight, l.reps) : l.weight);

  const exName = series[0]?.exerciseName || "Exercise";
  const label = metric === "volume" ? `${exName} — Volume` : `${exName} — Weight`;

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{ label, data }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// -------------------- Import/Export --------------------
function exportJson() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    plans,
    logs
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "workout_planner_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const payload = safeJsonParse(reader.result, null);
    if (!payload || !payload.plans || !payload.logs) {
      alert("Invalid JSON file");
      return;
    }
    plans = payload.plans;
    logs = payload.logs;

    savePlans();
    saveLogs();
    expandedPlans = new Set(plans.map(p => p.id));
    alert("Import successful!");
    renderAll();
  };
  reader.readAsText(file);
}

function resetAll() {
  const ok = confirm("Reset EVERYTHING? (Plans + Exercises + Logs)");
  if (!ok) return;

  localStorage.removeItem(LS_PLANS);
  localStorage.removeItem(LS_LOGS);
  plans = [];
  logs = [];
  expandedPlans = new Set();
  activeFilters = { text:"", planId:"", exerciseId:"" };
  renderAll();
}

// -------------------- Events --------------------
function onPlanChanged() {
  const planId = el("planSelect").value;
  renderExerciseDropdownsForPlan(planId);
  updateSuggestion();
  refreshChart();
}

function onExerciseChanged() {
  updateSuggestion();
  refreshChart();
}

function bindEvents() {
  el("createPlanBtn").addEventListener("click", addPlan);
  el("addExerciseBtn").addEventListener("click", addExerciseToPlan);
  el("logForm").addEventListener("submit", addLog);

  el("planSelect").addEventListener("change", onPlanChanged);
  el("exerciseSelect").addEventListener("change", onExerciseChanged);

  el("clearLogsBtn").addEventListener("click", clearAllLogs);

  el("applyFiltersBtn").addEventListener("click", applyFilters);
  el("resetFiltersBtn").addEventListener("click", resetFilters);

  el("filterPlan").addEventListener("change", () => {
    // update exercise filter options based on chosen plan
    activeFilters.planId = el("filterPlan").value;
    activeFilters.exerciseId = "";
    renderFilterExerciseDropdown();
  });

  el("refreshChartBtn").addEventListener("click", refreshChart);

  el("expandAllBtn").addEventListener("click", expandAll);
  el("collapseAllBtn").addEventListener("click", collapseAll);

  el("exportBtn").addEventListener("click", exportJson);

  el("importInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importJsonFile(file);
    e.target.value = ""; // reset
  });

  el("resetAllBtn").addEventListener("click", resetAll);
}

// -------------------- Render All --------------------
function renderAll() {
  renderPlanDropdowns();
  renderPlans();
  renderFilterExerciseDropdown();

  // Rebuild exercise dropdown for currently selected plan (if any)
  const currentPlan = el("planSelect").value;
  renderExerciseDropdownsForPlan(currentPlan);

  renderLogs();
  renderStats();
  updateSuggestion();
  refreshChart();
}

// -------------------- Init --------------------
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  bindEvents();
  renderAll();
});
