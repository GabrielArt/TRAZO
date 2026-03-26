const API_BASE = "/api";
const STATUS_ORDER = ["Por ver", "En progreso", "Aplicado", "Archivado"];
const MAX_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024;
const TEXT_FILE_EXTENSIONS = [".txt", ".md", ".markdown"];
const SMART_COLLECTION_KEYS = ["all", "due", "focus", "uncategorized", "duplicates"];
const TABLE_COLUMN_KEYS = ["type", "category", "collection", "reviewDate", "updatedAt"];
const DEFAULT_VISIBLE_COLUMNS = Object.freeze({
  type: true,
  category: true,
  collection: true,
  reviewDate: true,
  updatedAt: false,
});

const state = {
  tutorials: [],
  savedViews: [],
  page: "library",
  search: "",
  view: "table",
  sortBy: "updatedAt",
  sortDirection: "desc",
  type: "all",
  status: "all",
  category: "all",
  priority: "all",
  tagQuery: "",
  updatedFrom: "",
  updatedTo: "",
  favoritesOnly: false,
  showAdvancedFilters: false,
  smartCollection: "all",
  theme: getInitialTheme(),
  editingId: null,
  selectedId: null,
  selectedIds: new Set(),
  currentUser: null,
  authMode: "login",
  reminderPermission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS },
};

let uploadProgressTimer = null;
let reminderIntervalId = null;

const refs = {
  appContent: document.querySelector("#appContent"),
  libraryPage: document.querySelector("#libraryPage"),
  tutorialPage: document.querySelector("#tutorialPage"),
  settingsPage: document.querySelector("#settingsPage"),
  authGate: document.querySelector("#authGate"),
  showLoginButton: document.querySelector("#showLoginButton"),
  showRegisterButton: document.querySelector("#showRegisterButton"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  authMessage: document.querySelector("#authMessage"),
  userBadge: document.querySelector("#userBadge"),
  libraryNavButton: document.querySelector("#libraryNavButton"),
  searchNavButton: document.querySelector("#searchNavButton"),
  settingsNavButton: document.querySelector("#settingsNavButton"),
  logoutButton: document.querySelector("#logoutButton"),
  searchDialog: document.querySelector("#searchDialog"),
  searchForm: document.querySelector("#searchForm"),
  closeSearchButton: document.querySelector("#closeSearchButton"),
  searchSummary: document.querySelector("#searchSummary"),
  searchResults: document.querySelector("#searchResults"),
  viewSwitchButtons: Array.from(document.querySelectorAll("[data-view-target]")),
  sidebarTutorialsList: document.querySelector("#sidebarTutorialsList"),
  saveCurrentViewButton: document.querySelector("#saveCurrentViewButton"),
  savedViewsList: document.querySelector("#savedViewsList"),
  smartCollectionsList: document.querySelector("#smartCollectionsList"),
  librarySearchInput: document.querySelector("#librarySearchInput"),
  libraryQuickButtons: Array.from(document.querySelectorAll("[data-library-quick]")),
  columnToggleInputs: Array.from(document.querySelectorAll("[data-column-toggle]")),
  enableRemindersButton: document.querySelector("#enableRemindersButton"),
  statsGrid: document.querySelector("#statsGrid"),
  tableView: document.querySelector("#tableView"),
  galleryView: document.querySelector("#galleryView"),
  boardView: document.querySelector("#boardView"),
  reminderPanel: document.querySelector("#reminderPanel"),
  duplicatePanel: document.querySelector("#duplicatePanel"),
  detailPanel: document.querySelector("#detailPanel"),
  filters: document.querySelector(".filters"),
  toggleAdvancedFiltersButton: document.querySelector("#toggleAdvancedFiltersButton"),
  searchInput: document.querySelector("#searchInput"),
  viewSelect: document.querySelector("#viewSelect"),
  sortBySelect: document.querySelector("#sortBySelect"),
  sortDirectionSelect: document.querySelector("#sortDirectionSelect"),
  typeFilter: document.querySelector("#typeFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  tagFilter: document.querySelector("#tagFilter"),
  updatedFromFilter: document.querySelector("#updatedFromFilter"),
  updatedToFilter: document.querySelector("#updatedToFilter"),
  favoritesOnlyFilter: document.querySelector("#favoritesOnlyFilter"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
  bulkPanel: document.querySelector("#bulkPanel"),
  bulkCount: document.querySelector("#bulkCount"),
  selectVisibleButton: document.querySelector("#selectVisibleButton"),
  clearSelectionButton: document.querySelector("#clearSelectionButton"),
  bulkStatusSelect: document.querySelector("#bulkStatusSelect"),
  applyBulkStatusButton: document.querySelector("#applyBulkStatusButton"),
  bulkPrioritySelect: document.querySelector("#bulkPrioritySelect"),
  applyBulkPriorityButton: document.querySelector("#applyBulkPriorityButton"),
  bulkFavoriteOnButton: document.querySelector("#bulkFavoriteOnButton"),
  bulkFavoriteOffButton: document.querySelector("#bulkFavoriteOffButton"),
  bulkDeleteButton: document.querySelector("#bulkDeleteButton"),
  newTutorialButton: document.querySelector("#newTutorialButton"),
  shortcutsButton: document.querySelector("#shortcutsButton"),
  shortcutsDialog: document.querySelector("#shortcutsDialog"),
  closeShortcutsButton: document.querySelector("#closeShortcutsButton"),
  dialog: document.querySelector("#tutorialDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  tutorialForm: document.querySelector("#tutorialForm"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  deleteButton: document.querySelector("#deleteButton"),
  saveButton: document.querySelector("#tutorialForm button[type='submit']"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
  seedDataButton: document.querySelector("#seedDataButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importInput: document.querySelector("#importInput"),
  typeInput: document.querySelector("#typeInput"),
  sourceInput: document.querySelector("#sourceInput"),
  imageUrlField: document.querySelector("#imageUrlField"),
  textContentField: document.querySelector("#textContentField"),
  syncStatus: document.querySelector("#syncStatus"),
  uploadDropZone: document.querySelector("#uploadDropZone"),
  uploadBrowseButton: document.querySelector("#uploadBrowseButton"),
  uploadInput: document.querySelector("#uploadInput"),
  uploadProgress: document.querySelector("#uploadProgress"),
  uploadStatus: document.querySelector("#uploadStatus"),
};

void init();

async function init() {
  bindEvents();
  applyTheme(state.theme);
  syncAdvancedFiltersVisibility();
  switchAuthMode("login");
  syncTypeSpecificFields();
  await bootstrapSession();
}

function bindEvents() {
  refs.showLoginButton.addEventListener("click", () => switchAuthMode("login"));
  refs.showRegisterButton.addEventListener("click", () => switchAuthMode("register"));
  refs.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleLogin();
  });
  refs.registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleRegister();
  });
  refs.logoutButton.addEventListener("click", () => void handleLogout());
  refs.libraryNavButton.addEventListener("click", () => goToPage("library"));
  refs.settingsNavButton.addEventListener("click", () => goToPage("settings"));
  refs.searchNavButton.addEventListener("click", () => openSearchDialog());
  refs.closeSearchButton.addEventListener("click", () => closeSearchDialog());
  refs.searchForm.addEventListener("submit", (event) => event.preventDefault());
  refs.searchDialog.addEventListener("close", syncPageVisibility);

  refs.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });
  refs.librarySearchInput?.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    refs.searchInput.value = state.search;
    render();
  });
  refs.libraryQuickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyLibraryQuickFilter(button.dataset.libraryQuick);
    });
  });
  refs.columnToggleInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.columnToggle;
      if (!TABLE_COLUMN_KEYS.includes(key)) {
        return;
      }
      state.visibleColumns[key] = input.checked;
      render();
    });
  });
  refs.viewSelect.addEventListener("change", (event) => {
    state.view = normalizeView(event.target.value);
    refs.viewSelect.value = state.view;
    render();
  });
  refs.viewSwitchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = normalizeView(button.dataset.viewTarget);
      refs.viewSelect.value = state.view;
      render();
    });
  });
  refs.sortBySelect.addEventListener("change", (event) => {
    state.sortBy = normalizeSortBy(event.target.value);
    render();
  });
  refs.sortDirectionSelect.addEventListener("change", (event) => {
    state.sortDirection = normalizeSortDirection(event.target.value);
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
  refs.priorityFilter.addEventListener("change", (event) => {
    state.priority = event.target.value;
    render();
  });
  refs.tagFilter.addEventListener("input", (event) => {
    state.tagQuery = event.target.value.trim().toLowerCase();
    render();
  });
  refs.updatedFromFilter.addEventListener("change", (event) => {
    state.updatedFrom = event.target.value;
    render();
  });
  refs.updatedToFilter.addEventListener("change", (event) => {
    state.updatedTo = event.target.value;
    render();
  });
  refs.favoritesOnlyFilter.addEventListener("change", (event) => {
    state.favoritesOnly = event.target.checked;
    render();
  });
  refs.toggleAdvancedFiltersButton.addEventListener("click", () => {
    state.showAdvancedFilters = !state.showAdvancedFilters;
    render();
  });
  refs.themeToggleButton.addEventListener("click", toggleTheme);

  refs.newTutorialButton.addEventListener("click", openDialogForCreate);
  refs.shortcutsButton?.addEventListener("click", openShortcutsDialog);
  refs.closeShortcutsButton?.addEventListener("click", () => refs.shortcutsDialog.close());
  refs.closeDialogButton.addEventListener("click", () => refs.dialog.close());
  refs.tutorialForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void upsertTutorialFromForm();
  });
  refs.deleteButton.addEventListener("click", () => void deleteEditingTutorial());

  refs.tableView.addEventListener("click", (event) => void onActionClick(event));
  refs.galleryView.addEventListener("click", (event) => void onActionClick(event));
  refs.boardView.addEventListener("click", (event) => void onActionClick(event));
  refs.tutorialPage.addEventListener("click", (event) => void onActionClick(event));
  refs.settingsPage.addEventListener("click", (event) => {
    if (event.target === refs.settingsPage) {
      goToPage("library");
      return;
    }
    void onActionClick(event);
  });
  refs.sidebarTutorialsList.addEventListener("click", (event) => void onActionClick(event));
  refs.searchResults.addEventListener("click", (event) => void onActionClick(event));
  refs.duplicatePanel.addEventListener("click", (event) => void onDuplicatePanelAction(event));
  refs.savedViewsList.addEventListener("click", (event) => void onSavedViewAction(event));
  refs.smartCollectionsList?.addEventListener("click", (event) => onSmartCollectionAction(event));
  refs.tableView.addEventListener("change", (event) => void onInlineFieldChange(event));
  refs.boardView.addEventListener("change", (event) => void onInlineFieldChange(event));
  refs.tableView.addEventListener("change", (event) => onSelectionChange(event));
  refs.galleryView.addEventListener("change", (event) => onSelectionChange(event));
  refs.boardView.addEventListener("change", (event) => onSelectionChange(event));

  refs.typeInput.addEventListener("change", syncTypeSpecificFields);
  document.querySelectorAll("[data-status-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.statusShortcut;
      state.smartCollection = "all";
      refs.statusFilter.value = state.status;
      goToPage("library");
    });
  });
  refs.seedDataButton.addEventListener("click", () => void injectDemoData());
  refs.saveCurrentViewButton.addEventListener("click", () => void saveCurrentView());
  refs.enableRemindersButton.addEventListener("click", () => void handleEnableReminders());
  refs.selectVisibleButton.addEventListener("click", () => {
    selectVisibleTutorials();
    render();
  });
  refs.clearSelectionButton.addEventListener("click", () => {
    clearSelection();
    render();
  });
  refs.applyBulkStatusButton.addEventListener("click", () => void applyBulkStatus());
  refs.applyBulkPriorityButton.addEventListener("click", () => void applyBulkPriority());
  refs.bulkFavoriteOnButton.addEventListener("click", () => void applyBulkFavorite(true));
  refs.bulkFavoriteOffButton.addEventListener("click", () => void applyBulkFavorite(false));
  refs.bulkDeleteButton.addEventListener("click", () => void deleteSelectedTutorials());
  refs.exportButton.addEventListener("click", exportJson);
  refs.importButton.addEventListener("click", () => refs.importInput.click());
  refs.importInput.addEventListener("change", (event) => void importJson(event));

  refs.uploadBrowseButton.addEventListener("click", () => refs.uploadInput.click());
  refs.uploadInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    void handlePickedFile(file || null);
    refs.uploadInput.value = "";
  });
  refs.uploadDropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    refs.uploadDropZone.classList.add("is-dragging");
  });
  refs.uploadDropZone.addEventListener("dragleave", () => refs.uploadDropZone.classList.remove("is-dragging"));
  refs.uploadDropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    refs.uploadDropZone.classList.remove("is-dragging");
    void handlePickedFile(event.dataTransfer?.files?.[0] || null);
  });
  document.addEventListener("keydown", onGlobalKeydown);
}

