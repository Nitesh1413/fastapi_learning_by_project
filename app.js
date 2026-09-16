const P = window.PROJECTS || [];
const STORAGE_KEY = "fastapiquest.done";
const THEME_KEY = "fastapiquest.theme";

let done = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
let current = null;

const $ = (id) => document.getElementById(id);

function esc(value) {
  return String(value).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...done].sort((a, b) => a - b)));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  $("theme").textContent = theme === "dark" ? "☀" : "☾";
}

function renderPhaseOptions() {
  const phaseEl = $("phase");
  const phases = [...new Set(P.map((x) => x.phase))];
  phases.forEach((phase) => {
    const option = document.createElement("option");
    option.value = phase;
    option.textContent = phase.replace(/\b\w/g, (m) => m.toUpperCase());
    phaseEl.appendChild(option);
  });
}

function filteredProjects() {
  const query = $("q").value.trim().toLowerCase();
  const phase = $("phase").value;
  return P.filter((project) => {
    const matchesQuery = !query || JSON.stringify(project).toLowerCase().includes(query);
    const matchesPhase = !phase || project.phase === phase;
    return matchesQuery && matchesPhase;
  });
}

function renderList() {
  const listEl = $("list");
  const items = filteredProjects();
  $("count").textContent = `${items.length}/${P.length}`;

  listEl.innerHTML = items.map((project) => `
    <button class="row ${project.id === current ? "active" : ""}" data-project-id="${project.id}">
      <span class="n">${String(project.id).padStart(2, "0")}</span>
      <span class="name">${esc(project.name)}</span>
      ${done.has(project.id) ? '<span class="tick">✓</span>' : ""}
    </button>
  `).join("");

  listEl.querySelectorAll("[data-project-id]").forEach((button) => {
    button.addEventListener("click", () => openProject(Number(button.dataset.projectId)));
  });
}

function openProject(id) {
  const project = P.find((item) => item.id === id);
  if (!project) return;

  current = id;
  $("empty").classList.add("hidden");
  $("view").classList.remove("hidden");

  $("ph").textContent = project.phase;
  $("num").textContent = `Project ${project.id} of ${P.length}`;
  $("title").textContent = project.name;
  $("summary").textContent = project.summary;
  $("tc").textContent = `${project.topics.length} topics`;
  $("sc").textContent = `${project.steps.length} steps`;

  $("topics").innerHTML = project.topics
    .map((topic) => `<span class="chip">${esc(topic)}</span>`)
    .join("");

  $("steps").innerHTML = project.steps.map((step) => `
    <div class="step">
      <div class="stepno">${step.step}</div>
      <div>
        <div class="task">${esc(step.task)}</div>
        <div class="learn">Learn: ${esc(step.learn)}</div>
      </div>
    </div>
  `).join("");

  $("tests").innerHTML = project.tests.map((test, index) => `
    <div class="test">
      <b>Test ${index + 1}: ${esc(test.name)}</b>
      <div class="purpose">${esc(test.purpose)}</div>
    </div>
  `).join("");

  updateCompletion();

  const index = P.findIndex((item) => item.id === id);
  $("prev").disabled = index <= 0;
  $("next").disabled = index >= P.length - 1;

  renderList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateCompletion() {
  const isDone = done.has(current);
  $("done").innerHTML = isDone ? '<div class="done">✓ Project completed</div>' : "";
  $("complete").disabled = isDone;
}

function goPrevious() {
  const index = P.findIndex((item) => item.id === current);
  if (index > 0) openProject(P[index - 1].id);
}

function goNext() {
  const index = P.findIndex((item) => item.id === current);
  if (index >= 0 && index < P.length - 1) openProject(P[index + 1].id);
}

setTheme(localStorage.getItem(THEME_KEY) || "light");
renderPhaseOptions();
renderList();

$("q").addEventListener("input", renderList);
$("phase").addEventListener("change", renderList);
$("theme").addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

$("complete").addEventListener("click", () => {
  if (current == null) return;
  done.add(current);
  save();
  updateCompletion();
  renderList();
});

$("clear").addEventListener("click", () => {
  if (current == null) return;
  done.delete(current);
  save();
  updateCompletion();
  renderList();
});

$("prev").addEventListener("click", goPrevious);
$("next").addEventListener("click", goNext);
