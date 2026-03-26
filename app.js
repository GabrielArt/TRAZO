const STORAGE_KEY = "tutorial_vault_v1";

const STATUS_ORDER = ["Por ver", "En progreso", "Aplicado", "Archivado"];

const state = {
  tutorials: loadTutorials(),
  search: "",
  view: "table",
  type: "all",
  status: "all",
  category: "all",
  editingId: null,
};

const refs = {
  statsGrid: document.querySelector("#statsGrid"),
  tableView: document.querySelector("#tableView"),
  galleryView: document.querySelector("#galleryView"),
  boardView: document.querySelector("#boardView"),
  searchInput: document.querySelector("#searchInput"),
  viewSelect: document.querySelector("#viewSelect"),
  typeFilter: document.querySelector("#typeFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  newTutorialButton: document.querySelector("#newTutorialButton"),
  dialog: document.querySelector("#tutorialDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  tutorialForm: document.querySelector("#tutorialForm"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  deleteButton: document.querySelector("#deleteButton"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
  seedDataButton: document.querySelector("#seedDataButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importInput: document.querySelector("#importInput"),
  typeInput: document.querySelector("#typeInput"),
  sourceInput: document.querySelector("#sourceInput"),
  imageUrlField: document.querySelector("#imageUrlField"),
  textContentField: document.querySelector("#textContentField"),
};

init();

function init() {
  bindEvents();
  syncTypeSpecificFields();
  render();
}

function bindEvents() {
  refs.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  refs.viewSelect.addEventListener("change", (event) => {
    state.view = event.target.value;
    render();
  });

  refs.typeFilter.addEventListener("change", (event) => {
    state.type = event.target.value;
    render();
  });

  refs.statusFilter.addEventListener("change", (event) => {
    state.status = event.target.value;
    render();
  });

  refs.categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    render();
  });

  refs.newTutorialButton.addEventListener("click", () => {
    openDialogForCreate();
  });

  refs.closeDialogButton.addEventListener("click", () => {
    refs.dialog.close();
  });

  refs.tutorialForm.addEventListener("submit", (event) => {
    event.preventDefault();
    upsertTutorialFromForm();
  });

  refs.deleteButton.addEventListener("click", () => {
    if (!state.editingId) {
      refs.dialog.close();
      return;
    }

    const item = state.tutorials.find((tutorial) => tutorial.id === state.editingId);
    if (!item) {
      refs.dialog.close();
      return;
    }

    const confirmed = window.confirm(`Eliminar "${item.title}"?`);
    if (!confirmed) {
      return;
    }

    state.tutorials = state.tutorials.filter((tutorial) => tutorial.id !== state.editingId);
    persistTutorials();
    refs.dialog.close();
    render();
  });

  refs.tableView.addEventListener("click", onActionClick);
  refs.galleryView.addEventListener("click", onActionClick);
  refs.boardView.addEventListener("click", onActionClick);

  refs.typeInput.addEventListener("change", syncTypeSpecificFields);

  document.querySelectorAll("[data-status-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.statusShortcut;
      refs.statusFilter.value = state.status;
      render();
    });
  });

  refs.seedDataButton.addEventListener("click", () => {
    if (state.tutorials.length > 0) {
      const confirmed = window.confirm("Ya tienes datos. ¿Agregar ejemplos igualmente?");
      if (!confirmed) {
        return;
      }
    }
    injectDemoData();
  });

  refs.exportButton.addEventListener("click", exportJson);
  refs.importButton.addEventListener("click", () => refs.importInput.click());
  refs.importInput.addEventListener("change", importJson);
}