async function bootstrapSession() {
  setAuthenticated(null);
  try {
    const response = await apiAuthMe();
    setAuthenticated(response.user);
    await refreshTutorials();
    await refreshSavedViews();
    startReminderLoop();
  } catch {
    setAuthenticated(null);
    setAuthMessage("Inicia sesion para acceder a tu biblioteca.", false);
  }
}

function goToPage(page) {
  if (!state.currentUser) {
    return;
  }
  const next = page === "settings" || page === "tutorial" ? page : "library";
  if (next === "tutorial" && !state.selectedId) {
    state.page = "library";
  } else {
    state.page = next;
  }
  closeSearchDialog();
  render();
}

function openSearchDialog() {
  if (!state.currentUser || !refs.searchDialog?.showModal) {
    return;
  }
  if (!refs.searchDialog.open) {
    refs.searchDialog.showModal();
  }
  refs.searchInput.focus();
  refs.searchInput.select();
  renderSearchResults();
  syncPageVisibility();
}

function closeSearchDialog() {
  if (refs.searchDialog?.open) {
    refs.searchDialog.close();
  }
}

function syncPageVisibility() {
  const showLibrary = state.page !== "tutorial";
  const showTutorial = state.page === "tutorial";
  const showSettings = state.page === "settings";

  refs.libraryPage.classList.toggle("hidden", !showLibrary);
  refs.tutorialPage.classList.toggle("hidden", !showTutorial);
  refs.settingsPage.classList.toggle("hidden", !showSettings);

  refs.libraryNavButton.classList.toggle("is-active", showLibrary && !showSettings);
  refs.settingsNavButton.classList.toggle("is-active", showSettings);
  refs.searchNavButton.classList.toggle("is-active", Boolean(refs.searchDialog?.open));
}

function switchAuthMode(mode) {
  state.authMode = mode === "register" ? "register" : "login";
  refs.loginForm.classList.toggle("hidden", state.authMode !== "login");
  refs.registerForm.classList.toggle("hidden", state.authMode !== "register");
  refs.showLoginButton.classList.toggle("is-active", state.authMode === "login");
  refs.showRegisterButton.classList.toggle("is-active", state.authMode === "register");
  setAuthMessage("", false);
}

function setAuthenticated(user) {
  state.currentUser = user;
  const ok = Boolean(user);
  refs.authGate.classList.toggle("hidden", ok);
  refs.appContent.classList.toggle("hidden", !ok);
  refs.logoutButton.classList.toggle("hidden", !ok);
  if (ok) {
    state.page = "library";
    refs.userBadge.textContent = user.email;
    refs.detailPanel.classList.remove("hidden");
    updateReminderButton();
    syncPageVisibility();
    return;
  }
  refs.userBadge.textContent = "No autenticado";
  state.page = "library";
  state.tutorials = [];
  state.savedViews = [];
  state.smartCollection = "all";
  state.selectedId = null;
  state.selectedIds = new Set();
  state.editingId = null;
  state.visibleColumns = { ...DEFAULT_VISIBLE_COLUMNS };
  refs.tableView.innerHTML = "";
  refs.galleryView.innerHTML = "";
  refs.boardView.innerHTML = "";
  refs.savedViewsList.innerHTML = "";
  if (refs.smartCollectionsList) {
    refs.smartCollectionsList.innerHTML = "";
  }
  refs.sidebarTutorialsList.innerHTML = "";
  refs.reminderPanel.innerHTML = "";
  refs.reminderPanel.classList.add("hidden");
  refs.duplicatePanel.innerHTML = "";
  refs.duplicatePanel.classList.add("hidden");
  refs.detailPanel.innerHTML = "";
  closeSearchDialog();
  syncPageVisibility();
  stopReminderLoop();
}

function setAuthMessage(message, isError) {
  refs.authMessage.textContent = message;
  refs.authMessage.classList.toggle("is-error", isError);
}

async function handleLogin() {
  const email = refs.loginForm.elements.email.value.trim();
  const password = refs.loginForm.elements.password.value;
  if (!email || !password) {
    setAuthMessage("Email y clave son obligatorios.", true);
    return;
  }
  setAuthMessage("Validando acceso...", false);
  try {
    const response = await apiLogin(email, password);
    setAuthenticated(response.user);
    setAuthMessage("", false);
    refs.loginForm.reset();
    await refreshTutorials();
    await refreshSavedViews();
    startReminderLoop();
  } catch (error) {
    setAuthMessage(resolveError(error, "No se pudo iniciar sesion."), true);
  }
}

async function handleRegister() {
  const email = refs.registerForm.elements.email.value.trim();
  const password = refs.registerForm.elements.password.value;
  if (!email || !password) {
    setAuthMessage("Email y clave son obligatorios.", true);
    return;
  }
  setAuthMessage("Creando cuenta...", false);
  try {
    const response = await apiRegister(email, password);
    setAuthenticated(response.user);
    setAuthMessage("", false);
    refs.registerForm.reset();
    await refreshTutorials();
    await refreshSavedViews();
    startReminderLoop();
  } catch (error) {
    setAuthMessage(resolveError(error, "No se pudo crear la cuenta."), true);
  }
}

async function handleLogout() {
  try {
    await apiLogout();
  } catch {}
  setAuthenticated(null);
  setAuthMessage("Sesion cerrada.", false);
}

async function onActionClick(event) {
  const pageTarget = event.target.closest("[data-go-page]");
  if (pageTarget) {
    goToPage(pageTarget.dataset.goPage);
    return;
  }
  const sortTarget = event.target.closest("[data-sort-by]");
  if (sortTarget) {
    toggleSort(sortTarget.dataset.sortBy);
    return;
  }
  const openTarget = event.target.closest("[data-open-id]");
  if (openTarget) {
    selectTutorial(openTarget.dataset.openId);
    return;
  }
  const editTarget = event.target.closest("[data-edit-id]");
  if (editTarget) {
    openDialogForEdit(editTarget.dataset.editId);
    return;
  }
  const openUrlTarget = event.target.closest("[data-open-url]");
  if (openUrlTarget) {
    window.open(openUrlTarget.dataset.openUrl, "_blank", "noopener");
    return;
  }
  const favoriteTarget = event.target.closest("[data-toggle-favorite]");
  if (favoriteTarget) {
    await toggleFavorite(favoriteTarget.dataset.toggleFavorite);
    return;
  }
  const deleteTarget = event.target.closest("[data-delete-id]");
  if (!deleteTarget) {
    return;
  }
  const id = deleteTarget.dataset.deleteId;
  const target = state.tutorials.find((item) => item.id === id);
  if (!target) {
    return;
  }
  if (!window.confirm(`Eliminar "${target.title}"?`)) {
    return;
  }
  try {
    await apiDeleteTutorial(id);
    if (state.selectedId === id) {
      state.selectedId = null;
    }
    state.selectedIds.delete(id);
    await refreshTutorials();
  } catch (error) {
    showOperationError(error, "No se pudo eliminar el tutorial.");
  }
}

async function onInlineFieldChange(event) {
  const target = event.target.closest("[data-inline-field]");
  if (!target) {
    return;
  }

  const id = target.dataset.inlineId;
  const field = target.dataset.inlineField;
  const value = target.value;
  const tutorial = state.tutorials.find((item) => item.id === id);
  if (!tutorial) {
    return;
  }

  if (field === "status" && !STATUS_ORDER.includes(value)) {
    return;
  }
  if (field === "priority" && !["Alta", "Media", "Baja"].includes(value)) {
    return;
  }

  const payload = {
    ...tutorial,
    [field]: value,
    updatedAt: new Date().toISOString(),
  };

  try {
    await apiUpdateTutorial(id, payload);
    state.selectedId = id;
    await refreshTutorials();
  } catch (error) {
    showOperationError(error, "No se pudo actualizar en linea.");
    render();
  }
}

async function toggleFavorite(id) {
  const tutorial = state.tutorials.find((item) => item.id === id);
  if (!tutorial) {
    return;
  }

  const payload = {
    ...tutorial,
    isFavorite: !tutorial.isFavorite,
    updatedAt: new Date().toISOString(),
  };

  try {
    await apiUpdateTutorial(id, payload);
    state.selectedId = id;
    await refreshTutorials();
  } catch (error) {
    showOperationError(error, "No se pudo actualizar favorito.");
  }
}

async function onSavedViewAction(event) {
  const applyTarget = event.target.closest("[data-apply-view-id]");
  if (applyTarget) {
    applySavedView(applyTarget.dataset.applyViewId);
    return;
  }

  const deleteTarget = event.target.closest("[data-delete-view-id]");
  if (!deleteTarget) {
    return;
  }

  const id = deleteTarget.dataset.deleteViewId;
  if (!window.confirm("Eliminar esta vista guardada?")) {
    return;
  }

  try {
    await apiDeleteSavedView(id);
    await refreshSavedViews();
  } catch (error) {
    showOperationError(error, "No se pudo eliminar la vista guardada.");
  }
}

function onSmartCollectionAction(event) {
  const target = event.target.closest("[data-smart-collection]");
  if (!target) {
    return;
  }
  state.smartCollection = normalizeSmartCollectionKey(target.dataset.smartCollection);
  goToPage("library");
}

async function onDuplicatePanelAction(event) {
  const openTarget = event.target.closest("[data-open-id]");
  if (openTarget) {
    selectTutorial(openTarget.dataset.openId);
    return;
  }

  const archiveTarget = event.target.closest("[data-archive-duplicates]");
  if (!archiveTarget) {
    return;
  }
  await archiveDuplicatesForUrl(archiveTarget.dataset.archiveDuplicates);
}

async function archiveDuplicatesForUrl(encodedUrl) {
  const normalizedUrl = decodeURIComponent(encodedUrl || "");
  if (!normalizedUrl) {
    return;
  }

  const group = getDuplicateGroups().find((item) => item.url === normalizedUrl);
  if (!group || group.tutorials.length < 2) {
    window.alert("No se encontraron duplicados para esa URL.");
    return;
  }

  const keep = group.tutorials[0];
  const toArchive = group.tutorials.filter((tutorial) => tutorial.id !== keep.id && tutorial.status !== "Archivado");
  if (!toArchive.length) {
    window.alert("Todos los duplicados de este grupo ya estan archivados.");
    return;
  }

  if (!window.confirm(`Se conservara "${keep.title}" y se archivaran ${toArchive.length} duplicado(s). Continuar?`)) {
    return;
  }

  setSyncStatus(`Archivando duplicados (${toArchive.length})...`);
  try {
    const now = new Date().toISOString();
    for (const tutorial of toArchive) {
      await apiUpdateTutorial(tutorial.id, {
        ...tutorial,
        status: "Archivado",
        updatedAt: now,
      });
    }
    await refreshTutorials();
    window.alert(`Duplicados archivados: ${toArchive.length}`);
  } catch (error) {
    showOperationError(error, "No se pudieron archivar los duplicados.");
  }
}

