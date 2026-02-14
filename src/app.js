const form = document.getElementById("logForm");
const historyEl = document.getElementById("history");
const clearAllBtn = document.getElementById("clearAll");

let logs = JSON.parse(localStorage.getItem("workout_logs")) || [];
let plans = JSON.parse(localStorage.getItem("workout_plans")) || [];

function save() {
  localStorage.setItem("workout_logs", JSON.stringify(logs));
}

function render() {
  historyEl.innerHTML = "";

  if (logs.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No logs yet. Add your first workout!";
    historyEl.appendChild(li);
    return;
  }

  logs.slice().reverse().forEach((log, indexFromEnd) => {
    const realIndex = logs.length - 1 - indexFromEnd;

    const li = document.createElement("li");

    const left = document.createElement("div");
    left.innerHTML = `<strong>${log.exercise}</strong><div class="small">${log.date}</div>`;

    const right = document.createElement("div");
    const volume = log.weight * log.reps;
right.innerHTML = `${log.weight}kg x ${log.reps} (Volume: ${volume}) `;


    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      logs.splice(realIndex, 1);
      save();
      render();
    };

    right.appendChild(delBtn);
    li.appendChild(left);
    li.appendChild(right);

    historyEl.appendChild(li);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const exercise = document.getElementById("exercise").value.trim();
  const weight = Number(document.getElementById("weight").value);
  const reps = Number(document.getElementById("reps").value);

  logs.push({
    exercise,
    weight,
    reps,
    date: new Date().toLocaleString()
  });

  save();
  render();
  form.reset();
});

clearAllBtn.addEventListener("click", () => {
  logs = [];
  save();
  render();
});

render();
function savePlans() {
  localStorage.setItem("workout_plans", JSON.stringify(plans));
}

function renderPlans() {
  const list = document.getElementById("plansList");
  list.innerHTML = "";

  plans.forEach((plan, index) => {
    const li = document.createElement("li");
    li.textContent = plan;
    list.appendChild(li);
  });
}

function addPlan() {
  const name = document.getElementById("planName").value.trim();
  if (!name) return;

  plans.push(name);
  savePlans();
  renderPlans();
  document.getElementById("planName").value = "";
}

renderPlans();