function onActionClick(event) {
  const editTarget = event.target.closest("[data-edit-id]");
  if (editTarget) {
    openDialogForEdit(editTarget.dataset.editId);
    return;
  }

  const deleteTarget = event.target.closest("[data-delete-id]");
  if (!deleteTarget) {
    return;
  }

  const id = deleteTarget.dataset.deleteId;
  const target = state.tutorials.find((tutorial) => tutorial.id === id);
  if (!target) {
    return;
  }

  const confirmed = window.confirm(`Eliminar "${target.title}"?`);
  if (!confirmed) {
    return;
  }

  state.tutorials = state.tutorials.filter((tutorial) => tutorial.id !== id);
  persistTutorials();
  render();
}

function render() {
  renderStats();
  renderCategoryOptions();
  renderView();
}

function renderStats() {
  const total = state.tutorials.length;
  const byStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = state.tutorials.filter((tutorial) => tutorial.status === status).length;
    return acc;
  }, {});

  refs.statsGrid.innerHTML = `
    <article class="stat-card">
      <p>Total tutoriales</p>
      <strong>${total}</strong>
    </article>
    <article class="stat-card">
      <p>Por ver</p>
      <strong>${byStatus["Por ver"]}</strong>
    </article>
    <article class="stat-card">
      <p>En progreso</p>
      <strong>${byStatus["En progreso"]}</strong>
    </article>
    <article class="stat-card">
      <p>Aplicado</p>
      <strong>${byStatus["Aplicado"]}</strong>
    </article>
  `;
}

function renderCategoryOptions() {
  const categories = [...new Set(state.tutorials.map((tutorial) => tutorial.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es")
  );

  const previous = state.category;
  refs.categoryFilter.innerHTML = `<option value="all">Todas</option>`;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    refs.categoryFilter.append(option);
  });

  if (previous !== "all" && !categories.includes(previous)) {
    state.category = "all";
  }
  refs.categoryFilter.value = state.category;
}

function renderView() {
  refs.tableView.classList.toggle("hidden", state.view !== "table");
  refs.galleryView.classList.toggle("hidden", state.view !== "gallery");
  refs.boardView.classList.toggle("hidden", state.view !== "board");

  const filtered = getFilteredTutorials();

  if (state.view === "table") {
    renderTable(filtered);
    return;
  }
  if (state.view === "gallery") {
    renderGallery(filtered);
    return;
  }
  renderBoard(filtered);
}

