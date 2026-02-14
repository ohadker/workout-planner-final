const form = document.getElementById("logForm");
const historyEl = document.getElementById("history");
const clearAllBtn = document.getElementById("clearAll");

let logs = JSON.parse(localStorage.getItem("workout_logs")) || [];

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
    right.innerHTML = `${log.weight}kg x ${log.reps} `;

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
