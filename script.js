const app = document.getElementById("app");
const lockScreen = document.getElementById("lockScreen");
const pinInput = document.getElementById("pinInput");
const unlockBtn = document.getElementById("unlockBtn");

const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteBody = document.getElementById("noteBody");
const statusText = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const createdAtText = document.getElementById("createdAt");
const updatedAtText = document.getElementById("updatedAt");

const newNoteBtn = document.getElementById("newNote");
const saveNoteBtn = document.getElementById("saveNote");
const templateBtn = document.getElementById("templateBtn");
const deleteNoteBtn = document.getElementById("deleteNote");
const pinNoteBtn = document.getElementById("pinNote");
const themeToggleBtn = document.getElementById("themeToggle");
const changePinBtn = document.getElementById("changePinBtn");
const lockBtn = document.getElementById("lockBtn");

const dutyToggle = document.getElementById("dutyToggle");
const liveClock = document.getElementById("liveClock");

const commandPalette = document.getElementById("commandPalette");
const commandInput = document.getElementById("commandInput");
const commandList = document.getElementById("commandList");

let STAFF_PIN = localStorage.getItem("lvrpPin") || "lvrpstaff";

let notes = JSON.parse(localStorage.getItem("lvrpStaffNotes")) || [];
let activeNoteId = null;
let autoSaveTimer = null;
let idleTimer = null;
let onDuty = localStorage.getItem("lvrpDuty") === "true";

function unlock() {
  const enteredPin = pinInput.value.trim();

  if (enteredPin === STAFF_PIN) {
    lockScreen.classList.add("hidden");
    app.classList.remove("hidden");
    localStorage.setItem("lvrpUnlocked", "true");
    pinInput.value = "";
    resetIdleTimer();
    setStatus("Unlocked");
  } else {
    pinInput.value = "";
    pinInput.placeholder = "Wrong PIN";
    pinInput.classList.add("shake");

    setTimeout(() => {
      pinInput.classList.remove("shake");
      pinInput.placeholder = "PIN";
    }, 900);
  }
}

function lockApp() {
  localStorage.removeItem("lvrpUnlocked");
  app.classList.add("hidden");
  lockScreen.classList.remove("hidden");
  closePalette();
}

function resetIdleTimer() {
  clearTimeout(idleTimer);

  if (app.classList.contains("hidden")) return;

  idleTimer = setTimeout(() => {
    lockApp();
  }, 300000);
}

function saveToStorage() {
  localStorage.setItem("lvrpStaffNotes", JSON.stringify(notes));
}