async function saveCurrentView() {
  const name = window.prompt("Nombre para esta vista guardada:");
  if (!name || !name.trim()) {
    return;
  }

  try {
    await apiCreateSavedView({
      name: name.trim(),
      filters: getCurrentFilterSnapshot(),
    });
    await refreshSavedViews();
  } catch (error) {
    showOperationError(error, "No se pudo guardar la vista.");
  }
}

function applySavedView(id) {
  const saved = state.savedViews.find((item) => item.id === id);
  if (!saved) {
    return;
  }

  const filters = saved.filters || {};
  state.search = String(filters.search || "").toLowerCase();
  state.view = normalizeView(filters.view);
  state.sortBy = normalizeSortBy(filters.sortBy);
  state.sortDirection = normalizeSortDirection(filters.sortDirection);
  state.type = ["all", "video", "image", "text"].includes(filters.type) ? filters.type : "all";
  state.status = ["all", ...STATUS_ORDER].includes(filters.status) ? filters.status : "all";
  state.category = typeof filters.category === "string" && filters.category ? filters.category : "all";
  state.priority = ["all", "Alta", "Media", "Baja"].includes(filters.priority) ? filters.priority : "all";
  state.tagQuery = String(filters.tagQuery || "").toLowerCase();
  state.updatedFrom = typeof filters.updatedFrom === "string" ? filters.updatedFrom : "";
  state.updatedTo = typeof filters.updatedTo === "string" ? filters.updatedTo : "";
  state.favoritesOnly = Boolean(filters.favoritesOnly);
  state.visibleColumns = normalizeVisibleColumns(filters.visibleColumns);
  state.showAdvancedFilters = hasAdvancedFiltersApplied();
  state.smartCollection = normalizeSmartCollectionKey(filters.smartCollection);

  refs.searchInput.value = state.search;
  refs.viewSelect.value = state.view;
  refs.sortBySelect.value = state.sortBy;
  refs.sortDirectionSelect.value = state.sortDirection;
  refs.typeFilter.value = state.type;
  refs.statusFilter.value = state.status;
  refs.priorityFilter.value = state.priority;
  refs.tagFilter.value = state.tagQuery;
  refs.updatedFromFilter.value = state.updatedFrom;
  refs.updatedToFilter.value = state.updatedTo;
  refs.favoritesOnlyFilter.checked = state.favoritesOnly;

  renderCategoryOptions();
  const availableCategories = new Set(state.tutorials.map((tutorial) => tutorial.category).filter(Boolean));
  if (state.category !== "all" && !availableCategories.has(state.category)) {
    state.category = "all";
  }
  refs.categoryFilter.value = state.category;
  goToPage("library");
}

async function refreshSavedViews() {
  if (!state.currentUser) {
    state.savedViews = [];
    refs.savedViewsList.innerHTML = "";
    return;
  }

  try {
    state.savedViews = await apiListSavedViews();
  } catch (error) {
    state.savedViews = [];
    showOperationError(error, "No se pudieron cargar las vistas guardadas.");
  } finally {
    renderSavedViews();
  }
}

function renderSavedViews() {
  if (!state.currentUser) {
    refs.savedViewsList.innerHTML = "";
    return;
  }

  if (!state.savedViews.length) {
    refs.savedViewsList.innerHTML = `<p class="meta">Aun no tienes vistas guardadas.</p>`;
    return;
  }

  refs.savedViewsList.innerHTML = state.savedViews
    .map(
      (view) => `
        <article class="saved-view-item">
          <button type="button" class="saved-view-name" data-apply-view-id="${view.id}">${escapeHtml(view.name)}</button>
          <div class="saved-view-actions">
            <button type="button" data-apply-view-id="${view.id}">Aplicar</button>
            <button type="button" class="danger" data-delete-view-id="${view.id}">Eliminar</button>
          </div>
        </article>
      `
    )
    .join("");
}

function getCurrentFilterSnapshot() {
  return {
    search: state.search,
    view: state.view,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
    type: state.type,
    status: state.status,
    category: state.category,
    priority: state.priority,
    tagQuery: state.tagQuery,
    updatedFrom: state.updatedFrom,
    updatedTo: state.updatedTo,
    favoritesOnly: state.favoritesOnly,
    visibleColumns: { ...state.visibleColumns },
    smartCollection: state.smartCollection,
  };
}

function normalizeSortBy(value) {
  return ["updatedAt", "createdAt", "title", "type", "category", "collection", "priority", "reviewDate"].includes(
    value
  )
    ? value
    : "updatedAt";
}

function normalizeSortDirection(value) {
  return value === "asc" || value === "desc" ? value : "desc";
}

function defaultSortDirectionFor(by) {
  if (by === "priority" || by === "updatedAt" || by === "createdAt") {
    return "desc";
  }
  return "asc";
}

function toggleSort(sortBy) {
  const normalized = normalizeSortBy(sortBy);
  if (state.sortBy === normalized) {
    state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
  } else {
    state.sortBy = normalized;
    state.sortDirection = defaultSortDirectionFor(normalized);
  }
  refs.sortBySelect.value = state.sortBy;
  refs.sortDirectionSelect.value = state.sortDirection;
  render();
}

function normalizeView(value) {
  return value === "gallery" ? "gallery" : "table";
}

function normalizeSmartCollectionKey(value) {
  return SMART_COLLECTION_KEYS.includes(value) ? value : "all";
}

function normalizeVisibleColumns(value) {
  const normalized = { ...DEFAULT_VISIBLE_COLUMNS };
  if (!value || typeof value !== "object") {
    return normalized;
  }
  TABLE_COLUMN_KEYS.forEach((key) => {
    if (key in value) {
      normalized[key] = Boolean(value[key]);
    }
  });
  return normalized;
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem("tv_theme");
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {}
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = state.theme;
  try {
    localStorage.setItem("tv_theme", state.theme);
  } catch {}
  updateThemeToggleLabel();
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
}

function updateThemeToggleLabel() {
  if (!refs.themeToggleButton) {
    return;
  }
  refs.themeToggleButton.textContent = state.theme === "dark" ? "Tema claro" : "Tema oscuro";
}

function hasAdvancedFiltersApplied() {
  return Boolean(
    state.sortBy !== "updatedAt" ||
      state.sortDirection !== "desc" ||
      state.category !== "all" ||
      state.priority !== "all" ||
      state.tagQuery ||
      state.updatedFrom ||
      state.updatedTo ||
      state.favoritesOnly
  );
}

function getActiveAdvancedFilterCount() {
  let count = 0;
  if (state.sortBy !== "updatedAt") {
    count += 1;
  }
  if (state.sortDirection !== "desc") {
    count += 1;
  }
  if (state.category !== "all") {
    count += 1;
  }
  if (state.priority !== "all") {
    count += 1;
  }
  if (state.tagQuery) {
    count += 1;
  }
  if (state.updatedFrom) {
    count += 1;
  }
  if (state.updatedTo) {
    count += 1;
  }
  if (state.favoritesOnly) {
    count += 1;
  }
  return count;
}

function syncAdvancedFiltersVisibility() {
  if (!refs.filters || !refs.toggleAdvancedFiltersButton) {
    return;
  }
  refs.filters.classList.toggle("show-advanced", state.showAdvancedFilters);
  const count = getActiveAdvancedFilterCount();
  if (state.showAdvancedFilters) {
    refs.toggleAdvancedFiltersButton.textContent = "Ocultar filtros avanzados";
  } else if (count) {
    refs.toggleAdvancedFiltersButton.textContent = `Mostrar filtros avanzados (${count})`;
  } else {
    refs.toggleAdvancedFiltersButton.textContent = "Mostrar filtros avanzados";
  }
  refs.toggleAdvancedFiltersButton.setAttribute("aria-expanded", state.showAdvancedFilters ? "true" : "false");

  if (refs.searchNavButton) {
    const basicCount = Number(state.search.length > 0) + Number(state.type !== "all") + Number(state.status !== "all");
    const totalCount = count + basicCount;
    refs.searchNavButton.textContent = totalCount ? `Buscar (${totalCount})` : "Buscar";
  }

  if (refs.searchSummary) {
    refs.searchSummary.textContent = count
      ? `${count} filtro(s) avanzado(s) activo(s).`
      : "Sin filtros avanzados activos.";
  }
}

