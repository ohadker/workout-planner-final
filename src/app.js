let logs = [];
let plans = [];

function loadData() {
  logs = JSON.parse(localStorage.getItem("workout_logs")) || [];
  plans = JSON.parse(localStorage.getItem("workout_plans")) || [];
}

function saveLogs() {
  localStorage.setItem("workout_logs", JSON.stringify(logs));
}

function savePlans() {
  localStorage.setItem("workout_plans", JSON.stringify(plans));
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

/* ---------------- Plans ---------------- */

function addPlan() {
  const input = document.getElementById("planName");
  const name = input.value.trim();

  if (!name) return;

  // prevent duplicates (case-insensitive)
  const exists = plans.some(p => normalizeName(p) === normalizeName(name));
  if (exists) {
    alert("Plan already exists");
    return;
  }

  plans.push(name);
  savePlans();
  renderPlans();
  input.value = "";
}

function deletePlan(index) {
  const planName = plans[index];
  if (!planName) return;

  // remove plan
  plans.splice(index, 1);

  // remove logs related to this plan
  logs = logs.filter(l => l.plan !== planName);

  savePlans();
  saveLogs();
  renderPlans();
  renderLogs();
}

function renderPlans() {
  const list = document.getElementById("plansList");
  const select = document.getElementById("planSelect");

  // safety
  if (!list || !select) return;

  list.innerHTML = "";
  select.innerHTML = `<option value="">Select Plan</option>`;

  if (plans.length === 0) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="small">No plans yet. Create one above.</span>`;
    list.appendChild(li);
    return;
  }

  plans.forEach((plan, index) => {
    // list item
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.innerHTML = `<strong>${plan}</strong>`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "danger";
    delBtn.onclick = () => deletePlan(index);

    li.appendChild(left);
    li.appendChild(delBtn);
    list.appendChild(li);

    // dropdown option
    const opt = document.createElement("option");
    opt.value = plan;
    opt.textContent = plan;
    select.appendChild(opt);
  });
}

/* ---------------- Logs ---------------- */

function addLog(e) {
  e.preventDefault();

  const plan = document.getElementById("planSelect").value;
  const exercise = document.getElementById("exercise").value.trim();
  const weight = Number(document.getElementById("weight").value);
  const reps = Number(document.getElementById("reps").value);

  if (!plan) {
    alert("Please select a plan");
    return;
  }
  if (!exercise) return;

  logs.push({
    plan,
    exercise,
    weight,
    reps,
    date: new Date().toLocaleString()
  });

  saveLogs();
  renderLogs();
  e.target.reset();
}

function deleteLog(index) {
  logs.splice(index, 1);
  saveLogs();
  renderLogs();
}

function clearAllLogs() {
  logs = [];
  saveLogs();
  renderLogs();
}

function renderLogs() {
  const history = document.getElementById("history");
  if (!history) return;

  history.innerHTML = "";

  if (logs.length === 0) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="small">No logs yet. Add your first workout!</span>`;
    history.appendChild(li);
    return;
  }

  // show newest first
  logs.slice().reverse().forEach((log, idxFromEnd) => {
    const realIndex = logs.length - 1 - idxFromEnd;
    const volume = log.weight * log.reps;

    const li = document.createElement("li");
    const left = document.createElement("div");
    left.innerHTML = `
      <strong>${log.exercise}</strong>
      <span class="small">(${log.plan})</span>
      <div class="small">${log.date}</div>
      <div>${log.weight}kg x ${log.reps} (Volume: ${volume})</div>
    `;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteLog(realIndex);

    li.appendChild(left);
    li.appendChild(delBtn);
    history.appendChild(li);
  });
}

/* ---------------- Init ---------------- */

window.addEventListener("DOMContentLoaded", () => {
  loadData();

  // bind buttons/events
  document.getElementById("createPlanBtn").addEventListener("click", addPlan);
  document.getElementById("logForm").addEventListener("submit", addLog);
  document.getElementById("clearLogsBtn").addEventListener("click", clearAllLogs);

  renderPlans();
  renderLogs();
});
