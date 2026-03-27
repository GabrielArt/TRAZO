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
  notesSide: getInitialNotesSide(),
  tutorialEditMode: false,
  editingId: null,
  selectedId: null,
  selectedIds: new Set(),
  extraComposer: null,
  extraMediaContext: null,
  mediaCarouselIndexByTutorial: {},
  currentUser: null,
  authMode: "login",
  reminderPermission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS },
};

let uploadProgressTimer = null;
let reminderIntervalId = null;
let notesAutosaveTimer = null;
let extraComposerAutosaveTimer = null;
let isApplyingRoute = false;
let activeDraggedExtraBlock = null;
const extraBlockAutosaveTimers = new Map();
const tutorialEditorAutosaveTimers = new Map();

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
  extraMediaDialog: document.querySelector("#extraMediaDialog"),
  extraMediaForm: document.querySelector("#extraMediaForm"),
  extraMediaTitle: document.querySelector("#extraMediaTitle"),
  closeExtraMediaButton: document.querySelector("#closeExtraMediaButton"),
  cancelExtraMediaButton: document.querySelector("#cancelExtraMediaButton"),
  saveExtraMediaButton: document.querySelector("#saveExtraMediaButton"),
  extraMediaModeButtons: Array.from(document.querySelectorAll("[data-extra-media-mode]")),
  extraMediaUrlField: document.querySelector("#extraMediaUrlField"),
  extraMediaUrlInput: document.querySelector("#extraMediaUrlInput"),
  extraMediaFileField: document.querySelector("#extraMediaFileField"),
  extraMediaFileInput: document.querySelector("#extraMediaFileInput"),
  extraMediaCaptionInput: document.querySelector("#extraMediaCaptionInput"),
  extraMediaTimestampsField: document.querySelector("#extraMediaTimestampsField"),
  extraMediaTimestampsInput: document.querySelector("#extraMediaTimestampsInput"),
  extraMediaStatus: document.querySelector("#extraMediaStatus"),
  mediaPreviewDialog: document.querySelector("#mediaPreviewDialog"),
  mediaPreviewImage: document.querySelector("#mediaPreviewImage"),
  mediaPreviewCaption: document.querySelector("#mediaPreviewCaption"),
  closeMediaPreviewButton: document.querySelector("#closeMediaPreviewButton"),
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
  refs.closeExtraMediaButton?.addEventListener("click", closeExtraMediaDialog);
  refs.cancelExtraMediaButton?.addEventListener("click", closeExtraMediaDialog);
  refs.extraMediaForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveExtraMediaFromDialog();
  });
  refs.extraMediaModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setExtraMediaDialogMode(button.dataset.extraMediaMode);
    });
  });
  refs.extraMediaFileInput?.addEventListener("change", () => {
    const files = Array.from(refs.extraMediaFileInput.files || []);
    if (!files.length) {
      refs.extraMediaStatus.textContent = "";
    } else if (files.length === 1) {
      refs.extraMediaStatus.textContent = `Archivo seleccionado: ${files[0].name}`;
    } else {
      refs.extraMediaStatus.textContent = `${files.length} archivos seleccionados`;
    }
  });
  refs.closeMediaPreviewButton?.addEventListener("click", closeMediaPreviewDialog);
  refs.mediaPreviewDialog?.addEventListener("click", (event) => {
    if (event.target === refs.mediaPreviewDialog) {
      closeMediaPreviewDialog();
    }
  });

  refs.tableView.addEventListener("click", (event) => void onActionClick(event));
  refs.galleryView.addEventListener("click", (event) => void onActionClick(event));
  refs.boardView.addEventListener("click", (event) => void onActionClick(event));
  refs.tutorialPage.addEventListener("click", (event) => void onActionClick(event));
  refs.tutorialPage.addEventListener("input", (event) => onTutorialPageInput(event));
  refs.tutorialPage.addEventListener("change", (event) => onTutorialPageInput(event));
  refs.tutorialPage.addEventListener("dragstart", (event) => onTutorialPageDragStart(event));
  refs.tutorialPage.addEventListener("dragover", (event) => onTutorialPageDragOver(event));
  refs.tutorialPage.addEventListener("drop", (event) => void onTutorialPageDrop(event));
  refs.tutorialPage.addEventListener("dragend", () => onTutorialPageDragEnd());
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
  window.addEventListener("popstate", () => {
    if (!state.currentUser || isApplyingRoute) {
      return;
    }
    applyRouteFromLocation();
  });
  window.addEventListener("hashchange", () => {
    if (!state.currentUser || isApplyingRoute) {
      return;
    }
    applyRouteFromLocation();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushPendingAutosaves();
    }
  });
  window.addEventListener("resize", () => {
    if (!state.currentUser || state.page !== "tutorial" || !state.selectedId) {
      return;
    }
    window.requestAnimationFrame(() => {
      syncDetailEditorsLayout(state.selectedId);
    });
  });
  window.addEventListener("beforeunload", () => {
    if (state.extraComposer?.type === "text") {
      persistLiveTextDraft(state.extraComposer.tutorialId, state.extraComposer);
    }
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

function parseRouteFromLocation() {
  const rawHash = String(window.location.hash || "").replace(/^#\/?/, "");
  if (!rawHash) {
    return { page: "library", tutorialId: "" };
  }
  const [pageSegment, ...rest] = rawHash.split("/");
  const page = String(pageSegment || "").toLowerCase();
  const tutorialRawId = rest.join("/");
  let tutorialId = "";
  if (tutorialRawId) {
    try {
      tutorialId = decodeURIComponent(tutorialRawId);
    } catch {
      tutorialId = tutorialRawId;
    }
  }

  if (page === "settings") {
    return { page: "settings", tutorialId: "" };
  }
  if (page === "tutorial") {
    return { page: "tutorial", tutorialId };
  }
  return { page: "library", tutorialId: "" };
}

function buildRouteHash() {
  if (state.page === "settings") {
    return "#/settings";
  }
  if (state.page === "tutorial" && state.selectedId) {
    return `#/tutorial/${encodeURIComponent(state.selectedId)}`;
  }
  return "#/library";
}

function syncRouteToLocation(replace = false) {
  if (!state.currentUser || isApplyingRoute) {
    return;
  }
  const nextHash = buildRouteHash();
  if (window.location.hash === nextHash) {
    return;
  }
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
  if (replace) {
    window.history.replaceState(null, "", nextUrl);
  } else {
    window.history.pushState(null, "", nextUrl);
  }
}

function applyRouteFromLocation() {
  if (!state.currentUser) {
    return;
  }
  const route = parseRouteFromLocation();
  isApplyingRoute = true;
  if (route.page === "settings") {
    state.page = "settings";
    state.tutorialEditMode = false;
  } else if (route.page === "tutorial") {
    if (route.tutorialId) {
      state.selectedId = route.tutorialId;
    }
    state.page = state.selectedId ? "tutorial" : "library";
    state.tutorialEditMode = false;
  } else {
    state.page = "library";
    state.tutorialEditMode = false;
  }
  isApplyingRoute = false;
  closeSearchDialog();
  render();
}

function goToPage(page) {
  if (!state.currentUser) {
    return;
  }
  void flushPendingAutosaves();
  const next = page === "settings" || page === "tutorial" ? page : "library";
  if (next === "tutorial" && !state.selectedId) {
    state.page = "library";
    state.tutorialEditMode = false;
  } else {
    state.page = next;
    if (next !== "tutorial") {
      state.tutorialEditMode = false;
    }
  }
  closeSearchDialog();
  syncRouteToLocation();
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
    refs.userBadge.textContent = user.email;
    const route = parseRouteFromLocation();
    if (route.page === "settings") {
      state.page = "settings";
      state.tutorialEditMode = false;
    } else if (route.page === "tutorial") {
      state.page = "tutorial";
      state.selectedId = route.tutorialId || state.selectedId;
      state.tutorialEditMode = false;
    } else {
      state.page = "library";
      state.tutorialEditMode = false;
    }
    refs.detailPanel.classList.remove("hidden");
    updateReminderButton();
    syncRouteToLocation(true);
    syncPageVisibility();
    return;
  }
  refs.userBadge.textContent = "No autenticado";
  state.page = "library";
  state.tutorials = [];
  state.savedViews = [];
  state.smartCollection = "all";
  state.selectedId = null;
  state.tutorialEditMode = false;
  state.selectedIds = new Set();
  state.extraComposer = null;
  state.extraMediaContext = null;
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
  closeExtraMediaDialog();
  clearAutosaveTimers();
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
    openTutorialEditor(editTarget.dataset.editId);
    return;
  }
  const closeEditorTarget = event.target.closest("[data-close-tutorial-editor]");
  if (closeEditorTarget) {
    await flushPendingAutosaves();
    state.tutorialEditMode = false;
    render();
    return;
  }
  const addEditorTextTarget = event.target.closest("[data-editor-add-text-id]");
  if (addEditorTextTarget) {
    await addEditorTextBlock(addEditorTextTarget.dataset.editorAddTextId);
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
  const toggleNotesSideTarget = event.target.closest("[data-toggle-notes-side]");
  if (toggleNotesSideTarget) {
    toggleNotesSide();
    return;
  }
  const mediaPreviewTarget = event.target.closest("[data-open-media-preview]");
  if (mediaPreviewTarget) {
    openMediaPreviewDialog(
      mediaPreviewTarget.dataset.openMediaPreview,
      mediaPreviewTarget.dataset.openMediaCaption || "",
      mediaPreviewTarget.dataset.openMediaAlt || ""
    );
    return;
  }
  const carouselPrevTarget = event.target.closest("[data-carousel-prev-id]");
  if (carouselPrevTarget) {
    shiftMediaCarousel(carouselPrevTarget.dataset.carouselPrevId, -1);
    return;
  }
  const carouselNextTarget = event.target.closest("[data-carousel-next-id]");
  if (carouselNextTarget) {
    shiftMediaCarousel(carouselNextTarget.dataset.carouselNextId, 1);
    return;
  }
  const carouselJumpTarget = event.target.closest("[data-carousel-jump-id]");
  if (carouselJumpTarget) {
    const tutorialId = carouselJumpTarget.dataset.carouselJumpId;
    const index = Number(carouselJumpTarget.dataset.carouselJumpIndex);
    setMediaCarouselIndex(tutorialId, Number.isFinite(index) ? index : 0);
    render();
    return;
  }
  const videoJumpTarget = event.target.closest("[data-video-jump-id]");
  if (videoJumpTarget) {
    jumpExtraVideoToTimestamp(videoJumpTarget.dataset.videoJumpId, videoJumpTarget.dataset.videoJumpSeconds);
    return;
  }
  const saveExtraTarget = event.target.closest("[data-save-extra-content]");
  if (saveExtraTarget) {
    await saveExtraContentComposer(saveExtraTarget.dataset.saveExtraContent);
    return;
  }
  const closeComposerTarget = event.target.closest("[data-close-extra-composer]");
  if (closeComposerTarget) {
    closeExtraContentComposer();
    return;
  }
  const cancelExtraTarget = event.target.closest("[data-cancel-extra-content]");
  if (cancelExtraTarget) {
    closeExtraContentComposer();
    return;
  }
  const discardComposerTarget = event.target.closest("[data-discard-extra-composer]");
  if (discardComposerTarget) {
    await discardExtraContentComposer(discardComposerTarget.dataset.discardExtraComposer);
    return;
  }
  const addExtraTarget = event.target.closest("[data-add-content-type]");
  if (addExtraTarget) {
    const details = addExtraTarget.closest("details");
    if (details) {
      details.open = false;
    }
    openExtraContentComposer(addExtraTarget.dataset.addContentId, addExtraTarget.dataset.addContentType);
    return;
  }
  const moveExtraTarget = event.target.closest("[data-move-extra-id]");
  if (moveExtraTarget) {
    await moveExtraContentBlock(
      moveExtraTarget.dataset.moveExtraId,
      moveExtraTarget.dataset.moveContentBlockId,
      Number(moveExtraTarget.dataset.moveDirection || 0)
    );
    return;
  }
  const removeExtraTarget = event.target.closest("[data-remove-extra-id]");
  if (removeExtraTarget) {
    await removeExtraContentBlock(removeExtraTarget.dataset.removeExtraId, removeExtraTarget.dataset.removeContentBlockId);
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

function onTutorialPageInput(event) {
  if (state.tutorialEditMode) {
    const primaryField = event.target?.closest?.("[data-editor-primary-field]");
    if (primaryField) {
      if (primaryField instanceof HTMLTextAreaElement) {
        autoGrowTextarea(primaryField, 88);
      }
      if (state.selectedId) {
        scheduleTutorialEditorPrimarySave(state.selectedId, primaryField.dataset.editorPrimaryField, primaryField.value);
      }
      return;
    }
    const extraField = event.target?.closest?.("[data-editor-extra-field]");
    if (extraField) {
      if (extraField instanceof HTMLTextAreaElement) {
        autoGrowTextarea(extraField, 88);
      }
      const tutorialId = extraField.dataset.editorExtraTutorialId;
      const blockId = extraField.dataset.editorExtraBlockId;
      const field = extraField.dataset.editorExtraField;
      if (tutorialId && blockId && field) {
        scheduleTutorialEditorExtraSave(tutorialId, blockId, field, extraField.value);
      }
      return;
    }
  }

  const notesField = event.target?.closest?.("[data-notes-editor-id]");
  if (notesField instanceof HTMLTextAreaElement) {
    const tutorial = state.tutorials.find((item) => item.id === notesField.dataset.notesEditorId);
    if (tutorial?.type === "text") {
      notesField.style.removeProperty("height");
      notesField.style.removeProperty("max-height");
      notesField.style.removeProperty("min-height");
      notesField.style.overflowY = "hidden";
      autoGrowTextarea(notesField, 92);
    } else {
      syncPrimaryNotesHeight(notesField);
    }
    scheduleNotesAutosave(notesField.dataset.notesEditorId, notesField.value);
    if (state.selectedId) {
      syncDetailEditorsLayout(state.selectedId);
    }
    return;
  }

  const mediaNoteField = event.target?.closest?.("[data-extra-block-note-id]");
  if (mediaNoteField instanceof HTMLTextAreaElement) {
    const tutorialId = mediaNoteField.dataset.extraBlockTutorialId;
    const blockId = mediaNoteField.dataset.extraBlockNoteId;
    if (tutorialId && blockId) {
      scheduleExtraBlockFieldAutosave(tutorialId, blockId, "note", mediaNoteField.value);
    }
    syncExtraModuleNotesHeights();
    return;
  }

  const field = event.target?.closest?.("[data-extra-field]");
  if (!field || !state.extraComposer) {
    return;
  }
  const key = field.dataset.extraField;
  if (!["url", "text", "caption"].includes(key)) {
    return;
  }
  state.extraComposer[key] = field.value;
  if (state.extraComposer.type === "text") {
    persistLiveTextDraft(state.extraComposer.tutorialId, state.extraComposer);
  }
  if (key === "text" && field instanceof HTMLTextAreaElement) {
    autoGrowTextarea(field, 120);
  }
  if (state.extraComposer.type === "text") {
    scheduleExtraComposerAutosave(state.extraComposer.tutorialId);
  }
}

function findExtraModuleElement(target) {
  return target?.closest?.("[data-extra-module-id]") || null;
}

function onTutorialPageDragStart(event) {
  if (!state.tutorialEditMode) {
    return;
  }
  const dragHandle = event.target?.closest?.("[data-extra-drag-handle]");
  if (!dragHandle) {
    event.preventDefault();
    return;
  }
  const module = findExtraModuleElement(dragHandle);
  if (!(module instanceof HTMLElement)) {
    return;
  }
  const tutorialId = module.dataset.extraModuleTutorialId;
  const blockId = module.dataset.extraModuleId;
  if (!tutorialId || !blockId) {
    return;
  }
  activeDraggedExtraBlock = { tutorialId, blockId };
  module.classList.add("is-dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", blockId);
  }
}

function onTutorialPageDragOver(event) {
  if (!state.tutorialEditMode) {
    return;
  }
  if (!activeDraggedExtraBlock) {
    return;
  }
  const target = findExtraModuleElement(event.target);
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const targetBlockId = target.dataset.extraModuleId;
  if (!targetBlockId || targetBlockId === activeDraggedExtraBlock.blockId) {
    return;
  }
  event.preventDefault();
  clearExtraModuleDropState();
  target.classList.add("is-drop-target");
}

async function onTutorialPageDrop(event) {
  if (!state.tutorialEditMode) {
    return;
  }
  if (!activeDraggedExtraBlock) {
    return;
  }
  const target = findExtraModuleElement(event.target);
  if (!(target instanceof HTMLElement)) {
    onTutorialPageDragEnd();
    return;
  }
  const targetBlockId = target.dataset.extraModuleId;
  if (!targetBlockId || targetBlockId === activeDraggedExtraBlock.blockId) {
    onTutorialPageDragEnd();
    return;
  }
  event.preventDefault();
  await reorderExtraBlocks(activeDraggedExtraBlock.tutorialId, activeDraggedExtraBlock.blockId, targetBlockId);
  onTutorialPageDragEnd();
}

function onTutorialPageDragEnd() {
  activeDraggedExtraBlock = null;
  clearExtraModuleDropState();
}

function clearExtraModuleDropState() {
  refs.detailPanel.querySelectorAll(".is-dragging, .is-drop-target").forEach((element) => {
    element.classList.remove("is-dragging", "is-drop-target");
  });
}

async function reorderExtraBlocksLegacy(tutorialId, draggingBlockId, targetBlockId) {
  if (!tutorialId || !draggingBlockId || !targetBlockId) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const fromIndex = blocks.findIndex((block) => block.id === draggingBlockId);
  const toIndex = blocks.findIndex((block) => block.id === targetBlockId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return;
  }

  const nextBlocks = [...blocks];
  const [moving] = nextBlocks.splice(fromIndex, 1);
  const insertionIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  nextBlocks.splice(insertionIndex, 0, moving);
  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: normalizeExtraContentBlocks(nextBlocks),
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Orden actualizado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    render();
  } catch (error) {
    showOperationError(error, "No se pudo reordenar los modulos.");
  }
}

async function reorderExtraBlocks(tutorialId, draggingBlockId, targetBlockId) {
  if (!tutorialId || !draggingBlockId || !targetBlockId) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const fromIndex = blocks.findIndex((block) => block.id === draggingBlockId);
  const toIndex = blocks.findIndex((block) => block.id === targetBlockId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return;
  }

  const nextBlocks = [...blocks];
  const [moving] = nextBlocks.splice(fromIndex, 1);
  const insertionIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  nextBlocks.splice(insertionIndex, 0, moving);

  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: normalizeExtraContentBlocks(nextBlocks),
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Orden actualizado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    render();
  } catch (error) {
    showOperationError(error, "No se pudo reordenar los modulos.");
  }
}

async function moveExtraContentBlock(tutorialId, blockId, direction) {
  if (!tutorialId || !blockId) {
    return;
  }
  const shift = Number(direction);
  if (!Number.isFinite(shift) || shift === 0) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const currentIndex = blocks.findIndex((block) => block.id === blockId);
  if (currentIndex < 0) {
    return;
  }
  const targetIndex = Math.max(0, Math.min(blocks.length - 1, currentIndex + (shift > 0 ? 1 : -1)));
  if (targetIndex === currentIndex) {
    return;
  }

  const nextBlocks = [...blocks];
  const [moving] = nextBlocks.splice(currentIndex, 1);
  nextBlocks.splice(targetIndex, 0, moving);

  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: normalizeExtraContentBlocks(nextBlocks),
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Orden actualizado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    render();
  } catch (error) {
    showOperationError(error, "No se pudo mover el bloque.");
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

function getInitialNotesSide() {
  try {
    const saved = localStorage.getItem("tv_notes_side");
    if (saved === "left" || saved === "right") {
      return saved;
    }
  } catch {}
  return "right";
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

function toggleNotesSide() {
  if (state.tutorialEditMode) {
    void flushPendingAutosaves();
  }
  state.notesSide = state.notesSide === "left" ? "right" : "left";
  try {
    localStorage.setItem("tv_notes_side", state.notesSide);
  } catch {}
  render();
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
  void flushPendingAutosaves();
  state.selectedId = id;
  state.tutorialEditMode = false;
  closeSearchDialog();
  goToPage("tutorial");
}

function openTutorialEditor(id) {
  if (!id) {
    return;
  }
  void flushPendingAutosaves();
  state.selectedId = id;
  state.tutorialEditMode = true;
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
    if (state.tutorialEditMode) {
      renderTutorialEditorPanel();
    } else {
      renderTutorialViewerPanel();
    }
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
    details.addEventListener("toggle", () => {
      card.classList.toggle("menu-open", details.open);
    });

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

function getActiveTutorialForDetail() {
  if (!state.currentUser || !state.tutorials.length) {
    return null;
  }
  let tutorial = state.tutorials.find((item) => item.id === state.selectedId);
  if (!tutorial) {
    tutorial = state.tutorials[0];
    state.selectedId = tutorial?.id || null;
    syncRouteToLocation(true);
  }
  return tutorial || null;
}

function renderTutorialViewerPanel() {
  const tutorial = getActiveTutorialForDetail();
  if (!tutorial) {
    refs.detailPanel.innerHTML = `
      <div class="empty-state">
        <h3>No hay tutoriales para abrir</h3>
        <p>Vuelve a la biblioteca para crear tu primer tutorial.</p>
      </div>
    `;
    return;
  }

  const sourceLabel = escapeHtml(formatSource(tutorial.source || "manual"));
  const sourceValue = tutorial.url
    ? `<a href="${escapeAttribute(tutorial.url)}" target="_blank" rel="noreferrer">${sourceLabel}</a>`
    : sourceLabel;
  const tsHtml = tutorial.timestamps.length
    ? `<ul class="timestamp-list">${tutorial.timestamps.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : `<p class="empty-side">Sin timestamps</p>`;
  const createdAt = new Date(tutorial.createdAt || Date.now()).toLocaleString("es-BO");
  const updatedAt = new Date(tutorial.updatedAt || tutorial.createdAt || Date.now()).toLocaleString("es-BO");
  const reviewValue = tutorial.reviewDate || "Sin fecha";
  const showStudyMeta = tutorial.type !== "image";
  const notesHtml = tutorial.notes ? nl2br(escapeHtml(tutorial.notes)) : `<span class="empty-side">Sin notas</span>`;
  const extraBlocksHtml = renderExtraMediaReadOnlySection(tutorial);

  refs.detailPanel.innerHTML = `
    <article class="detail-layout">
      <header class="detail-header">
        <div class="detail-heading">
          <p class="detail-kicker">Pagina de tutorial</p>
          <h2 class="detail-title">${escapeHtml(tutorial.title)}</h2>
          <div class="detail-badges">
            <span class="pill ${statusPillClass(tutorial.status)}">${escapeHtml(tutorial.status)}</span>
            <span class="tag">${formatType(tutorial.type)}</span>
            <span class="tag">${escapeHtml(tutorial.category || "Sin categoria")}</span>
            <span class="tag">${escapeHtml(tutorial.priority)}</span>
          </div>
        </div>
        <div class="detail-actions">
          <button type="button" data-toggle-notes-side="1">${state.notesSide === "left" ? "Notas a la derecha" : "Notas a la izquierda"}</button>
          <button
            type="button"
            class="favorite-btn ${tutorial.isFavorite ? "is-on" : ""}"
            data-toggle-favorite="${tutorial.id}"
            title="Favorito"
          >
            ${tutorial.isFavorite ? "&#9733;" : "&#9734;"}
          </button>
          <button type="button" data-edit-id="${tutorial.id}">Editar</button>
        </div>
      </header>

      <section class="detail-properties-grid">
        <article class="detail-property-card">
          <span class="tutorial-property-label">Creado</span>
          <span class="tutorial-property-value">${escapeHtml(createdAt)}</span>
        </article>
        <article class="detail-property-card">
          <span class="tutorial-property-label">Actualizado</span>
          <span class="tutorial-property-value">${escapeHtml(updatedAt)}</span>
        </article>
        <article class="detail-property-card">
          <span class="tutorial-property-label">Coleccion</span>
          <span class="tutorial-property-value">${escapeHtml(tutorial.collection || "Sin coleccion")}</span>
        </article>
        <article class="detail-property-card">
          <span class="tutorial-property-label">Fuente</span>
          <span class="tutorial-property-value">${sourceValue}</span>
        </article>
      </section>

      <section class="detail-content-grid ${state.notesSide === "left" ? "is-notes-left" : ""}">
        <div class="detail-media-area">
          <div class="media-frame">${renderDetailMedia(tutorial)}</div>
        </div>
        <aside class="detail-side ${showStudyMeta ? "" : "detail-side--notes-only"}">
          <section class="detail-side-card">
            <h4>Notas</h4>
            <div class="detail-note-body">${notesHtml}</div>
          </section>
          ${
            showStudyMeta
              ? `
                <section class="detail-side-card">
                  <h4>Timestamps</h4>
                  ${tsHtml}
                </section>
                <section class="detail-side-card">
                  <h4>Repaso</h4>
                  <p class="detail-review">${escapeHtml(reviewValue)}</p>
                </section>
              `
              : ""
          }
        </aside>
      </section>

      ${extraBlocksHtml}
    </article>
  `;
}

function renderExtraMediaReadOnlySection(tutorial) {
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  if (!blocks.length) {
    return "";
  }

  const blocksHtml = blocks
    .map((block, index) => renderReadOnlyExtraBlock(tutorial.title, block, index + 1, blocks.length))
    .join("");

  return `
    <section class="detail-extra">
      <section class="detail-extra-media">
        <h4>Contenido agregado</h4>
        <div class="detail-extra-media-list">
          ${blocksHtml}
        </div>
      </section>
    </section>
  `;
}

function renderReadOnlyExtraBlock(tutorialTitle, block, order, total) {
  const noteHtml = block.note ? nl2br(escapeHtml(block.note)) : `<span class="empty-side">Sin notas</span>`;
  const typeLabel = block.type === "image" ? "Imagen" : block.type === "video" ? "Video" : "Texto";
  const orderMeta = total > 1 ? `<span class="meta">${order}/${total}</span>` : "";
  let contentHtml = "";
  if (block.type === "text") {
    contentHtml = `<pre>${escapeHtml(block.text || "")}</pre>`;
  } else if (block.type === "image") {
    contentHtml = `
      <button
        type="button"
        class="side-media-image-open"
        data-open-media-preview="${escapeAttribute(block.url)}"
        data-open-media-caption="${escapeAttribute(block.caption || "")}"
        data-open-media-alt="${escapeAttribute(tutorialTitle)}"
      >
        <img src="${escapeAttribute(block.url)}" alt="${escapeAttribute(block.caption || tutorialTitle)}" />
      </button>
    `;
  } else {
    const youtubeId = extractYouTubeId(block.url);
    contentHtml = youtubeId
      ? `<iframe src="https://www.youtube.com/embed/${youtubeId}" title="${escapeAttribute(tutorialTitle)}" allowfullscreen loading="lazy"></iframe>`
      : `<video controls src="${escapeAttribute(block.url)}"></video>`;
  }

  const timestamps = Array.isArray(block.timestamps) ? block.timestamps : [];
  const timestampsHtml =
    block.type === "video" && timestamps.length
      ? `
        <section class="media-module-timestamps">
          <h5>Timestamps</h5>
          <ul class="timestamp-list extra-video-timestamps">${timestamps.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>
        </section>
      `
      : "";

  return `
    <article class="detail-extra-item media-module ${state.notesSide === "left" ? "is-notes-left" : ""}">
      <div class="detail-extra-head media-module-head">
        <div class="media-module-title">
          <span class="tutorial-property-label">${typeLabel}</span>
          ${orderMeta}
        </div>
      </div>
      <div class="media-module-grid">
        <div class="media-module-media">
          ${block.caption ? `<p class="detail-extra-caption">${escapeHtml(block.caption)}</p>` : ""}
          <div class="detail-extra-body">${contentHtml}</div>
          ${timestampsHtml}
        </div>
        <section class="media-module-note">
          <h5>Notas</h5>
          <div class="detail-note-body">${noteHtml}</div>
        </section>
      </div>
    </article>
  `;
}

function renderTutorialEditorPanel() {
  const tutorial = getActiveTutorialForDetail();
  if (!tutorial) {
    refs.detailPanel.innerHTML = `
      <div class="empty-state">
        <h3>No hay tutoriales para editar</h3>
        <p>Vuelve a la biblioteca para crear tu primer tutorial.</p>
      </div>
    `;
    return;
  }

  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const modulesHtml = blocks.length
    ? blocks.map((block, index) => renderEditorExtraModule(tutorial.id, block, index + 1, blocks.length)).join("")
    : `<p class="meta">Aun no hay bloques adicionales.</p>`;

  refs.detailPanel.innerHTML = `
    <article class="detail-layout tutorial-editor-layout">
      <header class="detail-header">
        <div class="detail-heading">
          <p class="detail-kicker">Edicion de pagina</p>
          <h2 class="detail-title">${escapeHtml(tutorial.title)}</h2>
          <p class="meta">Configura la estructura modular sin abrir el contenido final.</p>
        </div>
        <div class="detail-actions">
          <button type="button" data-toggle-notes-side="1">${state.notesSide === "left" ? "Notas a la derecha" : "Notas a la izquierda"}</button>
          <button type="button" data-close-tutorial-editor="1">Ver pagina</button>
        </div>
      </header>

      <section class="detail-extra editor-modules">
        <section class="detail-extra-media">
          <h4>Bloque principal</h4>
          ${renderEditorPrimaryModule(tutorial)}
        </section>

        <section class="detail-extra-media">
          <h4>Bloques adicionales</h4>
          <div class="detail-extra-media-list">
            ${modulesHtml}
          </div>
          <div class="editor-add-row">
            <button type="button" class="ghost-btn" data-add-content-id="${tutorial.id}" data-add-content-type="image">+ Imagen</button>
            <button type="button" class="ghost-btn" data-add-content-id="${tutorial.id}" data-add-content-type="video">+ Video</button>
            <button type="button" class="ghost-btn" data-editor-add-text-id="${tutorial.id}">+ Texto</button>
          </div>
        </section>
      </section>
    </article>
  `;

  refs.detailPanel.querySelectorAll("[data-editor-primary-field], [data-editor-extra-field]").forEach((element) => {
    if (element instanceof HTMLTextAreaElement) {
      autoGrowTextarea(element, 88);
    }
  });
}

function renderEditorPrimaryModule(tutorial) {
  const isVideo = tutorial.type === "video";
  const isImage = tutorial.type === "image";
  const isText = tutorial.type === "text";
  return `
    <article class="detail-extra-item media-module ${state.notesSide === "left" ? "is-notes-left" : ""}">
      <div class="detail-extra-head media-module-head">
        <div class="media-module-title">
          <span class="tutorial-property-label">Principal</span>
        </div>
      </div>
      <div class="media-module-grid">
        <div class="media-module-media editor-module-fields">
          <label class="editor-inline-field">
            <span class="tutorial-property-label">Titulo</span>
            <input type="text" data-editor-primary-field="title" value="${escapeAttribute(tutorial.title)}" />
          </label>
          <label class="editor-inline-field">
            <span class="tutorial-property-label">Tipo</span>
            <select data-editor-primary-field="type">
              <option value="video" ${tutorial.type === "video" ? "selected" : ""}>Video</option>
              <option value="image" ${tutorial.type === "image" ? "selected" : ""}>Imagen</option>
              <option value="text" ${tutorial.type === "text" ? "selected" : ""}>Texto</option>
            </select>
          </label>
          <label class="editor-inline-field">
            <span class="tutorial-property-label">Fuente</span>
            <select data-editor-primary-field="source">
              <option value="youtube" ${tutorial.source === "youtube" ? "selected" : ""}>YouTube</option>
              <option value="instagram" ${tutorial.source === "instagram" ? "selected" : ""}>Instagram</option>
              <option value="manual" ${tutorial.source === "manual" ? "selected" : ""}>Manual</option>
            </select>
          </label>
          ${isVideo ? `<label class="editor-inline-field"><span class="tutorial-property-label">URL video</span><input type="url" data-editor-primary-field="url" value="${escapeAttribute(tutorial.url || "")}" /></label>` : ""}
          ${isImage ? `<label class="editor-inline-field"><span class="tutorial-property-label">URL imagen</span><input type="url" data-editor-primary-field="imageUrl" value="${escapeAttribute(tutorial.imageUrl || tutorial.url || "")}" /></label>` : ""}
          ${isText ? `<label class="editor-inline-field"><span class="tutorial-property-label">Texto</span><textarea data-editor-primary-field="textContent" placeholder="Contenido principal">${escapeHtml(tutorial.textContent || "")}</textarea></label>` : ""}
          ${
            isVideo
              ? `<label class="editor-inline-field"><span class="tutorial-property-label">Timestamps</span><textarea data-editor-primary-field="timestamps" placeholder="00:12 Intro&#10;02:40 Punto clave">${escapeHtml(
                  (tutorial.timestamps || []).join("\n")
                )}</textarea></label>`
              : ""
          }
        </div>
        <section class="media-module-note">
          <h5>Notas</h5>
          <textarea class="module-note-editor" data-editor-primary-field="notes" placeholder="Nota principal...">${escapeHtml(tutorial.notes || "")}</textarea>
        </section>
      </div>
    </article>
  `;
}

function renderEditorExtraModule(tutorialId, block, order, total) {
  const typeLabel = block.type === "image" ? "Imagen" : block.type === "video" ? "Video" : "Texto";
  const orderMeta = total > 1 ? `<span class="meta">${order}/${total}</span>` : "";
  const timestamps = Array.isArray(block.timestamps) ? block.timestamps : [];
  return `
    <article
      class="detail-extra-item media-module ${state.notesSide === "left" ? "is-notes-left" : ""}"
      draggable="true"
      data-extra-module-id="${block.id}"
      data-extra-module-tutorial-id="${tutorialId}"
    >
      <div class="detail-extra-head media-module-head">
        <div class="media-module-title">
          <button type="button" class="drag-handle" data-extra-drag-handle="1" title="Arrastra para mover">::</button>
          <span class="tutorial-property-label">${typeLabel}</span>
          ${orderMeta}
        </div>
        ${renderExtraBlockMenuV2(tutorialId, block.id, order, total)}
      </div>
      <div class="media-module-grid">
        <div class="media-module-media editor-module-fields">
          <label class="editor-inline-field">
            <span class="tutorial-property-label">Tipo</span>
            <select data-editor-extra-field="type" data-editor-extra-tutorial-id="${tutorialId}" data-editor-extra-block-id="${block.id}">
              <option value="image" ${block.type === "image" ? "selected" : ""}>Imagen</option>
              <option value="video" ${block.type === "video" ? "selected" : ""}>Video</option>
              <option value="text" ${block.type === "text" ? "selected" : ""}>Texto</option>
            </select>
          </label>
          <label class="editor-inline-field">
            <span class="tutorial-property-label">Titulo</span>
            <input
              type="text"
              data-editor-extra-field="caption"
              data-editor-extra-tutorial-id="${tutorialId}"
              data-editor-extra-block-id="${block.id}"
              value="${escapeAttribute(block.caption || "")}"
            />
          </label>
          ${
            block.type === "text"
              ? `
                <label class="editor-inline-field">
                  <span class="tutorial-property-label">Texto</span>
                  <textarea
                    data-editor-extra-field="text"
                    data-editor-extra-tutorial-id="${tutorialId}"
                    data-editor-extra-block-id="${block.id}"
                    placeholder="Contenido del bloque de texto"
                  >${escapeHtml(block.text || "")}</textarea>
                </label>
              `
              : `
                <label class="editor-inline-field">
                  <span class="tutorial-property-label">URL</span>
                  <input
                    type="url"
                    data-editor-extra-field="url"
                    data-editor-extra-tutorial-id="${tutorialId}"
                    data-editor-extra-block-id="${block.id}"
                    value="${escapeAttribute(block.url || "")}"
                  />
                </label>
              `
          }
          ${
            block.type === "video"
              ? `
                <label class="editor-inline-field">
                  <span class="tutorial-property-label">Timestamps</span>
                  <textarea
                    data-editor-extra-field="timestamps"
                    data-editor-extra-tutorial-id="${tutorialId}"
                    data-editor-extra-block-id="${block.id}"
                    placeholder="00:20 Intro&#10;03:40 Ejemplo"
                  >${escapeHtml(timestamps.join("\n"))}</textarea>
                </label>
              `
              : ""
          }
        </div>
        <section class="media-module-note">
          <h5>Notas</h5>
          <textarea
            class="module-note-editor"
            data-editor-extra-field="note"
            data-editor-extra-tutorial-id="${tutorialId}"
            data-editor-extra-block-id="${block.id}"
            placeholder="Notas del bloque..."
          >${escapeHtml(block.note || "")}</textarea>
        </section>
      </div>
    </article>
  `;
}

function renderDetailPanelLegacy() {
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
    syncRouteToLocation(true);
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
  const liveTextArea = refs.detailPanel.querySelector(".detail-composer-text-input");
  if (liveTextArea instanceof HTMLTextAreaElement) {
    autoGrowTextarea(liveTextArea, 120);
  }
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

  const sourceLabel = escapeHtml(formatSource(tutorial.source || "manual"));
  const sourceValue = tutorial.url
    ? `<a href="${escapeAttribute(tutorial.url)}" target="_blank" rel="noreferrer">${sourceLabel}</a>`
    : sourceLabel;
  const tsHtml = tutorial.timestamps.length
    ? `<ul class="timestamp-list">${tutorial.timestamps.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : `<p class="empty-side">Sin timestamps</p>`;
  const createdAt = new Date(tutorial.createdAt || Date.now()).toLocaleString("es-BO");
  const updatedAt = new Date(tutorial.updatedAt || tutorial.createdAt || Date.now()).toLocaleString("es-BO");
  const reviewValue = tutorial.reviewDate || "Sin fecha";
  const showStudyMeta = tutorial.type !== "image";
  syncLiveTextComposerForTutorial(tutorial);
  const extraMediaHtml = renderExtraMediaSection(tutorial);
  const extraComposerHtml = renderExtraContentComposer(tutorial);

  refs.detailPanel.innerHTML = `
    <article class="detail-layout">
      <header class="detail-header">
        <div class="detail-heading">
          <p class="detail-kicker">Pagina de tutorial</p>
          <h2 class="detail-title">${escapeHtml(tutorial.title)}</h2>
          <div class="detail-badges">
            <span class="pill ${statusPillClass(tutorial.status)}">${escapeHtml(tutorial.status)}</span>
            <span class="tag">${formatType(tutorial.type)}</span>
            <span class="tag">${escapeHtml(tutorial.category || "Sin categoria")}</span>
            <span class="tag">${escapeHtml(tutorial.priority)}</span>
          </div>
        </div>
        <div class="detail-actions">
          <button type="button" data-toggle-notes-side="1">${state.notesSide === "left" ? "Notas a la derecha" : "Notas a la izquierda"}</button>
          <button
            type="button"
            class="favorite-btn ${tutorial.isFavorite ? "is-on" : ""}"
            data-toggle-favorite="${tutorial.id}"
            title="Favorito"
          >
            ${tutorial.isFavorite ? "&#9733;" : "&#9734;"}
          </button>
          <button type="button" data-edit-id="${tutorial.id}">Editar</button>
        </div>
      </header>

      <section class="detail-properties-grid">
        <article class="detail-property-card">
          <span class="tutorial-property-label">Creado</span>
          <span class="tutorial-property-value">${escapeHtml(createdAt)}</span>
        </article>
        <article class="detail-property-card">
          <span class="tutorial-property-label">Actualizado</span>
          <span class="tutorial-property-value">${escapeHtml(updatedAt)}</span>
        </article>
        <article class="detail-property-card">
          <span class="tutorial-property-label">Coleccion</span>
          <span class="tutorial-property-value">${escapeHtml(tutorial.collection || "Sin coleccion")}</span>
        </article>
        <article class="detail-property-card">
          <span class="tutorial-property-label">Fuente</span>
          <span class="tutorial-property-value">${sourceValue}</span>
        </article>
      </section>

      <section class="detail-content-grid ${state.notesSide === "left" ? "is-notes-left" : ""}">
        <div class="detail-media-area">
          <div class="media-frame">${renderDetailMedia(tutorial)}</div>
        </div>
        <aside class="detail-side ${showStudyMeta ? "" : "detail-side--notes-only"}">
          <section class="detail-side-card">
            <h4>Notas</h4>
            <div class="detail-note-body">
              <textarea
                class="detail-note-editor"
                data-notes-editor-id="${tutorial.id}"
                placeholder="Escribe notas para este tutorial..."
              >${escapeHtml(tutorial.notes || "")}</textarea>
            </div>
          </section>
          ${
            showStudyMeta
              ? `
                <section class="detail-side-card">
                  <h4>Timestamps</h4>
                  ${tsHtml}
                </section>
                <section class="detail-side-card">
                  <h4>Repaso</h4>
                  <p class="detail-review">${escapeHtml(reviewValue)}</p>
                </section>
              `
              : ""
          }
        </aside>
      </section>

      <section class="detail-extra">
        ${extraMediaHtml}
        ${extraComposerHtml}
        <details class="detail-add-menu">
          <summary class="detail-add-trigger" aria-label="Agregar contenido">+</summary>
          <div class="row-menu-panel detail-add-panel">
            <button type="button" class="ghost-btn" data-add-content-id="${tutorial.id}" data-add-content-type="image">Imagen</button>
            <button type="button" class="ghost-btn" data-add-content-id="${tutorial.id}" data-add-content-type="video">Video</button>
            <button type="button" class="ghost-btn" data-add-content-id="${tutorial.id}" data-add-content-type="text">Texto</button>
          </div>
        </details>
      </section>
    </article>
  `;

  const favoriteButton = refs.detailPanel.querySelector(`[data-toggle-favorite="${tutorial.id}"]`);
  if (favoriteButton) {
    favoriteButton.innerHTML = tutorial.isFavorite ? "&#9733;" : "&#9734;";
  }
  const detailImage = refs.detailPanel.querySelector(".detail-media-area .media-frame img");
  if (detailImage instanceof HTMLImageElement && !detailImage.complete) {
    detailImage.addEventListener(
      "load",
      () => {
        syncDetailEditorsLayout(tutorial.id);
      },
      { once: true }
    );
  }
  syncDetailEditorsLayout(tutorial.id);
}

function syncDetailEditorsLayout(tutorialId) {
  if (!tutorialId) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  const noteEditor = refs.detailPanel.querySelector(`[data-notes-editor-id="${tutorialId}"]`);
  if (noteEditor instanceof HTMLTextAreaElement) {
    if (tutorial?.type === "text") {
      noteEditor.style.removeProperty("height");
      noteEditor.style.removeProperty("max-height");
      noteEditor.style.removeProperty("min-height");
      noteEditor.style.overflowY = "hidden";
      autoGrowTextarea(noteEditor, 92);
    } else {
      syncPrimaryNotesHeight(noteEditor);
    }
  }
  const liveTextArea = refs.detailPanel.querySelector(".detail-composer-text-input");
  if (liveTextArea instanceof HTMLTextAreaElement) {
    autoGrowTextarea(liveTextArea, 120);
  }
  syncExtraModuleNotesHeights();
}

function clampEditorHeight(editor, targetPx, minPx = 120) {
  if (!(editor instanceof HTMLTextAreaElement)) {
    return;
  }
  const nextHeight = Math.max(minPx, Math.floor(Number(targetPx) || 0));
  if (!Number.isFinite(nextHeight) || nextHeight <= 0) {
    return;
  }
  editor.style.height = `${nextHeight}px`;
  editor.style.minHeight = `${nextHeight}px`;
  editor.style.maxHeight = `${nextHeight}px`;
  editor.style.overflowY = "auto";
}

function syncPrimaryNotesHeight(noteEditor) {
  if (!(noteEditor instanceof HTMLTextAreaElement) || state.page !== "tutorial") {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === state.selectedId);
  if (!tutorial || tutorial.type === "text") {
    noteEditor.style.removeProperty("height");
    noteEditor.style.removeProperty("max-height");
    noteEditor.style.removeProperty("min-height");
    noteEditor.style.overflowY = "hidden";
    return;
  }

  const mediaFrame = refs.detailPanel.querySelector(".detail-media-area .media-frame");
  if (!(mediaFrame instanceof HTMLElement)) {
    return;
  }

  const noteCard = noteEditor.closest(".detail-side-card");
  const noteHeading = noteCard?.querySelector("h4");
  const headingHeight = noteHeading instanceof HTMLElement ? noteHeading.getBoundingClientRect().height + 6 : 0;
  clampEditorHeight(noteEditor, mediaFrame.getBoundingClientRect().height - headingHeight, 140);
}

function syncExtraModuleNotesHeights() {
  const modules = refs.detailPanel.querySelectorAll(".media-module");
  if (!modules.length) {
    return;
  }
  modules.forEach((module) => {
    if (!(module instanceof HTMLElement)) {
      return;
    }
    const noteEditor = module.querySelector("[data-extra-block-note-id]");
    const mediaColumn = module.querySelector(".media-module-media");
    if (!(noteEditor instanceof HTMLTextAreaElement) || !(mediaColumn instanceof HTMLElement)) {
      return;
    }
    const heading = module.querySelector(".media-module-note h5");
    const headingHeight = heading instanceof HTMLElement ? heading.getBoundingClientRect().height + 6 : 0;
    clampEditorHeight(noteEditor, mediaColumn.getBoundingClientRect().height - headingHeight, 92);

    const image = mediaColumn.querySelector("img");
    if (image instanceof HTMLImageElement && !image.complete && image.dataset.layoutBound !== "1") {
      image.dataset.layoutBound = "1";
      image.addEventListener(
        "load",
        () => {
          image.dataset.layoutBound = "0";
          if (state.selectedId) {
            syncDetailEditorsLayout(state.selectedId);
          }
        },
        { once: true }
      );
    }
    const video = mediaColumn.querySelector("video");
    if (video instanceof HTMLVideoElement && video.readyState < 1 && video.dataset.layoutBound !== "1") {
      video.dataset.layoutBound = "1";
      video.addEventListener(
        "loadedmetadata",
        () => {
          video.dataset.layoutBound = "0";
          if (state.selectedId) {
            syncDetailEditorsLayout(state.selectedId);
          }
        },
        { once: true }
      );
    }
  });
}

function syncLiveTextComposerForTutorial(tutorial) {
  if (!tutorial) {
    return;
  }
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const textBlocks = blocks.filter((block) => block.type === "text");
  const draft = loadLiveTextDraft(tutorial.id);

  if (state.extraComposer && state.extraComposer.type === "text" && state.extraComposer.tutorialId !== tutorial.id) {
    state.extraComposer = null;
  }

  if (!state.extraComposer && (textBlocks.length || draft)) {
    const latest = textBlocks[textBlocks.length - 1] || null;
    state.extraComposer = {
      tutorialId: tutorial.id,
      type: "text",
      url: "",
      text: latest?.text || "",
      caption: latest?.caption || "",
      blockId: latest?.id || null,
    };
  }

  if (state.extraComposer && state.extraComposer.tutorialId === tutorial.id && draft) {
    if (typeof draft.text === "string") {
      state.extraComposer.text = draft.text;
    }
    if (typeof draft.caption === "string") {
      state.extraComposer.caption = draft.caption;
    }
    if (typeof draft.blockId === "string" && draft.blockId) {
      state.extraComposer.blockId = draft.blockId;
    }
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

function renderExtraMediaSection(tutorial) {
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const mediaBlocks = blocks.filter((block) => block.type === "image" || block.type === "video");
  if (!mediaBlocks.length) {
    return "";
  }

  const modulesHtml = mediaBlocks
    .map((block, index) => renderExtraMediaModuleV2(tutorial.id, tutorial.title, block, index + 1, mediaBlocks.length))
    .join("");

  return `
    <section class="detail-extra-media">
      <h4>Contenido agregado</h4>
      <div class="detail-extra-media-list">
        ${modulesHtml}
      </div>
    </section>
  `;
}

function renderExtraMediaModule(tutorialId, tutorialTitle, block, order, total) {
  const youtubeId = extractYouTubeId(block.url);
  const timestamps = Array.isArray(block.timestamps) ? block.timestamps : [];
  const orderMeta = total > 1 ? `<span class="meta">${order}/${total}</span>` : "";
  let mediaHtml = "";
  if (block.type === "image") {
    mediaHtml = `
      <button
        type="button"
        class="side-media-image-open"
        data-open-media-preview="${escapeAttribute(block.url)}"
        data-open-media-caption="${escapeAttribute(block.caption || "")}"
        data-open-media-alt="${escapeAttribute(tutorialTitle)}"
      >
        <img src="${escapeAttribute(block.url)}" alt="${escapeAttribute(block.caption || tutorialTitle)}" />
      </button>
    `;
  } else {
    mediaHtml = youtubeId
      ? `<iframe src="https://www.youtube.com/embed/${youtubeId}" title="${escapeAttribute(
          tutorialTitle
        )}" allowfullscreen loading="lazy"></iframe>`
      : `<video controls data-extra-video-id="${block.id}" src="${escapeAttribute(block.url)}"></video>`;
  }

  const timestampsHtml = timestamps.length
    ? `
      <ul class="timestamp-list extra-video-timestamps">
        ${timestamps
          .map((entry) => {
            const seconds = parseTimestampToSeconds(entry);
            const canJump = Number.isFinite(seconds) && !youtubeId;
            if (!canJump) {
              return `<li>${escapeHtml(entry)}</li>`;
            }
            return `
              <li>
                <button
                  type="button"
                  class="ghost-btn timestamp-jump-btn"
                  data-video-jump-id="${block.id}"
                  data-video-jump-seconds="${seconds}"
                >
                  ${escapeHtml(entry)}
                </button>
              </li>
            `;
          })
          .join("")}
      </ul>
    `
    : "";

  return `
    <article
      class="detail-extra-item side-video-item media-module"
      draggable="true"
      data-extra-module-id="${block.id}"
      data-extra-module-tutorial-id="${tutorialId}"
    >
      <div class="detail-extra-head media-module-head">
        <div class="media-module-title">
          <span class="drag-handle" title="Arrastra para mover">⋮⋮</span>
          <span class="tutorial-property-label">${block.type === "image" ? "Imagen" : "Video"}</span>
          ${orderMeta}
        </div>
        ${renderExtraBlockMenu(tutorialId, block.id)}
      </div>
      ${block.caption ? `<p class="detail-extra-caption">${escapeHtml(block.caption)}</p>` : ""}
      <div class="detail-extra-body">${mediaHtml}</div>
      ${
        block.type === "video"
          ? `
            ${timestampsHtml}
            <label class="module-note-field">
              <span class="tutorial-property-label">Nota del video</span>
              <textarea
                class="module-note-editor"
                data-extra-block-note-id="${block.id}"
                data-extra-block-tutorial-id="${tutorialId}"
                placeholder="Escribe una nota para este video..."
              >${escapeHtml(block.note || "")}</textarea>
            </label>
          `
          : `
            <label class="module-note-field">
              <span class="tutorial-property-label">Nota de la imagen</span>
              <textarea
                class="module-note-editor"
                data-extra-block-note-id="${block.id}"
                data-extra-block-tutorial-id="${tutorialId}"
                placeholder="Escribe una nota para esta imagen..."
              >${escapeHtml(block.note || "")}</textarea>
            </label>
          `
      }
    </article>
  `;
}

function renderExtraBlockMenu(tutorialId, blockId) {
  return `
    <details class="row-menu row-menu-card detail-extra-menu">
      <summary class="menu-trigger" aria-label="Opciones del adjunto">···</summary>
      <div class="row-menu-panel">
        <p class="meta">Eliminar este adjunto.</p>
        <div class="menu-actions">
          <button
            type="button"
            class="danger"
            data-remove-extra-id="${tutorialId}"
            data-remove-content-block-id="${blockId}"
          >
            Eliminar
          </button>
        </div>
      </div>
    </details>
  `;
}

function renderExtraMediaModuleV2(tutorialId, tutorialTitle, block, order, total) {
  const youtubeId = extractYouTubeId(block.url);
  const timestamps = Array.isArray(block.timestamps) ? block.timestamps : [];
  const orderMeta = total > 1 ? `<span class="meta">${order}/${total}</span>` : "";
  let mediaHtml = "";
  if (block.type === "image") {
    mediaHtml = `
      <button
        type="button"
        class="side-media-image-open"
        data-open-media-preview="${escapeAttribute(block.url)}"
        data-open-media-caption="${escapeAttribute(block.caption || "")}"
        data-open-media-alt="${escapeAttribute(tutorialTitle)}"
      >
        <img src="${escapeAttribute(block.url)}" alt="${escapeAttribute(block.caption || tutorialTitle)}" />
      </button>
    `;
  } else {
    mediaHtml = youtubeId
      ? `<iframe src="https://www.youtube.com/embed/${youtubeId}" title="${escapeAttribute(
          tutorialTitle
        )}" allowfullscreen loading="lazy"></iframe>`
      : `<video controls data-extra-video-id="${block.id}" src="${escapeAttribute(block.url)}"></video>`;
  }

  const timestampsHtml = block.type === "video" && timestamps.length
    ? `
      <section class="media-module-timestamps">
        <h5>Timestamps</h5>
        <ul class="timestamp-list extra-video-timestamps">
          ${timestamps
            .map((entry) => {
              const seconds = parseTimestampToSeconds(entry);
              const canJump = Number.isFinite(seconds) && !youtubeId;
              if (!canJump) {
                return `<li>${escapeHtml(entry)}</li>`;
              }
              return `
                <li>
                  <button
                    type="button"
                    class="ghost-btn timestamp-jump-btn"
                    data-video-jump-id="${block.id}"
                    data-video-jump-seconds="${seconds}"
                  >
                    ${escapeHtml(entry)}
                  </button>
                </li>
              `;
            })
            .join("")}
        </ul>
      </section>
    `
    : "";

  const blockTypeLabel = block.type === "image" ? "Imagen" : "Video";
  return `
    <article
      class="detail-extra-item media-module ${state.notesSide === "left" ? "is-notes-left" : ""}"
      draggable="true"
      data-extra-module-id="${block.id}"
      data-extra-module-tutorial-id="${tutorialId}"
    >
      <div class="detail-extra-head media-module-head">
        <div class="media-module-title">
          <button type="button" class="drag-handle" data-extra-drag-handle="1" title="Arrastra para mover">::</button>
          <span class="tutorial-property-label">${blockTypeLabel}</span>
          ${orderMeta}
        </div>
        ${renderExtraBlockMenuV2(tutorialId, block.id, order, total)}
      </div>
      <div class="media-module-grid">
        <div class="media-module-media">
          ${block.caption ? `<p class="detail-extra-caption">${escapeHtml(block.caption)}</p>` : ""}
          <div class="detail-extra-body">${mediaHtml}</div>
          ${timestampsHtml}
        </div>
        <section class="media-module-note">
          <h5>Notas</h5>
          <textarea
            class="module-note-editor"
            data-extra-block-note-id="${block.id}"
            data-extra-block-tutorial-id="${tutorialId}"
            placeholder="Escribe una nota para este bloque..."
          >${escapeHtml(block.note || "")}</textarea>
        </section>
      </div>
    </article>
  `;
}

function renderExtraBlockMenuV2(tutorialId, blockId, order, total) {
  const first = order <= 1;
  const last = order >= total;
  return `
    <details class="row-menu row-menu-card detail-extra-menu">
      <summary class="menu-trigger" aria-label="Opciones del bloque">...</summary>
      <div class="row-menu-panel">
        <div class="menu-actions">
          <button
            type="button"
            class="ghost-btn"
            data-move-extra-id="${tutorialId}"
            data-move-content-block-id="${blockId}"
            data-move-direction="-1"
            ${first ? "disabled" : ""}
          >
            Subir
          </button>
          <button
            type="button"
            class="ghost-btn"
            data-move-extra-id="${tutorialId}"
            data-move-content-block-id="${blockId}"
            data-move-direction="1"
            ${last ? "disabled" : ""}
          >
            Bajar
          </button>
        </div>
        <div class="menu-actions">
          <button
            type="button"
            class="danger"
            data-remove-extra-id="${tutorialId}"
            data-remove-content-block-id="${blockId}"
          >
            Eliminar bloque
          </button>
        </div>
      </div>
    </details>
  `;
}

function getMediaCarouselIndex(tutorialId, total) {
  const count = Math.max(0, Number(total) || 0);
  if (!tutorialId || !count) {
    return 0;
  }
  const raw = Number(state.mediaCarouselIndexByTutorial[tutorialId] || 0);
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.max(0, Math.min(count - 1, Math.trunc(raw)));
}

function setMediaCarouselIndex(tutorialId, index) {
  if (!tutorialId) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  const total = normalizeExtraContentBlocks(tutorial?.extraContent)
    .filter((block) => block.type === "image")
    .length;
  if (!total) {
    state.mediaCarouselIndexByTutorial[tutorialId] = 0;
    return;
  }
  const next = Math.max(0, Math.min(total - 1, Math.trunc(Number(index) || 0)));
  state.mediaCarouselIndexByTutorial[tutorialId] = next;
}

function shiftMediaCarousel(tutorialId, delta) {
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  const imageBlocks = normalizeExtraContentBlocks(tutorial?.extraContent).filter((block) => block.type === "image");
  const total = imageBlocks.length;
  if (!tutorialId || !total) {
    return;
  }
  const current = getMediaCarouselIndex(tutorialId, total);
  const next = (current + Number(delta || 0) + total) % total;
  state.mediaCarouselIndexByTutorial[tutorialId] = next;
  render();
}

function parseTimestampToSeconds(value) {
  const text = String(value || "").trim();
  if (!text) {
    return NaN;
  }
  const match = text.match(/(\d{1,2}:){1,2}\d{1,2}|\d{1,4}/);
  const token = match ? match[0] : text;
  const parts = token.split(":").map((part) => Number(part.trim()));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return NaN;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return NaN;
}

function jumpExtraVideoToTimestamp(blockId, secondsRaw) {
  if (!blockId) {
    return;
  }
  const seconds = Number(secondsRaw);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return;
  }
  const target = refs.detailPanel.querySelector(`[data-extra-video-id="${blockId}"]`);
  if (!(target instanceof HTMLVideoElement)) {
    return;
  }
  target.currentTime = seconds;
  target.play().catch(() => {});
}

function openMediaPreviewDialog(url, caption = "", alt = "") {
  if (!refs.mediaPreviewDialog?.showModal || !refs.mediaPreviewImage) {
    return;
  }
  const safeUrl = String(url || "").trim();
  if (!safeUrl) {
    return;
  }
  refs.mediaPreviewImage.src = safeUrl;
  refs.mediaPreviewImage.alt = String(alt || "Vista previa");
  if (refs.mediaPreviewCaption) {
    refs.mediaPreviewCaption.textContent = String(caption || "");
    refs.mediaPreviewCaption.classList.toggle("hidden", !String(caption || "").trim());
  }
  if (!refs.mediaPreviewDialog.open) {
    refs.mediaPreviewDialog.showModal();
  }
}

function closeMediaPreviewDialog() {
  if (refs.mediaPreviewDialog?.open) {
    refs.mediaPreviewDialog.close();
  }
  if (refs.mediaPreviewImage) {
    refs.mediaPreviewImage.src = "";
  }
}

function scheduleNotesAutosave(tutorialId, value) {
  if (!tutorialId) {
    return;
  }
  if (notesAutosaveTimer) {
    window.clearTimeout(notesAutosaveTimer);
  }
  notesAutosaveTimer = window.setTimeout(() => {
    void saveDetailNotesAutosave(tutorialId, value);
  }, 700);
}

async function saveDetailNotesAutosave(tutorialId, value) {
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const nextNotes = String(value || "");
  if (nextNotes === String(tutorial.notes || "")) {
    return;
  }

  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    notes: nextNotes,
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.notes = nextNotes;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) {
    showOperationError(error, "No se pudieron guardar las notas.");
  }
}

function scheduleExtraBlockFieldAutosave(tutorialId, blockId, field, value) {
  if (!tutorialId || !blockId || !field) {
    return;
  }
  const timerKey = `${tutorialId}:${blockId}:${field}`;
  const existingTimer = extraBlockAutosaveTimers.get(timerKey);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }
  const timer = window.setTimeout(() => {
    extraBlockAutosaveTimers.delete(timerKey);
    void saveExtraBlockField(tutorialId, blockId, field, value);
  }, 420);
  extraBlockAutosaveTimers.set(timerKey, timer);
}

async function saveExtraBlockField(tutorialId, blockId, field, value) {
  if (!tutorialId || !blockId || !field) {
    return;
  }
  if (!["note"].includes(field)) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index < 0) {
    return;
  }
  const current = blocks[index];
  const nextValue = String(value || "");
  if (String(current[field] || "") === nextValue) {
    return;
  }

  const nextBlocks = [...blocks];
  nextBlocks[index] = {
    ...current,
    [field]: nextValue,
  };
  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: normalizeExtraContentBlocks(nextBlocks),
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) {
    showOperationError(error, "No se pudo guardar la nota del modulo.");
  }
}

function scheduleTutorialEditorPrimarySave(tutorialId, field, value) {
  if (!tutorialId || !field) {
    return;
  }
  const timerKey = `p:${tutorialId}:${field}`;
  const existing = tutorialEditorAutosaveTimers.get(timerKey);
  if (existing) {
    window.clearTimeout(existing);
  }
  const timer = window.setTimeout(() => {
    tutorialEditorAutosaveTimers.delete(timerKey);
    void saveTutorialEditorPrimaryField(tutorialId, field, value);
  }, 420);
  tutorialEditorAutosaveTimers.set(timerKey, timer);
}

function scheduleTutorialEditorExtraSave(tutorialId, blockId, field, value) {
  if (!tutorialId || !blockId || !field) {
    return;
  }
  const timerKey = `e:${tutorialId}:${blockId}:${field}`;
  const existing = tutorialEditorAutosaveTimers.get(timerKey);
  if (existing) {
    window.clearTimeout(existing);
  }
  const timer = window.setTimeout(() => {
    tutorialEditorAutosaveTimers.delete(timerKey);
    void saveTutorialEditorExtraField(tutorialId, blockId, field, value);
  }, 420);
  tutorialEditorAutosaveTimers.set(timerKey, timer);
}

async function saveTutorialEditorPrimaryField(tutorialId, field, value) {
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const nextValue = String(value ?? "");
  let changed = false;
  switch (field) {
    case "title": {
      const title = nextValue.trim();
      if (!title || title === tutorial.title) {
        return;
      }
      tutorial.title = title;
      changed = true;
      break;
    }
    case "type": {
      if (!["video", "image", "text"].includes(nextValue) || nextValue === tutorial.type) {
        return;
      }
      tutorial.type = nextValue;
      if (tutorial.type !== "video") {
        tutorial.timestamps = [];
      }
      changed = true;
      break;
    }
    case "source": {
      if (!["youtube", "instagram", "manual"].includes(nextValue) || nextValue === tutorial.source) {
        return;
      }
      tutorial.source = nextValue;
      changed = true;
      break;
    }
    case "url": {
      if (nextValue === tutorial.url) {
        return;
      }
      tutorial.url = nextValue;
      tutorial.normalizedUrl = normalizeUrl(nextValue);
      changed = true;
      break;
    }
    case "imageUrl": {
      if (nextValue === tutorial.imageUrl) {
        return;
      }
      tutorial.imageUrl = nextValue;
      changed = true;
      break;
    }
    case "textContent": {
      if (nextValue === tutorial.textContent) {
        return;
      }
      tutorial.textContent = nextValue;
      changed = true;
      break;
    }
    case "notes": {
      if (nextValue === tutorial.notes) {
        return;
      }
      tutorial.notes = nextValue;
      changed = true;
      break;
    }
    case "timestamps": {
      const nextTimestamps = parseTimestampLines(nextValue);
      if (JSON.stringify(nextTimestamps) === JSON.stringify(tutorial.timestamps || [])) {
        return;
      }
      tutorial.timestamps = nextTimestamps;
      changed = true;
      break;
    }
    default:
      return;
  }

  if (!changed) {
    return;
  }

  const updatedAt = new Date().toISOString();
  tutorial.updatedAt = updatedAt;
  const payload = {
    ...tutorial,
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    if (field === "type") {
      render();
    }
  } catch (error) {
    showOperationError(error, "No se pudo guardar el bloque principal.");
    await refreshTutorials();
  }
}

async function saveTutorialEditorExtraField(tutorialId, blockId, field, value) {
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index < 0) {
    return;
  }
  const current = blocks[index];
  const nextValue = String(value ?? "");
  const nextBlock = { ...current };

  switch (field) {
    case "type":
      if (!["image", "video", "text"].includes(nextValue) || nextValue === current.type) {
        return;
      }
      nextBlock.type = nextValue;
      if (nextValue === "text") {
        nextBlock.text = typeof current.text === "string" && current.text.trim() ? current.text : "Nuevo bloque de texto";
        nextBlock.url = "";
        nextBlock.timestamps = [];
      } else {
        nextBlock.url = typeof current.url === "string" && current.url.trim() ? current.url : "https://";
        nextBlock.text = "";
        nextBlock.timestamps = nextValue === "video" ? normalizeTimestampEntries(current.timestamps) : [];
      }
      break;
    case "caption":
      if (nextValue === (current.caption || "")) {
        return;
      }
      nextBlock.caption = nextValue;
      break;
    case "url":
      if (current.type === "text") {
        return;
      }
      if (!nextValue.trim()) {
        return;
      }
      if (nextValue === (current.url || "")) {
        return;
      }
      nextBlock.url = nextValue;
      break;
    case "text":
      if (current.type !== "text") {
        return;
      }
      if (!nextValue.trim()) {
        return;
      }
      if (nextValue === (current.text || "")) {
        return;
      }
      nextBlock.text = nextValue;
      break;
    case "timestamps":
      if (current.type !== "video") {
        return;
      }
      {
        const nextTimestamps = parseTimestampLines(nextValue);
        if (JSON.stringify(nextTimestamps) === JSON.stringify(current.timestamps || [])) {
          return;
        }
        nextBlock.timestamps = nextTimestamps;
      }
      break;
    case "note":
      if (nextValue === (current.note || "")) {
        return;
      }
      nextBlock.note = nextValue;
      break;
    default:
      return;
  }

  const nextBlocks = [...blocks];
  nextBlocks[index] = nextBlock;
  const updatedAt = new Date().toISOString();
  tutorial.extraContent = normalizeExtraContentBlocks(nextBlocks);
  tutorial.updatedAt = updatedAt;

  const payload = {
    ...tutorial,
    extraContent: tutorial.extraContent,
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    if (field === "type") {
      render();
    }
  } catch (error) {
    showOperationError(error, "No se pudo guardar el bloque.");
    await refreshTutorials();
  }
}

function renderExtraContentComposer(tutorial) {
  const composer = state.extraComposer;
  if (!composer || composer.tutorialId !== tutorial.id || composer.type !== "text") {
    return "";
  }

  return `
    <article class="detail-extra-composer">
      <div class="detail-composer-tools">
        <details class="row-menu row-menu-card detail-composer-menu">
          <summary class="menu-trigger" aria-label="Opciones de seccion">···</summary>
          <div class="row-menu-panel">
            <p class="meta">Eliminar esta seccion de texto.</p>
            <div class="menu-actions">
              <button type="button" class="danger" data-discard-extra-composer="${tutorial.id}">Eliminar seccion</button>
            </div>
          </div>
        </details>
      </div>
      <label class="detail-composer-field">
        <input
          class="detail-composer-title-input"
          type="text"
          data-extra-field="caption"
          placeholder="Insertar titulo"
          value="${escapeAttribute(composer.caption || "")}"
        />
      </label>
      <label class="detail-composer-field">
        <textarea class="detail-composer-text-input" data-extra-field="text" placeholder="Insertar texto">${escapeHtml(composer.text || "")}</textarea>
      </label>
    </article>
  `;
}

function openExtraContentComposer(tutorialId, type) {
  if (!tutorialId || !["image", "video", "text"].includes(type || "")) {
    return;
  }
  if (type === "image" || type === "video") {
    openExtraMediaDialog(tutorialId, type);
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  const blocks = normalizeExtraContentBlocks(tutorial?.extraContent);
  const latest = blocks.filter((block) => block.type === "text").pop() || null;
  const draft = loadLiveTextDraft(tutorialId);
  state.extraComposer = {
    tutorialId,
    type,
    url: "",
    text: draft?.text ?? latest?.text ?? "",
    caption: draft?.caption ?? latest?.caption ?? "",
    blockId: draft?.blockId || latest?.id || null,
  };
  render();
}

function closeExtraContentComposer() {
  if (state.extraComposer?.type === "text") {
    persistLiveTextDraft(state.extraComposer.tutorialId, state.extraComposer);
  }
  state.extraComposer = null;
  if (extraComposerAutosaveTimer) {
    window.clearTimeout(extraComposerAutosaveTimer);
    extraComposerAutosaveTimer = null;
  }
  render();
}

async function discardExtraContentComposer(tutorialId) {
  const composer = state.extraComposer;
  if (!composer || composer.tutorialId !== tutorialId || composer.type !== "text") {
    return;
  }
  const shouldDelete = window.confirm("Eliminar esta seccion de texto? Esta accion no se puede deshacer.");
  if (!shouldDelete) {
    return;
  }
  if (extraComposerAutosaveTimer) {
    window.clearTimeout(extraComposerAutosaveTimer);
    extraComposerAutosaveTimer = null;
  }

  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    state.extraComposer = null;
    render();
    return;
  }

  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const nextBlocks = composer.blockId ? blocks.filter((block) => block.id !== composer.blockId) : blocks;
  state.extraComposer = null;
  clearLiveTextDraft(tutorialId);
  if (nextBlocks.length === blocks.length) {
    render();
    return;
  }

  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: nextBlocks,
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    clearLiveTextDraft(tutorialId);
    setSyncStatus(`Seccion eliminada · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    render();
  } catch (error) {
    showOperationError(error, "No se pudo eliminar la seccion de texto.");
  }
}

function scheduleExtraComposerAutosave(tutorialId) {
  if (!tutorialId || !state.extraComposer || state.extraComposer.type !== "text") {
    return;
  }
  if (extraComposerAutosaveTimer) {
    window.clearTimeout(extraComposerAutosaveTimer);
  }
  extraComposerAutosaveTimer = window.setTimeout(() => {
    void autosaveExtraComposerText(tutorialId);
  }, 260);
}

async function autosaveExtraComposerText(tutorialId) {
  const composer = state.extraComposer;
  if (!composer || composer.tutorialId !== tutorialId || composer.type !== "text") {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const text = String(composer.text || "");
  const caption = String(composer.caption || "").trim();
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const blockId = composer.blockId || createId();
  composer.blockId = blockId;
  let nextBlocks = [...blocks];
  if (!text.trim()) {
    nextBlocks = nextBlocks.filter((block) => block.id !== blockId);
    composer.blockId = null;
    if (nextBlocks.length === blocks.length) {
      return;
    }
  } else {
    const nextBlock = {
      id: blockId,
      type: "text",
      text,
      caption,
      createdAt: new Date().toISOString(),
    };
    const idx = nextBlocks.findIndex((block) => block.id === blockId);
    if (idx >= 0) {
      nextBlocks[idx] = nextBlock;
    } else {
      nextBlocks.push(nextBlock);
    }
  }

  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: normalizeExtraContentBlocks(nextBlocks),
    updatedAt,
  };

  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) {
    showOperationError(error, "No se pudo guardar el texto adicional.");
  }
}

async function saveExtraContentComposer(tutorialId) {
  const composer = state.extraComposer;
  if (!composer || composer.tutorialId !== tutorialId) {
    return;
  }
  if (!tutorialId || !["image", "video", "text"].includes(composer.type || "")) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }

  const caption = (composer.caption || "").trim();
  let block = null;
  if (composer.type === "text") {
    const text = (composer.text || "").trim();
    if (!text) {
      window.alert("El texto no puede estar vacio.");
      return;
    }
    block = {
      id: createId(),
      type: "text",
      text,
      caption,
      createdAt: new Date().toISOString(),
    };
  } else {
    const url = (composer.url || "").trim();
    if (!url) {
      window.alert("Debes escribir una URL valida.");
      return;
    }
    block = {
      id: createId(),
      type: composer.type,
      url,
      caption,
      createdAt: new Date().toISOString(),
    };
  }

  const nextBlocks = normalizeExtraContentBlocks([...(tutorial.extraContent || []), block]);
  const payload = {
    ...tutorial,
    extraContent: nextBlocks,
    updatedAt: new Date().toISOString(),
  };

  try {
    await apiUpdateTutorial(tutorialId, payload);
    state.selectedId = tutorialId;
    state.extraComposer = null;
    await refreshTutorials();
  } catch (error) {
    showOperationError(error, "No se pudo agregar el bloque de contenido.");
  }
}

function openExtraMediaDialog(tutorialId, type) {
  if (!refs.extraMediaDialog?.showModal) {
    return;
  }
  const normalizedType = type === "video" ? "video" : "image";
  state.extraMediaContext = {
    tutorialId,
    type: normalizedType,
    mode: "url",
  };
  refs.extraMediaTitle.textContent = normalizedType === "image" ? "Agregar imagenes" : "Agregar video";
  refs.extraMediaUrlInput.value = "";
  refs.extraMediaUrlInput.placeholder = normalizedType === "image" ? "https://... (una por linea)" : "https://...";
  refs.extraMediaCaptionInput.value = "";
  refs.extraMediaFileInput.value = "";
  if (refs.extraMediaTimestampsInput) {
    refs.extraMediaTimestampsInput.value = "";
  }
  setExtraMediaDialogStatus("");
  setExtraMediaDialogMode("url");
  if (!refs.extraMediaDialog.open) {
    refs.extraMediaDialog.showModal();
  }
}

function setExtraMediaDialogMode(mode) {
  const next = mode === "upload" ? "upload" : "url";
  if (!state.extraMediaContext) {
    return;
  }
  state.extraMediaContext.mode = next;
  refs.extraMediaModeButtons.forEach((button) => {
    const active = button.dataset.extraMediaMode === next;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  refs.extraMediaUrlField.classList.toggle("hidden", next !== "url");
  refs.extraMediaFileField.classList.toggle("hidden", next !== "upload");
  const isVideo = state.extraMediaContext.type === "video";
  refs.extraMediaTimestampsField?.classList.toggle("hidden", !isVideo);
  if (refs.extraMediaUrlInput) {
    refs.extraMediaUrlInput.placeholder = isVideo ? "https://..." : "https://... (una por linea)";
  }
  if (refs.extraMediaFileInput) {
    refs.extraMediaFileInput.accept = isVideo ? "video/*" : "image/*";
    refs.extraMediaFileInput.multiple = !isVideo;
  }
}

function setExtraMediaDialogStatus(message, isError = false) {
  if (!refs.extraMediaStatus) {
    return;
  }
  refs.extraMediaStatus.textContent = message;
  refs.extraMediaStatus.classList.toggle("is-error", Boolean(isError));
}

function closeExtraMediaDialog() {
  if (refs.extraMediaDialog?.open) {
    refs.extraMediaDialog.close();
  }
  state.extraMediaContext = null;
  if (refs.extraMediaFileInput) {
    refs.extraMediaFileInput.value = "";
  }
  if (refs.extraMediaUrlInput) {
    refs.extraMediaUrlInput.value = "";
  }
  if (refs.extraMediaCaptionInput) {
    refs.extraMediaCaptionInput.value = "";
  }
  if (refs.extraMediaTimestampsInput) {
    refs.extraMediaTimestampsInput.value = "";
  }
  setExtraMediaDialogStatus("");
}

function collectMediaUrlsFromInput(rawValue, allowMultiple) {
  const raw = String(rawValue || "").trim();
  if (!raw) {
    return [];
  }
  const chunks = raw
    .split(/\r?\n|,/)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  if (!allowMultiple) {
    return chunks.length ? [chunks[0]] : [];
  }
  return chunks;
}

function parseTimestampLines(rawValue) {
  const lines = String(rawValue || "")
    .split(/\r?\n/)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  return normalizeTimestampEntries(lines);
}

async function saveExtraMediaFromDialog() {
  const context = state.extraMediaContext;
  if (!context) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === context.tutorialId);
  if (!tutorial) {
    closeExtraMediaDialog();
    return;
  }

  const caption = refs.extraMediaCaptionInput.value.trim();
  const timestamps = context.type === "video" ? parseTimestampLines(refs.extraMediaTimestampsInput?.value || "") : [];
  const blocksToAdd = [];
  refs.saveExtraMediaButton.disabled = true;
  try {
    if (context.mode === "url") {
      const urls = collectMediaUrlsFromInput(refs.extraMediaUrlInput.value, context.type === "image");
      if (!urls.length) {
        setExtraMediaDialogStatus("Debes ingresar una URL valida.", true);
        return;
      }
      urls.forEach((url) => {
        blocksToAdd.push({
          id: createId(),
          type: context.type,
          url,
          caption,
          note: "",
          timestamps: context.type === "video" ? timestamps : [],
          createdAt: new Date().toISOString(),
        });
      });
    } else {
      let files = Array.from(refs.extraMediaFileInput.files || []);
      if (!files.length) {
        setExtraMediaDialogStatus("Selecciona un archivo.", true);
        return;
      }
      if (context.type === "video") {
        files = [files[0]];
      }
      for (const file of files) {
        if (context.type === "image" && !file.type.startsWith("image/")) {
          setExtraMediaDialogStatus("Debes seleccionar imagenes.", true);
          return;
        }
        if (context.type === "video" && !file.type.startsWith("video/")) {
          setExtraMediaDialogStatus("Debes seleccionar un video.", true);
          return;
        }
      }

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setExtraMediaDialogStatus(
          files.length > 1 ? `Subiendo ${index + 1}/${files.length}: ${file.name}` : `Subiendo ${file.name}`
        );
        const uploaded = await apiUploadFile(file, (percent) => {
          setExtraMediaDialogStatus(
            files.length > 1
              ? `Subiendo ${index + 1}/${files.length}: ${percent}%`
              : `Subiendo archivo... ${percent}%`
          );
        });
        blocksToAdd.push({
          id: createId(),
          type: context.type,
          url: uploaded.url,
          caption,
          note: "",
          timestamps: context.type === "video" ? timestamps : [],
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (!blocksToAdd.length) {
      setExtraMediaDialogStatus("No se pudo crear el adjunto.", true);
      return;
    }

    const nextBlocks = normalizeExtraContentBlocks([...(tutorial.extraContent || []), ...blocksToAdd]);
    const updatedAt = new Date().toISOString();
    const payload = {
      ...tutorial,
      extraContent: nextBlocks,
      updatedAt,
    };
    await apiUpdateTutorial(context.tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    if (context.type === "image") {
      const totalImages = nextBlocks.filter((item) => item.type === "image").length;
      if (totalImages) {
        state.mediaCarouselIndexByTutorial[context.tutorialId] = totalImages - 1;
      }
    }
    state.selectedId = context.tutorialId;
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    closeExtraMediaDialog();
    render();
  } catch (error) {
    setExtraMediaDialogStatus(resolveError(error, "No se pudo agregar el contenido."), true);
  } finally {
    refs.saveExtraMediaButton.disabled = false;
  }
}

async function removeExtraContentBlock(tutorialId, blockId) {
  if (!tutorialId || !blockId) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent);
  const nextBlocks = blocks.filter((block) => block.id !== blockId);
  if (nextBlocks.length === blocks.length) {
    return;
  }
  if (!window.confirm("Eliminar este bloque de contenido adicional?")) {
    return;
  }

  const payload = {
    ...tutorial,
    extraContent: nextBlocks,
    updatedAt: new Date().toISOString(),
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    state.selectedId = tutorialId;
    await refreshTutorials();
  } catch (error) {
    showOperationError(error, "No se pudo eliminar el bloque adicional.");
  }
}

async function addEditorTextBlock(tutorialId) {
  if (!tutorialId) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const nextBlocks = normalizeExtraContentBlocks([
    ...(tutorial.extraContent || []),
    {
      id: createId(),
      type: "text",
      text: "Nuevo bloque de texto",
      caption: "",
      note: "",
      createdAt: new Date().toISOString(),
    },
  ]);
  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: nextBlocks,
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    render();
  } catch (error) {
    showOperationError(error, "No se pudo agregar el bloque de texto.");
  }
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
    extraContent: current ? normalizeExtraContentBlocks(current.extraContent) : [],
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

function liveTextDraftStorageKey(tutorialId) {
  const userId = state.currentUser?.id || "guest";
  return `tv_live_text_draft_${userId}_${tutorialId}`;
}

function persistLiveTextDraft(tutorialId, composer) {
  if (!tutorialId || !composer || composer.type !== "text") {
    return;
  }
  try {
    const payload = {
      blockId: typeof composer.blockId === "string" ? composer.blockId : null,
      text: String(composer.text || ""),
      caption: String(composer.caption || ""),
      updatedAt: Date.now(),
    };
    localStorage.setItem(liveTextDraftStorageKey(tutorialId), JSON.stringify(payload));
  } catch {}
}

function loadLiveTextDraft(tutorialId) {
  if (!tutorialId) {
    return null;
  }
  try {
    const raw = localStorage.getItem(liveTextDraftStorageKey(tutorialId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const text = typeof parsed.text === "string" ? parsed.text : "";
    const caption = typeof parsed.caption === "string" ? parsed.caption : "";
    const blockId = typeof parsed.blockId === "string" ? parsed.blockId : "";
    if (!text && !caption && !blockId) {
      return null;
    }
    return { text, caption, blockId };
  } catch {
    return null;
  }
}

function clearLiveTextDraft(tutorialId) {
  if (!tutorialId) {
    return;
  }
  try {
    localStorage.removeItem(liveTextDraftStorageKey(tutorialId));
  } catch {}
}

function autoGrowTextarea(textarea, minHeight = 80) {
  if (!(textarea instanceof HTMLTextAreaElement)) {
    return;
  }
  textarea.style.height = "0px";
  const next = Math.max(minHeight, textarea.scrollHeight || 0);
  textarea.style.height = `${next}px`;
}

function clearAutosaveTimers() {
  if (notesAutosaveTimer) {
    window.clearTimeout(notesAutosaveTimer);
    notesAutosaveTimer = null;
  }
  if (extraComposerAutosaveTimer) {
    window.clearTimeout(extraComposerAutosaveTimer);
    extraComposerAutosaveTimer = null;
  }
  if (extraBlockAutosaveTimers.size) {
    extraBlockAutosaveTimers.forEach((timer) => window.clearTimeout(timer));
    extraBlockAutosaveTimers.clear();
  }
  if (tutorialEditorAutosaveTimers.size) {
    tutorialEditorAutosaveTimers.forEach((timer) => window.clearTimeout(timer));
    tutorialEditorAutosaveTimers.clear();
  }
}

async function flushPendingAutosaves() {
  if (!state.currentUser) {
    return;
  }
  const tasks = [];
  if (notesAutosaveTimer) {
    window.clearTimeout(notesAutosaveTimer);
    notesAutosaveTimer = null;
    if (state.selectedId) {
      const notesField = refs.detailPanel.querySelector(`[data-notes-editor-id="${state.selectedId}"]`);
      if (notesField instanceof HTMLTextAreaElement) {
        tasks.push(saveDetailNotesAutosave(state.selectedId, notesField.value));
      }
    }
  }
  if (extraComposerAutosaveTimer && state.extraComposer?.type === "text") {
    window.clearTimeout(extraComposerAutosaveTimer);
    extraComposerAutosaveTimer = null;
    tasks.push(autosaveExtraComposerText(state.extraComposer.tutorialId));
  }
  if (extraBlockAutosaveTimers.size) {
    const entries = Array.from(extraBlockAutosaveTimers.entries());
    extraBlockAutosaveTimers.clear();
    entries.forEach(([key, timer]) => {
      window.clearTimeout(timer);
      const [tutorialId, blockId, field] = String(key || "").split(":");
      if (!tutorialId || !blockId || !field) {
        return;
      }
      const selector = `[data-extra-block-note-id="${blockId}"][data-extra-block-tutorial-id="${tutorialId}"]`;
      const editor = refs.detailPanel.querySelector(selector);
      if (editor instanceof HTMLTextAreaElement) {
        tasks.push(saveExtraBlockField(tutorialId, blockId, field, editor.value));
      }
    });
  }
  if (tutorialEditorAutosaveTimers.size) {
    const entries = Array.from(tutorialEditorAutosaveTimers.entries());
    tutorialEditorAutosaveTimers.clear();
    entries.forEach(([key, timer]) => {
      window.clearTimeout(timer);
      const parts = String(key || "").split(":");
      if (parts[0] === "p") {
        const [, tutorialId, field] = parts;
        if (!tutorialId || !field) {
          return;
        }
        const input = refs.detailPanel.querySelector(`[data-editor-primary-field="${field}"]`);
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
          tasks.push(saveTutorialEditorPrimaryField(tutorialId, field, input.value));
        }
        return;
      }
      if (parts[0] === "e") {
        const [, tutorialId, blockId, field] = parts;
        if (!tutorialId || !blockId || !field) {
          return;
        }
        const selector = `[data-editor-extra-field="${field}"][data-editor-extra-tutorial-id="${tutorialId}"][data-editor-extra-block-id="${blockId}"]`;
        const input = refs.detailPanel.querySelector(selector);
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
          tasks.push(saveTutorialEditorExtraField(tutorialId, blockId, field, input.value));
        }
      }
    });
  }
  if (tasks.length) {
    await Promise.allSettled(tasks);
  }
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
    if (state.page === "tutorial" && !state.selectedId) {
      state.page = "library";
    }
    syncRouteToLocation(true);
    setSyncStatus(`Sincronizado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    checkAndNotifyReminders();
  } catch (error) {
    setSyncStatus(resolveError(error, "No se pudo conectar con el backend."), true);
  } finally {
    render();
  }
}

function normalizeTimestampEntries(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .slice(0, 200)
    .map((entry) => String(entry || "").trim().slice(0, 120))
    .filter(Boolean);
}

function normalizeExtraContentBlocks(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const type = String(item.type || "").trim();
      if (!["image", "video", "text"].includes(type)) {
        return null;
      }
      const id = typeof item.id === "string" && item.id ? item.id : createId();
      const caption = typeof item.caption === "string" ? item.caption : "";
      const note = typeof item.note === "string" ? item.note : "";
      const createdAt = typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString();
      if (type === "text") {
        const text = typeof item.text === "string" ? item.text : "";
        if (!text.trim()) {
          return null;
        }
        return { id, type, text, caption, note, createdAt };
      }
      const url = typeof item.url === "string" ? item.url : "";
      if (!url.trim()) {
        return null;
      }
      const timestamps = type === "video" ? normalizeTimestampEntries(item.timestamps) : [];
      return { id, type, url, caption, note, timestamps, createdAt };
    })
    .filter(Boolean)
    .slice(0, 60);
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
    extraContent: normalizeExtraContentBlocks(item.extraContent),
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