function syncViewSwitchButtons() {
  if (!refs.viewSwitchButtons?.length) {
    return;
  }
  refs.viewSwitchButtons.forEach((button) => {
    const isActive = normalizeView(button.dataset.viewTarget) === state.view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function applyLibraryQuickFilter(key) {
  const next = String(key || "all");
  state.smartCollection = "all";
  state.status = "all";
  state.favoritesOnly = false;

  if (next === "por_ver") {
    state.status = "Por ver";
  } else if (next === "en_progreso") {
    state.status = "En progreso";
  } else if (next === "aplicado") {
    state.status = "Aplicado";
  } else if (next === "favoritos") {
    state.favoritesOnly = true;
  } else if (next === "alta") {
    state.priority = "Alta";
  } else {
    state.priority = "all";
  }

  if (next !== "alta") {
    state.priority = "all";
  }

  refs.statusFilter.value = state.status;
  refs.priorityFilter.value = state.priority;
  refs.favoritesOnlyFilter.checked = state.favoritesOnly;
  goToPage("library");
}

function getActiveLibraryQuickFilter() {
  if (state.favoritesOnly && state.status === "all" && state.priority === "all") {
    return "favoritos";
  }
  if (!state.favoritesOnly && state.priority === "Alta" && state.status === "all") {
    return "alta";
  }
  if (state.status === "Por ver") {
    return "por_ver";
  }
  if (state.status === "En progreso") {
    return "en_progreso";
  }
  if (state.status === "Aplicado") {
    return "aplicado";
  }
  return "all";
}

function syncLibraryFilters() {
  if (refs.librarySearchInput) {
    refs.librarySearchInput.value = state.search;
  }

  const activeQuick = getActiveLibraryQuickFilter();
  refs.libraryQuickButtons.forEach((button) => {
    const isActive = button.dataset.libraryQuick === activeQuick;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  refs.columnToggleInputs.forEach((input) => {
    const key = input.dataset.columnToggle;
    if (!TABLE_COLUMN_KEYS.includes(key)) {
      return;
    }
    input.checked = Boolean(state.visibleColumns[key]);
  });
}

function openShortcutsDialog() {
  if (!refs.shortcutsDialog?.showModal) {
    return;
  }
  refs.shortcutsDialog.showModal();
}

function onGlobalKeydown(event) {
  const key = event.key || "";
  const lower = key.toLowerCase();
  const withMeta = event.ctrlKey || event.metaKey;

  if (withMeta && lower === "n") {
    event.preventDefault();
    if (state.currentUser) {
      openDialogForCreate();
    }
    return;
  }

  if (lower === "escape") {
    if (refs.searchDialog?.open) {
      closeSearchDialog();
      return;
    }
    if (refs.shortcutsDialog?.open) {
      refs.shortcutsDialog.close();
      return;
    }
    if (refs.dialog?.open) {
      refs.dialog.close();
      return;
    }
    if (state.page === "settings") {
      goToPage("library");
      return;
    }
    return;
  }

  const target = event.target;
  const isTyping =
    target instanceof HTMLElement &&
    (target.closest("input, textarea, select, [contenteditable='true']") !== null || target.tagName === "INPUT");

  if (!withMeta && lower === "/" && !isTyping && state.currentUser) {
    event.preventDefault();
    openSearchDialog();
    return;
  }

  if (!withMeta && key === "?" && !isTyping && state.currentUser) {
    event.preventDefault();
    openShortcutsDialog();
  }
}

function getSmartCollectionDefinitions() {
  return [
    { key: "all", label: "Todo" },
    { key: "due", label: "Pendientes hoy" },
    { key: "focus", label: "Enfoque (Alta)" },
    { key: "uncategorized", label: "Sin categoria" },
    { key: "duplicates", label: "Duplicados URL" },
  ];
}

function renderSmartCollections() {
  if (!refs.smartCollectionsList) {
    return;
  }
  if (!state.currentUser) {
    refs.smartCollectionsList.innerHTML = "";
    return;
  }

  const smartItems = getSmartCollectionDefinitions();
  refs.smartCollectionsList.innerHTML = smartItems
    .map((item) => {
      const total = getBaseTutorialsForSmartCollection(item.key).length;
      const isActive = state.smartCollection === item.key;
      return `
        <button type="button" class="shortcut ${isActive ? "is-active" : ""}" data-smart-collection="${item.key}">
          <span class="shortcut-line">
            <span>${item.label}</span>
            <span class="shortcut-count">${total}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderSidebarTutorials() {
  if (!state.currentUser) {
    refs.sidebarTutorialsList.innerHTML = "";
    return;
  }

  const items = [...state.tutorials]
    .sort((a, b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0))
    .slice(0, 20);

  if (!items.length) {
    refs.sidebarTutorialsList.innerHTML = `<p class="meta">Aun no hay tutoriales.</p>`;
    return;
  }

  refs.sidebarTutorialsList.innerHTML = items
    .map(
      (tutorial) => `
        <button type="button" class="shortcut sidebar-tutorial ${state.selectedId === tutorial.id ? "is-active" : ""}" data-open-id="${tutorial.id}">
          <span class="sidebar-tutorial-line">
            <span class="sidebar-tutorial-token">${tutorialTypeToken(tutorial.type)}</span>
            <span class="sidebar-tutorial-title" title="${escapeAttribute(tutorial.title)}">${escapeHtml(
              truncateSidebarTitle(tutorial.title)
            )}</span>
          </span>
        </button>
      `
    )
    .join("");
}

function renderDuplicatePanel() {
  if (!state.currentUser) {
    refs.duplicatePanel.classList.add("hidden");
    refs.duplicatePanel.innerHTML = "";
    return;
  }

  const groups = getDuplicateGroups();
  if (!groups.length) {
    refs.duplicatePanel.classList.add("hidden");
    refs.duplicatePanel.innerHTML = "";
    return;
  }

  refs.duplicatePanel.innerHTML = `
    <div class="duplicate-header">
      <h3>Duplicados detectados</h3>
      <p class="meta">${groups.length} grupo(s)</p>
    </div>
    <div class="duplicate-list">
      ${groups
        .slice(0, 5)
        .map((group) => {
          const encodedUrl = encodeURIComponent(group.url);
          return `
            <article class="duplicate-group">
              <p class="duplicate-link">${escapeHtml(group.url)}</p>
              <div class="duplicate-items">
                ${group.tutorials
                  .map(
                    (tutorial) => `
                      <button type="button" data-open-id="${tutorial.id}">${escapeHtml(tutorial.title)}</button>
                    `
                  )
                  .join("")}
              </div>
              <div class="duplicate-actions">
                <button type="button" data-archive-duplicates="${encodedUrl}">Conservar ultimo y archivar resto</button>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
  refs.duplicatePanel.classList.remove("hidden");
}

function renderBulkPanel() {
  if (!state.currentUser || !state.tutorials.length) {
    refs.bulkPanel.classList.add("hidden");
    refs.bulkCount.textContent = "0 seleccionados";
    return;
  }

  const selectedCount = getSelectedTutorials().length;
  const visibleCount = getFilteredTutorials().length;
  if (!selectedCount) {
    refs.bulkPanel.classList.add("hidden");
    refs.bulkCount.textContent = "0 seleccionados";
    return;
  }

  refs.bulkPanel.classList.remove("hidden");
  refs.bulkCount.textContent = `${selectedCount} seleccionados de ${visibleCount} visibles`;

  const hasSelection = selectedCount > 0;
  refs.selectVisibleButton.disabled = visibleCount === 0;
  refs.clearSelectionButton.disabled = !hasSelection;
  refs.applyBulkStatusButton.disabled = !hasSelection;
  refs.applyBulkPriorityButton.disabled = !hasSelection;
  refs.bulkFavoriteOnButton.disabled = !hasSelection;
  refs.bulkFavoriteOffButton.disabled = !hasSelection;
  refs.bulkDeleteButton.disabled = !hasSelection;
}

function onSelectionChange(event) {
  const selectOne = event.target.closest("[data-select-id]");
  if (selectOne) {
    toggleSelection(selectOne.dataset.selectId, selectOne.checked);
    render();
    return;
  }

  const selectAll = event.target.closest("[data-select-all-visible]");
  if (selectAll) {
    setSelectionForVisible(selectAll.checked);
    render();
  }
}

function toggleSelection(id, checked) {
  if (!id) {
    return;
  }
  if (checked) {
    state.selectedIds.add(id);
    return;
  }
  state.selectedIds.delete(id);
}

function setSelectionForVisible(checked) {
  const visible = getFilteredTutorials();
  visible.forEach((tutorial) => toggleSelection(tutorial.id, checked));
}

function selectVisibleTutorials() {
  setSelectionForVisible(true);
}

function clearSelection() {
  state.selectedIds = new Set();
}

function getSelectedTutorials() {
  return state.tutorials.filter((tutorial) => state.selectedIds.has(tutorial.id));
}

function isTutorialSelected(id) {
  return state.selectedIds.has(id);
}

function isAllVisibleSelected(items) {
  if (!items.length) {
    return false;
  }
  return items.every((item) => state.selectedIds.has(item.id));
}

function pruneSelection() {
  const currentIds = new Set(state.tutorials.map((tutorial) => tutorial.id));
  state.selectedIds = new Set([...state.selectedIds].filter((id) => currentIds.has(id)));
}

async function applyBulkStatus() {
  const status = refs.bulkStatusSelect.value;
  if (!STATUS_ORDER.includes(status)) {
    window.alert("Selecciona un estado valido.");
    return;
  }
  await applyBulkPatch({ status }, `Estado actualizado para ${getSelectedTutorials().length} tutorial(es).`);
}

async function applyBulkPriority() {
  const priority = refs.bulkPrioritySelect.value;
  if (!["Alta", "Media", "Baja"].includes(priority)) {
    window.alert("Selecciona una prioridad valida.");
    return;
  }
  await applyBulkPatch({ priority }, `Prioridad actualizada para ${getSelectedTutorials().length} tutorial(es).`);
}

async function applyBulkFavorite(isFavorite) {
  await applyBulkPatch(
    { isFavorite: Boolean(isFavorite) },
    `${isFavorite ? "Favorito ON" : "Favorito OFF"} aplicado a ${getSelectedTutorials().length} tutorial(es).`
  );
}

async function applyBulkPatch(patch, successMessage) {
  const selected = getSelectedTutorials();
  if (!selected.length) {
    window.alert("Selecciona al menos un tutorial.");
    return;
  }

  setSyncStatus(`Aplicando cambios masivos (${selected.length})...`);
  try {
    const now = new Date().toISOString();
    for (const tutorial of selected) {
      await apiUpdateTutorial(tutorial.id, {
        ...tutorial,
        ...patch,
        updatedAt: now,
      });
    }
    await refreshTutorials();
    window.alert(successMessage);
  } catch (error) {
    showOperationError(error, "No se pudo aplicar el cambio masivo.");
  }
}

async function deleteSelectedTutorials() {
  const selected = getSelectedTutorials();
  if (!selected.length) {
    window.alert("Selecciona al menos un tutorial.");
    return;
  }

  if (!window.confirm(`Eliminar ${selected.length} tutorial(es) seleccionados?`)) {
    return;
  }

  setSyncStatus(`Eliminando ${selected.length} tutorial(es)...`);
  try {
    for (const tutorial of selected) {
      await apiDeleteTutorial(tutorial.id);
      state.selectedIds.delete(tutorial.id);
      if (state.selectedId === tutorial.id) {
        state.selectedId = null;
      }
    }
    await refreshTutorials();
    window.alert(`${selected.length} tutorial(es) eliminados.`);
  } catch (error) {
    showOperationError(error, "No se pudo eliminar la seleccion.");
  }
}

function renderReminderPanel() {
  if (!state.currentUser) {
    refs.reminderPanel.classList.add("hidden");
    refs.reminderPanel.innerHTML = "";
    return;
  }

  const reminders = getDueReminders();
  if (!reminders.length) {
    refs.reminderPanel.classList.add("hidden");
    refs.reminderPanel.innerHTML = "";
    return;
  }

  refs.reminderPanel.innerHTML = `
    <div class="reminder-header">
      <h3>Recordatorios</h3>
      <p class="meta">${reminders.length} pendientes</p>
    </div>
    <div class="reminder-list">
      ${reminders
        .slice(0, 6)
        .map(
          (item) => `
            <article class="reminder-item">
              <button type="button" class="link-cell" data-open-id="${item.id}">${escapeHtml(item.title)}</button>
              <p class="meta">Repaso: ${escapeHtml(item.reviewDate)} · ${escapeHtml(item.category || "Sin categoria")}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
  refs.reminderPanel.classList.remove("hidden");
}

function getDueReminders() {
  const today = toDateKey(new Date().toISOString());
  return state.tutorials
    .filter((tutorial) => tutorial.reviewDate && tutorial.status !== "Archivado" && tutorial.reviewDate <= today)
    .sort((a, b) => a.reviewDate.localeCompare(b.reviewDate));
}

async function handleEnableReminders() {
  if (typeof Notification === "undefined") {
    window.alert("Este navegador no soporta notificaciones.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    state.reminderPermission = permission;
    updateReminderButton();
    if (permission === "granted") {
      checkAndNotifyReminders();
    }
  } catch {
    state.reminderPermission = "denied";
    updateReminderButton();
  }
}

function updateReminderButton() {
  if (!refs.enableRemindersButton) {
    return;
  }

  if (typeof Notification === "undefined") {
    refs.enableRemindersButton.textContent = "Notificaciones no disponibles";
    refs.enableRemindersButton.disabled = true;
    return;
  }

  state.reminderPermission = Notification.permission;
  if (state.reminderPermission === "granted") {
    refs.enableRemindersButton.textContent = "Recordatorios activos";
    refs.enableRemindersButton.disabled = true;
    return;
  }

  refs.enableRemindersButton.textContent = "Activar recordatorios";
  refs.enableRemindersButton.disabled = false;
}

function startReminderLoop() {
  stopReminderLoop();
  updateReminderButton();
  reminderIntervalId = window.setInterval(() => {
    checkAndNotifyReminders();
  }, 120000);
  checkAndNotifyReminders();
}

function stopReminderLoop() {
  if (reminderIntervalId) {
    window.clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}

function checkAndNotifyReminders() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }

  const reminders = getDueReminders();
  reminders.slice(0, 3).forEach((item) => {
    if (wasReminderNotified(item)) {
      return;
    }
    try {
      const notification = new Notification("Tutorial pendiente", {
        body: `${item.title} · Repaso: ${item.reviewDate}`,
      });
      notification.onclick = () => {
        window.focus();
        selectTutorial(item.id);
      };
      markReminderNotified(item);
    } catch {
      // Skip notification errors in unsupported environments.
    }
  });
}

function reminderStorageKey(item) {
  const userId = state.currentUser?.id || "guest";
  return `tv_reminder_${userId}_${item.id}_${item.reviewDate}`;
}

function wasReminderNotified(item) {
  try {
    return localStorage.getItem(reminderStorageKey(item)) === "1";
  } catch {
    return false;
  }
}

function markReminderNotified(item) {
  try {
    localStorage.setItem(reminderStorageKey(item), "1");
  } catch {}
}

function selectTutorial(id) {
  if (!id) {
    return;
  }
  state.selectedId = id;
  closeSearchDialog();
  goToPage("tutorial");
}

function render() {
  if (!state.currentUser) {
    return;
  }
  syncAdvancedFiltersVisibility();
  renderSavedViews();
  renderSmartCollections();
  renderSidebarTutorials();
  renderCategoryOptions();
  renderSearchResults();
  syncPageVisibility();
  syncViewSwitchButtons();
  syncLibraryFilters();

  if (state.page === "settings") {
    return;
  }

  if (state.page === "tutorial") {
    renderDetailPanel();
    return;
  }

  renderStats();
  renderBulkPanel();
  const filtered = getFilteredTutorials();
  renderView(filtered);
  renderReminderPanel();
  renderDuplicatePanel();
}

function renderSearchResults() {
  if (!refs.searchResults) {
    return;
  }

  const filtered = getFilteredTutorials();
  const items = filtered.slice(0, 12);
  const advancedCount = getActiveAdvancedFilterCount();
  if (refs.searchSummary) {
    refs.searchSummary.textContent = advancedCount
      ? `${filtered.length} resultado(s) con ${advancedCount} filtro(s) avanzado(s).`
      : `${filtered.length} resultado(s).`;
  }

  if (!items.length) {
    refs.searchResults.innerHTML = `<p class="meta">No hay resultados con los filtros actuales.</p>`;
    return;
  }

  refs.searchResults.innerHTML = items
    .map(
      (item) => `
        <button type="button" class="search-result-item" data-open-id="${item.id}">
          <span class="search-result-title">${escapeHtml(item.title)}</span>
          <span class="search-result-meta">${formatType(item.type)} · ${escapeHtml(item.category || "Sin categoria")}</span>
        </button>
      `
    )
    .join("");
}

function renderStats() {
  const total = state.tutorials.length;
  const byStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = state.tutorials.filter((t) => t.status === status).length;
    return acc;
  }, {});
  refs.statsGrid.innerHTML = `
    <article class="stat-card"><p>Total tutoriales</p><strong>${total}</strong></article>
    <article class="stat-card"><p>Por ver</p><strong>${byStatus["Por ver"]}</strong></article>
    <article class="stat-card"><p>En progreso</p><strong>${byStatus["En progreso"]}</strong></article>
    <article class="stat-card"><p>Aplicado</p><strong>${byStatus["Aplicado"]}</strong></article>
  `;
}

function renderCategoryOptions() {
  const categories = [...new Set(state.tutorials.map((t) => t.category).filter(Boolean))].sort((a, b) =>
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

function renderView(items) {
  refs.tableView.classList.toggle("hidden", state.view !== "table");
  refs.galleryView.classList.toggle("hidden", state.view !== "gallery");
  refs.boardView.classList.add("hidden");
  if (state.view === "gallery") {
    renderGallery(items);
  } else {
    renderTable(items);
  }
}

function renderTableLegacy(items) {
  if (!items.length) {
    renderEmptyInto(refs.tableView);
    return;
  }
  refs.tableView.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fav</th><th>Titulo</th><th>Tipo</th><th>Categoria</th><th>Estado</th><th>Prioridad</th><th>Repaso</th><th>Acciones</th></tr></thead>
        <tbody>
          ${items
            .map(
              (t) => `
                <tr>
                  <td>
                    <button type="button" class="favorite-btn ${t.isFavorite ? "is-on" : ""}" data-toggle-favorite="${t.id}" title="Favorito">
                      ${t.isFavorite ? "★" : "☆"}
                    </button>
                  </td>
                  <td><button type="button" class="link-cell" data-open-id="${t.id}">${escapeHtml(t.title)}</button></td>
                  <td>${formatType(t.type)}</td>
                  <td>${escapeHtml(t.category || "Sin categoria")}</td>
                  <td>
                    <select class="inline-select" data-inline-field="status" data-inline-id="${t.id}">
                      ${renderStatusOptions(t.status)}
                    </select>
                  </td>
                  <td>
                    <select class="inline-select" data-inline-field="priority" data-inline-id="${t.id}">
                      ${renderPriorityOptions(t.priority)}
                    </select>
                  </td>
                  <td>${escapeHtml(t.reviewDate || "-")}</td>
                  <td><div class="table-actions">
                    <button type="button" data-open-id="${t.id}">Abrir</button>
                    <button type="button" data-edit-id="${t.id}">Editar</button>
                    <button type="button" class="danger" data-delete-id="${t.id}">Eliminar</button>
                  </div></td>
                </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderGalleryLegacy(items) {
  if (!items.length) {
    renderEmptyInto(refs.galleryView);
    return;
  }
  refs.galleryView.innerHTML = `
    <div class="gallery-grid">
      ${items
        .map((t) => {
          const preview = getPreviewForCard(t);
          return `
            <article class="card">
              <img src="${preview}" alt="${escapeHtml(t.title)}" class="card-preview" data-open-id="${t.id}" />
              <div class="card-content">
                <button type="button" class="card-title-btn" data-open-id="${t.id}"><h3 class="card-title">${escapeHtml(
            t.title
          )}</h3></button>
                <p class="meta">${formatType(t.type)} - ${escapeHtml(t.category || "Sin categoria")}</p>
                <p class="meta">${escapeHtml(t.collection || "Sin coleccion")} - ${escapeHtml(t.priority)}</p>
                <p><span class="pill ${statusPillClass(t.status)}">${escapeHtml(t.status)}</span></p>
                <div class="tag-row">${t.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
                <div class="table-actions">
                  <button type="button" class="favorite-btn ${t.isFavorite ? "is-on" : ""}" data-toggle-favorite="${t.id}" title="Favorito">
                    ${t.isFavorite ? "★" : "☆"}
                  </button>
                  <button type="button" data-open-id="${t.id}">Abrir</button>
                  <button type="button" data-edit-id="${t.id}">Editar</button>
                  <button type="button" class="danger" data-delete-id="${t.id}">Eliminar</button>
                </div>
              </div>
            </article>`;
        })
        .join("")}
    </div>`;

  refs.galleryView.querySelectorAll(".card").forEach((card) => {
    const content = card.querySelector(".card-content");
    const titleButton = card.querySelector(".card-title-btn");
    const tableActions = card.querySelector(".table-actions");
    if (!(content instanceof HTMLElement) || !(titleButton instanceof HTMLElement) || !(tableActions instanceof HTMLElement)) {
      return;
    }

    const metaRows = content.querySelectorAll(".meta");
    if (metaRows[1]) {
      metaRows[1].remove();
    }
    const statusPill = content.querySelector(".pill");
    const statusLine = statusPill?.parentElement;
    const statusText = statusPill?.textContent?.trim() || "";
    if (statusLine instanceof HTMLElement) {
      statusLine.remove();
    }
    const tagRow = content.querySelector(".tag-row");
    if (tagRow instanceof HTMLElement) {
      tagRow.remove();
    }
    if (metaRows[0] && statusText) {
      metaRows[0].textContent = `${metaRows[0].textContent || ""} · ${statusText}`;
    }

    const details = document.createElement("details");
    details.className = "row-menu row-menu-card";
    const summary = document.createElement("summary");
    summary.className = "menu-trigger";
    summary.setAttribute("aria-label", "Opciones");
    summary.textContent = "...";
    const panel = document.createElement("div");
    panel.className = "row-menu-panel";

    const selectControl = tableActions.querySelector("[data-select-id]");
    if (selectControl instanceof HTMLInputElement) {
      const selectLabel = document.createElement("label");
      selectLabel.className = "menu-check";
      selectLabel.append(selectControl);
      selectLabel.append(document.createTextNode("Seleccionar"));
      panel.append(selectLabel);
    }

    const favoriteControl = tableActions.querySelector("[data-toggle-favorite]");
    if (favoriteControl instanceof HTMLButtonElement) {
      favoriteControl.classList.remove("favorite-btn");
      favoriteControl.textContent = favoriteControl.classList.contains("is-on") ? "Favorito ON" : "Favorito OFF";
      favoriteControl.classList.add("menu-favorite");
      panel.append(favoriteControl);
    }

    tableActions.className = "menu-actions";
    panel.append(tableActions);
    details.append(summary, panel);

    const head = document.createElement("div");
    head.className = "card-head";
    head.append(titleButton, details);
    content.prepend(head);
  });
}

function renderBoardLegacy(items) {
  if (!items.length) {
    renderEmptyInto(refs.boardView);
    return;
  }
  refs.boardView.innerHTML = `
    <div class="board">
      ${STATUS_ORDER.map((status) => {
        const columnItems = items.filter((t) => t.status === status);
        return `
          <section class="column">
            <h3>${status} (${columnItems.length})</h3>
            ${
              columnItems.length
                ? columnItems
                    .map(
                      (t) => `
                        <article class="mini-card">
                          <button type="button" class="link-cell" data-open-id="${t.id}">${escapeHtml(t.title)}</button>
                          <button type="button" class="favorite-btn ${t.isFavorite ? "is-on" : ""}" data-toggle-favorite="${t.id}" title="Favorito">
                            ${t.isFavorite ? "★" : "☆"}
                          </button>
                          <p>${escapeHtml(t.category || "Sin categoria")}</p>
                          <select class="inline-select" data-inline-field="status" data-inline-id="${t.id}">
                            ${renderStatusOptions(t.status)}
                          </select>
                          <select class="inline-select" data-inline-field="priority" data-inline-id="${t.id}">
                            ${renderPriorityOptions(t.priority)}
                          </select>
                          <div class="table-actions"><button type="button" data-edit-id="${t.id}">Editar</button></div>
                        </article>`
                    )
                    .join("")
                : `<p class="meta">Sin elementos</p>`
            }
          </section>`;
      }).join("")}
    </div>`;
}

function renderTableSortHeader(label, sortBy) {
  const isActive = state.sortBy === sortBy;
  const arrow = isActive ? (state.sortDirection === "asc" ? "↑" : "↓") : "";
  return `
    <button
      type="button"
      class="table-sort-btn ${isActive ? "is-active" : ""}"
      data-sort-by="${sortBy}"
      aria-label="Ordenar por ${label}"
    >
      <span>${label}</span>
      ${arrow ? `<span class="table-sort-arrow">${arrow}</span>` : ""}
    </button>
  `;
}

function renderTable(items) {
  if (!items.length) {
    renderEmptyInto(refs.tableView);
    return;
  }

  const showType = Boolean(state.visibleColumns.type);
  const showCategory = Boolean(state.visibleColumns.category);
  const showCollection = Boolean(state.visibleColumns.collection);
  const showReviewDate = Boolean(state.visibleColumns.reviewDate);
  const showUpdatedAt = Boolean(state.visibleColumns.updatedAt);

  refs.tableView.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="select-cell">
              <input
                type="checkbox"
                class="select-box"
                data-select-all-visible="1"
                aria-label="Seleccionar visibles"
                ${isAllVisibleSelected(items) ? "checked" : ""}
              />
            </th>
            <th>Fav</th>
            <th>${renderTableSortHeader("Titulo", "title")}</th>
            ${showType ? `<th>${renderTableSortHeader("Tipo", "type")}</th>` : ""}
            ${showCategory ? `<th>${renderTableSortHeader("Categoria", "category")}</th>` : ""}
            ${showCollection ? `<th>${renderTableSortHeader("Coleccion", "collection")}</th>` : ""}
            <th>${renderTableSortHeader("Prioridad", "priority")}</th>
            ${showReviewDate ? `<th>${renderTableSortHeader("Repaso", "reviewDate")}</th>` : ""}
            ${showUpdatedAt ? "<th>Actualizado</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (t) => `
                <tr class="${isTutorialSelected(t.id) ? "is-selected" : ""}">
                  <td class="select-cell">
                    <input
                      type="checkbox"
                      class="select-box"
                      data-select-id="${t.id}"
                      aria-label="Seleccionar ${escapeAttribute(t.title)}"
                      ${isTutorialSelected(t.id) ? "checked" : ""}
                    />
                  </td>
                  <td>
                    <button type="button" class="favorite-btn ${t.isFavorite ? "is-on" : ""}" data-toggle-favorite="${t.id}" title="Favorito">
                      ${t.isFavorite ? "&#9733;" : "&#9734;"}
                    </button>
                  </td>
                  <td><button type="button" class="link-cell" data-open-id="${t.id}">${escapeHtml(t.title)}</button></td>
                  ${showType ? `<td>${formatType(t.type)}</td>` : ""}
                  ${showCategory ? `<td>${escapeHtml(t.category || "Sin categoria")}</td>` : ""}
                  ${showCollection ? `<td>${escapeHtml(t.collection || "Sin coleccion")}</td>` : ""}
                  <td>${escapeHtml(t.priority || "-")}</td>
                  ${showReviewDate ? `<td>${escapeHtml(t.reviewDate || "-")}</td>` : ""}
                  ${showUpdatedAt ? `<td>${escapeHtml(formatListDate(t.updatedAt || t.createdAt))}</td>` : ""}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderGallery(items) {
  if (!items.length) {
    renderEmptyInto(refs.galleryView);
    return;
  }

  refs.galleryView.innerHTML = `
    <div class="gallery-grid">
      ${items
        .map((t) => {
          const preview = getPreviewForCard(t);
          return `
            <article class="card card-compact ${isTutorialSelected(t.id) ? "is-selected" : ""}">
              <img src="${preview}" alt="${escapeHtml(t.title)}" class="card-preview" data-open-id="${t.id}" />
              <div class="card-content">
                <button type="button" class="card-title-btn" data-open-id="${t.id}">
                  <h3 class="card-title">${escapeHtml(t.title)}</h3>
                </button>
                <p class="meta">${formatType(t.type)} · ${escapeHtml(t.category || "Sin categoria")}</p>
                <p class="meta">${escapeHtml(t.collection || "Sin coleccion")} · ${escapeHtml(t.priority)}</p>
                <p><span class="pill ${statusPillClass(t.status)}">${escapeHtml(t.status)}</span></p>
                <div class="tag-row">${t.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
                <div class="table-actions">
                  <input
                    type="checkbox"
                    class="select-box"
                    data-select-id="${t.id}"
                    aria-label="Seleccionar ${escapeAttribute(t.title)}"
                    ${isTutorialSelected(t.id) ? "checked" : ""}
                  />
                  <button type="button" class="favorite-btn ${t.isFavorite ? "is-on" : ""}" data-toggle-favorite="${t.id}" title="Favorito">
                    ${t.isFavorite ? "&#9733;" : "&#9734;"}
                  </button>
                  <button type="button" data-open-id="${t.id}">Abrir</button>
                  <button type="button" data-edit-id="${t.id}">Editar</button>
                  <button type="button" class="danger" data-delete-id="${t.id}">Eliminar</button>
                </div>
              </div>
            </article>`;
        })
        .join("")}
    </div>`;

  refs.galleryView.querySelectorAll(".card").forEach((card) => {
    const content = card.querySelector(".card-content");
    const titleButton = card.querySelector(".card-title-btn");
    const tableActions = card.querySelector(".table-actions");
    if (!(content instanceof HTMLElement) || !(titleButton instanceof HTMLElement) || !(tableActions instanceof HTMLElement)) {
      return;
    }

    const metaRows = content.querySelectorAll(".meta");
    if (metaRows[1]) {
      metaRows[1].remove();
    }
    const statusPill = content.querySelector(".pill");
    const statusLine = statusPill?.parentElement;
    const statusText = statusPill?.textContent?.trim() || "";
    if (statusLine instanceof HTMLElement) {
      statusLine.remove();
    }
    const tagRow = content.querySelector(".tag-row");
    if (tagRow instanceof HTMLElement) {
      tagRow.remove();
    }
    if (metaRows[0] && statusText) {
      metaRows[0].textContent = `${metaRows[0].textContent || ""} · ${statusText}`;
    }

    const details = document.createElement("details");
    details.className = "row-menu row-menu-card";
    const summary = document.createElement("summary");
    summary.className = "menu-trigger";
    summary.setAttribute("aria-label", "Opciones");
    summary.textContent = "...";
    const panel = document.createElement("div");
    panel.className = "row-menu-panel";

    const selectControl = tableActions.querySelector("[data-select-id]");
    if (selectControl instanceof HTMLInputElement) {
      const selectLabel = document.createElement("label");
      selectLabel.className = "menu-check";
      selectLabel.append(selectControl);
      selectLabel.append(document.createTextNode("Seleccionar"));
      panel.append(selectLabel);
    }

    const favoriteControl = tableActions.querySelector("[data-toggle-favorite]");
    if (favoriteControl instanceof HTMLButtonElement) {
      favoriteControl.classList.remove("favorite-btn");
      favoriteControl.textContent = favoriteControl.classList.contains("is-on") ? "Favorito ON" : "Favorito OFF";
      favoriteControl.classList.add("menu-favorite");
      panel.append(favoriteControl);
    }

    tableActions.className = "menu-actions";
    panel.append(tableActions);
    details.append(summary, panel);

    const head = document.createElement("div");
    head.className = "card-head";
    head.append(titleButton, details);
    content.prepend(head);
  });
}

function renderBoard(items) {
  if (!items.length) {
    renderEmptyInto(refs.boardView);
    return;
  }

  refs.boardView.innerHTML = `
    <div class="board">
      ${STATUS_ORDER.map((status) => {
        const columnItems = items.filter((t) => t.status === status);
        return `
          <section class="column">
            <h3>${status} (${columnItems.length})</h3>
            ${
              columnItems.length
                ? columnItems
                    .map(
                      (t) => `
                        <article class="mini-card ${isTutorialSelected(t.id) ? "is-selected" : ""}">
                          <div class="mini-card-top">
                            <input
                              type="checkbox"
                              class="select-box"
                              data-select-id="${t.id}"
                              aria-label="Seleccionar ${escapeAttribute(t.title)}"
                              ${isTutorialSelected(t.id) ? "checked" : ""}
                            />
                            <button type="button" class="favorite-btn ${t.isFavorite ? "is-on" : ""}" data-toggle-favorite="${t.id}" title="Favorito">
                              ${t.isFavorite ? "&#9733;" : "&#9734;"}
                            </button>
                          </div>
                          <button type="button" class="link-cell" data-open-id="${t.id}">${escapeHtml(t.title)}</button>
                          <p>${escapeHtml(t.category || "Sin categoria")}</p>
                          <select class="inline-select" data-inline-field="status" data-inline-id="${t.id}">
                            ${renderStatusOptions(t.status)}
                          </select>
                          <select class="inline-select" data-inline-field="priority" data-inline-id="${t.id}">
                            ${renderPriorityOptions(t.priority)}
                          </select>
                          <div class="table-actions"><button type="button" data-edit-id="${t.id}">Editar</button></div>
                        </article>`
                    )
                    .join("")
                : `<p class="meta">Sin elementos</p>`
            }
          </section>`;
      }).join("")}
    </div>`;
}

function renderDetailPanel() {
  if (!state.currentUser || !state.tutorials.length) {
    refs.detailPanel.innerHTML = `
      <div class="empty-state">
        <h3>No hay tutoriales para abrir</h3>
        <p>Vuelve a la biblioteca para crear tu primer tutorial.</p>
      </div>
    `;
    return;
  }
  let tutorial = state.tutorials.find((item) => item.id === state.selectedId);
  if (!tutorial) {
    tutorial = state.tutorials[0];
    state.selectedId = tutorial.id;
  }

  const tagsHtml = tutorial.tags.length
    ? tutorial.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")
    : `<span class="empty-side">Sin etiquetas</span>`;
  const tsHtml = tutorial.timestamps.length
    ? `<ul class="timestamp-list">${tutorial.timestamps.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : `<p class="empty-side">Sin timestamps</p>`;
  const notesHtml = tutorial.notes ? nl2br(escapeHtml(tutorial.notes)) : `<span class="empty-side">Sin notas</span>`;
  const createdAt = new Date(tutorial.createdAt || Date.now()).toLocaleString("es-BO");
  const updatedAt = new Date(tutorial.updatedAt || tutorial.createdAt || Date.now()).toLocaleString("es-BO");

  refs.detailPanel.innerHTML = `
    <div class="detail-top">
      <div>
        <p class="eyebrow">Pagina de tutorial</p>
        <h3>${escapeHtml(tutorial.title)}</h3>
        <div class="detail-meta">
          <span class="pill ${statusPillClass(tutorial.status)}">${escapeHtml(tutorial.status)}</span>
          <span class="tag">${formatType(tutorial.type)}</span>
          <span class="tag">${escapeHtml(tutorial.category || "Sin categoria")}</span>
          <span class="tag">${escapeHtml(tutorial.priority)}</span>
        </div>
      </div>
      <div class="table-actions">
        <button type="button" class="favorite-btn ${tutorial.isFavorite ? "is-on" : ""}" data-toggle-favorite="${tutorial.id}" title="Favorito">
          ${tutorial.isFavorite ? "★" : "☆"}
        </button>
        <button type="button" data-edit-id="${tutorial.id}">Editar</button>
      </div>
    </div>
    <div class="tutorial-properties">
      <div class="tutorial-property-row">
        <span class="tutorial-property-label">Creado</span>
        <span class="tutorial-property-value">${escapeHtml(createdAt)}</span>
      </div>
      <div class="tutorial-property-row">
        <span class="tutorial-property-label">Actualizado</span>
        <span class="tutorial-property-value">${escapeHtml(updatedAt)}</span>
      </div>
      <div class="tutorial-property-row">
        <span class="tutorial-property-label">Coleccion</span>
        <span class="tutorial-property-value">${escapeHtml(tutorial.collection || "Sin coleccion")}</span>
      </div>
      <div class="tutorial-property-row">
        <span class="tutorial-property-label">Fuente</span>
        <span class="tutorial-property-value">${escapeHtml(formatSource(tutorial.source || "manual"))}</span>
      </div>
    </div>
    <div class="detail-grid">
      <div class="media-frame">${renderDetailMedia(tutorial)}</div>
      <aside class="detail-side">
        <div><h4>Etiquetas</h4><div class="tag-row">${tagsHtml}</div></div>
        <div><h4>Notas</h4><p>${notesHtml}</p></div>
        <div><h4>Timestamps</h4>${tsHtml}</div>
        <div><h4>Repaso</h4><p>${escapeHtml(tutorial.reviewDate || "Sin fecha")}</p></div>
      </aside>
    </div>`;

  const favoriteButton = refs.detailPanel.querySelector(`[data-toggle-favorite="${tutorial.id}"]`);
  if (favoriteButton) {
    favoriteButton.innerHTML = tutorial.isFavorite ? "&#9733;" : "&#9734;";
  }
}

function renderDetailMedia(tutorial) {
  if (tutorial.type === "text") {
    return `<pre>${escapeHtml(tutorial.textContent || tutorial.notes || "Sin contenido de texto.")}</pre>`;
  }
  if (tutorial.type === "image") {
    const imageUrl = tutorial.imageUrl || tutorial.url;
    return imageUrl ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(tutorial.title)}" />` : "<p class='empty-side'>No hay imagen para mostrar.</p>";
  }
  const youtubeId = extractYouTubeId(tutorial.url);
  if (youtubeId) {
    return `<iframe src="https://www.youtube.com/embed/${youtubeId}" title="${escapeAttribute(
      tutorial.title
    )}" allowfullscreen loading="lazy"></iframe>`;
  }
  if (isLikelyVideoUrl(tutorial.url)) {
    return `<video controls src="${escapeAttribute(tutorial.url)}"></video>`;
  }
  return tutorial.url
    ? `<p><a href="${escapeAttribute(tutorial.url)}" target="_blank" rel="noreferrer">Abrir video</a></p>`
    : "<p class='empty-side'>No hay video para mostrar.</p>";
}

function renderEmptyInto(container) {
  container.innerHTML = "";
  container.append(refs.emptyStateTemplate.content.cloneNode(true));
}

function openDialogForCreate() {
  state.editingId = null;
  refs.dialogTitle.textContent = "Nuevo tutorial";
  refs.deleteButton.classList.add("hidden");
  refs.tutorialForm.reset();
  refs.typeInput.value = "video";
  syncTypeSpecificFields();
  refs.sourceInput.value = "youtube";
  resetUploadProgress();
  setUploadStatus("Sin archivo adjunto", false);
  refs.dialog.showModal();
}

function openDialogForEdit(id) {
  const t = state.tutorials.find((item) => item.id === id);
  if (!t) {
    return;
  }
  state.editingId = id;
  refs.dialogTitle.textContent = "Editar tutorial";
  refs.deleteButton.classList.remove("hidden");
  refs.tutorialForm.elements.title.value = t.title;
  refs.tutorialForm.elements.type.value = t.type;
  syncTypeSpecificFields();
  refs.tutorialForm.elements.source.value = t.source || "manual";
  refs.tutorialForm.elements.url.value = t.url || "";
  refs.tutorialForm.elements.category.value = t.category || "";
  refs.tutorialForm.elements.collection.value = t.collection || "";
  refs.tutorialForm.elements.status.value = t.status;
  refs.tutorialForm.elements.priority.value = t.priority;
  refs.tutorialForm.elements.reviewDate.value = t.reviewDate || "";
  refs.tutorialForm.elements.tags.value = t.tags.join(", ");
  refs.tutorialForm.elements.imageUrl.value = t.imageUrl || "";
  refs.tutorialForm.elements.textContent.value = t.textContent || "";
  refs.tutorialForm.elements.notes.value = t.notes || "";
  refs.tutorialForm.elements.timestamps.value = t.timestamps.join("\n");
  resetUploadProgress();
  setUploadStatus("Puedes arrastrar un archivo para reemplazar contenido.", false);
  refs.dialog.showModal();
}

async function upsertTutorialFromForm() {
  const f = refs.tutorialForm.elements;
  const title = f.title.value.trim();
  const type = f.type.value;
  const url = f.url.value.trim();
  const normalizedUrl = normalizeUrl(url);
  if (!title) {
    window.alert("El titulo es obligatorio.");
    return;
  }

  const duplicate = state.tutorials.find((t) => t.normalizedUrl && t.normalizedUrl === normalizedUrl && t.id !== state.editingId);
  if (normalizedUrl && duplicate && !window.confirm(`Ya existe un tutorial con esa URL: "${duplicate.title}". ¿Deseas guardarlo igual?`)) {
    return;
  }

  const now = new Date().toISOString();
  const current = state.editingId ? state.tutorials.find((tutorial) => tutorial.id === state.editingId) : null;
  const payload = {
    id: state.editingId || createId(),
    title,
    type,
    source: pickSource(f.source.value, url),
    url,
    normalizedUrl,
    imageUrl: f.imageUrl.value.trim(),
    textContent: f.textContent.value.trim(),
    category: f.category.value.trim(),
    collection: f.collection.value.trim(),
    status: f.status.value,
    priority: f.priority.value,
    isFavorite: current ? Boolean(current.isFavorite) : false,
    reviewDate: f.reviewDate.value,
    tags: parseTags(f.tags.value),
    notes: f.notes.value.trim(),
    timestamps: f.timestamps.value.split("\n").map((line) => line.trim()).filter(Boolean),
    updatedAt: now,
  };

  setFormBusy(true);
  try {
    if (state.editingId) {
      await apiUpdateTutorial(state.editingId, payload);
      state.selectedId = state.editingId;
    } else {
      payload.createdAt = now;
      await apiCreateTutorial(payload);
      state.selectedId = payload.id;
    }
    refs.dialog.close();
    await refreshTutorials();
  } catch (error) {
    showOperationError(error, "No se pudo guardar el tutorial.");
  } finally {
    setFormBusy(false);
  }
}

async function deleteEditingTutorial() {
  if (!state.editingId) {
    refs.dialog.close();
    return;
  }
  const target = state.tutorials.find((t) => t.id === state.editingId);
  if (!target) {
    refs.dialog.close();
    return;
  }
  if (!window.confirm(`Eliminar "${target.title}"?`)) {
    return;
  }
  setFormBusy(true);
  try {
    await apiDeleteTutorial(state.editingId);
    refs.dialog.close();
    if (state.selectedId === state.editingId) {
      state.selectedId = null;
    }
    state.selectedIds.delete(state.editingId);
    await refreshTutorials();
  } catch (error) {
    showOperationError(error, "No se pudo eliminar el tutorial.");
  } finally {
    setFormBusy(false);
  }
}

function syncTypeSpecificFields() {
  const type = refs.typeInput.value;
  const previousSource = refs.sourceInput.value;
  refs.imageUrlField.classList.toggle("hidden", type !== "image");
  refs.textContentField.classList.toggle("hidden", type !== "text");
  if (type === "video") {
    refs.sourceInput.innerHTML = `
      <option value="youtube">YouTube</option>
      <option value="instagram">Instagram</option>
      <option value="manual">Manual</option>`;
    refs.sourceInput.value = ["youtube", "instagram", "manual"].includes(previousSource) ? previousSource : "youtube";
    return;
  }
  refs.sourceInput.innerHTML = `<option value="manual">Manual</option>`;
  refs.sourceInput.value = "manual";
}

async function handlePickedFile(file) {
  if (!file) {
    return;
  }
  if (!state.currentUser) {
    setUploadStatus("Debes iniciar sesion para subir archivos.", true);
    return;
  }

  const validationError = validateFileBeforeUpload(file);
  if (validationError) {
    setUploadStatus(validationError, true);
    return;
  }

  const lowerName = file.name.toLowerCase();
  const isText = file.type.startsWith("text/") || TEXT_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  try {
    if (isText) {
      refs.typeInput.value = "text";
      syncTypeSpecificFields();
      refs.tutorialForm.elements.textContent.value = await file.text();
      refs.tutorialForm.elements.url.value = "";
      refs.tutorialForm.elements.source.value = "manual";
      ensureTitleFromFile(file.name);
      resetUploadProgress();
      setUploadStatus(`Texto cargado: ${file.name}`, false);
      return;
    }

    setUploadStatus("Subiendo archivo...", false);
    setUploadProgress(0, true);
    const uploaded = await apiUploadFile(file, (percent) => {
      setUploadProgress(percent, true);
      setUploadStatus(`Subiendo archivo... ${percent}%`, false);
    });
    setUploadProgress(100, true);
    const uploadedUrl = uploaded.url;
    if (file.type.startsWith("image/")) {
      refs.typeInput.value = "image";
      syncTypeSpecificFields();
      refs.tutorialForm.elements.imageUrl.value = uploadedUrl;
      refs.tutorialForm.elements.url.value = uploadedUrl;
      refs.tutorialForm.elements.source.value = "manual";
      ensureTitleFromFile(file.name);
      setUploadStatus(`Imagen subida: ${file.name}`, false);
      scheduleUploadProgressReset();
      return;
    }
    if (file.type.startsWith("video/")) {
      refs.typeInput.value = "video";
      syncTypeSpecificFields();
      refs.tutorialForm.elements.url.value = uploadedUrl;
      refs.tutorialForm.elements.source.value = "manual";
      ensureTitleFromFile(file.name);
      setUploadStatus(`Video subido: ${file.name}`, false);
      scheduleUploadProgressReset();
      return;
    }
    refs.tutorialForm.elements.url.value = uploadedUrl;
    refs.tutorialForm.elements.source.value = "manual";
    ensureTitleFromFile(file.name);
    setUploadStatus(`Archivo subido: ${file.name}`, false);
    scheduleUploadProgressReset();
  } catch (error) {
    resetUploadProgress();
    setUploadStatus(resolveError(error, "No se pudo procesar el archivo."), true);
  }
}

function ensureTitleFromFile(fileName) {
  if (refs.tutorialForm.elements.title.value.trim()) {
    return;
  }
  const clean = String(fileName || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  refs.tutorialForm.elements.title.value = clean || "Nuevo tutorial";
}

function validateFileBeforeUpload(file) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "El archivo supera el maximo de 250MB.";
  }

  const lowerName = file.name.toLowerCase();
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isText = file.type.startsWith("text/") || TEXT_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (isImage || isVideo || isText) {
    return "";
  }

  return "Tipo de archivo no soportado. Usa imagen, video o texto.";
}

function setUploadStatus(message, isError) {
  refs.uploadStatus.textContent = message;
  refs.uploadStatus.classList.toggle("is-error", isError);
}

function setUploadProgress(percent, visible) {
  refs.uploadProgress.value = Math.max(0, Math.min(100, Number(percent) || 0));
  refs.uploadProgress.classList.toggle("hidden", !visible);
}

function resetUploadProgress() {
  refs.uploadProgress.value = 0;
  refs.uploadProgress.classList.add("hidden");
}

function scheduleUploadProgressReset() {
  if (uploadProgressTimer) {
    window.clearTimeout(uploadProgressTimer);
  }
  uploadProgressTimer = window.setTimeout(() => {
    resetUploadProgress();
  }, 900);
}

function getBaseTutorialsForSmartCollection(collectionKey) {
  const key = normalizeSmartCollectionKey(collectionKey);
  if (key === "all") {
    return [...state.tutorials];
  }

  if (key === "due") {
    const today = toDateKey(new Date().toISOString());
    return state.tutorials.filter((tutorial) => tutorial.reviewDate && tutorial.reviewDate <= today && tutorial.status !== "Archivado");
  }

  if (key === "focus") {
    return state.tutorials.filter(
      (tutorial) =>
        tutorial.priority === "Alta" && (tutorial.status === "Por ver" || tutorial.status === "En progreso")
    );
  }

  if (key === "uncategorized") {
    return state.tutorials.filter((tutorial) => !tutorial.category.trim());
  }

  if (key === "duplicates") {
    const duplicateIds = new Set(getDuplicateGroups().flatMap((group) => group.tutorials.map((tutorial) => tutorial.id)));
    return state.tutorials.filter((tutorial) => duplicateIds.has(tutorial.id));
  }

  return [...state.tutorials];
}

function getDuplicateGroups() {
  const byNormalizedUrl = new Map();
  state.tutorials.forEach((tutorial) => {
    const key = (tutorial.normalizedUrl || "").trim().toLowerCase();
    if (!key) {
      return;
    }
    if (!byNormalizedUrl.has(key)) {
      byNormalizedUrl.set(key, []);
    }
    byNormalizedUrl.get(key).push(tutorial);
  });

  return [...byNormalizedUrl.entries()]
    .filter((entry) => entry[1].length > 1)
    .map(([url, tutorials]) => ({
      url,
      tutorials: [...tutorials].sort(
        (a, b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0)
      ),
    }))
    .sort((a, b) => b.tutorials.length - a.tutorials.length);
}

function getFilteredTutorials() {
  return getBaseTutorialsForSmartCollection(state.smartCollection)
    .filter((t) => {
      if (state.type !== "all" && t.type !== state.type) {
        return false;
      }
      if (state.status !== "all" && t.status !== state.status) {
        return false;
      }
      if (state.category !== "all" && t.category !== state.category) {
        return false;
      }
      if (state.priority !== "all" && t.priority !== state.priority) {
        return false;
      }
      if (state.favoritesOnly && !t.isFavorite) {
        return false;
      }
      if (state.tagQuery) {
        const hasTag = t.tags.some((tag) => tag.toLowerCase().includes(state.tagQuery));
        if (!hasTag) {
          return false;
        }
      }
      const updatedDate = toDateKey(t.updatedAt || t.createdAt);
      if (state.updatedFrom && (!updatedDate || updatedDate < state.updatedFrom)) {
        return false;
      }
      if (state.updatedTo && (!updatedDate || updatedDate > state.updatedTo)) {
        return false;
      }
      if (!state.search) {
        return true;
      }
      return String(t.title || "").toLowerCase().includes(state.search);
    })
    .sort(compareTutorialForSort);
}

function compareTutorialForSort(left, right) {
  const direction = state.sortDirection === "asc" ? 1 : -1;
  const by = state.sortBy;

  if (by === "title") {
    return compareByTextValues(left.title, right.title, direction, left, right);
  }

  if (by === "type") {
    return compareByTextValues(formatType(left.type), formatType(right.type), direction, left, right);
  }

  if (by === "category") {
    return compareByTextValues(left.category, right.category, direction, left, right);
  }

  if (by === "collection") {
    return compareByTextValues(left.collection, right.collection, direction, left, right);
  }

  if (by === "reviewDate") {
    const leftDate = left.reviewDate || "";
    const rightDate = right.reviewDate || "";
    if (!leftDate && !rightDate) {
      return compareByUpdated(left, right, direction);
    }
    if (!leftDate) {
      return 1;
    }
    if (!rightDate) {
      return -1;
    }
    const diff = direction * leftDate.localeCompare(rightDate);
    if (diff !== 0) {
      return diff;
    }
    return compareByUpdated(left, right, direction);
  }

  if (by === "priority") {
    const diff = direction * (priorityRank(left.priority) - priorityRank(right.priority));
    if (diff !== 0) {
      return diff;
    }
    return compareByUpdated(left, right, direction);
  }

  if (by === "createdAt") {
    const diff = compareByDate(left.createdAt, right.createdAt, direction);
    if (diff !== 0) {
      return diff;
    }
    return compareByUpdated(left, right, direction);
  }

  const diff = compareByUpdated(left, right, direction);
  if (diff !== 0) {
    return diff;
  }
  return compareByTextValues(left.title, right.title, direction, left, right);
}

function compareByUpdated(left, right, direction) {
  return compareByDate(left.updatedAt || left.createdAt, right.updatedAt || right.createdAt, direction);
}

function compareByDate(leftValue, rightValue, direction) {
  const left = Date.parse(leftValue || "");
  const right = Date.parse(rightValue || "");
  const leftValid = Number.isFinite(left);
  const rightValid = Number.isFinite(right);

  if (!leftValid && !rightValid) {
    return 0;
  }
  if (!leftValid) {
    return 1;
  }
  if (!rightValid) {
    return -1;
  }
  return direction * (left - right);
}

function compareByTextValues(leftValue, rightValue, direction, left, right) {
  const leftText = String(leftValue || "").trim();
  const rightText = String(rightValue || "").trim();
  if (!leftText && !rightText) {
    return compareByUpdated(left, right, direction);
  }
  if (!leftText) {
    return 1;
  }
  if (!rightText) {
    return -1;
  }

  const diff = direction * leftText.localeCompare(rightText, "es", { sensitivity: "base" });
  if (diff !== 0) {
    return diff;
  }
  return compareByUpdated(left, right, direction);
}

function priorityRank(priority) {
  if (priority === "Alta") {
    return 3;
  }
  if (priority === "Media") {
    return 2;
  }
  return 1;
}

function toDateKey(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function formatListDate(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("es-BO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusPillClass(status) {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function formatType(type) {
  return type === "video" ? "Video" : type === "image" ? "Imagen" : "Texto";
}

function truncateSidebarTitle(value, maxLength = 34) {
  const text = String(value || "").trim();
  if (!text) {
    return "Sin titulo";
  }
  if (text.length <= maxLength) {
    return text;
  }
  const cut = Math.max(1, maxLength - 3);
  return `${text.slice(0, cut).trimEnd()}...`;
}

function formatSource(source) {
  if (source === "youtube") {
    return "YouTube";
  }
  if (source === "instagram") {
    return "Instagram";
  }
  return "Manual";
}

function tutorialTypeToken(type) {
  if (type === "video") {
    return "V";
  }
  if (type === "image") {
    return "I";
  }
  return "T";
}

function renderStatusOptions(selected) {
  return STATUS_ORDER.map((status) => `<option value="${status}" ${selected === status ? "selected" : ""}>${status}</option>`).join("");
}

function renderPriorityOptions(selected) {
  return ["Alta", "Media", "Baja"]
    .map((priority) => `<option value="${priority}" ${selected === priority ? "selected" : ""}>${priority}</option>`)
    .join("");
}

function getPreviewForCard(tutorial) {
  if (tutorial.type === "image") {
    return tutorial.imageUrl || tutorial.url || genericPreview("image");
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
  return "data:image/svg+xml;utf8," + encodeURIComponent(textSvg(type === "video" ? "VID" : type === "text" ? "TXT" : "IMG"));
}

function textSvg(token) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#e6e1d3' /><stop offset='1' stop-color='#d2dfd7' /></linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)' /><text x='50%' y='50%' font-size='64' font-family='Arial' text-anchor='middle' fill='#3b4a3f'>${token}</text>
  </svg>`;
}

function parseTags(value) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
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
  for (const pattern of [/(?:youtube\.com\/watch\?v=)([^&]+)/i, /(?:youtu\.be\/)([^?&]+)/i, /(?:youtube\.com\/shorts\/)([^?&]+)/i]) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return "";
}

function isLikelyVideoUrl(url) {
  return !!url && (/(\.mp4|\.webm|\.mov|\.ogg)(\?.*)?$/i.test(url) || url.startsWith("/uploads/"));
}

function normalizeUrl(url) {
  if (!url) {
    return "";
  }
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, "");
  }
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function nl2br(value) {
  return String(value).replaceAll("\n", "<br>");
}

function createId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function setFormBusy(isBusy) {
  Array.from(refs.tutorialForm.elements).forEach((element) => {
    element.disabled = isBusy;
  });
  refs.saveButton.textContent = isBusy ? "Guardando..." : "Guardar";
}

function setSyncStatus(message, isError = false) {
  refs.syncStatus.textContent = message;
  refs.syncStatus.classList.toggle("is-error", isError);
}

function resolveError(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function showOperationError(error, fallback) {
  window.alert(resolveError(error, fallback));
}

async function refreshTutorials() {
  if (!state.currentUser) {
    return;
  }
  setSyncStatus("Sincronizando con el servidor...");
  try {
    state.tutorials = (await apiListTutorials()).map(normalizeTutorial);
    pruneSelection();
    if (!state.selectedId || !state.tutorials.some((t) => t.id === state.selectedId)) {
      state.selectedId = state.tutorials[0]?.id || null;
    }
    setSyncStatus(`Sincronizado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    checkAndNotifyReminders();
  } catch (error) {
    setSyncStatus(resolveError(error, "No se pudo conectar con el backend."), true);
  } finally {
    render();
  }
}

function normalizeTutorial(item) {
  const now = new Date().toISOString();
  return {
    id: typeof item.id === "string" ? item.id : createId(),
    title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Sin titulo",
    type: item.type === "video" || item.type === "image" || item.type === "text" ? item.type : "text",
    source: typeof item.source === "string" ? item.source : "manual",
    url: typeof item.url === "string" ? item.url : "",
    normalizedUrl: normalizeUrl(typeof item.url === "string" ? item.url : ""),
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
    textContent: typeof item.textContent === "string" ? item.textContent : "",
    category: typeof item.category === "string" ? item.category : "",
    collection: typeof item.collection === "string" ? item.collection : "",
    status: STATUS_ORDER.includes(item.status) ? item.status : "Por ver",
    priority: ["Alta", "Media", "Baja"].includes(item.priority) ? item.priority : "Media",
    isFavorite: Boolean(item.isFavorite),
    reviewDate: typeof item.reviewDate === "string" ? item.reviewDate : "",
    tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === "string") : [],
    notes: typeof item.notes === "string" ? item.notes : "",
    timestamps: Array.isArray(item.timestamps) ? item.timestamps.filter((entry) => typeof entry === "string") : [],
    createdAt: typeof item.createdAt === "string" ? item.createdAt : now,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : now,
  };
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

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed)) {
      throw new Error("Formato invalido");
    }
    await apiReplaceTutorials(parsed.map(normalizeTutorial));
    await refreshTutorials();
    window.alert(`Importacion completada: ${parsed.length} tutoriales.`);
  } catch (error) {
    showOperationError(error, "No se pudo importar el archivo JSON.");
  } finally {
    refs.importInput.value = "";
  }
}

async function injectDemoData() {
  if (!state.currentUser) {
    window.alert("Debes iniciar sesion.");
    return;
  }
  if (state.tutorials.length > 0 && !window.confirm("Ya tienes datos. ¿Agregar ejemplos igualmente?")) {
    return;
  }
  const now = new Date().toISOString();
  const demo = [
    {
      id: createId(),
      title: "Composicion visual para reels",
      type: "video",
      source: "instagram",
      url: "https://www.instagram.com/reel/CxExample01/",
      normalizedUrl: "https://www.instagram.com/reel/CxExample01",
      imageUrl: "",
      textContent: "",
      category: "Edicion",
      collection: "Portfolio 2026",
      status: "Por ver",
      priority: "Alta",
      isFavorite: true,
      reviewDate: "",
      tags: ["reels", "composicion"],
      notes: "Aplicar en proyecto de branding personal.",
      timestamps: ["00:52 Intro", "02:18 Regla de tercios"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      title: "Diseno de componentes UI en Figma",
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
      isFavorite: false,
      reviewDate: "",
      tags: ["figma", "componentes", "ui"],
      notes: "Revisar nuevamente la parte de variantes.",
      timestamps: ["03:12 Auto layout", "08:44 Variants"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
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
      isFavorite: false,
      reviewDate: "",
      tags: ["copy", "landing"],
      notes: "Ya aplicado en la landing del portfolio.",
      timestamps: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
  try {
    await apiReplaceTutorials([...demo, ...state.tutorials]);
    state.selectedId = demo[0].id;
    await refreshTutorials();
  } catch (error) {
    showOperationError(error, "No se pudo cargar la data de ejemplo.");
  }
}

async function apiAuthMe() {
  return requestJson(`${API_BASE}/auth/me`);
}

async function apiRegister(email, password) {
  return requestJson(`${API_BASE}/auth/register`, { method: "POST", body: { email, password } });
}

async function apiLogin(email, password) {
  return requestJson(`${API_BASE}/auth/login`, { method: "POST", body: { email, password } });
}

async function apiLogout() {
  return requestJson(`${API_BASE}/auth/logout`, { method: "POST" });
}

async function apiListTutorials() {
  return requestJson(`${API_BASE}/tutorials`);
}

async function apiCreateTutorial(payload) {
  return requestJson(`${API_BASE}/tutorials`, { method: "POST", body: payload });
}

async function apiUpdateTutorial(id, payload) {
  return requestJson(`${API_BASE}/tutorials/${encodeURIComponent(id)}`, { method: "PUT", body: payload });
}

async function apiDeleteTutorial(id) {
  return requestJson(`${API_BASE}/tutorials/${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function apiReplaceTutorials(tutorials) {
  return requestJson(`${API_BASE}/tutorials/import`, { method: "POST", body: { tutorials } });
}

async function apiListSavedViews() {
  return requestJson(`${API_BASE}/saved-views`);
}

async function apiCreateSavedView(payload) {
  return requestJson(`${API_BASE}/saved-views`, { method: "POST", body: payload });
}

async function apiDeleteSavedView(id) {
  return requestJson(`${API_BASE}/saved-views/${encodeURIComponent(id)}`, { method: "DELETE" });
}

function apiUploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const payload = new FormData();
    payload.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/uploads`, true);
    xhr.withCredentials = true;

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || typeof onProgress !== "function") {
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    });

    xhr.addEventListener("load", () => {
      let body = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = xhr.responseText;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const message = body && typeof body === "object" && "error" in body && body.error ? body.error : `Error al subir archivo (${xhr.status})`;
        reject(new Error(String(message)));
        return;
      }
      resolve(body);
    });

    xhr.addEventListener("error", () => {
      reject(new Error("No se pudo subir el archivo."));
    });

    xhr.send(payload);
  });
}

async function requestJson(url, options = {}) {
  const init = { method: options.method || "GET", headers: {}, credentials: "include" };
  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, init);
  const body = await readResponseBody(response);
  if (!response.ok) {
    if (response.status === 401 && !url.includes("/auth/")) {
      setAuthenticated(null);
      setAuthMessage("Sesion expirada. Vuelve a iniciar sesion.", true);
    }
    const message = body && typeof body === "object" && "error" in body && body.error ? body.error : `Error de red (${response.status})`;
    throw new Error(String(message));
  }
  return body;
}

async function readResponseBody(response) {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
