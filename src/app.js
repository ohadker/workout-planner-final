let logs = JSON.parse(localStorage.getItem("workout_logs")) || [];
let plans = JSON.parse(localStorage.getItem("workout_plans")) || [];

function saveLogs() {
  localStorage.setItem("workout_logs", JSON.stringify(logs));
}

function savePlans() {
  localStorage.setItem("workout_plans", JSON.stringify(plans));
}

function addPlan() {
  const name = document.getElementById("planName").value.trim();
  if (!name) return;

  plans.push(name);
  savePlans();
  renderPlans();
  document.getElementById("planName").value = "";
}

function renderPlans() {
  const list = document.getElementById("plansList");
  const select = document.getElementById("planSelect");

  list.innerHTML = "";
  select.innerHTML = `<option value="">Select Plan</option>`;

  plans.forEach(plan => {
    const li = document.createElement("li");
    li.textContent = plan;
    list.appendChild(li);

    const option = document.createElement("option");
    option.value = plan;
    option.textContent = plan;
    select.appendChild(option);
  });
}

function renderLogs() {
  const history = document.getElementById("history");
  history.innerHTML = "";

  logs.forEach((log, index) => {
    const li = document.createElement("li");

    const volume = log.weight * log.reps;

    li.innerHTML = `
      <strong>${log.exercise}</strong>
      <span class="small">(${log.plan})</span><br>
      ${log.weight}kg x ${log.reps} (Volume: ${volume})<br>
      <span class="small">${log.date}</span>
      <button onclick="deleteLog(${index})">Delete</button>
    `;

    history.appendChild(li);
  });
}

function deleteLog(index) {
  logs.splice(index, 1);
  saveLogs();
  renderLogs();
}

document.getElementById("logForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const plan = document.getElementById("planSelect").value;
  const exercise = document.getElementById("exercise").value;
  const weight = Number(document.getElementById("weight").value);
  const reps = Number(document.getElementById("reps").value);

  if (!plan) {
    alert("Please select a workout plan");
    return;
  }

  logs.push({
    plan,
    exercise,
    weight,
    reps,
    date: new Date().toLocaleString()
  });

  saveLogs();
  renderLogs();
  this.reset();
});

renderPlans();
renderLogs();