function setStatus(text) {
  if (!statusText) return;

  statusText.textContent = text;

  setTimeout(() => {
    statusText.textContent = "Ready";
  }, 1800);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function updateMeta(note) {
  createdAtText.textContent = `Created: ${formatDate(note?.createdAt)}`;
  updatedAtText.textContent = `Updated: ${formatDate(note?.updatedAt)}`;
}

function insertSodamibaTemplate() {
  const confirmTemplate = confirm("Create a new 'Spēlētāju sodāmība' note?");
  if (!confirmTemplate) return;

  activeNoteId = null;
  noteTitle.value = "Spēlētāju sodāmība";

  noteBody.value = `Informācija par spēlētāju:
(TX / ID / C-ID / Vārds Uzvārds)

Incidenta laiks:
(DATUMS / LAIKS)

Incidenta apraksts:
(LOĢISKS UN SAPROTAMS CITIEM!)

Pierādījumi:
(VISMAZ 7 DIENAS VĒL DERĪGI)

Secinājumi:
(PERSONĪGAIS KOMENTĀRS)

Iespējamā sodāmība:
(IEMESLS + LAIKS)`;

  saveNote(false);
  setStatus("Sodāmība template created");
}

function getFilteredNotes() {
  const query = searchInput.value.toLowerCase().trim();

  return notes
    .filter(note => {
      const title = (note.title || "").toLowerCase();
      const body = (note.body || "").toLowerCase();

      return title.includes(query) || body.includes(query);
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
}

function renderNotes() {
  notesList.innerHTML = "";

  const filteredNotes = getFilteredNotes();

  if (filteredNotes.length === 0) {
    notesList.innerHTML = `<p style="color:#777;">No notes found.</p>`;
    return;
  }

  filteredNotes.forEach(note => {
    const item = document.createElement("div");
    item.className = "note-item";

    if (note.id === activeNoteId) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <strong>${note.pinned ? "📌 " : ""}${escapeHTML(note.title || "Untitled Note")}</strong>
      <small>Updated: ${formatDate(note.updatedAt || note.createdAt)}</small>
    `;

    item.addEventListener("click", () => loadNote(note.id));
    notesList.appendChild(item);
  });
}

function loadNote(id) {
  const note = notes.find(note => note.id === id);
  if (!note) return;

  activeNoteId = note.id;
  noteTitle.value = note.title || "";
  noteBody.value = note.body || "";

  updateMeta(note);
  renderNotes();
  setStatus("Note loaded");
}

function newNote() {
  activeNoteId = null;
  noteTitle.value = "";
  noteBody.value = "";
  updateMeta(null);
  renderNotes();
  setStatus("New note");
}

function saveNote(silent = false) {
  const title = noteTitle.value.trim();
  const body = noteBody.value.trim();

  if (!title && !body) {
    if (!silent) setStatus("Empty note not saved");
    return;
  }

  const finalTitle = title || "Untitled Note";
  const now = new Date().toISOString();

  if (!activeNoteId) {
    activeNoteId = Date.now().toString();

    notes.push({
      id: activeNoteId,
      title: finalTitle,
      body,
      pinned: false,
      createdAt: now,
      updatedAt: now
    });
  } else {
    const note = notes.find(note => note.id === activeNoteId);

    if (note) {
      note.title = finalTitle;
      note.body = body;
      note.updatedAt = now;
    }
  }

  saveToStorage();
  renderNotes();
  updateMeta(notes.find(note => note.id === activeNoteId));

  if (!silent) {
    setStatus("Saved successfully");
  }
}

function autoSave() {
  clearTimeout(autoSaveTimer);
  statusText.textContent = "Typing...";

  autoSaveTimer = setTimeout(() => {
    saveNote(true);
    setStatus("Auto-saved");
  }, 700);
}

function deleteNote() {
  if (!activeNoteId) {
    setStatus("No note selected");
    return;
  }

  const confirmDelete = confirm("Delete this note?");
  if (!confirmDelete) return;

  notes = notes.filter(note => note.id !== activeNoteId);

  saveToStorage();
  newNote();
  setStatus("Note deleted");
}

function togglePin() {
  if (!activeNoteId) {
    setStatus("No note selected");
    return;
  }

  const note = notes.find(note => note.id === activeNoteId);
  if (!note) return;

  note.pinned = !note.pinned;
  note.updatedAt = new Date().toISOString();

  saveToStorage();
  renderNotes();
  updateMeta(note);

  setStatus(note.pinned ? "Note pinned" : "Note unpinned");
}

function toggleTheme() {
  document.body.classList.toggle("light");

  const theme = document.body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem("lvrpTheme", theme);

  setStatus(`${theme} theme enabled`);
}

function loadTheme() {
  const theme = localStorage.getItem("lvrpTheme");

  if (theme === "light") {
    document.body.classList.add("light");
  }
}

function changePin() {
  const currentPin = prompt("Enter current PIN");

  if (currentPin !== STAFF_PIN) {
    setStatus("Wrong current PIN");
    return;
  }

  const newPin = prompt("Enter new PIN");

  if (!newPin || newPin.trim().length < 4) {
    setStatus("PIN must be at least 4 characters");
    return;
  }

  localStorage.setItem("lvrpPin", newPin.trim());
  STAFF_PIN = newPin.trim();

  setStatus("PIN changed");
}

function updateClock() {
  liveClock.textContent = new Date().toLocaleTimeString();
}

function renderDutyStatus() {
  dutyToggle.textContent = onDuty ? "On Duty" : "Off Duty";
  dutyToggle.className = onDuty ? "status-btn on" : "status-btn off";
}

function toggleDuty() {
  onDuty = !onDuty;
  localStorage.setItem("lvrpDuty", String(onDuty));
  renderDutyStatus();
  setStatus(onDuty ? "You are now on duty" : "You are now off duty");
}

const commands = [
  {
    name: "New Note",
    action: newNote
  },
  {
    name: "Save Note",
    action: () => saveNote(false)
  },
  {
    name: "Sodāmība Template",
    action: insertSodamibaTemplate
  },
  {
    name: "Pin / Unpin Note",
    action: togglePin
  },
  {
    name: "Toggle Theme",
    action: toggleTheme
  },
  {
    name: "Change PIN",
    action: changePin
  },
  {
    name: "Toggle Duty Status",
    action: toggleDuty
  },
  {
    name: "Lock App",
    action: lockApp
  }
];

function openPalette() {
  commandPalette.classList.remove("hidden");
  commandInput.value = "";
  renderCommands();

  setTimeout(() => {
    commandInput.focus();
  }, 50);
}

function closePalette() {
  commandPalette.classList.add("hidden");
}

function renderCommands() {
  const search = commandInput.value.toLowerCase();

  commandList.innerHTML = "";

  const results = commands.filter(command =>
    command.name.toLowerCase().includes(search)
  );

  if (results.length === 0) {
    commandList.innerHTML = `<div class="command-item">No commands found</div>`;
    return;
  }

  results.forEach(command => {
    const item = document.createElement("div");
    item.className = "command-item";
    item.textContent = command.name;

    item.addEventListener("click", () => {
      command.action();
      closePalette();
    });

    commandList.appendChild(item);
  });
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

unlockBtn.addEventListener("click", unlock);

pinInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    unlock();
  }
});

newNoteBtn.addEventListener("click", newNote);
saveNoteBtn.addEventListener("click", () => saveNote(false));
templateBtn.addEventListener("click", insertSodamibaTemplate);
deleteNoteBtn.addEventListener("click", deleteNote);
pinNoteBtn.addEventListener("click", togglePin);
themeToggleBtn.addEventListener("click", toggleTheme);
changePinBtn.addEventListener("click", changePin);
lockBtn.addEventListener("click", lockApp);
dutyToggle.addEventListener("click", toggleDuty);

searchInput.addEventListener("input", renderNotes);
noteTitle.addEventListener("input", autoSave);
noteBody.addEventListener("input", autoSave);
commandInput.addEventListener("input", renderCommands);

commandPalette.addEventListener("click", event => {
  if (event.target === commandPalette) {
    closePalette();
  }
});

document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if ((event.ctrlKey || event.metaKey) && key === "s") {
    event.preventDefault();
    saveNote(false);
  }

  if ((event.ctrlKey || event.metaKey) && key === "k") {
    event.preventDefault();
    openPalette();
  }

  if ((event.ctrlKey || event.metaKey) && key === "n") {
    event.preventDefault();
    newNote();
  }

  if (event.key === "Escape") {
    closePalette();
  }
});

["mousemove", "keydown", "click", "input"].forEach(eventType => {
  document.addEventListener(eventType, resetIdleTimer);
});

loadTheme();
renderDutyStatus();
renderNotes();
updateMeta(null);
updateClock();

setInterval(updateClock, 1000);

if (localStorage.getItem("lvrpUnlocked") === "true") {
  lockScreen.classList.add("hidden");
  app.classList.remove("hidden");
  resetIdleTimer();
}