function renderTable(items) {
  if (items.length === 0) {
    renderEmptyInto(refs.tableView);
    return;
  }

  refs.tableView.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Repaso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (tutorial) => `
              <tr>
                <td>${escapeHtml(tutorial.title)}</td>
                <td>${formatType(tutorial.type)}</td>
                <td>${escapeHtml(tutorial.category || "Sin categoría")}</td>
                <td><span class="pill ${statusPillClass(tutorial.status)}">${escapeHtml(tutorial.status)}</span></td>
                <td>${escapeHtml(tutorial.priority)}</td>
                <td>${escapeHtml(tutorial.reviewDate || "-")}</td>
                <td>
                  <div class="table-actions">
                    <button type="button" data-edit-id="${tutorial.id}">Editar</button>
                    <button type="button" class="danger" data-delete-id="${tutorial.id}">Eliminar</button>
                  </div>
                </td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderGallery(items) {
  if (items.length === 0) {
    renderEmptyInto(refs.galleryView);
    return;
  }

  refs.galleryView.innerHTML = `
    <div class="gallery-grid">
      ${items
        .map((tutorial) => {
          const preview = getPreviewForCard(tutorial);
          return `
            <article class="card">
              <img src="${preview}" alt="${escapeHtml(tutorial.title)}" class="card-preview" />
              <div class="card-content">
                <h3 class="card-title">${escapeHtml(tutorial.title)}</h3>
                <p class="meta">${formatType(tutorial.type)} · ${escapeHtml(tutorial.category || "Sin categoría")}</p>
                <p class="meta">${escapeHtml(tutorial.collection || "Sin colección")} · ${escapeHtml(tutorial.priority)}</p>
                <p><span class="pill ${statusPillClass(tutorial.status)}">${escapeHtml(tutorial.status)}</span></p>
                <div class="tag-row">
                  ${tutorial.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                </div>
                <div class="table-actions">
                  <button type="button" data-edit-id="${tutorial.id}">Editar</button>
                  <button type="button" class="danger" data-delete-id="${tutorial.id}">Eliminar</button>
                </div>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderBoard(items) {
  if (items.length === 0) {
    renderEmptyInto(refs.boardView);
    return;
  }

  refs.boardView.innerHTML = `
    <div class="board">
      ${STATUS_ORDER.map((status) => {
        const columnItems = items.filter((tutorial) => tutorial.status === status);
        return `
          <section class="column">
            <h3>${status} (${columnItems.length})</h3>
            ${
              columnItems.length === 0
                ? `<p class="meta">Sin elementos</p>`
                : columnItems
                    .map(
                      (tutorial) => `
                      <article class="mini-card" data-edit-id="${tutorial.id}">
                        <strong>${escapeHtml(tutorial.title)}</strong>
                        <p>${escapeHtml(tutorial.category || "Sin categoría")} · ${escapeHtml(tutorial.priority)}</p>
                      </article>
                    `
                    )
                    .join("")
            }
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderEmptyInto(container) {
  container.innerHTML = "";
  const fragment = refs.emptyStateTemplate.content.cloneNode(true);
  container.append(fragment);
}

function openDialogForCreate() {
  state.editingId = null;
  refs.dialogTitle.textContent = "Nuevo tutorial";
  refs.deleteButton.classList.add("hidden");
  refs.tutorialForm.reset();
  refs.typeInput.value = "video";
  refs.sourceInput.value = "youtube";
  syncTypeSpecificFields();
  refs.dialog.showModal();
}

function openDialogForEdit(id) {
  const tutorial = state.tutorials.find((item) => item.id === id);
  if (!tutorial) {
    return;
  }
  state.editingId = id;
  refs.dialogTitle.textContent = "Editar tutorial";
  refs.deleteButton.classList.remove("hidden");

  refs.tutorialForm.elements.title.value = tutorial.title;
  refs.tutorialForm.elements.type.value = tutorial.type;
  refs.tutorialForm.elements.source.value = tutorial.source;
  refs.tutorialForm.elements.url.value = tutorial.url || "";
  refs.tutorialForm.elements.category.value = tutorial.category || "";
  refs.tutorialForm.elements.collection.value = tutorial.collection || "";
  refs.tutorialForm.elements.status.value = tutorial.status;
  refs.tutorialForm.elements.priority.value = tutorial.priority;
  refs.tutorialForm.elements.reviewDate.value = tutorial.reviewDate || "";
  refs.tutorialForm.elements.tags.value = tutorial.tags.join(", ");
  refs.tutorialForm.elements.imageUrl.value = tutorial.imageUrl || "";
  refs.tutorialForm.elements.textContent.value = tutorial.textContent || "";
  refs.tutorialForm.elements.notes.value = tutorial.notes || "";
  refs.tutorialForm.elements.timestamps.value = tutorial.timestamps.join("\n");

  syncTypeSpecificFields();
  refs.dialog.showModal();
}

function upsertTutorialFromForm() {
  const form = refs.tutorialForm.elements;
  const title = form.title.value.trim();
  const type = form.type.value;
  const url = form.url.value.trim();
  const normalizedUrl = normalizeUrl(url);

  if (!title) {
    window.alert("El título es obligatorio.");
    return;
  }

  const duplicate = state.tutorials.find(
    (tutorial) => tutorial.normalizedUrl && tutorial.normalizedUrl === normalizedUrl && tutorial.id !== state.editingId
  );

  if (normalizedUrl && duplicate) {
    const proceed = window.confirm(`Ya existe un tutorial con esa URL: "${duplicate.title}". ¿Deseas guardarlo igual?`);
    if (!proceed) {
      return;
    }
  }

  const source = pickSource(form.source.value, url);
  const model = {
    id: state.editingId || crypto.randomUUID(),
    title,
    type,
    source,
    url,
    normalizedUrl,
    imageUrl: form.imageUrl.value.trim(),
    textContent: form.textContent.value.trim(),
    category: form.category.value.trim(),
    collection: form.collection.value.trim(),
    status: form.status.value,
    priority: form.priority.value,
    reviewDate: form.reviewDate.value,
    tags: parseTags(form.tags.value),
    notes: form.notes.value.trim(),
    timestamps: form.timestamps.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    updatedAt: new Date().toISOString(),
  };

  if (!state.editingId) {
    model.createdAt = model.updatedAt;
    state.tutorials.unshift(model);
  } else {
    state.tutorials = state.tutorials.map((tutorial) =>
      tutorial.id === state.editingId
        ? {
            ...tutorial,
            ...model,
            createdAt: tutorial.createdAt,
          }
        : tutorial
    );
  }

  persistTutorials();
  refs.dialog.close();
  render();
}

function syncTypeSpecificFields() {
  const type = refs.typeInput.value;
  refs.imageUrlField.classList.toggle("hidden", type !== "image");
  refs.textContentField.classList.toggle("hidden", type !== "text");

  if (type === "video") {
    refs.sourceInput.innerHTML = `
      <option value="youtube">YouTube</option>
      <option value="instagram">Instagram</option>
      <option value="manual">Manual</option>
    `;
    return;
  }

  refs.sourceInput.innerHTML = `<option value="manual">Manual</option>`;
}

function getFilteredTutorials() {
  return [...state.tutorials]
    .filter((tutorial) => {
      if (state.type !== "all" && tutorial.type !== state.type) {
        return false;
      }
      if (state.status !== "all" && tutorial.status !== state.status) {
        return false;
      }
      if (state.category !== "all" && tutorial.category !== state.category) {
        return false;
      }
      if (!state.search) {
        return true;
      }

      const haystack = [
        tutorial.title,
        tutorial.category,
        tutorial.collection,
        tutorial.notes,
        tutorial.textContent,
        tutorial.tags.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(state.search);
    })
    .sort((a, b) => {
      const aDate = Date.parse(a.updatedAt || a.createdAt || 0);
      const bDate = Date.parse(b.updatedAt || b.createdAt || 0);
      return bDate - aDate;
    });
}

function statusPillClass(status) {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function formatType(type) {
  if (type === "video") {
    return "Video";
  }
  if (type === "image") {
    return "Imagen";
  }
  return "Texto";
}

function getPreviewForCard(tutorial) {
  if (tutorial.type === "image") {
    return tutorial.imageUrl || tutorial.url || genericPreview(tutorial.type);
  }

  if (tutorial.type === "video") {
    const youtubeId = extractYouTubeId(tutorial.url);
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
  }

  return genericPreview(tutorial.type);
}

function genericPreview(type) {
  if (type === "text") {
    return "data:image/svg+xml;utf8," + encodeURIComponent(textSvg("TXT"));
  }
  if (type === "video") {
    return "data:image/svg+xml;utf8," + encodeURIComponent(textSvg("VID"));
  }
  return "data:image/svg+xml;utf8," + encodeURIComponent(textSvg("IMG"));
}

function textSvg(token) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop stop-color='#e6e1d3' />
        <stop offset='1' stop-color='#d2dfd7' />
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)' />
    <text x='50%' y='50%' font-size='64' font-family='Arial' text-anchor='middle' fill='#3b4a3f'>${token}</text>
  </svg>`;
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function pickSource(sourceFromForm, url) {
  if (!url) {
    return sourceFromForm || "manual";
  }

  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  }
  if (lower.includes("instagram.com")) {
    return "instagram";
  }
  return sourceFromForm || "manual";
}

function extractYouTubeId(url) {
  if (!url) {
    return "";
  }
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/i,
    /(?:youtu\.be\/)([^?&]+)/i,
    /(?:youtube\.com\/shorts\/)([^?&]+)/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return "";
}

function normalizeUrl(url) {
  if (!url) {
    return "";
  }
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, "");
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadTutorials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function persistTutorials() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tutorials));
}

function exportJson() {
  const payload = JSON.stringify(state.tutorials, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `tutorial-vault-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed)) {
        throw new Error("Formato inválido");
      }

      state.tutorials = parsed.map((item) => sanitizeImportedTutorial(item));
      persistTutorials();
      render();
      window.alert(`Importación completada: ${state.tutorials.length} tutoriales.`);
    } catch {
      window.alert("No se pudo importar el archivo JSON.");
    } finally {
      refs.importInput.value = "";
    }
  };
  reader.readAsText(file);
}

function sanitizeImportedTutorial(item) {
  const now = new Date().toISOString();
  return {
    id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
    title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Sin título",
    type: validType(item.type) ? item.type : "text",
    source: typeof item.source === "string" ? item.source : "manual",
    url: typeof item.url === "string" ? item.url : "",
    normalizedUrl: normalizeUrl(typeof item.url === "string" ? item.url : ""),
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
    textContent: typeof item.textContent === "string" ? item.textContent : "",
    category: typeof item.category === "string" ? item.category : "",
    collection: typeof item.collection === "string" ? item.collection : "",
    status: STATUS_ORDER.includes(item.status) ? item.status : "Por ver",
    priority: ["Alta", "Media", "Baja"].includes(item.priority) ? item.priority : "Media",
    reviewDate: typeof item.reviewDate === "string" ? item.reviewDate : "",
    tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === "string") : [],
    notes: typeof item.notes === "string" ? item.notes : "",
    timestamps: Array.isArray(item.timestamps) ? item.timestamps.filter((entry) => typeof entry === "string") : [],
    createdAt: typeof item.createdAt === "string" ? item.createdAt : now,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : now,
  };
}

function validType(type) {
  return type === "video" || type === "image" || type === "text";
}

function injectDemoData() {
  const now = new Date().toISOString();
  const demo = [
    {
      id: crypto.randomUUID(),
      title: "Composición visual para reels",
      type: "video",
      source: "instagram",
      url: "https://www.instagram.com/reel/CxExample01/",
      normalizedUrl: "https://www.instagram.com/reel/CxExample01",
      imageUrl: "",
      textContent: "",
      category: "Edición",
      collection: "Portfolio 2026",
      status: "Por ver",
      priority: "Alta",
      reviewDate: "",
      tags: ["reels", "composición"],
      notes: "Aplicar en proyecto de branding personal.",
      timestamps: ["00:52 Intro", "02:18 Regla de tercios"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: "Diseño de componentes UI en Figma",
      type: "video",
      source: "youtube",
      url: "https://www.youtube.com/watch?v=QxExample02",
      normalizedUrl: "https://www.youtube.com/watch?v=QxExample02",
      imageUrl: "",
      textContent: "",
      category: "UI",
      collection: "Design System",
      status: "En progreso",
      priority: "Alta",
      reviewDate: "",
      tags: ["figma", "componentes", "ui"],
      notes: "Revisar nuevamente la parte de variantes.",
      timestamps: ["03:12 Auto layout", "08:44 Variants"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: "Checklist de copy para landing pages",
      type: "text",
      source: "manual",
      url: "",
      normalizedUrl: "",
      imageUrl: "",
      textContent: "1. Titular claro\n2. Beneficio principal\n3. Prueba social\n4. CTA directo",
      category: "Marketing",
      collection: "Growth",
      status: "Aplicado",
      priority: "Media",
      reviewDate: "",
      tags: ["copy", "landing"],
      notes: "Ya aplicado en la landing del portfolio.",
      timestamps: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  state.tutorials = [...demo, ...state.tutorials];
  persistTutorials();
  render();
}
