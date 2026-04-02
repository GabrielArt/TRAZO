const API_BASE = "/api";
const STATUS_ORDER = ["Por ver", "En progreso", "Aplicado", "Archivado"];
const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
const DEFAULT_CLOUD_MEDIA_TRANSFER_MAX_BYTES = 100 * 1024 * 1024;
const TEXT_FILE_EXTENSIONS = [".txt", ".md", ".markdown"];
const SMART_COLLECTION_KEYS = ["all", "due", "focus", "uncategorized", "duplicates"];
const TABLE_COLUMN_KEYS = ["type", "category", "collection", "reviewDate", "updatedAt"];
const EMOJI_COLOR_KEYS = ["default", "blue", "red", "green", "yellow", "purple", "orange"];
const RICH_HTML_STORAGE_PREFIX = "@@TV_RICH_HTML@@";
const LIVE_SYNC_POLL_MS = 1000;
const LIVE_SYNC_SSE_RECONNECT_MS = 900;
const LIVE_EDIT_GRACE_MS = 1200;
const MOBILE_SIDEBAR_BREAKPOINT = 980;
const EMOJI_PICKER_STORAGE_KEY = "tv_recent_symbols";
const EMOJI_PICKER_MAX_RECENT = 18;
const EMOJI_PICKER_TABS = Object.freeze([
  { id: "recent", label: "Recientes" },
  { id: "faces", label: "Caras" },
  { id: "symbols", label: "Simbolos" },
  { id: "shapes", label: "Formas" },
  { id: "arrows", label: "Flechas" },
  { id: "misc", label: "Varios" },
]);
const EMOJI_PICKER_LIBRARY = Object.freeze({
  faces: Object.freeze([
    { symbol: "☺", label: "sonrisa", keywords: "feliz cara sonrisa" },
    { symbol: "☻", label: "alegre", keywords: "cara feliz alegre" },
    { symbol: "☹", label: "triste", keywords: "cara triste" },
    { symbol: "☼", label: "sol", keywords: "sol luz dia" },
    { symbol: "♥", label: "corazon", keywords: "amor corazon" },
    { symbol: "♡", label: "corazon vacio", keywords: "amor corazon" },
    { symbol: "✿", label: "flor", keywords: "flor naturaleza" },
    { symbol: "❀", label: "flor decorativa", keywords: "flor" },
  ]),
  symbols: Object.freeze([
    { symbol: "✦", label: "estrella", keywords: "estrella brillo" },
    { symbol: "✶", label: "estrella fuerte", keywords: "estrella brillo" },
    { symbol: "✧", label: "brillo fino", keywords: "estrella brillo" },
    { symbol: "✩", label: "estrella vacia", keywords: "estrella" },
    { symbol: "✓", label: "check", keywords: "check listo correcto" },
    { symbol: "✕", label: "equis", keywords: "x error cerrar" },
    { symbol: "⚡", label: "rayo", keywords: "rayo energia rapido" },
    { symbol: "∞", label: "infinito", keywords: "infinito" },
  ]),
  shapes: Object.freeze([
    { symbol: "●", label: "circulo lleno", keywords: "circulo forma" },
    { symbol: "○", label: "circulo vacio", keywords: "circulo forma" },
    { symbol: "◆", label: "rombo", keywords: "rombo forma" },
    { symbol: "◇", label: "rombo vacio", keywords: "rombo forma" },
    { symbol: "■", label: "cuadrado lleno", keywords: "cuadrado forma" },
    { symbol: "□", label: "cuadrado vacio", keywords: "cuadrado forma" },
    { symbol: "▲", label: "triangulo arriba", keywords: "triangulo forma" },
    { symbol: "▼", label: "triangulo abajo", keywords: "triangulo forma" },
  ]),
  arrows: Object.freeze([
    { symbol: "←", label: "flecha izquierda", keywords: "flecha izquierda" },
    { symbol: "→", label: "flecha derecha", keywords: "flecha derecha" },
    { symbol: "↑", label: "flecha arriba", keywords: "flecha arriba" },
    { symbol: "↓", label: "flecha abajo", keywords: "flecha abajo" },
    { symbol: "↔", label: "flecha horizontal", keywords: "flecha horizontal" },
    { symbol: "↕", label: "flecha vertical", keywords: "flecha vertical" },
    { symbol: "➜", label: "flecha curva", keywords: "flecha avanzar" },
    { symbol: "➤", label: "puntero", keywords: "flecha puntero" },
  ]),
  misc: Object.freeze([
    { symbol: "⚙", label: "configuracion", keywords: "configuracion ajustes" },
    { symbol: "⚒", label: "herramientas", keywords: "herramientas trabajo" },
    { symbol: "☕", label: "cafe", keywords: "cafe bebida" },
    { symbol: "☁", label: "nube", keywords: "nube cloud" },
    { symbol: "☂", label: "paraguas", keywords: "lluvia paraguas" },
    { symbol: "✉", label: "correo", keywords: "mail correo mensaje" },
    { symbol: "✎", label: "lapiz", keywords: "escribir editar" },
    { symbol: "⌛", label: "tiempo", keywords: "reloj tiempo espera" },
  ]),
});
const EMOJI_PICKER_ENTRY_MAP = new Map(
  Object.values(EMOJI_PICKER_LIBRARY)
    .flat()
    .map((entry) => [entry.symbol, entry])
);
const EMOJI_PICKER_ALL_ENTRIES = Object.freeze(Array.from(EMOJI_PICKER_ENTRY_MAP.values()));
const DEFAULT_VISIBLE_COLUMNS = Object.freeze({
  type: true,
  category: true,
  collection: true,
  reviewDate: true,
  updatedAt: false,
});
const DEFAULT_USER_SETTINGS = Object.freeze({
  storageMode: "device",
  localRootPath: "",
  cloudRootPath: "",
  cloudProvider: "none",
  cloudEnabled: false,
  cloudConnected: false,
  cloudAccountName: "",
  cloudConnectedAt: "",
  peerEnabled: false,
  syncTutorialIds: [],
  setupCompleted: false,
  lastSyncAt: "",
  lastSyncStatus: "idle",
  lastSyncSummary: {},
  updatedAt: "",
});

const state = {
  tutorials: [],
  tutorialsSignature: "",
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
  sidebarCollapsed: getInitialSidebarCollapsed(),
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
  userSettings: { ...DEFAULT_USER_SETTINGS },
  maxUploadSizeBytes: DEFAULT_MAX_UPLOAD_SIZE_BYTES,
  cloudMediaTransferMaxBytes: DEFAULT_CLOUD_MEDIA_TRANSFER_MAX_BYTES,
  notesCollapse: getInitialNotesCollapseState(),
  reminderPermission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS },
  emojiPickerCategory: "recent",
};

let uploadProgressTimer = null;
let reminderIntervalId = null;
let liveSyncIntervalId = null;
let liveSyncInFlight = false;
let liveSyncPendingApply = false;
let liveEventSource = null;
let liveEventReconnectTimer = null;
let liveEventQueuedTutorials = false;
let liveEventQueuedSettings = false;
let liveEventQueueTimer = null;
let liveEventStreamConnected = false;
let liveEditLastAt = 0;
let liveSyncPendingFlushTimer = null;
let notesAutosaveTimer = null;
let primaryTextAutosaveTimer = null;
let extraComposerAutosaveTimer = null;
let isApplyingRoute = false;
let activeDraggedExtraBlock = null;
let activeMarkdownTarget = null;
let recentEmojiSymbols = loadRecentEmojiSymbols();
let wasCompactSidebarViewport = false;
let sidebarAutoCollapsed = false;
let authRequestInFlight = false;
const extraBlockAutosaveTimers = new Map();
const tutorialEditorAutosaveTimers = new Map();

const refs = {
  appShell: document.querySelector(".app-shell"),
  appContent: document.querySelector("#appContent"),
  libraryPage: document.querySelector("#libraryPage"),
  tutorialPage: document.querySelector("#tutorialPage"),
  settingsPage: document.querySelector("#settingsPage"),
  sidebarBackdrop: document.querySelector("#sidebarBackdrop"),
  toggleSidebarButton: document.querySelector("#toggleSidebarButton"),
  sidebarExpandButton: document.querySelector("#sidebarExpandButton"),
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
  emojiInput: document.querySelector("#emojiInput"),
  emojiPickerToggle: document.querySelector("#emojiPickerToggle"),
  emojiPickerPanel: document.querySelector("#emojiPickerPanel"),
  emojiPickerSearch: document.querySelector("#emojiPickerSearch"),
  emojiPickerRecentGrid: document.querySelector("#emojiPickerRecentGrid"),
  emojiPickerGrid: document.querySelector("#emojiPickerGrid"),
  emojiPickerCategoryTitle: document.querySelector("#emojiPickerCategoryTitle"),
  emojiPickerEmpty: document.querySelector("#emojiPickerEmpty"),
  emojiPickerCategoryButtons: Array.from(document.querySelectorAll("[data-emoji-category]")),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  deleteButton: document.querySelector("#deleteButton"),
  saveButton: document.querySelector("#tutorialForm button[type='submit']"),
  dialogMiniEditor: document.querySelector("#dialogMiniEditor"),
  dialogMiniEditorContent: document.querySelector("#dialogMiniEditorContent"),
  dialogMiniAddImage: document.querySelector("#dialogMiniAddImage"),
  dialogMiniAddVideo: document.querySelector("#dialogMiniAddVideo"),
  dialogMiniAddText: document.querySelector("#dialogMiniAddText"),
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
  uploadLimitHint: document.querySelector("#uploadLimitHint"),
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
  extraMediaLimitHint: document.querySelector("#extraMediaLimitHint"),
  mediaPreviewDialog: document.querySelector("#mediaPreviewDialog"),
  mediaPreviewImage: document.querySelector("#mediaPreviewImage"),
  mediaPreviewCaption: document.querySelector("#mediaPreviewCaption"),
  closeMediaPreviewButton: document.querySelector("#closeMediaPreviewButton"),
  markdownToolbar: document.querySelector("#markdownToolbar"),
  setupDialog: document.querySelector("#setupDialog"),
  setupForm: document.querySelector("#setupForm"),
  closeSetupButton: document.querySelector("#closeSetupButton"),
  saveSetupButton: document.querySelector("#saveSetupButton"),
  createSetupLocalFolderButton: document.querySelector("#createSetupLocalFolderButton"),
  setupLocalRootPath: document.querySelector("#setupLocalRootPath"),
  setupCloudSyncEnabled: document.querySelector("#setupCloudSyncEnabled"),
  setupPeerSyncEnabled: document.querySelector("#setupPeerSyncEnabled"),
  setupStatus: document.querySelector("#setupStatus"),
  localRootPathInput: document.querySelector("#localRootPathInput"),
  cloudRootPathInput: document.querySelector("#cloudRootPathInput"),
  cloudSyncEnabled: document.querySelector("#cloudSyncEnabled"),
  peerSyncEnabled: document.querySelector("#peerSyncEnabled"),
  pickLocalFolderButton: document.querySelector("#pickLocalFolderButton"),
  createLocalFolderButton: document.querySelector("#createLocalFolderButton"),
  saveStorageSettingsButton: document.querySelector("#saveStorageSettingsButton"),
  runStorageSyncButton: document.querySelector("#runStorageSyncButton"),
  syncNowHint: document.querySelector("#syncNowHint"),
  storageSetupStatus: document.querySelector("#storageSetupStatus"),
  storageRoutingHint: document.querySelector("#storageRoutingHint"),
  cloudConnectionStatus: document.querySelector("#cloudConnectionStatus"),
  lastSyncMeta: document.querySelector("#lastSyncMeta"),
  lastSyncDetails: document.querySelector("#lastSyncDetails"),
  setupTutorialSyncList: document.querySelector("#setupTutorialSyncList"),
  setupCloudRootPath: document.querySelector("#setupCloudRootPath"),
  setupRoutingHint: document.querySelector("#setupRoutingHint"),
};

void init();

async function init() {
  bindEvents();
  wasCompactSidebarViewport = isCompactSidebarViewport();
  applyTheme(state.theme);
  setAuthenticated(null);
  applySidebarCollapsed(state.sidebarCollapsed, { persist: false });
  syncResponsiveShell();
  syncAdvancedFiltersVisibility();
  syncEmojiPickerToggleIcon();
  renderEmojiPickerPanel();
  switchAuthMode("login");
  syncTypeSpecificFields();
  syncUploadLimitHints();
  void refreshClientConfig();
  void bootstrapSession();
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
  refs.toggleSidebarButton?.addEventListener("click", () => applySidebarCollapsed(!state.sidebarCollapsed));
  refs.sidebarExpandButton?.addEventListener("click", () => applySidebarCollapsed(false));
  refs.sidebarBackdrop?.addEventListener("click", () => applySidebarCollapsed(true, { persist: false }));

  refs.newTutorialButton.addEventListener("click", openDialogForCreate);
  refs.shortcutsButton?.addEventListener("click", openShortcutsDialog);
  refs.closeShortcutsButton?.addEventListener("click", () => refs.shortcutsDialog.close());
  refs.closeDialogButton.addEventListener("click", () => refs.dialog.close());
  refs.dialog.addEventListener("click", (event) => void onActionClick(event));
  refs.dialog.addEventListener("close", () => {
    closeEmojiPickerPanel();
    const shouldReturnToViewer = state.page === "tutorial" && state.tutorialEditMode;
    hideDialogMiniEditor();
    if (shouldReturnToViewer) {
      state.tutorialEditMode = false;
      render();
    }
  });
  refs.tutorialForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void upsertTutorialFromForm();
  });
  refs.emojiInput?.addEventListener("input", () => syncEmojiPickerToggleIcon());
  refs.emojiPickerSearch?.addEventListener("input", () => renderEmojiPickerPanel());
  refs.emojiPickerSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  });
  refs.emojiPickerCategoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.emojiPickerCategory = normalizeEmojiPickerCategory(button.dataset.emojiCategory);
      renderEmojiPickerPanel();
    });
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
      setExtraMediaDialogStatus("");
    } else if (files.length === 1) {
      setExtraMediaDialogStatus(`Archivo seleccionado: ${files[0].name}`);
    } else {
      const previewNames = files
        .slice(0, 2)
        .map((file) => file.name)
        .join(", ");
      const remaining = files.length - 2;
      setExtraMediaDialogStatus(
        remaining > 0 ? `${previewNames} (+${remaining} mas)` : `${files.length} archivos seleccionados`
      );
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
  refs.tutorialPage.addEventListener("keydown", (event) => onTutorialPageKeydown(event));
  refs.tutorialPage.addEventListener("dragstart", (event) => onTutorialPageDragStart(event));
  refs.tutorialPage.addEventListener("dragover", (event) => onTutorialPageDragOver(event));
  refs.tutorialPage.addEventListener("drop", (event) => void onTutorialPageDrop(event));
  refs.tutorialPage.addEventListener("dragend", () => onTutorialPageDragEnd());
  refs.tutorialPage.addEventListener("mouseup", () => scheduleMarkdownToolbarUpdate());
  refs.tutorialPage.addEventListener("keyup", () => scheduleMarkdownToolbarUpdate());
  refs.tutorialPage.addEventListener("focusin", () => scheduleMarkdownToolbarUpdate());
  refs.tutorialPage.addEventListener("focusout", () => scheduleMarkdownToolbarUpdate(120));
  refs.tutorialPage.addEventListener("focusout", (event) => onTutorialPageFocusOut(event));
  refs.dialog.addEventListener("dragstart", (event) => onTutorialPageDragStart(event));
  refs.dialog.addEventListener("dragover", (event) => onTutorialPageDragOver(event));
  refs.dialog.addEventListener("drop", (event) => void onTutorialPageDrop(event));
  refs.dialog.addEventListener("dragend", () => onTutorialPageDragEnd());
  refs.dialog.addEventListener("mouseup", () => scheduleMarkdownToolbarUpdate());
  refs.dialog.addEventListener("keyup", () => scheduleMarkdownToolbarUpdate());
  refs.dialog.addEventListener("focusin", () => scheduleMarkdownToolbarUpdate());
  refs.dialog.addEventListener("focusout", () => scheduleMarkdownToolbarUpdate(120));
  refs.dialog.addEventListener("focusout", (event) => onTutorialPageFocusOut(event));
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
  refs.saveStorageSettingsButton?.addEventListener("click", () => void saveStorageSettingsFromPanel());
  refs.pickLocalFolderButton?.addEventListener("click", () => void pickLocalFolderFromExplorer("local"));
  refs.createLocalFolderButton?.addEventListener("click", () => void createLocalFolderFromPanel());
  refs.runStorageSyncButton?.addEventListener("click", () => void runStorageSyncNow());
  refs.setupTutorialSyncList?.addEventListener("change", onSettingsTutorialSyncChange);
  refs.closeSetupButton?.addEventListener("click", () => refs.setupDialog?.close());
  refs.createSetupLocalFolderButton?.addEventListener("click", () => void createLocalFolderFromSetupDialog());
  refs.setupForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSetupDialogSettings();
  });
  [
    refs.localRootPathInput,
    refs.cloudRootPathInput,
    refs.cloudSyncEnabled,
    refs.peerSyncEnabled,
    refs.setupLocalRootPath,
    refs.setupCloudRootPath,
    refs.setupCloudSyncEnabled,
    refs.setupPeerSyncEnabled,
  ]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("change", syncStorageRoutingHintsFromInputs);
      if (input instanceof HTMLInputElement && input.type === "text") {
        input.addEventListener("input", syncStorageRoutingHintsFromInputs);
      }
    });
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
      stopLiveEventStream();
      stopLiveSyncLoop();
      return;
    }
    syncLiveSyncLoopState();
    void runLiveSyncTick({ force: true });
  });
  window.addEventListener("resize", () => {
    syncResponsiveShell();
    if (state.currentUser && state.page === "library" && state.view === "table") {
      window.requestAnimationFrame(() => {
        render();
      });
      return;
    }
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
  refs.markdownToolbar?.addEventListener("click", (event) => onMarkdownToolbarClick(event));
  refs.markdownToolbar?.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });
  refs.tutorialPage.addEventListener("keydown", (event) => onMarkdownEditorKeydown(event));
  refs.dialog.addEventListener("keydown", (event) => onMarkdownEditorKeydown(event));
  document.addEventListener("mousedown", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("[data-toggle-notes-collapse]")) {
      event.preventDefault();
    }
    const richMarkdownTarget = findRichMarkdownEditableFromNode(target);
    const keepMarkdownToolbarOpen =
      (target instanceof HTMLElement && isMarkdownEditableTarget(target)) || richMarkdownTarget instanceof HTMLElement;
    if (
      refs.markdownToolbar &&
      !refs.markdownToolbar.classList.contains("hidden") &&
      target instanceof Node &&
      !refs.markdownToolbar.contains(target) &&
      !keepMarkdownToolbarOpen
    ) {
      hideMarkdownToolbar();
    }
    if (
      refs.emojiPickerPanel &&
      refs.emojiPickerToggle &&
      !refs.emojiPickerPanel.classList.contains("hidden") &&
      target instanceof Node &&
      !refs.emojiPickerPanel.contains(target) &&
      !refs.emojiPickerToggle.contains(target)
    ) {
      closeEmojiPickerPanel();
    }
  });
}

async function bootstrapSession() {
  setAuthenticated(null);
  setAuthMessage("Conectando con el servidor...", false);
  try {
    const response = await apiAuthMe();
    setAuthenticated(response.user);
    setAuthMessage("", false);
    await refreshUserSettings();
    await runStartupSyncIfNeeded();
    await refreshTutorials();
    await refreshSavedViews();
    startReminderLoop();
    syncLiveSyncLoopState();
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
  closeWindowMediaShells();
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
  closeSidebarForCompactNavigation();
  syncRouteToLocation();
  render();
}

function openSearchDialog() {
  if (!state.currentUser || !refs.searchDialog?.showModal) {
    return;
  }
  closeSidebarForCompactNavigation();
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
  if (!showTutorial) {
    hideMarkdownToolbar();
  }
  syncSidebarBackdrop();
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
  syncResponsiveShell();
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
    syncStorageSettingsUi();
    syncRouteToLocation(true);
    syncPageVisibility();
    return;
  }
  refs.userBadge.textContent = "No autenticado";
  state.page = "library";
  state.tutorials = [];
  state.tutorialsSignature = "";
  state.savedViews = [];
  state.userSettings = { ...DEFAULT_USER_SETTINGS };
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
  if (refs.setupDialog?.open) {
    refs.setupDialog.close();
  }
  if (refs.setupTutorialSyncList) {
    refs.setupTutorialSyncList.innerHTML = "";
  }
  syncStorageSettingsUi();
  closeExtraMediaDialog();
  clearAutosaveTimers();
  closeSearchDialog();
  syncPageVisibility();
  stopReminderLoop();
  stopLiveEventStream();
  stopLiveSyncLoop();
}

function setAuthMessage(message, isError) {
  refs.authMessage.textContent = message;
  refs.authMessage.classList.toggle("is-error", isError);
}

function setAuthFormsBusy(isBusy) {
  const busy = Boolean(isBusy);
  const loginSubmit = refs.loginForm?.querySelector("button[type='submit']");
  const registerSubmit = refs.registerForm?.querySelector("button[type='submit']");
  if (loginSubmit) {
    loginSubmit.disabled = busy;
  }
  if (registerSubmit) {
    registerSubmit.disabled = busy;
  }
  if (refs.showLoginButton) {
    refs.showLoginButton.disabled = busy;
  }
  if (refs.showRegisterButton) {
    refs.showRegisterButton.disabled = busy;
  }
}

function getEffectiveMaxUploadBytes() {
  const parsed = Number(state.maxUploadSizeBytes);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_MAX_UPLOAD_SIZE_BYTES;
}

function getEffectiveCloudMediaTransferMaxBytes() {
  const parsed = Number(state.cloudMediaTransferMaxBytes);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_CLOUD_MEDIA_TRANSFER_MAX_BYTES;
}

function syncUploadLimitHints() {
  const maxUploadLabel = formatBytesForUi(getEffectiveMaxUploadBytes());
  if (refs.uploadLimitHint) {
    refs.uploadLimitHint.textContent = `Limite local por archivo: ${maxUploadLabel}.`;
  }
  if (refs.extraMediaLimitHint) {
    refs.extraMediaLimitHint.textContent = `Modo archivo: limite local por archivo ${maxUploadLabel}.`;
  }
}

async function refreshClientConfig() {
  try {
    const payload = await apiClientConfig();
    const serverMaxUpload = Number(payload?.maxUploadBytes || 0);
    const serverCloudTransfer = Number(payload?.cloudMediaTransferMaxBytes || 0);
    if (Number.isFinite(serverMaxUpload) && serverMaxUpload > 0) {
      state.maxUploadSizeBytes = Math.floor(serverMaxUpload);
    } else {
      state.maxUploadSizeBytes = DEFAULT_MAX_UPLOAD_SIZE_BYTES;
    }
    if (Number.isFinite(serverCloudTransfer) && serverCloudTransfer > 0) {
      state.cloudMediaTransferMaxBytes = Math.floor(serverCloudTransfer);
    } else {
      state.cloudMediaTransferMaxBytes = DEFAULT_CLOUD_MEDIA_TRANSFER_MAX_BYTES;
    }
  } catch {
    state.maxUploadSizeBytes = DEFAULT_MAX_UPLOAD_SIZE_BYTES;
    state.cloudMediaTransferMaxBytes = DEFAULT_CLOUD_MEDIA_TRANSFER_MAX_BYTES;
  } finally {
    syncUploadLimitHints();
  }
}

async function handleLogin() {
  if (authRequestInFlight) {
    return;
  }
  const email = refs.loginForm.elements.email.value.trim();
  const password = refs.loginForm.elements.password.value;
  if (!email || !password) {
    setAuthMessage("Email y clave son obligatorios.", true);
    return;
  }
  authRequestInFlight = true;
  setAuthFormsBusy(true);
  setAuthMessage("Validando acceso...", false);
  try {
    const response = await apiLogin(email, password);
    setAuthenticated(response.user);
    setAuthMessage("", false);
    refs.loginForm.reset();
    await refreshUserSettings();
    await runStartupSyncIfNeeded();
    await refreshTutorials();
    await refreshSavedViews();
    startReminderLoop();
    syncLiveSyncLoopState();
  } catch (error) {
    setAuthMessage(resolveError(error, "No se pudo iniciar sesion."), true);
  } finally {
    authRequestInFlight = false;
    setAuthFormsBusy(false);
  }
}

async function handleRegister() {
  if (authRequestInFlight) {
    return;
  }
  const email = refs.registerForm.elements.email.value.trim();
  const password = refs.registerForm.elements.password.value;
  if (!email || !password) {
    setAuthMessage("Email y clave son obligatorios.", true);
    return;
  }
  authRequestInFlight = true;
  setAuthFormsBusy(true);
  setAuthMessage("Creando cuenta...", false);
  try {
    const response = await apiRegister(email, password);
    setAuthenticated(response.user);
    setAuthMessage("", false);
    refs.registerForm.reset();
    await refreshUserSettings();
    await runStartupSyncIfNeeded();
    await refreshTutorials();
    await refreshSavedViews();
    startReminderLoop();
    syncLiveSyncLoopState();
  } catch (error) {
    setAuthMessage(resolveError(error, "No se pudo crear la cuenta."), true);
  } finally {
    authRequestInFlight = false;
    setAuthFormsBusy(false);
  }
}

async function runStartupSyncIfNeeded() {
  if (!state.currentUser) {
    return;
  }
  const settings = normalizeUserSettings(state.userSettings);
  const hasLocalConfigured = Boolean(String(settings.localRootPath || "").trim());
  const hasCloudConfigured = Boolean(
    settings.cloudEnabled && settings.cloudConnected && String(settings.cloudProvider || "none") !== "none"
  );
  if (!hasLocalConfigured && !hasCloudConfigured) {
    return;
  }
  try {
    const result = await apiRunStorageSync();
    if (result?.settings) {
      state.userSettings = normalizeUserSettings(result.settings);
      syncStorageSettingsUi();
      syncLiveSyncLoopState();
    }
  } catch {
    // En arranque evitamos bloquear el login por fallos transitorios de sincronizacion.
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
  const openEmojiPickerTarget = event.target.closest("[data-open-emoji-picker]");
  if (openEmojiPickerTarget) {
    toggleEmojiPickerPanel();
    return;
  }
  const closeEmojiPickerTarget = event.target.closest("[data-close-emoji-picker]");
  if (closeEmojiPickerTarget) {
    closeEmojiPickerPanel();
    return;
  }
  const emojiPickTarget = event.target.closest("[data-emoji-pick]");
  if (emojiPickTarget) {
    const symbol = normalizeEmoji(emojiPickTarget.dataset.emojiPick || "");
    applyPickedEmojiSymbol(symbol);
    return;
  }
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
  const openPropertiesEditTarget = event.target.closest("[data-open-properties-edit-id]");
  if (openPropertiesEditTarget) {
    if (state.page === "tutorial" && state.tutorialEditMode) {
      state.tutorialEditMode = false;
      render();
    }
    openDialogForEdit(openPropertiesEditTarget.dataset.openPropertiesEditId);
    return;
  }
  const closeEditorTarget = event.target.closest("[data-close-tutorial-editor]");
  if (closeEditorTarget) {
    await flushPendingAutosaves();
    if (refs.dialog?.open) {
      refs.dialog.close();
    }
    state.tutorialEditMode = false;
    render();
    return;
  }
  const miniNotesToggleTarget = event.target.closest("[data-mini-toggle-notes]");
  if (miniNotesToggleTarget) {
    if (!isStructureLayoutInteractionEnabled()) {
      return;
    }
    await toggleNotesSide(
      miniNotesToggleTarget.dataset.miniNotesTutorialId || state.selectedId,
      miniNotesToggleTarget.dataset.miniNotesBlockId || ""
    );
    return;
  }
  const miniSetNotesSideTarget = event.target.closest("[data-mini-set-note-side]");
  if (miniSetNotesSideTarget) {
    if (!isStructureLayoutInteractionEnabled()) {
      return;
    }
    const tutorialId = miniSetNotesSideTarget.dataset.miniNotesTutorialId || state.selectedId;
    const blockId = miniSetNotesSideTarget.dataset.miniNotesBlockId || "";
    const requestedSide = normalizeNoteSide(miniSetNotesSideTarget.dataset.miniNoteSide, "right");
    if (!tutorialId) {
      return;
    }
    const tutorial = state.tutorials.find((item) => item.id === tutorialId);
    if (!tutorial) {
      return;
    }
    const currentSide = blockId
      ? resolveBlockNotesSide(
          normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial)).find((block) => block.id === blockId),
          resolveTutorialNotesSide(tutorial)
        )
      : resolveTutorialNotesSide(tutorial);
    if (currentSide !== requestedSide) {
      await toggleNotesSide(tutorialId, blockId);
    }
    return;
  }
  const miniMoveTarget = event.target.closest("[data-mini-move-block-id]");
  if (miniMoveTarget) {
    if (!isStructureLayoutInteractionEnabled()) {
      return;
    }
    await moveExtraContentBlock(
      miniMoveTarget.dataset.miniMoveTutorialId,
      miniMoveTarget.dataset.miniMoveBlockId,
      Number(miniMoveTarget.dataset.miniMoveDirection || 0)
    );
    return;
  }
  const collapseNotesTarget = event.target.closest("[data-toggle-notes-collapse]");
  if (collapseNotesTarget) {
    toggleNotesCollapse(
      collapseNotesTarget.dataset.toggleNotesTutorialId || state.selectedId,
      collapseNotesTarget.dataset.toggleNotesBlockId || ""
    );
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
  const toggleWindowMediaTarget = event.target.closest("[data-toggle-window-media]");
  if (toggleWindowMediaTarget) {
    toggleWindowMediaShell(toggleWindowMediaTarget.closest("[data-window-media-shell]"));
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
  const mainVideoJumpTarget = event.target.closest("[data-main-video-jump-seconds]");
  if (mainVideoJumpTarget) {
    jumpPrimaryVideoToTimestamp(mainVideoJumpTarget.dataset.mainVideoJumpSeconds);
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
    const tutorialId = addExtraTarget.dataset.addContentId;
    const contentType = addExtraTarget.dataset.addContentType;
    if (contentType === "text") {
      await addEditorTextBlock(tutorialId);
      return;
    }
    openExtraContentComposer(tutorialId, contentType);
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
  markLiveEditActivity();
  const richEditor = event.target?.closest?.("[data-rich-editable='1']");
  if (richEditor instanceof HTMLElement) {
    const serializedValue = serializeRichEditableContent(richEditor.innerHTML);

    const tutorialIdFromPrimaryText = richEditor.dataset.richPrimaryTextId;
    if (tutorialIdFromPrimaryText) {
      const hiddenPrimaryTextEditor = refs.detailPanel.querySelector(`[data-primary-text-editor-id="${tutorialIdFromPrimaryText}"]`);
      if (hiddenPrimaryTextEditor instanceof HTMLTextAreaElement) {
        hiddenPrimaryTextEditor.value = serializedValue;
      }
      schedulePrimaryTextAutosave(tutorialIdFromPrimaryText, serializedValue);
      return;
    }

    const tutorialIdFromNotes = richEditor.dataset.richNotesId;
    if (tutorialIdFromNotes) {
      const hiddenNotesEditor = refs.detailPanel.querySelector(`[data-notes-editor-id="${tutorialIdFromNotes}"]`);
      if (hiddenNotesEditor instanceof HTMLTextAreaElement) {
        hiddenNotesEditor.value = serializedValue;
      }
      scheduleNotesAutosave(tutorialIdFromNotes, serializedValue);
      if (state.selectedId) {
        syncDetailEditorsLayout(state.selectedId);
      }
      return;
    }

    const tutorialIdFromExtraNote = richEditor.dataset.richExtraNoteTutorialId;
    const blockIdFromExtraNote = richEditor.dataset.richExtraNoteId;
    if (tutorialIdFromExtraNote && blockIdFromExtraNote) {
      const hiddenExtraNoteEditor = refs.detailPanel.querySelector(
        `[data-extra-block-field="note"][data-extra-block-note-id="${blockIdFromExtraNote}"][data-extra-block-tutorial-id="${tutorialIdFromExtraNote}"]`
      );
      if (hiddenExtraNoteEditor instanceof HTMLTextAreaElement) {
        hiddenExtraNoteEditor.value = serializedValue;
      }
      scheduleExtraBlockFieldAutosave(tutorialIdFromExtraNote, blockIdFromExtraNote, "note", serializedValue);
      syncExtraModuleNotesHeights();
      return;
    }

    const tutorialIdFromExtraText = richEditor.dataset.richExtraTextTutorialId;
    const blockIdFromExtraText = richEditor.dataset.richExtraTextId;
    if (tutorialIdFromExtraText && blockIdFromExtraText) {
      const hiddenExtraTextEditor = refs.detailPanel.querySelector(
        `[data-extra-block-field="text"][data-extra-block-id="${blockIdFromExtraText}"][data-extra-block-tutorial-id="${tutorialIdFromExtraText}"]`
      );
      if (hiddenExtraTextEditor instanceof HTMLTextAreaElement) {
        hiddenExtraTextEditor.value = serializedValue;
      }
      scheduleExtraBlockFieldAutosave(tutorialIdFromExtraText, blockIdFromExtraText, "text", serializedValue);
      return;
    }
  }

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
    updatePrimaryNotesMarkdownPreview(notesField.dataset.notesEditorId, notesField.value);
    scheduleNotesAutosave(notesField.dataset.notesEditorId, notesField.value);
    if (state.selectedId) {
      syncDetailEditorsLayout(state.selectedId);
    }
    return;
  }

  const extraBlockField = event.target?.closest?.("[data-extra-block-field]");
  if (
    extraBlockField instanceof HTMLInputElement ||
    extraBlockField instanceof HTMLTextAreaElement ||
    extraBlockField instanceof HTMLSelectElement
  ) {
    const tutorialId = extraBlockField.dataset.extraBlockTutorialId;
    const blockId = extraBlockField.dataset.extraBlockId || extraBlockField.dataset.extraBlockNoteId;
    const field = extraBlockField.dataset.extraBlockField;
    if (tutorialId && blockId && field) {
      scheduleExtraBlockFieldAutosave(tutorialId, blockId, field, extraBlockField.value);
    }
    if (extraBlockField instanceof HTMLTextAreaElement) {
      if (field === "text") {
        autoGrowTextarea(extraBlockField, 120);
        updateExtraMarkdownPreview(blockId, extraBlockField.value);
      }
      if (field === "note") {
        updateExtraNoteMarkdownPreview(blockId, extraBlockField.value);
      }
      syncExtraModuleNotesHeights();
    }
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

function onTutorialPageKeydown(event) {
  const target = event?.target;
  if (isLiveEditableElement(target)) {
    markLiveEditActivity();
  }
}

function onTutorialPageFocusOut(event) {
  schedulePendingLiveSyncFlush(180);
  const target = event.target;
  const next = event.relatedTarget;
  const movingToNotesToggle =
    next instanceof Element && Boolean(next.closest("[data-toggle-notes-collapse]"));

  if (target instanceof HTMLElement && target.dataset.richEditable === "1") {
    if (movingToNotesToggle) {
      return;
    }
    const tutorialIdFromPrimaryText = target.dataset.richPrimaryTextId;
    if (tutorialIdFromPrimaryText) {
      const serializedValue = serializeRichEditableContent(target.innerHTML);
      const hiddenPrimaryTextEditor = refs.detailPanel.querySelector(`[data-primary-text-editor-id="${tutorialIdFromPrimaryText}"]`);
      if (hiddenPrimaryTextEditor instanceof HTMLTextAreaElement) {
        hiddenPrimaryTextEditor.value = serializedValue;
      }
      if (primaryTextAutosaveTimer) {
        window.clearTimeout(primaryTextAutosaveTimer);
        primaryTextAutosaveTimer = null;
      }
      void savePrimaryTextAutosave(tutorialIdFromPrimaryText, serializedValue);
    }

    const tutorialIdFromNotes = target.dataset.richNotesId;
    if (tutorialIdFromNotes) {
      const serializedValue = serializeRichEditableContent(target.innerHTML);
      const hiddenNotesEditor = refs.detailPanel.querySelector(`[data-notes-editor-id="${tutorialIdFromNotes}"]`);
      if (hiddenNotesEditor instanceof HTMLTextAreaElement) {
        hiddenNotesEditor.value = serializedValue;
      }
      if (notesAutosaveTimer) {
        window.clearTimeout(notesAutosaveTimer);
        notesAutosaveTimer = null;
      }
      void saveDetailNotesAutosave(tutorialIdFromNotes, serializedValue);
    }

    const tutorialIdFromExtraNote = target.dataset.richExtraNoteTutorialId;
    const blockIdFromExtraNote = target.dataset.richExtraNoteId;
    if (tutorialIdFromExtraNote && blockIdFromExtraNote) {
      const serializedValue = serializeRichEditableContent(target.innerHTML);
      const hiddenExtraNoteEditor = refs.detailPanel.querySelector(
        `[data-extra-block-field="note"][data-extra-block-note-id="${blockIdFromExtraNote}"][data-extra-block-tutorial-id="${tutorialIdFromExtraNote}"]`
      );
      if (hiddenExtraNoteEditor instanceof HTMLTextAreaElement) {
        hiddenExtraNoteEditor.value = serializedValue;
      }
      clearExtraBlockAutosaveTimer(tutorialIdFromExtraNote, blockIdFromExtraNote, "note");
      void saveExtraBlockField(tutorialIdFromExtraNote, blockIdFromExtraNote, "note", serializedValue);
    }

    const tutorialIdFromExtraText = target.dataset.richExtraTextTutorialId;
    const blockIdFromExtraText = target.dataset.richExtraTextId;
    if (tutorialIdFromExtraText && blockIdFromExtraText) {
      const serializedValue = serializeRichEditableContent(target.innerHTML);
      const hiddenExtraTextEditor = refs.detailPanel.querySelector(
        `[data-extra-block-field="text"][data-extra-block-id="${blockIdFromExtraText}"][data-extra-block-tutorial-id="${tutorialIdFromExtraText}"]`
      );
      if (hiddenExtraTextEditor instanceof HTMLTextAreaElement) {
        hiddenExtraTextEditor.value = serializedValue;
      }
      clearExtraBlockAutosaveTimer(tutorialIdFromExtraText, blockIdFromExtraText, "text");
      void saveExtraBlockField(tutorialIdFromExtraText, blockIdFromExtraText, "text", serializedValue);
    }

    if (state.selectedId) {
      syncDetailEditorsLayout(state.selectedId);
    }
    return;
  }

  if (target instanceof HTMLTextAreaElement && target.dataset.notesEditorId) {
    const tutorialId = target.dataset.notesEditorId;
    const wrap = refs.detailPanel.querySelector(`[data-primary-notes-wrap-id="${tutorialId}"]`);
    if (wrap instanceof HTMLElement && next instanceof Node && wrap.contains(next)) {
      return;
    }
    closePrimaryNotesEditor(tutorialId);
    return;
  }

  if (
    target instanceof HTMLTextAreaElement &&
    target.dataset.extraBlockField === "note" &&
    target.dataset.extraBlockNoteId &&
    target.dataset.extraBlockTutorialId
  ) {
    const tutorialId = target.dataset.extraBlockTutorialId;
    const blockId = target.dataset.extraBlockNoteId;
    const wrap = refs.detailPanel.querySelector(`[data-extra-note-wrap-id="${blockId}"]`);
    if (wrap instanceof HTMLElement && next instanceof Node && wrap.contains(next)) {
      return;
    }
    closeExtraNoteEditor(tutorialId, blockId);
    return;
  }

  if (
    target instanceof HTMLTextAreaElement &&
    target.dataset.extraBlockField === "text" &&
    target.dataset.extraBlockId &&
    target.dataset.extraBlockTutorialId
  ) {
    const tutorialId = target.dataset.extraBlockTutorialId;
    const blockId = target.dataset.extraBlockId;
    const wrap = refs.detailPanel.querySelector(`[data-extra-text-wrap-id="${blockId}"]`);
    if (wrap instanceof HTMLElement && next instanceof Node && wrap.contains(next)) {
      return;
    }
    closeExtraTextEditor(tutorialId, blockId);
  }
}

function isMarkdownEditableTarget(target) {
  return target instanceof HTMLTextAreaElement && target.dataset.markdownEnabled === "1";
}

function isRichMarkdownEditableTarget(target) {
  return target instanceof HTMLElement && target.dataset.richEditable === "1";
}

function findRichMarkdownEditableFromNode(target) {
  if (!(target instanceof Node)) {
    return null;
  }
  if (target instanceof HTMLElement && isRichMarkdownEditableTarget(target)) {
    return target;
  }
  const element = target instanceof Element ? target : target.parentElement;
  const match = element?.closest?.("[data-rich-editable='1']");
  return match instanceof HTMLElement ? match : null;
}

function getActiveMarkdownEditableTarget() {
  const active = document.activeElement;
  if (isMarkdownEditableTarget(active) || isRichMarkdownEditableTarget(active)) {
    return active;
  }
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const richTarget = findRichMarkdownEditableFromNode(selection.anchorNode);
    if (richTarget) {
      return richTarget;
    }
  }
  return null;
}

function getActiveSelectionRangeForRichTarget(target) {
  if (!isRichMarkdownEditableTarget(target)) {
    return null;
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (!target.contains(range.commonAncestorContainer)) {
    return null;
  }
  return range;
}

function scheduleMarkdownToolbarUpdate(delayMs = 0) {
  if (!refs.markdownToolbar) {
    return;
  }
  window.setTimeout(() => {
    updateMarkdownToolbarVisibility();
  }, Math.max(0, Number(delayMs) || 0));
}

function updateMarkdownToolbarVisibility() {
  if (!refs.markdownToolbar) {
    return;
  }
  const active = getActiveMarkdownEditableTarget();
  if (!active) {
    hideMarkdownToolbar();
    return;
  }

  let rect = null;
  if (isMarkdownEditableTarget(active)) {
    const start = Number(active.selectionStart || 0);
    const end = Number(active.selectionEnd || 0);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      hideMarkdownToolbar();
      return;
    }
    rect = active.getBoundingClientRect();
  } else if (isRichMarkdownEditableTarget(active)) {
    const range = getActiveSelectionRangeForRichTarget(active);
    if (!range || range.collapsed) {
      hideMarkdownToolbar();
      return;
    }
    rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) {
      rect = active.getBoundingClientRect();
    }
  } else {
    hideMarkdownToolbar();
    return;
  }

  activeMarkdownTarget = active;
  refs.markdownToolbar.classList.remove("hidden");
  const width = refs.markdownToolbar.offsetWidth || 220;
  const top = Math.max(8, rect.top - 46);
  const anchor = rect.left + rect.width / 2;
  const left = Math.max(8, Math.min(window.innerWidth - width - 8, anchor - width / 2));
  refs.markdownToolbar.style.top = `${top}px`;
  refs.markdownToolbar.style.left = `${left}px`;
}

function hideMarkdownToolbar() {
  activeMarkdownTarget = null;
  if (!refs.markdownToolbar) {
    return;
  }
  refs.markdownToolbar.classList.add("hidden");
}

function onMarkdownToolbarClick(event) {
  const button = event.target?.closest?.("[data-md-action]");
  if (!button || !activeMarkdownTarget) {
    return;
  }
  if (!isMarkdownEditableTarget(activeMarkdownTarget) && !isRichMarkdownEditableTarget(activeMarkdownTarget)) {
    return;
  }
  const action = button.dataset.mdAction;
  const color = button.dataset.mdColor || "";
  applyMarkdownAction(activeMarkdownTarget, action, color);
  scheduleMarkdownToolbarUpdate();
}

function onMarkdownEditorKeydown(event) {
  const target = event.target;
  const richTarget = findRichMarkdownEditableFromNode(target);
  const markdownTarget = isMarkdownEditableTarget(target) ? target : richTarget;
  if (!markdownTarget) {
    return;
  }
  if (!(event.ctrlKey || event.metaKey)) {
    return;
  }
  const key = String(event.key || "").toLowerCase();
  let action = "";
  if (key === "b") {
    action = "bold";
  } else if (key === "i") {
    action = "italic";
  } else if (key === "u") {
    action = "underline";
  } else if (key === "k") {
    action = "link";
  }
  if (!action) {
    return;
  }
  event.preventDefault();
  applyMarkdownAction(markdownTarget, action, "");
  scheduleMarkdownToolbarUpdate();
}

function applyMarkdownAction(target, action, color = "") {
  if (isMarkdownEditableTarget(target)) {
    applyMarkdownActionToTextarea(target, action, color);
    return;
  }
  if (isRichMarkdownEditableTarget(target)) {
    applyMarkdownActionToRichTarget(target, action, color);
  }
}

function applyMarkdownActionToTextarea(textarea, action, color = "") {
  if (!(textarea instanceof HTMLTextAreaElement)) {
    return;
  }
  const raw = textarea.value || "";
  const start = Number(textarea.selectionStart || 0);
  const end = Number(textarea.selectionEnd || 0);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return;
  }
  const before = raw.slice(0, start);
  const selection = raw.slice(start, end);
  const after = raw.slice(end);
  let replacement = selection;
  let caretStart = start;
  let caretEnd = end;

  const wrap = (prefix, suffix = prefix, placeholder = "texto") => {
    const content = selection || placeholder;
    replacement = `${prefix}${content}${suffix}`;
    caretStart = start + prefix.length;
    caretEnd = start + prefix.length + content.length;
  };

  const prefixLines = (prefix) => {
    const lines = (selection || "texto").split(/\r?\n/);
    replacement = lines.map((line) => `${prefix}${line}`).join("\n");
    caretStart = start;
    caretEnd = start + replacement.length;
  };

  switch (action) {
    case "bold":
      wrap("**");
      break;
    case "italic":
      wrap("*");
      break;
    case "heading":
      replacement = `## ${selection || "Titulo"}`;
      caretStart = start + 3;
      caretEnd = start + replacement.length;
      break;
    case "quote":
      prefixLines("> ");
      break;
    case "list":
      prefixLines("- ");
      break;
    case "code":
      wrap("`", "`", "codigo");
      break;
    case "underline": {
      const content = selection || "texto";
      replacement = `{{u:currentColor|${content}}}`;
      caretStart = start + "{{u:currentColor|".length;
      caretEnd = caretStart + content.length;
      break;
    }
    case "text-color": {
      const safeColor = sanitizeCssColor(color, "#60a5fa");
      const content = selection || "texto";
      replacement = `{{c:${safeColor}|${content}}}`;
      caretStart = start + `{{c:${safeColor}|`.length;
      caretEnd = caretStart + content.length;
      break;
    }
    case "underline-color": {
      const safeColor = sanitizeCssColor(color, "#f59e0b");
      const content = selection || "texto";
      replacement = `{{u:${safeColor}|${content}}}`;
      caretStart = start + `{{u:${safeColor}|`.length;
      caretEnd = caretStart + content.length;
      break;
    }
    case "highlight-color": {
      const safeColor = sanitizeCssColor(color, "#fde68a");
      const content = selection || "texto";
      replacement = `{{bg:${safeColor}|${content}}}`;
      caretStart = start + `{{bg:${safeColor}|`.length;
      caretEnd = caretStart + content.length;
      break;
    }
    case "link": {
      const content = selection || "texto";
      replacement = `[${content}](https://)`;
      caretStart = start + 1;
      caretEnd = start + 1 + content.length;
      break;
    }
    default:
      return;
  }

  textarea.value = `${before}${replacement}${after}`;
  textarea.focus();
  textarea.setSelectionRange(caretStart, caretEnd);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function ensureRichSelection(target, placeholder = "texto") {
  const selection = window.getSelection();
  if (!selection) {
    return null;
  }
  if (selection.rangeCount === 0) {
    target.focus();
  }
  const range = getActiveSelectionRangeForRichTarget(target);
  if (!range) {
    return null;
  }
  if (!range.collapsed) {
    return range;
  }
  const textNode = document.createTextNode(placeholder);
  range.insertNode(textNode);
  range.setStart(textNode, 0);
  range.setEnd(textNode, textNode.length);
  selection.removeAllRanges();
  selection.addRange(range);
  return range;
}

function wrapRichSelectionWithTag(target, tagName, placeholder = "texto") {
  const range = ensureRichSelection(target, placeholder);
  if (!range) {
    return false;
  }
  const wrapper = document.createElement(tagName);
  try {
    const fragment = range.extractContents();
    if (fragment.childNodes.length === 0) {
      wrapper.textContent = placeholder;
    } else {
      wrapper.appendChild(fragment);
    }
    range.insertNode(wrapper);
    range.selectNodeContents(wrapper);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  } catch {
    return false;
  }
}

function wrapRichSelectionWithElement(target, buildElement, placeholder = "texto") {
  const range = ensureRichSelection(target, placeholder);
  if (!range) {
    return false;
  }
  const wrapper = buildElement();
  if (!(wrapper instanceof HTMLElement)) {
    return false;
  }
  try {
    const fragment = range.extractContents();
    if (fragment.childNodes.length === 0) {
      wrapper.textContent = placeholder;
    } else {
      wrapper.appendChild(fragment);
    }
    range.insertNode(wrapper);
    range.selectNodeContents(wrapper);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  } catch {
    return false;
  }
}

function applyMarkdownActionToRichTarget(target, action, color = "") {
  if (!isRichMarkdownEditableTarget(target)) {
    return;
  }
  target.focus();

  const exec = (command, value = undefined) => {
    if (typeof document.execCommand !== "function") {
      return false;
    }
    try {
      return document.execCommand(command, false, value);
    } catch {
      return false;
    }
  };

  switch (action) {
    case "bold":
      if (!exec("bold")) {
        wrapRichSelectionWithTag(target, "strong");
      }
      break;
    case "italic":
      if (!exec("italic")) {
        wrapRichSelectionWithTag(target, "em");
      }
      break;
    case "heading":
      exec("formatBlock", "<h4>");
      break;
    case "quote":
      exec("formatBlock", "<blockquote>");
      break;
    case "list":
      exec("insertUnorderedList");
      break;
    case "code":
      if (!wrapRichSelectionWithTag(target, "code", "codigo")) {
        exec("insertText", "`codigo`");
      }
      break;
    case "underline":
      if (!exec("underline")) {
        wrapRichSelectionWithTag(target, "u");
      }
      break;
    case "text-color": {
      const safeColor = sanitizeCssColor(color, "#60a5fa");
      const safeColorKey = normalizeColorTokenKey(safeColor);
      const existing = findStyledAncestorForSelection(target, (element) => {
        const token = getInlineTextColorToken(element);
        return token && normalizeColorTokenKey(token) === safeColorKey;
      });
      if (existing) {
        existing.removeAttribute("data-md-color");
        existing.removeAttribute("color");
        existing.style.removeProperty("color");
        if (existing.tagName.toLowerCase() === "span" && !String(existing.getAttribute("style") || "").trim()) {
          unwrapElementKeepChildren(existing);
        }
        target.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      wrapRichSelectionWithElement(
        target,
        () => {
          const span = document.createElement("span");
          span.setAttribute("data-md-color", safeColor);
          span.style.color = safeColor;
          return span;
        },
        "texto"
      );
      break;
    }
    case "underline-color": {
      const safeColor = sanitizeCssColor(color, "#f59e0b");
      const safeColorKey = normalizeColorTokenKey(safeColor);
      const existing = findStyledAncestorForSelection(target, (element) => {
        if (!elementHasUnderlineDecoration(element)) {
          return false;
        }
        const token = getInlineUnderlineColorToken(element);
        return token && normalizeColorTokenKey(token) === safeColorKey;
      });
      if (existing) {
        if (existing.tagName.toLowerCase() === "u") {
          unwrapElementKeepChildren(existing);
        } else {
          existing.removeAttribute("data-md-underline");
          existing.style.removeProperty("text-decoration");
          existing.style.removeProperty("text-decoration-line");
          existing.style.removeProperty("text-decoration-color");
          if (existing.tagName.toLowerCase() === "span" && !String(existing.getAttribute("style") || "").trim()) {
            unwrapElementKeepChildren(existing);
          }
        }
        target.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      if (!wrapRichSelectionWithElement(
        target,
        () => {
          const span = document.createElement("span");
          span.setAttribute("data-md-underline", safeColor);
          span.style.textDecorationLine = "underline";
          span.style.textDecorationColor = safeColor;
          return span;
        },
        "texto"
      )) {
        exec("underline");
      }
      break;
    }
    case "highlight-color": {
      const safeColor = sanitizeCssColor(color, "#fde68a");
      const safeColorKey = normalizeColorTokenKey(safeColor);
      const existing = findStyledAncestorForSelection(target, (element) => {
        const token = getInlineHighlightColorToken(element);
        return token && normalizeColorTokenKey(token) === safeColorKey;
      });
      if (existing) {
        if (existing.tagName.toLowerCase() === "mark") {
          unwrapElementKeepChildren(existing);
        } else {
          existing.removeAttribute("data-md-highlight");
          existing.style.removeProperty("background");
          existing.style.removeProperty("background-color");
          if (existing.tagName.toLowerCase() === "span" && !String(existing.getAttribute("style") || "").trim()) {
            unwrapElementKeepChildren(existing);
          }
        }
        target.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      wrapRichSelectionWithElement(
        target,
        () => {
          const mark = document.createElement("mark");
          mark.setAttribute("data-md-highlight", safeColor);
          mark.style.backgroundColor = safeColor;
          return mark;
        },
        "texto"
      );
      break;
    }
    case "link": {
      ensureRichSelection(target, "enlace");
      const url = window.prompt("URL del enlace:", "https://");
      if (!url) {
        return;
      }
      const safeUrl = String(url).trim();
      if (!safeUrl) {
        return;
      }
      exec("createLink", safeUrl);
      break;
    }
    default:
      return;
  }

  target.dispatchEvent(new Event("input", { bubbles: true }));
}

function updateExtraMarkdownPreview(blockId, rawText) {
  if (!blockId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-extra-markdown-preview-id="${blockId}"]`);
  if (!(preview instanceof HTMLElement)) {
    return;
  }
  setMarkdownPreviewContent(preview, rawText || "", "Sin contenido");
}

function updatePrimaryNotesMarkdownPreview(tutorialId, rawText) {
  if (!tutorialId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-notes-markdown-preview-id="${tutorialId}"]`);
  setMarkdownPreviewContent(preview, rawText || "");
}

function updateExtraNoteMarkdownPreview(blockId, rawText) {
  if (!blockId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-extra-note-markdown-preview-id="${blockId}"]`);
  setMarkdownPreviewContent(preview, rawText || "");
}

function openPrimaryNotesEditor(tutorialId) {
  if (!tutorialId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-notes-markdown-preview-id="${tutorialId}"]`);
  const editor = refs.detailPanel.querySelector(`[data-notes-editor-id="${tutorialId}"]`);
  if (!(editor instanceof HTMLTextAreaElement)) {
    return;
  }
  preview?.classList.remove("hidden");
  editor.classList.remove("hidden");
  const len = editor.value.length;
  editor.focus();
  editor.setSelectionRange(len, len);
  syncDetailEditorsLayout(tutorialId);
}

function closePrimaryNotesEditor(tutorialId) {
  if (!tutorialId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-notes-markdown-preview-id="${tutorialId}"]`);
  const editor = refs.detailPanel.querySelector(`[data-notes-editor-id="${tutorialId}"]`);
  if (!(editor instanceof HTMLTextAreaElement)) {
    return;
  }
  updatePrimaryNotesMarkdownPreview(tutorialId, editor.value);
  editor.classList.add("hidden");
  preview?.classList.remove("hidden");
  syncDetailEditorsLayout(tutorialId);
}

function openExtraNoteEditor(tutorialId, blockId) {
  if (!tutorialId || !blockId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-extra-note-markdown-preview-id="${blockId}"]`);
  const editor = refs.detailPanel.querySelector(
    `[data-extra-block-field="note"][data-extra-block-note-id="${blockId}"][data-extra-block-tutorial-id="${tutorialId}"]`
  );
  if (!(editor instanceof HTMLTextAreaElement)) {
    return;
  }
  preview?.classList.remove("hidden");
  editor.classList.remove("hidden");
  const len = editor.value.length;
  editor.focus();
  editor.setSelectionRange(len, len);
  syncDetailEditorsLayout(tutorialId);
}

function closeExtraNoteEditor(tutorialId, blockId) {
  if (!tutorialId || !blockId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-extra-note-markdown-preview-id="${blockId}"]`);
  const editor = refs.detailPanel.querySelector(
    `[data-extra-block-field="note"][data-extra-block-note-id="${blockId}"][data-extra-block-tutorial-id="${tutorialId}"]`
  );
  if (!(editor instanceof HTMLTextAreaElement)) {
    return;
  }
  updateExtraNoteMarkdownPreview(blockId, editor.value);
  editor.classList.add("hidden");
  preview?.classList.remove("hidden");
  syncDetailEditorsLayout(tutorialId);
}

function openExtraTextEditor(tutorialId, blockId) {
  if (!tutorialId || !blockId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-extra-markdown-preview-id="${blockId}"]`);
  const editor = refs.detailPanel.querySelector(
    `[data-extra-block-field="text"][data-extra-block-id="${blockId}"][data-extra-block-tutorial-id="${tutorialId}"]`
  );
  if (!(editor instanceof HTMLTextAreaElement)) {
    return;
  }
  preview?.classList.remove("hidden");
  editor.classList.remove("hidden");
  autoGrowTextarea(editor, 120);
  const len = editor.value.length;
  editor.focus();
  editor.setSelectionRange(len, len);
  syncDetailEditorsLayout(tutorialId);
}

function closeExtraTextEditor(tutorialId, blockId) {
  if (!tutorialId || !blockId) {
    return;
  }
  const preview = refs.detailPanel.querySelector(`[data-extra-markdown-preview-id="${blockId}"]`);
  const editor = refs.detailPanel.querySelector(
    `[data-extra-block-field="text"][data-extra-block-id="${blockId}"][data-extra-block-tutorial-id="${tutorialId}"]`
  );
  if (!(editor instanceof HTMLTextAreaElement)) {
    return;
  }
  updateExtraMarkdownPreview(blockId, editor.value);
  editor.classList.add("hidden");
  preview?.classList.remove("hidden");
  syncDetailEditorsLayout(tutorialId);
}

function findExtraModuleElement(target) {
  return target?.closest?.("[data-extra-module-id], [data-mini-module-id]") || null;
}

function isStructureLayoutInteractionEnabled() {
  if (state.tutorialEditMode) {
    return true;
  }
  if (Boolean(refs.dialog?.open) && Boolean(state.editingId)) {
    return true;
  }
  return false;
}

function getModuleDragMeta(element) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }
  const blockId = element.dataset.extraModuleId || element.dataset.miniModuleId || "";
  const tutorialId = element.dataset.extraModuleTutorialId || element.dataset.miniModuleTutorialId || "";
  if (!blockId || !tutorialId) {
    return null;
  }
  return { tutorialId, blockId };
}

function onTutorialPageDragStart(event) {
  if (!isStructureLayoutInteractionEnabled()) {
    return;
  }
  const module = findExtraModuleElement(event.target);
  const meta = getModuleDragMeta(module);
  if (!meta) {
    event.preventDefault();
    return;
  }
  const { tutorialId, blockId } = meta;
  activeDraggedExtraBlock = { tutorialId, blockId };
  if (module instanceof HTMLElement) {
    module.classList.add("is-dragging");
  }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", blockId);
  }
}

function onTutorialPageDragOver(event) {
  if (!isStructureLayoutInteractionEnabled()) {
    return;
  }
  if (!activeDraggedExtraBlock) {
    return;
  }
  const target = findExtraModuleElement(event.target);
  const meta = getModuleDragMeta(target);
  if (!meta) {
    return;
  }
  const targetBlockId = meta.blockId;
  if (!targetBlockId || targetBlockId === activeDraggedExtraBlock.blockId) {
    return;
  }
  event.preventDefault();
  clearExtraModuleDropState();
  if (target instanceof HTMLElement) {
    target.classList.add("is-drop-target");
  }
}

async function onTutorialPageDrop(event) {
  if (!isStructureLayoutInteractionEnabled()) {
    return;
  }
  if (!activeDraggedExtraBlock) {
    return;
  }
  const target = findExtraModuleElement(event.target);
  const meta = getModuleDragMeta(target);
  if (!meta) {
    onTutorialPageDragEnd();
    return;
  }
  const targetBlockId = meta.blockId;
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
  document.querySelectorAll(".is-dragging, .is-drop-target").forEach((element) => {
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
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
  const fromIndex = blocks.findIndex((block) => block.id === draggingBlockId);
  const toIndex = blocks.findIndex((block) => block.id === targetBlockId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return;
  }

  const nextBlocks = [...blocks];
  const [moving] = nextBlocks.splice(fromIndex, 1);
  const insertionIndex = toIndex;
  nextBlocks.splice(insertionIndex, 0, moving);
  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: normalizeExtraContentBlocks(nextBlocks, resolveTutorialNotesSide(tutorial)),
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
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
  const fromIndex = blocks.findIndex((block) => block.id === draggingBlockId);
  const toIndex = blocks.findIndex((block) => block.id === targetBlockId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return;
  }

  const nextBlocks = [...blocks];
  const [moving] = nextBlocks.splice(fromIndex, 1);
  const insertionIndex = toIndex;
  nextBlocks.splice(insertionIndex, 0, moving);

  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    extraContent: normalizeExtraContentBlocks(nextBlocks, resolveTutorialNotesSide(tutorial)),
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
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
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
    extraContent: normalizeExtraContentBlocks(nextBlocks, resolveTutorialNotesSide(tutorial)),
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
  const tutorialIndex = state.tutorials.findIndex((item) => item.id === id);
  if (tutorialIndex < 0) {
    return;
  }
  const tutorial = state.tutorials[tutorialIndex];
  const previousFavorite = Boolean(tutorial.isFavorite);
  const previousUpdatedAt = tutorial.updatedAt;
  const optimisticUpdatedAt = new Date().toISOString();

  tutorial.isFavorite = !previousFavorite;
  tutorial.updatedAt = optimisticUpdatedAt;
  state.tutorialsSignature = buildTutorialsSignature(state.tutorials);
  render();

  const payload = {
    ...tutorial,
    isFavorite: tutorial.isFavorite,
    updatedAt: optimisticUpdatedAt,
  };

  try {
    const updated = await apiUpdateTutorial(id, payload);
    const normalized = normalizeTutorial(updated);
    state.tutorials[tutorialIndex] = normalized;
    if (state.selectedId === id) {
      state.selectedId = id;
    }
    state.tutorialsSignature = buildTutorialsSignature(state.tutorials);
    render();
    state.selectedId = id;
  } catch (error) {
    tutorial.isFavorite = previousFavorite;
    tutorial.updatedAt = previousUpdatedAt;
    state.tutorialsSignature = buildTutorialsSignature(state.tutorials);
    render();
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

function normalizeUserSettings(value) {
  const payload = value && typeof value === "object" ? value : {};
  const storageMode = ["device", "cloud", "peer", "hybrid"].includes(payload.storageMode) ? payload.storageMode : "device";
  const cloudProvider = ["none", "google_drive", "one_drive", "dropbox", "supabase"].includes(payload.cloudProvider)
    ? payload.cloudProvider
    : "none";
  const lastSyncSummary =
    payload.lastSyncSummary && typeof payload.lastSyncSummary === "object" && !Array.isArray(payload.lastSyncSummary)
      ? payload.lastSyncSummary
      : {};
  const syncTutorialIds = Array.isArray(payload.syncTutorialIds)
    ? payload.syncTutorialIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  return {
    storageMode,
    localRootPath: String(payload.localRootPath || ""),
    cloudRootPath: String(payload.cloudRootPath || ""),
    cloudProvider,
    cloudEnabled: Boolean(payload.cloudEnabled),
    cloudConnected: Boolean(payload.cloudConnected),
    cloudAccountName: String(payload.cloudAccountName || ""),
    cloudConnectedAt: String(payload.cloudConnectedAt || ""),
    peerEnabled: Boolean(payload.peerEnabled),
    syncTutorialIds,
    setupCompleted: Boolean(payload.setupCompleted),
    lastSyncAt: String(payload.lastSyncAt || ""),
    lastSyncStatus: ["idle", "ok", "warning", "error"].includes(String(payload.lastSyncStatus || ""))
      ? String(payload.lastSyncStatus)
      : "idle",
    lastSyncSummary,
    updatedAt: String(payload.updatedAt || ""),
  };
}

async function refreshUserSettings() {
  if (!state.currentUser) {
    state.userSettings = { ...DEFAULT_USER_SETTINGS };
    syncStorageSettingsUi();
    return;
  }
  try {
    const response = await apiGetSettings();
    state.userSettings = normalizeUserSettings(response);
  } catch (error) {
    state.userSettings = { ...DEFAULT_USER_SETTINGS };
    showOperationError(error, "No se pudo cargar la configuracion de sincronizacion.");
  } finally {
    syncStorageSettingsUi();
    maybeOpenSetupDialog();
    syncLiveSyncLoopState();
  }
}

function buildStorageRoutingHint(settings) {
  const cloudConnected = Boolean(settings?.cloudConnected);
  const cloudEnabled = Boolean(settings?.cloudEnabled);
  const peerEnabled = Boolean(settings?.peerEnabled);

  if (!cloudEnabled) {
    return "Tunel nube apagado: todo queda local.";
  }
  if (!cloudConnected) {
    return "Tunel nube encendido, pendiente de activar en backend.";
  }
  if (peerEnabled) {
    return "Texto/metadatos por nube + archivos grandes por P2P.";
  }
  return "Texto/metadatos por nube + archivos grandes pendientes hasta que haya otro dispositivo.";
}

function buildSyncNowHint(settings) {
  const cloudConnected = Boolean(settings?.cloudConnected);
  const cloudEnabled = Boolean(settings?.cloudEnabled);
  const peerEnabled = Boolean(settings?.peerEnabled);
  const cloudLimitLabel = formatBytesForUi(getEffectiveCloudMediaTransferMaxBytes());
  const pendingPeer = Number(settings?.lastSyncSummary?.cloud?.pendingPeer || 0);

  if (!cloudEnabled) {
    return "Activa el tunel nube para sincronizar texto/metadatos.";
  }
  if (!cloudConnected) {
    return "Guarda configuracion para terminar de conectar el tunel nube.";
  }

  const base = `Nube: texto/metadatos + archivos hasta ${cloudLimitLabel}.`;
  if (pendingPeer > 0) {
    return `${base} Pendientes grandes: ${pendingPeer}.`;
  }
  if (peerEnabled) {
    return `${base} Archivos grandes pasan a P2P automaticamente.`;
  }
  return `${base} Archivos grandes quedaran pendientes hasta activar P2P.`;
}

function syncStorageRoutingHintsFromInputs() {
  const fallback = normalizeUserSettings(state.userSettings);
  const panelDraft = refs.localRootPathInput ? collectStorageSettingsFromPanel() : fallback;
  if (refs.storageRoutingHint) {
    refs.storageRoutingHint.textContent = buildStorageRoutingHint(panelDraft);
  }
  if (refs.syncNowHint) {
    refs.syncNowHint.textContent = buildSyncNowHint(panelDraft);
  }
  if (refs.setupRoutingHint) {
    const setupDraft = refs.setupLocalRootPath ? collectStorageSettingsFromSetupDialog() : fallback;
    refs.setupRoutingHint.textContent = buildStorageRoutingHint(setupDraft);
  }
}

// Canonical UI sync for storage settings (Supabase tunnel + P2P model).
function syncStorageSettingsUi() {
  const raw = normalizeUserSettings(state.userSettings);
  const settings = normalizeUserSettings({
    ...raw,
    storageMode: "hybrid",
    cloudProvider: "supabase",
    cloudAccountName: "",
  });
  state.userSettings = settings;

  if (refs.localRootPathInput) {
    refs.localRootPathInput.value = settings.localRootPath || "";
  }
  if (refs.cloudRootPathInput) {
    refs.cloudRootPathInput.value = settings.cloudRootPath || "";
    refs.cloudRootPathInput.placeholder = "Ej: trazo (prefijo remoto)";
  }
  if (refs.cloudSyncEnabled) {
    refs.cloudSyncEnabled.checked = settings.cloudEnabled;
  }
  if (refs.peerSyncEnabled) {
    refs.peerSyncEnabled.checked = settings.peerEnabled;
  }

  if (refs.storageSetupStatus) {
    refs.storageSetupStatus.textContent = `Modelo local + tunel Supabase. Tutoriales nube: ${settings.syncTutorialIds.length}`;
  }
  syncStorageRoutingHintsFromInputs();

  if (refs.cloudConnectionStatus) {
    const connectedAt = settings.cloudConnectedAt
      ? new Date(settings.cloudConnectedAt).toLocaleString("es-BO", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "";
    const dateLabel = connectedAt ? ` · Desde: ${connectedAt}` : "";
    refs.cloudConnectionStatus.textContent = settings.cloudConnected
      ? `Supabase conectado por backend${dateLabel}.`
      : "Supabase pendiente. Guarda configuracion para activar el tunel.";
  }

  if (refs.lastSyncMeta) {
    refs.lastSyncMeta.textContent = buildLastSyncMeta(settings);
    refs.lastSyncMeta.classList.toggle("is-error", settings.lastSyncStatus === "error");
  }
  if (refs.lastSyncDetails) {
    const detailItems = buildLastSyncDetailItems(settings);
    refs.lastSyncDetails.innerHTML = detailItems.length
      ? detailItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : `<li class="meta">Aun no hay ejecuciones registradas.</li>`;
  }

  if (refs.setupLocalRootPath) {
    refs.setupLocalRootPath.value = settings.localRootPath || "";
  }
  if (refs.setupCloudRootPath) {
    refs.setupCloudRootPath.value = settings.cloudRootPath || "";
    refs.setupCloudRootPath.placeholder = "Ej: trazo (prefijo remoto)";
  }
  if (refs.setupCloudSyncEnabled) {
    refs.setupCloudSyncEnabled.checked = settings.cloudEnabled;
  }
  if (refs.setupPeerSyncEnabled) {
    refs.setupPeerSyncEnabled.checked = settings.peerEnabled;
  }

  if (refs.setupTutorialSyncList) {
    if (!state.tutorials.length) {
      refs.setupTutorialSyncList.innerHTML = `<p class="meta">Aun no hay tutoriales.</p>`;
    } else {
      const selected = new Set(settings.syncTutorialIds);
      refs.setupTutorialSyncList.innerHTML = state.tutorials
        .slice(0, 120)
        .map((tutorial) => {
          const checked = selected.has(tutorial.id) ? "checked" : "";
          const token = renderSidebarTutorialToken(tutorial);
          return `
            <label class="column-option">
              <input type="checkbox" data-sync-tutorial-id="${tutorial.id}" ${checked} />
              <span class="sync-tutorial-line">${token}<span>${escapeHtml(tutorial.title)}</span></span>
            </label>
          `;
        })
        .join("");
    }
  }
}

function buildLastSyncMeta(settings) {
  const statusMap = {
    idle: "sin ejecuciones",
    ok: "correcta",
    warning: "con avisos",
    error: "con error",
  };
  const statusLabel = statusMap[settings.lastSyncStatus] || statusMap.idle;
  if (!settings.lastSyncAt) {
    return `Ultima sincronizacion: ${statusLabel}`;
  }
  const formattedDate = new Date(settings.lastSyncAt).toLocaleString("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  });
  return `Ultima sincronizacion: ${formattedDate} (${statusLabel})`;
}

function buildLastSyncDetailItems(settings) {
  if (!settings.lastSyncAt) {
    return [];
  }
  const summary = settings.lastSyncSummary && typeof settings.lastSyncSummary === "object" ? settings.lastSyncSummary : {};
  const total = Number(summary.totalTutorials || 0);
  const synced = Number(summary.syncedTutorials || 0);
  const local = summary.local && typeof summary.local === "object" ? summary.local : {};
  const cloud = summary.cloud && typeof summary.cloud === "object" ? summary.cloud : {};
  const items = [
    `Tutoriales detectados: ${total}`,
    `Tutoriales sincronizados: ${synced}`,
    `Local -> ${Number(local.synced || 0)} sincronizados / ${Number(local.errors || 0)} errores`,
    `Nube -> ${Number(cloud.synced || 0)} sincronizados / ${Number(cloud.skipped || 0)} omitidos / ${Number(cloud.errors || 0)} errores`,
  ];
  if (Number(cloud.downloaded || 0) > 0 || Number(cloud.deleted || 0) > 0 || Number(cloud.cleaned || 0) > 0) {
    items.push(
      `Nube pull -> ${Number(cloud.downloaded || 0)} descargados / ${Number(cloud.deleted || 0)} eliminados / ${Number(cloud.cleaned || 0)} limpiados`
    );
  }
  if (Number(cloud.pendingPeer || 0) > 0) {
    items.push(`Pendiente entre dispositivos (archivos grandes): ${Number(cloud.pendingPeer || 0)}`);
  }
  if (Array.isArray(summary.errors) && summary.errors.length) {
    summary.errors.slice(0, 3).forEach((errorText) => items.push(`Aviso: ${String(errorText)}`));
  }
  return items;
}

function collectStorageSettingsFromPanel() {
  const selectedIds = Array.from(refs.setupTutorialSyncList?.querySelectorAll("[data-sync-tutorial-id]:checked") || [])
    .map((input) => input.getAttribute("data-sync-tutorial-id") || "")
    .filter(Boolean);
  return normalizeUserSettings({
    storageMode: "hybrid",
    localRootPath: refs.localRootPathInput?.value || "",
    cloudRootPath: refs.cloudRootPathInput?.value || "",
    cloudProvider: "supabase",
    cloudAccountName: "",
    cloudConnected: state.userSettings.cloudConnected,
    cloudConnectedAt: state.userSettings.cloudConnectedAt,
    cloudEnabled: refs.cloudSyncEnabled?.checked || false,
    peerEnabled: refs.peerSyncEnabled?.checked || false,
    syncTutorialIds: selectedIds,
    setupCompleted: true,
    lastSyncAt: state.userSettings.lastSyncAt,
    lastSyncStatus: state.userSettings.lastSyncStatus,
    lastSyncSummary: state.userSettings.lastSyncSummary,
  });
}

function collectStorageSettingsFromSetupDialog() {
  return normalizeUserSettings({
    storageMode: "hybrid",
    localRootPath: refs.setupLocalRootPath?.value || "",
    cloudRootPath: refs.setupCloudRootPath?.value || "",
    cloudProvider: "supabase",
    cloudAccountName: "",
    cloudConnected: state.userSettings.cloudConnected,
    cloudConnectedAt: state.userSettings.cloudConnectedAt,
    cloudEnabled: refs.setupCloudSyncEnabled?.checked || false,
    peerEnabled: refs.setupPeerSyncEnabled?.checked || false,
    syncTutorialIds: state.userSettings.syncTutorialIds || [],
    setupCompleted: true,
    lastSyncAt: state.userSettings.lastSyncAt,
    lastSyncStatus: state.userSettings.lastSyncStatus,
    lastSyncSummary: state.userSettings.lastSyncSummary,
  });
}

async function saveStorageSettingsFromPanel() {
  if (!state.currentUser) {
    return;
  }
  const payload = collectStorageSettingsFromPanel();
  try {
    let updated = normalizeUserSettings(await apiUpdateSettings(payload));
    if (updated.cloudProvider === "supabase" && updated.cloudEnabled && !updated.cloudConnected) {
      updated = normalizeUserSettings(await apiConnectCloudProvider("supabase", ""));
    }
    state.userSettings = updated;
    syncStorageSettingsUi();
    syncLiveSyncLoopState();
    setSyncStatus(`Configuracion guardada · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) {
    showOperationError(error, "No se pudo guardar la configuracion de sincronizacion.");
  }
}

async function createLocalFolderFromPanel() {
  const value = String(refs.localRootPathInput?.value || "").trim();
  if (!value) {
    window.alert("Escribe primero la ruta de carpeta local.");
    return;
  }
  try {
    const created = await apiCreateLocalFolder(value);
    refs.localRootPathInput.value = created.path || value;
    if (refs.storageSetupStatus) {
      refs.storageSetupStatus.textContent = `Carpeta creada: ${created.path || value}`;
    }
  } catch (error) {
    showOperationError(error, "No se pudo crear la carpeta local.");
  }
}

async function pickLocalFolderFromExplorer() {
  if (!state.currentUser) {
    return;
  }
  try {
    const description = "Selecciona la carpeta local principal de TRAZO";
    const picked = await apiPickFolder(description);
    const pickedPath = String(picked?.path || "").trim();
    if (!pickedPath) {
      return;
    }
    if (refs.localRootPathInput) {
      refs.localRootPathInput.value = pickedPath;
    }
    setSyncStatus(`Carpeta local seleccionada: ${pickedPath}`);
  } catch (error) {
    showOperationError(error, "No se pudo abrir el explorador de carpetas.");
  }
}

async function createLocalFolderFromSetupDialog() {
  const value = String(refs.setupLocalRootPath?.value || "").trim();
  if (!value) {
    setSetupStatus("Escribe una carpeta primero.", true);
    return;
  }
  try {
    const created = await apiCreateLocalFolder(value);
    refs.setupLocalRootPath.value = created.path || value;
    setSetupStatus(`Carpeta creada: ${created.path || value}`);
  } catch (error) {
    setSetupStatus(resolveError(error, "No se pudo crear la carpeta local."), true);
  }
}

async function saveSetupDialogSettings() {
  if (!state.currentUser) {
    return;
  }
  const payload = collectStorageSettingsFromSetupDialog();
  refs.saveSetupButton.disabled = true;
  try {
    let updated = normalizeUserSettings(await apiUpdateSettings(payload));
    if (updated.cloudProvider === "supabase" && updated.cloudEnabled && !updated.cloudConnected) {
      updated = normalizeUserSettings(await apiConnectCloudProvider("supabase", ""));
    }
    state.userSettings = updated;
    syncStorageSettingsUi();
    syncLiveSyncLoopState();
    setSyncStatus(`Configuracion inicial guardada · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    refs.setupDialog?.close();
  } catch (error) {
    setSetupStatus(resolveError(error, "No se pudo guardar la configuracion inicial."), true);
  } finally {
    refs.saveSetupButton.disabled = false;
  }
}

async function runStorageSyncNow() {
  if (!state.currentUser) {
    return;
  }
  try {
    const result = await apiRunStorageSync();
    const count = Number(result?.syncedTutorials || 0);
    if (result?.settings) {
      state.userSettings = normalizeUserSettings(result.settings);
      syncStorageSettingsUi();
      syncLiveSyncLoopState();
    } else {
      await refreshUserSettings();
    }
    const status = String(state.userSettings.lastSyncStatus || "idle");
    setSyncStatus(`Sincronizacion completada | ${count} tutorial(es) | estado: ${status}`);
  } catch (error) {
    showOperationError(error, "No se pudo ejecutar la sincronizacion.");
  }
}

function maybeOpenSetupDialog() {
  if (!state.currentUser || !refs.setupDialog?.showModal) {
    return;
  }
  if (state.userSettings.setupCompleted) {
    return;
  }
  if (!refs.setupDialog.open) {
    setSetupStatus("");
    refs.setupDialog.showModal();
  }
}

function setSetupStatus(message, isError = false) {
  if (!refs.setupStatus) {
    return;
  }
  refs.setupStatus.textContent = message;
  refs.setupStatus.classList.toggle("is-error", Boolean(isError));
}

function onSettingsTutorialSyncChange() {
  if (!refs.setupTutorialSyncList) {
    return;
  }
  const selectedIds = Array.from(refs.setupTutorialSyncList.querySelectorAll("[data-sync-tutorial-id]:checked"))
    .map((input) => input.getAttribute("data-sync-tutorial-id") || "")
    .filter(Boolean);
  state.userSettings = {
    ...state.userSettings,
    syncTutorialIds: selectedIds,
  };
  syncStorageSettingsUi();
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

function getInitialSidebarCollapsed() {
  try {
    const stored = localStorage.getItem("tv_sidebar_collapsed");
    if (stored === "1" || stored === "0") {
      return stored === "1";
    }
  } catch {
    // no-op
  }
  return isCompactSidebarViewport();
}

function isCompactSidebarViewport() {
  return typeof window !== "undefined" && window.matchMedia(`(max-width: ${MOBILE_SIDEBAR_BREAKPOINT}px)`).matches;
}

function syncSidebarBackdrop() {
  const shouldShowBackdrop = isCompactSidebarViewport() && !state.sidebarCollapsed;
  refs.sidebarBackdrop?.classList.toggle("hidden", !shouldShowBackdrop);
  document.body.classList.toggle("body-lock-scroll", shouldShowBackdrop);
}

function syncResponsiveShell() {
  const compact = isCompactSidebarViewport();
  refs.appShell?.classList.toggle("is-compact-shell", compact);

  if (compact !== wasCompactSidebarViewport) {
    if (compact) {
      if (!state.sidebarCollapsed) {
        sidebarAutoCollapsed = true;
        applySidebarCollapsed(true, { persist: false });
      }
    } else if (sidebarAutoCollapsed) {
      sidebarAutoCollapsed = false;
      applySidebarCollapsed(false, { persist: false });
    }
    wasCompactSidebarViewport = compact;
  }

  if (!compact) {
    refs.sidebarBackdrop?.classList.add("hidden");
    document.body.classList.remove("body-lock-scroll");
  } else {
    syncSidebarBackdrop();
  }
}

function closeSidebarForCompactNavigation() {
  if (isCompactSidebarViewport() && !state.sidebarCollapsed) {
    applySidebarCollapsed(true, { persist: false });
  }
}

function applySidebarCollapsed(collapsed, options = {}) {
  const { persist = true } = options;
  state.sidebarCollapsed = Boolean(collapsed);
  refs.appShell?.classList.toggle("is-sidebar-collapsed", state.sidebarCollapsed);
  refs.sidebarExpandButton?.classList.toggle("hidden", !state.sidebarCollapsed);
  refs.toggleSidebarButton?.setAttribute("aria-expanded", state.sidebarCollapsed ? "false" : "true");
  if (refs.toggleSidebarButton) {
    refs.toggleSidebarButton.title = state.sidebarCollapsed ? "Mostrar menu lateral" : "Plegar menu lateral";
  }
  syncSidebarBackdrop();
  if (persist) {
    try {
      localStorage.setItem("tv_sidebar_collapsed", state.sidebarCollapsed ? "1" : "0");
    } catch {}
  }
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

function getInitialNotesCollapseState() {
  try {
    const raw = localStorage.getItem("tv_notes_collapse");
    if (!raw) {
      return { primary: {}, extra: {} };
    }
    const parsed = JSON.parse(raw);
    const primary = parsed && typeof parsed.primary === "object" && parsed.primary ? parsed.primary : {};
    const extra = parsed && typeof parsed.extra === "object" && parsed.extra ? parsed.extra : {};
    return { primary, extra };
  } catch {
    return { primary: {}, extra: {} };
  }
}

function persistNotesCollapseState() {
  try {
    localStorage.setItem("tv_notes_collapse", JSON.stringify(state.notesCollapse || { primary: {}, extra: {} }));
  } catch {}
}

function getExtraNotesCollapseKey(tutorialId, blockId) {
  return `${String(tutorialId || "").trim()}:${String(blockId || "").trim()}`;
}

function isPrimaryNotesCollapsed(tutorialId) {
  if (!tutorialId) {
    return false;
  }
  return Boolean(state.notesCollapse?.primary?.[tutorialId]);
}

function isExtraNotesCollapsed(tutorialId, blockId) {
  if (!tutorialId || !blockId) {
    return false;
  }
  return Boolean(state.notesCollapse?.extra?.[getExtraNotesCollapseKey(tutorialId, blockId)]);
}

function toggleNotesCollapse(tutorialId, blockId = "") {
  if (!shouldLockNotesHeight()) {
    return;
  }
  if (!tutorialId) {
    return;
  }
  const inSelectedTutorial = state.page === "tutorial" && state.selectedId === tutorialId;
  const anchorBefore =
    inSelectedTutorial && blockId
      ? refs.detailPanel.querySelector(`[data-extra-view-module-id="${blockId}"], [data-extra-text-module-id="${blockId}"]`)
      : null;
  const anchorTopBefore = anchorBefore instanceof HTMLElement ? anchorBefore.getBoundingClientRect().top : null;

  if (!state.notesCollapse || typeof state.notesCollapse !== "object") {
    state.notesCollapse = { primary: {}, extra: {} };
  }
  state.notesCollapse.primary = state.notesCollapse.primary || {};
  state.notesCollapse.extra = state.notesCollapse.extra || {};
  if (!blockId) {
    const current = isPrimaryNotesCollapsed(tutorialId);
    if (current) {
      delete state.notesCollapse.primary[tutorialId];
    } else {
      state.notesCollapse.primary[tutorialId] = true;
    }
  } else {
    const key = getExtraNotesCollapseKey(tutorialId, blockId);
    const current = isExtraNotesCollapsed(tutorialId, blockId);
    if (current) {
      delete state.notesCollapse.extra[key];
    } else {
      state.notesCollapse.extra[key] = true;
    }
  }
  persistNotesCollapseState();
  const nextCollapsed = blockId
    ? isExtraNotesCollapsed(tutorialId, blockId)
    : isPrimaryNotesCollapsed(tutorialId);

  if (inSelectedTutorial && blockId) {
    const module = refs.detailPanel.querySelector(
      `[data-extra-view-module-id="${blockId}"], [data-extra-text-module-id="${blockId}"]`
    );
    if (module instanceof HTMLElement) {
      module.classList.toggle("is-note-collapsed", nextCollapsed);
      const noteSection = module.querySelector(".media-module-note");
      if (noteSection instanceof HTMLElement) {
        noteSection.classList.toggle("is-collapsed", nextCollapsed);
      }
      module.querySelectorAll(`[data-toggle-notes-block-id="${blockId}"]`).forEach((buttonNode) => {
        if (!(buttonNode instanceof HTMLButtonElement)) {
          return;
        }
        buttonNode.textContent = nextCollapsed ? "Mostrar" : "Ocultar";
        buttonNode.setAttribute("aria-expanded", nextCollapsed ? "false" : "true");
      });
      syncDetailEditorsLayout(tutorialId);
      return;
    }
  }

  if (inSelectedTutorial) {
    renderDetailPanel();
  } else {
    render();
  }

  if (inSelectedTutorial && blockId && Number.isFinite(anchorTopBefore)) {
    window.requestAnimationFrame(() => {
      const anchorAfter = refs.detailPanel.querySelector(
        `[data-extra-view-module-id="${blockId}"], [data-extra-text-module-id="${blockId}"]`
      );
      if (!(anchorAfter instanceof HTMLElement)) {
        return;
      }
      const delta = anchorAfter.getBoundingClientRect().top - Number(anchorTopBefore);
      if (Math.abs(delta) > 1) {
        window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      }
    });
  }
}

function normalizeNoteSide(value, fallback = "right") {
  if (value === "left" || value === "right") {
    return value;
  }
  return fallback === "left" ? "left" : "right";
}

function resolveTutorialNotesSide(tutorial) {
  return normalizeNoteSide(tutorial?.notesSide, state.notesSide);
}

function resolveBlockNotesSide(block, fallback = "right") {
  return normalizeNoteSide(block?.noteSide, fallback);
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

async function toggleNotesSide(tutorialId, blockId = "") {
  const targetTutorialId = tutorialId || state.selectedId;
  if (!targetTutorialId) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === targetTutorialId);
  if (!tutorial) {
    return;
  }
  const updatedAt = new Date().toISOString();

  if (!blockId) {
    const nextPrimarySide = resolveTutorialNotesSide(tutorial) === "left" ? "right" : "left";
    const payload = {
      ...tutorial,
      notesSide: nextPrimarySide,
      updatedAt,
    };
    try {
      await apiUpdateTutorial(targetTutorialId, payload);
      tutorial.notesSide = nextPrimarySide;
      tutorial.updatedAt = updatedAt;
      state.notesSide = nextPrimarySide;
      try {
        localStorage.setItem("tv_notes_side", state.notesSide);
      } catch {}
      render();
    } catch (error) {
      showOperationError(error, "No se pudo cambiar el lado de las notas.");
    }
    return;
  }

  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
  const index = blocks.findIndex((item) => item.id === blockId);
  if (index < 0) {
    return;
  }
  const current = blocks[index];
  const nextBlocks = [...blocks];
  nextBlocks[index] = {
    ...current,
    noteSide: resolveBlockNotesSide(current, resolveTutorialNotesSide(tutorial)) === "left" ? "right" : "left",
  };
  const payload = {
    ...tutorial,
    extraContent: normalizeExtraContentBlocks(nextBlocks, resolveTutorialNotesSide(tutorial)),
    updatedAt,
  };
  try {
    await apiUpdateTutorial(targetTutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    render();
  } catch (error) {
    showOperationError(error, "No se pudo cambiar el lado de notas del bloque.");
  }
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
    if (isEmojiPickerOpen()) {
      closeEmojiPickerPanel();
      return;
    }
    if (document.querySelector("[data-window-media-shell].is-window-fullscreen")) {
      closeWindowMediaShells();
      return;
    }
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
    if (isCompactSidebarViewport() && !state.sidebarCollapsed) {
      applySidebarCollapsed(true, { persist: false });
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
            ${renderSidebarTutorialToken(tutorial)}
            <span class="sidebar-tutorial-title" title="${escapeAttribute(tutorial.title)}">${escapeHtml(
              truncateSidebarTitle(tutorial.title)
            )}</span>
            ${renderTutorialSyncHint(tutorial, "sidebar")}
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
    <ul class="reminder-list">
      ${reminders
        .slice(0, 6)
        .map(
          (item) => `
            <li class="reminder-item">
              <button type="button" class="link-cell" data-open-id="${item.id}">${escapeHtml(item.title)}</button>
              <p class="meta">Repaso: ${escapeHtml(item.reviewDate)} · ${escapeHtml(item.category || "Sin categoria")}</p>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
  refs.reminderPanel.querySelectorAll(".reminder-item .meta").forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    node.textContent = String(node.textContent || "")
      .replace(/^Repaso:\s*/i, "")
      .replace(/\u00C2·/g, "·")
      .trim();
  });
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

function canUseLiveSync(settings = state.userSettings) {
  return Boolean(state.currentUser);
}

function supportsLiveEventStream() {
  return typeof EventSource !== "undefined";
}

function isLiveEditableElement(node) {
  if (!(node instanceof HTMLElement)) {
    return false;
  }
  const editingLikeElement =
    node.isContentEditable ||
    node instanceof HTMLInputElement ||
    node instanceof HTMLTextAreaElement ||
    node instanceof HTMLSelectElement;
  if (!editingLikeElement) {
    return false;
  }
  return Boolean(node.closest("#tutorialPage")) || Boolean(node.closest("#tutorialDialog"));
}

function markLiveEditActivity() {
  liveEditLastAt = Date.now();
}

function schedulePendingLiveSyncFlush(delayMs = LIVE_EDIT_GRACE_MS) {
  if (liveSyncPendingFlushTimer) {
    window.clearTimeout(liveSyncPendingFlushTimer);
  }
  liveSyncPendingFlushTimer = window.setTimeout(() => {
    liveSyncPendingFlushTimer = null;
    if (!liveSyncPendingApply || !state.currentUser) {
      return;
    }
    if (isTutorialEditingInProgress()) {
      schedulePendingLiveSyncFlush(LIVE_EDIT_GRACE_MS);
      return;
    }
    void runLiveSyncTick({ force: true });
  }, Math.max(120, Number(delayMs) || LIVE_EDIT_GRACE_MS));
}

function isTutorialEditingInProgress() {
  if (refs.dialog?.open || refs.extraMediaDialog?.open) {
    return true;
  }
  const active = document.activeElement;
  if (isLiveEditableElement(active)) {
    return true;
  }
  if (Date.now() - liveEditLastAt < LIVE_EDIT_GRACE_MS) {
    return true;
  }
  return Boolean(state.page === "tutorial" && state.tutorialEditMode);
}

function startLiveSyncLoop() {
  stopLiveSyncLoop();
  if (!state.currentUser) {
    return;
  }
  liveSyncIntervalId = window.setInterval(() => {
    void runLiveSyncTick();
  }, LIVE_SYNC_POLL_MS);
  void runLiveSyncTick({ force: true });
}

function stopLiveSyncLoop() {
  if (liveSyncIntervalId) {
    window.clearInterval(liveSyncIntervalId);
    liveSyncIntervalId = null;
  }
  liveSyncInFlight = false;
  liveSyncPendingApply = false;
  if (liveSyncPendingFlushTimer) {
    window.clearTimeout(liveSyncPendingFlushTimer);
    liveSyncPendingFlushTimer = null;
  }
}

function startLiveEventStream() {
  if (!state.currentUser || !canUseLiveSync() || document.visibilityState === "hidden" || !supportsLiveEventStream()) {
    return;
  }
  if (liveEventSource) {
    return;
  }
  const streamUrl = `${API_BASE}/live/stream`;
  try {
    const eventSource = new EventSource(streamUrl, { withCredentials: true });
    liveEventSource = eventSource;
    liveEventStreamConnected = false;
    eventSource.addEventListener("open", () => {
      liveEventStreamConnected = true;
    });
    eventSource.addEventListener("tutorials_changed", () => {
      queueLiveEventRefresh({ tutorials: true });
    });
    eventSource.addEventListener("settings_changed", () => {
      queueLiveEventRefresh({ settings: true });
    });
    eventSource.addEventListener("connected", () => {
      queueLiveEventRefresh({ tutorials: true, settings: true });
    });
    eventSource.onerror = () => {
      stopLiveEventStream();
      scheduleLiveEventReconnect();
      syncLiveSyncLoopState();
    };
  } catch {
    scheduleLiveEventReconnect();
  }
}

function stopLiveEventStream() {
  if (liveEventReconnectTimer) {
    window.clearTimeout(liveEventReconnectTimer);
    liveEventReconnectTimer = null;
  }
  if (liveEventQueueTimer) {
    window.clearTimeout(liveEventQueueTimer);
    liveEventQueueTimer = null;
  }
  if (liveSyncPendingFlushTimer) {
    window.clearTimeout(liveSyncPendingFlushTimer);
    liveSyncPendingFlushTimer = null;
  }
  liveEventQueuedTutorials = false;
  liveEventQueuedSettings = false;
  liveEventStreamConnected = false;
  if (liveEventSource) {
    try {
      liveEventSource.close();
    } catch {}
    liveEventSource = null;
  }
}

function scheduleLiveEventReconnect() {
  if (liveEventReconnectTimer || !state.currentUser || document.visibilityState === "hidden" || !canUseLiveSync()) {
    return;
  }
  liveEventReconnectTimer = window.setTimeout(() => {
    liveEventReconnectTimer = null;
    startLiveEventStream();
  }, LIVE_SYNC_SSE_RECONNECT_MS);
}

function queueLiveEventRefresh(flags = {}) {
  if (flags.tutorials) {
    liveEventQueuedTutorials = true;
  }
  if (flags.settings) {
    liveEventQueuedSettings = true;
  }
  if (liveEventQueueTimer) {
    return;
  }
  liveEventQueueTimer = window.setTimeout(async () => {
    liveEventQueueTimer = null;
    const needTutorials = liveEventQueuedTutorials;
    const needSettings = liveEventQueuedSettings;
    liveEventQueuedTutorials = false;
    liveEventQueuedSettings = false;
    if (needSettings) {
      await refreshUserSettings();
    }
    if (needTutorials) {
      await runLiveSyncTick({ force: true });
    }
  }, 120);
}

function syncLiveSyncLoopState() {
  if (!state.currentUser || document.visibilityState === "hidden" || !canUseLiveSync()) {
    stopLiveEventStream();
    stopLiveSyncLoop();
    return;
  }
  if (supportsLiveEventStream()) {
    if (!liveEventReconnectTimer) {
      startLiveEventStream();
    }
  }
  if (!liveSyncIntervalId) {
    startLiveSyncLoop();
  }
}

async function runLiveSyncTick(options = {}) {
  const force = Boolean(options && options.force);
  if (!state.currentUser) {
    return;
  }
  if (!force && (document.visibilityState === "hidden" || !canUseLiveSync())) {
    return;
  }
  if (liveSyncInFlight) {
    return;
  }
  liveSyncInFlight = true;
  try {
    const apiTutorials = await apiListTutorials();
    const incomingSignature = buildTutorialsSignature(apiTutorials);
    if (incomingSignature === state.tutorialsSignature && !liveSyncPendingApply) {
      return;
    }
    if (isTutorialEditingInProgress()) {
      liveSyncPendingApply = true;
      schedulePendingLiveSyncFlush();
      return;
    }
    const prevScrollY = window.scrollY;
    const changed = await applyTutorialListFromServer(apiTutorials);
    liveSyncPendingApply = false;
    if (changed) {
      syncStorageSettingsUi();
      render();
      if (state.page === "tutorial") {
        window.scrollTo({ top: prevScrollY, behavior: "auto" });
      }
      setSyncStatus(`Actualizado en vivo · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    }
  } catch {
    // En modo en vivo no interrumpimos al usuario con errores transitorios.
  } finally {
    liveSyncInFlight = false;
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
  closeWindowMediaShells();
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
  state.tutorialEditMode = false;
  closeSearchDialog();
  goToPage("tutorial");
  openDialogForEdit(id);
}

function render() {
  if (!state.currentUser) {
    return;
  }
  syncAdvancedFiltersVisibility();
  renderSavedViews();
  renderSmartCollections();
  renderSidebarTutorials();
  syncStorageSettingsUi();
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
      renderDetailPanel();
    }
    if (refs.dialog?.open && state.editingId) {
      renderDialogMiniEditor(state.editingId);
    }
    return;
  }

  renderStats();
  renderBulkPanel();
  const filtered = getFilteredTutorials();
  renderView(filtered);
  renderReminderPanel();
  renderDuplicatePanel();
  if (refs.dialog?.open && state.editingId) {
    renderDialogMiniEditor(state.editingId);
  }
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
                  <td>
                    <button type="button" class="link-cell" data-open-id="${t.id}">
                      <span class="title-with-sync">
                        <span class="title-with-sync-text">${renderTutorialDisplayTitle(t)}</span>
                        ${renderTutorialSyncHint(t)}
                      </span>
                    </button>
                  </td>
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

function getTutorialSyncHint(tutorial) {
  if (!tutorial || typeof tutorial !== "object") {
    return null;
  }
  const tutorialId = String(tutorial.id || "").trim();
  if (!tutorialId) {
    return null;
  }
  const summary = state.userSettings?.lastSyncSummary;
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return null;
  }
  const tutorialCloud = summary.tutorialCloud;
  if (!tutorialCloud || typeof tutorialCloud !== "object" || Array.isArray(tutorialCloud)) {
    return null;
  }
  const raw = tutorialCloud[tutorialId];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const stateValue = String(raw.state || "").trim().toLowerCase();
  const pendingPeer = Math.max(0, Number(raw.pendingPeer || 0));
  if (stateValue === "pending_peer") {
    return {
      tone: "pending",
      iconHtml: "&harr;",
      label:
        pendingPeer > 1
          ? `Pendiente entre dispositivos (${pendingPeer} archivos grandes)`
          : "Pendiente entre dispositivos (archivo grande)",
    };
  }
  if (stateValue === "error") {
    return {
      tone: "error",
      iconHtml: "!",
      label: "Sincronizacion con error en este tutorial",
    };
  }
  return null;
}

function renderTutorialSyncHint(tutorial, variant = "inline") {
  const hint = getTutorialSyncHint(tutorial);
  if (!hint) {
    return "";
  }
  const classes = ["tutorial-sync-hint", `is-${hint.tone}`];
  if (variant === "sidebar") {
    classes.push("is-sidebar");
  } else if (variant === "detail") {
    classes.push("is-detail");
  }
  const label = escapeAttribute(hint.label || "Estado de sincronizacion");
  const iconHtml = typeof hint.iconHtml === "string" && hint.iconHtml ? hint.iconHtml : "&bull;";
  return `<span class="${classes.join(" ")}" title="${label}" aria-label="${label}">${iconHtml}</span>`;
}

function shouldUseCompactLibraryTableLayout() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(max-width: 900px)").matches;
}

function renderCompactLibraryTable(items) {
  if (!items.length) {
    renderEmptyInto(refs.tableView);
    return;
  }

  const showType = Boolean(state.visibleColumns.type);
  const showCategory = Boolean(state.visibleColumns.category);
  const showCollection = Boolean(state.visibleColumns.collection);
  const showReviewDate = Boolean(state.visibleColumns.reviewDate);
  const showUpdatedAt = Boolean(state.visibleColumns.updatedAt);

  const sortButtons = [
    { label: "Titulo", key: "title" },
    ...(showType ? [{ label: "Tipo", key: "type" }] : []),
    ...(showCategory ? [{ label: "Categoria", key: "category" }] : []),
    ...(showCollection ? [{ label: "Coleccion", key: "collection" }] : []),
    { label: "Prioridad", key: "priority" },
    ...(showReviewDate ? [{ label: "Repaso", key: "reviewDate" }] : []),
    ...(showUpdatedAt ? [{ label: "Actualizado", key: "updatedAt" }] : []),
  ];

  refs.tableView.innerHTML = `
    <div class="library-mobile-list-wrap">
      <div class="library-mobile-sort" role="toolbar" aria-label="Ordenar lista">
        ${sortButtons
          .map((button) => {
            const isActive = state.sortBy === button.key;
            const arrow = isActive ? (state.sortDirection === "asc" ? "↑" : "↓") : "";
            return `
              <button
                type="button"
                class="table-sort-btn library-mobile-sort-btn ${isActive ? "is-active" : ""}"
                data-sort-by="${button.key}"
                aria-label="Ordenar por ${button.label}"
              >
                <span>${button.label}</span>
                ${arrow ? `<span class="table-sort-arrow">${arrow}</span>` : ""}
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="library-mobile-list">
        ${items
          .map((t) => {
            return `
              <article class="library-mobile-card ${isTutorialSelected(t.id) ? "is-selected" : ""}">
                <div class="library-mobile-card-top">
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
                  <span class="library-mobile-card-spacer"></span>
                  <details class="row-menu row-menu-card library-mobile-menu">
                    <summary class="menu-trigger" aria-label="Opciones">...</summary>
                    <div class="row-menu-panel">
                      <div class="menu-actions">
                        <button type="button" data-open-id="${t.id}">Abrir</button>
                        <button type="button" data-edit-id="${t.id}">Editar</button>
                        <button type="button" class="danger" data-delete-id="${t.id}">Eliminar</button>
                      </div>
                    </div>
                  </details>
                </div>
                <button type="button" class="link-cell library-mobile-title" data-open-id="${t.id}">
                  <span class="title-with-sync">
                    <span class="title-with-sync-text">${renderTutorialDisplayTitle(t)}</span>
                    ${renderTutorialSyncHint(t)}
                  </span>
                </button>
                <div class="library-mobile-meta-row">
                  ${showType ? `<span>${formatType(t.type)}</span>` : ""}
                  ${showCategory ? `<span>${escapeHtml(t.category || "Sin categoria")}</span>` : ""}
                  ${showCollection ? `<span>${escapeHtml(t.collection || "Sin coleccion")}</span>` : ""}
                </div>
                <div class="library-mobile-meta-row library-mobile-meta-row--secondary">
                  <span>Prioridad: ${escapeHtml(t.priority || "-")}</span>
                  ${showReviewDate ? `<span>Repaso: ${escapeHtml(t.reviewDate || "-")}</span>` : ""}
                  ${showUpdatedAt ? `<span>Actualizado: ${escapeHtml(formatListDate(t.updatedAt || t.createdAt))}</span>` : ""}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderTable(items) {
  if (shouldUseCompactLibraryTableLayout()) {
    renderCompactLibraryTable(items);
    return;
  }

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
                  <td>
                    <button type="button" class="link-cell" data-open-id="${t.id}">
                      <span class="title-with-sync">
                        <span class="title-with-sync-text">${renderTutorialDisplayTitle(t)}</span>
                        ${renderTutorialSyncHint(t)}
                      </span>
                    </button>
                  </td>
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
                  <h3 class="card-title">
                    <span class="title-with-sync">
                      <span class="title-with-sync-text">${renderTutorialDisplayTitle(t)}</span>
                      ${renderTutorialSyncHint(t)}
                    </span>
                  </h3>
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
  const tutorialYoutubeId = tutorial.type === "video" ? extractYouTubeId(tutorial.url) : "";
  const canJumpMainVideo = tutorial.type === "video" && !tutorialYoutubeId && isLikelyVideoUrl(tutorial.url);
  const tsHtml = tutorial.timestamps.length
    ? `<ul class="timestamp-list">${tutorial.timestamps
        .map((line) => {
          const seconds = parseTimestampToSeconds(line);
          if (!canJumpMainVideo || !Number.isFinite(seconds)) {
            return `<li>${escapeHtml(line)}</li>`;
          }
          return `
            <li>
              <button type="button" class="ghost-btn timestamp-jump-btn" data-main-video-jump-seconds="${seconds}">
                ${escapeHtml(line)}
              </button>
            </li>
          `;
        })
        .join("")}</ul>`
    : `<p class="empty-side">Sin timestamps</p>`;
  const createdAt = new Date(tutorial.createdAt || Date.now()).toLocaleString("es-BO");
  const updatedAt = new Date(tutorial.updatedAt || tutorial.createdAt || Date.now()).toLocaleString("es-BO");
  const reviewValue = tutorial.reviewDate || "Sin fecha";
  const showStudyMeta = tutorial.type !== "image";
  const notesHtml = tutorial.notes ? nl2br(escapeHtml(tutorial.notes)) : `<span class="empty-side">Sin notas</span>`;
  const primaryNotesSide = resolveTutorialNotesSide(tutorial);
  const extraBlocksHtml = renderExtraMediaReadOnlySection(tutorial);

  refs.detailPanel.innerHTML = `
    <article class="detail-layout">
      <header class="detail-header">
        <div class="detail-heading">
          <p class="detail-kicker">Pagina de tutorial</p>
          <h2 class="detail-title">
            <span class="title-with-sync">
              <span class="title-with-sync-text">${renderTutorialDisplayTitle(tutorial)}</span>
              ${renderTutorialSyncHint(tutorial, "detail")}
            </span>
          </h2>
          <div class="detail-badges">
            <span class="pill ${statusPillClass(tutorial.status)}">${escapeHtml(tutorial.status)}</span>
            <span class="tag">${formatType(tutorial.type)}</span>
            <span class="tag">${escapeHtml(tutorial.category || "Sin categoria")}</span>
            <span class="tag">${escapeHtml(tutorial.priority)}</span>
          </div>
        </div>
        <div class="detail-actions">
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

      <section class="detail-content-grid ${primaryNotesSide === "left" ? "is-notes-left" : ""}">
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
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
  const tutorialNotesSide = resolveTutorialNotesSide(tutorial);
  if (!blocks.length) {
    return "";
  }

  const blocksHtml = blocks
    .map((block, index) => renderReadOnlyExtraBlock(tutorial.title, block, index + 1, blocks.length, tutorialNotesSide))
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

function renderReadOnlyExtraBlock(tutorialTitle, block, order, total, notesSideFallback) {
  const blockNotesSide = resolveBlockNotesSide(block, notesSideFallback);
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
      : `<video controls playsinline webkit-playsinline="true" preload="metadata" src="${escapeAttribute(block.url)}"></video>`;
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
    <article class="detail-extra-item media-module ${blockNotesSide === "left" ? "is-notes-left" : ""}">
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

  refs.detailPanel.innerHTML = `
    <article class="detail-layout tutorial-editor-layout">
      <header class="detail-header">
        <div class="detail-heading">
          <p class="detail-kicker">Edicion de pagina</p>
          <h2 class="detail-title">${escapeHtml(tutorial.title)}</h2>
          <p class="meta">Organiza la pagina en miniatura y abre el editor flotante para ajustar propiedades.</p>
        </div>
        <div class="detail-actions">
          <button type="button" data-open-properties-edit-id="${tutorial.id}">Opciones</button>
          <button type="button" data-close-tutorial-editor="1">Ver pagina</button>
        </div>
      </header>

      <section class="tutorial-editor-strip">
        <div class="tutorial-editor-strip-copy">
          <p class="tutorial-property-label">Resto de opciones de edicion</p>
          <p class="meta">Se gestiona en la ventana flotante del editor.</p>
        </div>
        <button type="button" class="ghost-btn" data-open-properties-edit-id="${tutorial.id}">Abrir editor flotante</button>
      </section>
    </article>
  `;
}

function renderEditorPrimaryModule(tutorial) {
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
          ${tutorial.type === "video" ? `<label class="editor-inline-field"><span class="tutorial-property-label">URL video</span><input type="url" data-editor-primary-field="url" value="${escapeAttribute(tutorial.url || "")}" /></label>` : ""}
          ${isImage ? `<label class="editor-inline-field"><span class="tutorial-property-label">URL imagen</span><input type="url" data-editor-primary-field="imageUrl" value="${escapeAttribute(tutorial.imageUrl || tutorial.url || "")}" /></label>` : ""}
          ${isText ? `<label class="editor-inline-field"><span class="tutorial-property-label">Texto</span><textarea data-editor-primary-field="textContent" placeholder="Contenido principal">${escapeHtml(richStoredValueToPlainText(tutorial.textContent || ""))}</textarea></label>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderEditorExtraModule(tutorialId, block, order, total) {
  const typeLabel = block.type === "image" ? "Imagen" : block.type === "video" ? "Video" : "Texto";
  const orderMeta = total > 1 ? `<span class="meta">${order}/${total}</span>` : "";
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
                  >${escapeHtml(richStoredValueToPlainText(block.text || ""))}</textarea>
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
        </div>
      </div>
    </article>
  `;
}

function renderEditorMiniMap(tutorial, blocks) {
  const primaryNotesSide = resolveTutorialNotesSide(tutorial);
  const totalExtraBlocks = blocks.length;
  const cards = [
    renderEditorMiniMapCard({
      tutorialId: tutorial.id,
      blockId: "",
      order: 1,
      type: tutorial.type,
      noteSide: primaryNotesSide,
      isPrimary: true,
      isDraggable: false,
      canMoveUp: false,
      canMoveDown: false,
    }),
    ...blocks.map((block, index) =>
      renderEditorMiniMapCard({
        tutorialId: tutorial.id,
        blockId: block.id,
        order: index + 2,
        type: block.type,
        noteSide: resolveBlockNotesSide(block, primaryNotesSide),
        isPrimary: false,
        isDraggable: true,
        canMoveUp: index > 0,
        canMoveDown: index < totalExtraBlocks - 1,
      })
    ),
  ].join("");

  return `
    <section class="editor-mini-map-floating" aria-label="Miniatura de secciones">
      <div class="editor-mini-map-list">
        ${cards}
      </div>
    </section>
  `;
}

function renderEditorMiniMapCard({
  tutorialId,
  blockId,
  order,
  type,
  noteSide,
  isPrimary,
  isDraggable,
  canMoveUp = false,
  canMoveDown = false,
}) {
  const typeLabel = type === "image" ? "Imagen" : type === "video" ? "Video" : "Texto";
  const moduleLabel = isPrimary ? "Principal" : "Modulo";
  const typeClass = type === "video" ? "is-video" : type === "image" ? "is-image" : "is-text";
  const supportsNotesSide = type !== "text";
  const mediaClass = type === "text" ? "is-text" : "is-media";
  const draggableAttr = isDraggable ? `draggable="true"` : "";
  const dataAttrs = isDraggable ? `data-mini-module-id="${blockId}" data-mini-module-tutorial-id="${tutorialId}"` : "";
  return `
    <article class="mini-layout-card ${typeClass} ${isPrimary ? "is-primary" : ""}" ${draggableAttr} ${dataAttrs}>
      <div class="mini-layout-top">
        <div class="mini-layout-top-meta">
          <span class="mini-layout-index">${order}</span>
          <span class="mini-layout-label">${moduleLabel}</span>
          <span class="mini-layout-kind">${typeLabel}</span>
        </div>
        ${
          isDraggable
            ? `
              <div class="mini-layout-actions">
                <button
                  type="button"
                  class="mini-layout-move"
                  data-mini-move-block-id="${blockId}"
                  data-mini-move-tutorial-id="${tutorialId}"
                  data-mini-move-direction="-1"
                  aria-label="Mover arriba"
                  title="Mover arriba"
                  ${canMoveUp ? "" : "disabled"}
                >↑</button>
                <button
                  type="button"
                  class="mini-layout-move"
                  data-mini-move-block-id="${blockId}"
                  data-mini-move-tutorial-id="${tutorialId}"
                  data-mini-move-direction="1"
                  aria-label="Mover abajo"
                  title="Mover abajo"
                  ${canMoveDown ? "" : "disabled"}
                >↓</button>
                <button type="button" class="mini-layout-drag" data-mini-drag-handle="1" aria-label="Arrastrar">::</button>
              </div>
            `
            : `<span class="mini-layout-lock">#</span>`
        }
      </div>
      <div class="mini-layout-shell ${supportsNotesSide && noteSide === "left" ? "is-notes-left" : ""} ${supportsNotesSide ? "" : "is-no-note"}">
        <span class="mini-layout-box mini-layout-media ${mediaClass}"></span>
        ${
          supportsNotesSide
            ? `
              <span class="mini-layout-box mini-layout-note">
                <button
                  type="button"
                  class="mini-layout-note-side ${noteSide === "left" ? "is-active" : ""}"
                  data-mini-set-note-side="1"
                  data-mini-note-side="left"
                  data-mini-notes-tutorial-id="${tutorialId}"
                  data-mini-notes-block-id="${escapeAttribute(blockId || "")}"
                  aria-label="Poner nota a la izquierda"
                  title="Nota a la izquierda"
                >Izq</button>
                <button
                  type="button"
                  class="mini-layout-note-side ${noteSide === "right" ? "is-active" : ""}"
                  data-mini-set-note-side="1"
                  data-mini-note-side="right"
                  data-mini-notes-tutorial-id="${tutorialId}"
                  data-mini-notes-block-id="${escapeAttribute(blockId || "")}"
                  aria-label="Poner nota a la derecha"
                  title="Nota a la derecha"
                >Der</button>
              </span>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function hideDialogMiniEditor() {
  if (refs.dialogMiniEditor) {
    refs.dialogMiniEditor.classList.add("hidden");
  }
  if (refs.dialogMiniEditorContent) {
    refs.dialogMiniEditorContent.innerHTML = "";
  }
  if (refs.dialogMiniAddImage) {
    delete refs.dialogMiniAddImage.dataset.addContentId;
    delete refs.dialogMiniAddImage.dataset.addContentType;
  }
  if (refs.dialogMiniAddVideo) {
    delete refs.dialogMiniAddVideo.dataset.addContentId;
    delete refs.dialogMiniAddVideo.dataset.addContentType;
  }
  if (refs.dialogMiniAddText) {
    delete refs.dialogMiniAddText.dataset.editorAddTextId;
  }
}

function renderDialogMiniEditor(tutorialId) {
  if (!refs.dialogMiniEditor || !refs.dialogMiniEditorContent) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial || state.page !== "tutorial") {
    hideDialogMiniEditor();
    return;
  }
  refs.dialogMiniEditor.classList.remove("hidden");
  refs.dialogMiniEditorContent.innerHTML = renderEditorMiniMap(
    tutorial,
    normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial))
  );

  if (refs.dialogMiniAddImage) {
    refs.dialogMiniAddImage.dataset.addContentId = tutorialId;
    refs.dialogMiniAddImage.dataset.addContentType = "image";
  }
  if (refs.dialogMiniAddVideo) {
    refs.dialogMiniAddVideo.dataset.addContentId = tutorialId;
    refs.dialogMiniAddVideo.dataset.addContentType = "video";
  }
  if (refs.dialogMiniAddText) {
    refs.dialogMiniAddText.dataset.editorAddTextId = tutorialId;
  }
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
  const showTimestamps = tutorial.type === "video";
  const showReview = tutorial.type !== "image" && tutorial.type !== "text";
  const showNotes = tutorial.type !== "text";
  const showSide = showNotes || showTimestamps || showReview;
  const tutorialNotesSide = resolveTutorialNotesSide(tutorial);
  const notesCollapseEnabled = shouldLockNotesHeight();
  const primaryNotesCollapsed = notesCollapseEnabled ? isPrimaryNotesCollapsed(tutorial.id) : false;
  const canCollapsePrimaryNotes = notesCollapseEnabled && showNotes && !showTimestamps && !showReview;
  const collapsePrimaryToCenter = canCollapsePrimaryNotes && primaryNotesCollapsed;
  const effectiveShowSide = showSide && !collapsePrimaryToCenter;
  const primaryNotesPreviewHtml = buildMarkdownPreviewHtml(tutorial.notes || "");
  const extraMediaHtml = renderExtraMediaSection(tutorial, tutorialNotesSide);

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

      <section class="detail-content-grid ${tutorialNotesSide === "left" ? "is-notes-left" : ""} ${!effectiveShowSide ? "is-single-column" : ""} ${collapsePrimaryToCenter ? "is-primary-notes-collapsed" : ""}">
        <div class="detail-media-area">
          <div class="media-frame">${renderDetailMedia(tutorial)}</div>
          ${
            collapsePrimaryToCenter
              ? `
                <div class="media-inline-tools">
                  <button
                    type="button"
                    class="notes-collapse-btn"
                    data-toggle-notes-collapse="1"
                    data-toggle-notes-tutorial-id="${tutorial.id}"
                    aria-expanded="false"
                  >
                    Mostrar notas
                  </button>
                </div>
              `
              : ""
          }
        </div>
        ${
          effectiveShowSide
            ? `
              <aside class="detail-side ${showNotes && !showTimestamps && !showReview ? "detail-side--notes-only" : ""}">
                ${
                  showNotes
                    ? `
                      <section class="detail-side-card ${primaryNotesCollapsed ? "is-collapsed" : ""}">
                        <div class="notes-card-head">
                          <h4>Notas</h4>
                          ${
                            canCollapsePrimaryNotes
                              ? `
                                <button
                                  type="button"
                                  class="notes-collapse-btn"
                                  data-toggle-notes-collapse="1"
                                  data-toggle-notes-tutorial-id="${tutorial.id}"
                                  aria-expanded="${primaryNotesCollapsed ? "false" : "true"}"
                                >
                                  ${primaryNotesCollapsed ? "Mostrar" : "Ocultar"}
                                </button>
                              `
                              : ""
                          }
                        </div>
                        <div class="detail-note-body" data-primary-notes-wrap-id="${tutorial.id}">
                          <div
                            class="markdown-body detail-note-markdown-view ${primaryNotesCollapsed ? "hidden" : ""}"
                            data-notes-markdown-preview-id="${tutorial.id}"
                            data-rich-editable="1"
                            data-rich-notes-id="${tutorial.id}"
                            data-placeholder="Escribe notas para este tutorial..."
                            contenteditable="true"
                            spellcheck="true"
                            tabindex="0"
                          >${primaryNotesPreviewHtml}</div>
                          <textarea
                            class="detail-note-editor hidden"
                            data-notes-editor-id="${tutorial.id}"
                            data-markdown-enabled="1"
                            placeholder="Escribe notas para este tutorial..."
                          >${escapeHtml(tutorial.notes || "")}</textarea>
                        </div>
                      </section>
                    `
                    : ""
                }
                ${
                  showTimestamps
                    ? `
                      <section class="detail-side-card">
                        <h4>Timestamps</h4>
                        ${tsHtml}
                      </section>
                    `
                    : ""
                }
                ${
                  showReview
                    ? `
                      <section class="detail-side-card">
                        <h4>Repaso</h4>
                        <p class="detail-review">${escapeHtml(reviewValue)}</p>
                      </section>
                    `
                    : ""
                }
              </aside>
            `
            : ""
        }
      </section>

      <section class="detail-extra">
        ${extraMediaHtml}
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
  window.requestAnimationFrame(() => {
    if (state.page === "tutorial" && state.selectedId === tutorial.id) {
      syncDetailEditorsLayout(tutorial.id);
    }
  });
}

function syncDetailEditorsLayout(tutorialId) {
  if (!tutorialId) {
    return;
  }
  syncVideoOrientationClasses(refs.detailPanel);
  syncImageOrientationClasses(refs.detailPanel);
  syncPortraitAlignmentClasses();
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
  refs.detailPanel.querySelectorAll('[data-extra-block-field="text"]').forEach((element) => {
    if (element instanceof HTMLTextAreaElement) {
      autoGrowTextarea(element, 120);
    }
  });
  syncExtraModuleNotesHeights();
}

function resolveVideoOrientation(videoElement) {
  if (!(videoElement instanceof HTMLVideoElement)) {
    return "";
  }
  const width = Number(videoElement.videoWidth || 0);
  const height = Number(videoElement.videoHeight || 0);
  if (!width || !height) {
    return "";
  }
  const ratio = width / height;
  if (ratio < 0.92) {
    return "portrait";
  }
  if (ratio > 1.08) {
    return "landscape";
  }
  return "square";
}

function applyVideoOrientationClass(videoElement) {
  if (!(videoElement instanceof HTMLVideoElement)) {
    return;
  }
  const orientation = resolveVideoOrientation(videoElement);
  if (!orientation) {
    videoElement.removeAttribute("data-video-orientation");
    return;
  }
  videoElement.setAttribute("data-video-orientation", orientation);
}

function resolveImageOrientation(imageElement) {
  if (!(imageElement instanceof HTMLImageElement)) {
    return "";
  }
  const width = Number(imageElement.naturalWidth) || 0;
  const height = Number(imageElement.naturalHeight) || 0;
  if (width <= 0 || height <= 0) {
    return "";
  }
  if (width > height * 1.05) {
    return "landscape";
  }
  if (height > width * 1.05) {
    return "portrait";
  }
  return "square";
}

function applyImageOrientationClass(imageElement) {
  if (!(imageElement instanceof HTMLImageElement)) {
    return;
  }
  const orientation = resolveImageOrientation(imageElement);
  if (!orientation) {
    imageElement.removeAttribute("data-image-orientation");
    return;
  }
  imageElement.setAttribute("data-image-orientation", orientation);
}

function bindImageOrientation(imageElement) {
  if (!(imageElement instanceof HTMLImageElement)) {
    return;
  }
  applyImageOrientationClass(imageElement);
  if (imageElement.dataset.orientationBound === "1") {
    return;
  }
  imageElement.dataset.orientationBound = "1";
  imageElement.addEventListener(
    "load",
    () => {
      applyImageOrientationClass(imageElement);
      if (state.selectedId) {
        syncDetailEditorsLayout(state.selectedId);
      }
    },
    { once: true }
  );
}

function bindVideoOrientation(videoElement) {
  if (!(videoElement instanceof HTMLVideoElement)) {
    return;
  }
  applyVideoOrientationClass(videoElement);
  if (videoElement.dataset.orientationBound === "1") {
    return;
  }
  videoElement.dataset.orientationBound = "1";
  videoElement.addEventListener("loadedmetadata", () => {
    applyVideoOrientationClass(videoElement);
    if (state.selectedId) {
      syncDetailEditorsLayout(state.selectedId);
    }
  });
}

function syncVideoOrientationClasses(scope = refs.detailPanel) {
  if (!(scope instanceof HTMLElement)) {
    return;
  }
  scope.querySelectorAll("video").forEach((videoNode) => {
    if (videoNode instanceof HTMLVideoElement) {
      bindVideoOrientation(videoNode);
    }
  });
}

function syncImageOrientationClasses(scope = refs.detailPanel) {
  if (!(scope instanceof HTMLElement)) {
    return;
  }
  scope.querySelectorAll("img").forEach((imageNode) => {
    if (imageNode instanceof HTMLImageElement) {
      bindImageOrientation(imageNode);
    }
  });
}

function isPortraitMediaContainer(container) {
  if (!(container instanceof HTMLElement)) {
    return false;
  }
  const portraitImage = container.querySelector('img[data-image-orientation="portrait"]');
  if (portraitImage instanceof HTMLImageElement) {
    return true;
  }
  const imageNode = container.querySelector("img");
  if (imageNode instanceof HTMLImageElement) {
    const imageOrientation = resolveImageOrientation(imageNode);
    if (imageOrientation === "portrait") {
      return true;
    }
  }
  const portraitVideo = container.querySelector('video[data-video-orientation="portrait"]');
  if (portraitVideo instanceof HTMLVideoElement) {
    return true;
  }
  const videoNode = container.querySelector("video");
  if (videoNode instanceof HTMLVideoElement) {
    const videoOrientation = resolveVideoOrientation(videoNode);
    if (videoOrientation === "portrait") {
      return true;
    }
  }
  const portraitEmbed = container.querySelector(".window-media-shell.is-portrait-embed");
  if (portraitEmbed instanceof HTMLElement) {
    return true;
  }

  const measurable = container.querySelector("img, video, iframe");
  if (measurable instanceof HTMLElement) {
    const rect = measurable.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && rect.height > rect.width * 1.05) {
      return true;
    }
  }
  return false;
}

function syncPortraitAlignmentClasses() {
  const detailGrid = refs.detailPanel.querySelector(".detail-content-grid");
  if (detailGrid instanceof HTMLElement) {
    const mediaArea = detailGrid.querySelector(".detail-media-area");
    detailGrid.classList.toggle("is-primary-portrait-media", isPortraitMediaContainer(mediaArea));
  }

  refs.detailPanel.querySelectorAll(".media-module").forEach((module) => {
    if (!(module instanceof HTMLElement)) {
      return;
    }
    const mediaArea = module.querySelector(".media-module-media");
    module.classList.toggle("is-media-portrait", isPortraitMediaContainer(mediaArea));
  });
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

function parseCssPixels(value) {
  const numeric = Number.parseFloat(String(value || "0"));
  return Number.isFinite(numeric) ? numeric : 0;
}

function shouldLockNotesHeight() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }
  return window.matchMedia("(min-width: 900px)").matches;
}

function syncPrimaryNotesHeight(noteEditor) {
  if (!(noteEditor instanceof HTMLTextAreaElement) || state.page !== "tutorial") {
    return;
  }
  const tutorialId = noteEditor.dataset.notesEditorId || state.selectedId;
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial || tutorial.type === "text") {
    noteEditor.style.removeProperty("height");
    noteEditor.style.removeProperty("max-height");
    noteEditor.style.removeProperty("min-height");
    noteEditor.style.overflowY = "hidden";
    const detailSide = noteEditor.closest(".detail-side");
    if (detailSide instanceof HTMLElement) {
      detailSide.style.removeProperty("max-height");
      detailSide.style.removeProperty("overflow-y");
      detailSide.style.removeProperty("height");
    }
    const noteCard = noteEditor.closest(".detail-side-card");
    if (noteCard instanceof HTMLElement) {
      noteCard.style.removeProperty("height");
      noteCard.style.removeProperty("max-height");
      noteCard.style.removeProperty("min-height");
      noteCard.style.removeProperty("overflow");
    }
    const noteBody = noteEditor.closest(".detail-note-body");
    if (noteBody instanceof HTMLElement) {
      noteBody.style.removeProperty("height");
      noteBody.style.removeProperty("max-height");
      noteBody.style.removeProperty("min-height");
      noteBody.style.removeProperty("overflow");
    }
    return;
  }

  if (!shouldLockNotesHeight()) {
    noteEditor.style.removeProperty("height");
    noteEditor.style.removeProperty("max-height");
    noteEditor.style.removeProperty("min-height");
    noteEditor.style.overflowY = "hidden";
    autoGrowTextarea(noteEditor, 120);
    const detailSide = noteEditor.closest(".detail-side");
    if (detailSide instanceof HTMLElement) {
      detailSide.style.removeProperty("max-height");
      detailSide.style.removeProperty("overflow-y");
      detailSide.style.removeProperty("height");
    }
    const noteCard = noteEditor.closest(".detail-side-card");
    if (noteCard instanceof HTMLElement) {
      noteCard.style.removeProperty("height");
      noteCard.style.removeProperty("max-height");
      noteCard.style.removeProperty("min-height");
      noteCard.style.removeProperty("overflow");
    }
    const noteBody = noteEditor.closest(".detail-note-body");
    if (noteBody instanceof HTMLElement) {
      noteBody.style.removeProperty("height");
      noteBody.style.removeProperty("max-height");
      noteBody.style.removeProperty("min-height");
      noteBody.style.removeProperty("overflow");
    }
    const noteView = refs.detailPanel.querySelector(`[data-notes-markdown-preview-id="${tutorialId}"]`);
    if (noteView instanceof HTMLElement) {
      noteView.style.removeProperty("height");
      noteView.style.removeProperty("max-height");
      noteView.style.removeProperty("min-height");
      noteView.style.removeProperty("overflow-y");
    }
    return;
  }

  const mediaFrame = refs.detailPanel.querySelector(".detail-media-area .media-frame");
  if (!(mediaFrame instanceof HTMLElement)) {
    return;
  }

  const noteCard = noteEditor.closest(".detail-side-card");
  const detailSide = noteEditor.closest(".detail-side");
  const noteBody = noteEditor.closest(".detail-note-body");
  if (!(noteCard instanceof HTMLElement) || !(detailSide instanceof HTMLElement)) {
    return;
  }
  if (noteCard.classList.contains("is-collapsed")) {
    noteEditor.style.removeProperty("height");
    noteEditor.style.removeProperty("max-height");
    noteEditor.style.removeProperty("min-height");
    noteEditor.style.overflowY = "hidden";
    noteCard.style.removeProperty("height");
    noteCard.style.removeProperty("max-height");
    noteCard.style.removeProperty("min-height");
    noteCard.style.removeProperty("overflow");
    if (noteBody instanceof HTMLElement) {
      noteBody.style.removeProperty("height");
      noteBody.style.removeProperty("max-height");
      noteBody.style.removeProperty("min-height");
      noteBody.style.removeProperty("overflow");
    }
    return;
  }
  const noteHeading = noteCard?.querySelector(".notes-card-head");
  const noteView = noteCard?.querySelector(".detail-note-markdown-view");
  const detailSideComputed = window.getComputedStyle(detailSide);
  const noteCardComputed = window.getComputedStyle(noteCard);
  const sideGap = parseCssPixels(detailSideComputed.rowGap || detailSideComputed.gap);
  const noteCardGap = parseCssPixels(noteCardComputed.rowGap || noteCardComputed.gap);
  const headingHeight = noteHeading instanceof HTMLElement ? noteHeading.getBoundingClientRect().height : 0;
  const mediaHeight = mediaFrame.getBoundingClientRect().height;
  const sideCards = Array.from(detailSide.querySelectorAll(".detail-side-card"));
  const otherCardsHeight = sideCards
    .filter((card) => card !== noteCard)
    .reduce((acc, card) => acc + card.getBoundingClientRect().height, 0);
  const sideGapsTotal = Math.max(0, sideCards.length - 1) * sideGap;
  const noteCardHeight = Math.max(140, mediaHeight - otherCardsHeight - sideGapsTotal);
  const cardBodyPadding = parseCssPixels(noteCardComputed.paddingTop) + parseCssPixels(noteCardComputed.paddingBottom);
  const availableHeight = Math.max(140, noteCardHeight - headingHeight - cardBodyPadding - noteCardGap);

  detailSide.style.height = `${Math.max(140, mediaHeight)}px`;
  detailSide.style.maxHeight = `${Math.max(140, mediaHeight)}px`;
  detailSide.style.overflowY = sideCards.length > 1 ? "auto" : "hidden";
  noteCard.style.height = `${noteCardHeight}px`;
  noteCard.style.maxHeight = `${noteCardHeight}px`;
  noteCard.style.minHeight = `${noteCardHeight}px`;
  noteCard.style.display = "flex";
  noteCard.style.flexDirection = "column";
  noteCard.style.overflow = "hidden";
  if (noteBody instanceof HTMLElement) {
    noteBody.style.height = `${availableHeight}px`;
    noteBody.style.maxHeight = `${availableHeight}px`;
    noteBody.style.minHeight = `${availableHeight}px`;
    noteBody.style.overflow = "hidden";
  }

  clampEditorHeight(noteEditor, availableHeight, 140);
  if (noteView instanceof HTMLElement) {
    noteView.style.maxHeight = `${availableHeight}px`;
    noteView.style.minHeight = `${availableHeight}px`;
    noteView.style.height = `${availableHeight}px`;
    noteView.style.overflowY = "auto";
  }
}

function syncExtraModuleNotesHeights() {
  if (!shouldLockNotesHeight()) {
    refs.detailPanel.querySelectorAll(".media-module-note").forEach((noteColumn) => {
      if (!(noteColumn instanceof HTMLElement)) {
        return;
      }
      noteColumn.style.removeProperty("height");
      noteColumn.style.removeProperty("max-height");
      noteColumn.style.removeProperty("overflow");
    });
    refs.detailPanel.querySelectorAll("[data-extra-block-note-id]").forEach((noteEditor) => {
      if (!(noteEditor instanceof HTMLTextAreaElement)) {
        return;
      }
      noteEditor.style.removeProperty("height");
      noteEditor.style.removeProperty("max-height");
      noteEditor.style.removeProperty("min-height");
      noteEditor.style.overflowY = "hidden";
      autoGrowTextarea(noteEditor, 92);
    });
    refs.detailPanel.querySelectorAll(".extra-note-markdown-view").forEach((noteView) => {
      if (!(noteView instanceof HTMLElement)) {
        return;
      }
      noteView.style.removeProperty("height");
      noteView.style.removeProperty("max-height");
      noteView.style.removeProperty("min-height");
      noteView.style.removeProperty("overflow-y");
    });
    return;
  }

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
    const noteColumn = module.querySelector(".media-module-note");
    if (!(noteColumn instanceof HTMLElement)) {
      return;
    }
    if (noteColumn.classList.contains("is-collapsed")) {
      noteColumn.style.removeProperty("height");
      noteColumn.style.removeProperty("max-height");
      noteColumn.style.removeProperty("overflow");
      noteEditor.style.removeProperty("height");
      noteEditor.style.removeProperty("max-height");
      noteEditor.style.removeProperty("min-height");
      noteEditor.style.overflowY = "hidden";
      return;
    }
    const heading = module.querySelector(".media-module-note .notes-card-head");
    const noteView = module.querySelector(".extra-note-markdown-view");
    const noteColumnComputed = window.getComputedStyle(noteColumn);
    const noteColumnGap = parseCssPixels(noteColumnComputed.rowGap || noteColumnComputed.gap);
    const noteColumnPadding =
      parseCssPixels(noteColumnComputed.paddingTop) + parseCssPixels(noteColumnComputed.paddingBottom);
    const headingHeight = heading instanceof HTMLElement ? heading.getBoundingClientRect().height : 0;
    const mediaHeight = mediaColumn.getBoundingClientRect().height;
    const availableHeight = Math.max(92, mediaHeight - headingHeight - noteColumnGap - noteColumnPadding);
    noteColumn.style.height = `${Math.max(92, mediaHeight)}px`;
    noteColumn.style.maxHeight = `${Math.max(92, mediaHeight)}px`;
    noteColumn.style.overflow = "hidden";
    clampEditorHeight(noteEditor, availableHeight, 92);
    if (noteView instanceof HTMLElement) {
      noteView.style.maxHeight = `${availableHeight}px`;
      noteView.style.minHeight = `${availableHeight}px`;
      noteView.style.height = `${availableHeight}px`;
      noteView.style.overflowY = "auto";
    }

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
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
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
    const primaryTextHtml = buildMarkdownPreviewHtml(tutorial.textContent || "");
    return `
      <div class="detail-text-wrap" data-primary-text-wrap-id="${tutorial.id}">
        <div
          class="markdown-body detail-main-text-editor"
          data-rich-editable="1"
          data-rich-primary-text-id="${tutorial.id}"
          data-placeholder="Insertar texto"
          contenteditable="true"
          spellcheck="true"
          tabindex="0"
        >${primaryTextHtml}</div>
        <textarea
          class="detail-composer-text-input hidden"
          data-primary-text-editor-id="${tutorial.id}"
          data-markdown-enabled="1"
          placeholder="Insertar texto"
        >${escapeHtml(tutorial.textContent || "")}</textarea>
      </div>
    `;
  }
  if (tutorial.type === "image") {
    const imageUrl = tutorial.imageUrl || tutorial.url;
    return imageUrl ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(tutorial.title)}" />` : "<p class='empty-side'>No hay imagen para mostrar.</p>";
  }
  const youtubeId = extractYouTubeId(tutorial.url);
  if (youtubeId) {
    const shellClass = `window-media-shell${isLikelyPortraitEmbedUrl(tutorial.url) ? " is-portrait-embed" : ""}`;
    return `
      <div class="${shellClass}" data-window-media-shell>
        <button type="button" class="window-media-toggle" data-toggle-window-media aria-expanded="false">Expandir ventana</button>
        <iframe
          src="https://www.youtube.com/embed/${youtubeId}"
          title="${escapeAttribute(tutorial.title)}"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
    `;
  }
  if (isLikelyVideoUrl(tutorial.url)) {
    return `
      <div class="window-media-shell" data-window-media-shell>
        <button type="button" class="window-media-toggle" data-toggle-window-media aria-expanded="false">Expandir ventana</button>
          <video controls playsinline webkit-playsinline="true" preload="metadata" data-primary-video="1" src="${escapeAttribute(tutorial.url)}"></video>
      </div>
    `;
  }
  return tutorial.url
    ? `<p><a href="${escapeAttribute(tutorial.url)}" target="_blank" rel="noreferrer">Abrir video</a></p>`
    : "<p class='empty-side'>No hay video para mostrar.</p>";
}

function renderExtraMediaSection(tutorial, notesSideFallback = resolveTutorialNotesSide(tutorial)) {
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, notesSideFallback);
  if (!blocks.length) {
    return "";
  }

  const modulesHtml = blocks
    .map((block, index) =>
      block.type === "text"
        ? renderExtraTextModuleV2(tutorial.id, block, index + 1, blocks.length, notesSideFallback)
        : renderExtraMediaModuleV2(tutorial.id, tutorial.title, block, index + 1, blocks.length, notesSideFallback)
    )
    .join("");

  return `
    <section class="detail-extra-media">
      <div class="detail-extra-media-list">
        ${modulesHtml}
      </div>
    </section>
  `;
}

function renderExtraTextModuleV2(tutorialId, block, order, total, notesSideFallback = "right") {
  const textPreviewHtml = buildMarkdownPreviewHtml(block.text || "");
  return `
    <article
      class="detail-extra-item media-module media-module-text-only"
      data-extra-text-module-id="${block.id}"
      data-extra-text-module-tutorial-id="${tutorialId}"
    >
      <div class="detail-extra-head media-module-head media-module-head--compact">
        ${renderExtraBlockMenuV2(tutorialId, block.id, order, total)}
      </div>
      <div class="media-module-media">
        <label class="editor-inline-field">
          <input
            type="text"
            class="extra-text-title-input"
            data-extra-block-field="caption"
            data-extra-block-id="${block.id}"
            data-extra-block-tutorial-id="${tutorialId}"
            value="${escapeAttribute(block.caption || "")}"
            placeholder="Insertar titulo"
          />
        </label>
        <div class="editor-inline-field extra-text-body" data-extra-text-wrap-id="${block.id}">
          <div
            class="markdown-body extra-markdown-preview"
            data-extra-markdown-preview-id="${block.id}"
            data-rich-editable="1"
            data-rich-extra-text-id="${block.id}"
            data-rich-extra-text-tutorial-id="${tutorialId}"
            data-placeholder="Insertar texto"
            contenteditable="true"
            spellcheck="true"
            tabindex="0"
          >
            ${textPreviewHtml}
          </div>
          <textarea
            class="detail-composer-text-input hidden"
            data-extra-block-field="text"
            data-extra-block-id="${block.id}"
            data-extra-block-tutorial-id="${tutorialId}"
            data-markdown-enabled="1"
            placeholder="Insertar texto"
          >${escapeHtml(block.text || "")}</textarea>
        </div>
      </div>
    </article>
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
      : `<video controls playsinline webkit-playsinline="true" preload="metadata" data-extra-video-id="${block.id}" src="${escapeAttribute(block.url)}"></video>`;
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
                data-extra-block-field="note"
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
                data-extra-block-field="note"
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

function renderExtraMediaModuleV2(tutorialId, tutorialTitle, block, order, total, notesSideFallback = "right") {
  const blockNotesSide = resolveBlockNotesSide(block, notesSideFallback);
  const notesCollapseEnabled = shouldLockNotesHeight();
  const blockNotesCollapsed = notesCollapseEnabled ? isExtraNotesCollapsed(tutorialId, block.id) : false;
  const youtubeId = extractYouTubeId(block.url);
  const timestamps = Array.isArray(block.timestamps) ? block.timestamps : [];
  const notePreviewHtml = buildMarkdownPreviewHtml(block.note || "");
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
    const shellClass = `window-media-shell${isLikelyPortraitEmbedUrl(block.url) ? " is-portrait-embed" : ""}`;
    mediaHtml = youtubeId
      ? `
        <div class="${shellClass}" data-window-media-shell>
          <button type="button" class="window-media-toggle" data-toggle-window-media aria-expanded="false">Expandir ventana</button>
          <iframe src="https://www.youtube.com/embed/${youtubeId}" title="${escapeAttribute(
            tutorialTitle
          )}" allowfullscreen loading="lazy"></iframe>
        </div>
      `
      : `
        <div class="window-media-shell" data-window-media-shell>
          <button type="button" class="window-media-toggle" data-toggle-window-media aria-expanded="false">Expandir ventana</button>
          <video controls playsinline webkit-playsinline="true" preload="metadata" data-extra-video-id="${block.id}" src="${escapeAttribute(block.url)}"></video>
        </div>
      `;
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

  return `
    <article
      class="detail-extra-item media-module ${blockNotesSide === "left" ? "is-notes-left" : ""} ${blockNotesCollapsed ? "is-note-collapsed" : ""}"
      data-extra-view-module-id="${block.id}"
      data-extra-view-tutorial-id="${tutorialId}"
    >
      <div class="detail-extra-head media-module-head media-module-head--compact">
        ${
          notesCollapseEnabled
            ? `
              <button
                type="button"
                class="notes-collapse-btn"
                data-toggle-notes-collapse="1"
                data-toggle-notes-tutorial-id="${tutorialId}"
                data-toggle-notes-block-id="${block.id}"
                aria-expanded="${blockNotesCollapsed ? "false" : "true"}"
              >
                ${blockNotesCollapsed ? "Mostrar" : "Ocultar"}
              </button>
            `
            : `<span class="meta">Notas visibles</span>`
        }
        ${renderExtraBlockMenuV2(tutorialId, block.id, order, total)}
      </div>
      <div class="media-module-grid">
        <div class="media-module-media">
          ${block.caption ? `<p class="detail-extra-caption">${escapeHtml(block.caption)}</p>` : ""}
          <div class="detail-extra-body">${mediaHtml}</div>
          ${timestampsHtml}
        </div>
        <section class="media-module-note ${blockNotesCollapsed ? "is-collapsed" : ""}">
          <div class="notes-card-head">
            <h5>Notas</h5>
          </div>
          <div
            class="markdown-body extra-note-markdown-view"
            data-extra-note-markdown-preview-id="${block.id}"
            data-rich-editable="1"
            data-rich-extra-note-id="${block.id}"
            data-rich-extra-note-tutorial-id="${tutorialId}"
            data-extra-note-wrap-id="${block.id}"
            data-placeholder="Escribe una nota para este bloque..."
            contenteditable="true"
            spellcheck="true"
            tabindex="0"
          >
            ${notePreviewHtml}
          </div>
          <textarea
            class="module-note-editor hidden"
            data-extra-block-note-id="${block.id}"
            data-extra-block-field="note"
            data-extra-block-tutorial-id="${tutorialId}"
            data-markdown-enabled="1"
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

function jumpPrimaryVideoToTimestamp(secondsRaw) {
  const seconds = Number(secondsRaw);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return;
  }
  const target = refs.detailPanel.querySelector("[data-primary-video='1']");
  if (!(target instanceof HTMLVideoElement)) {
    return;
  }
  target.currentTime = seconds;
  target.play().catch(() => {});
}

function toggleWindowMediaShell(shellElement) {
  if (!(shellElement instanceof HTMLElement)) {
    return;
  }
  const shouldOpen = !shellElement.classList.contains("is-window-fullscreen");
  closeWindowMediaShells();
  shellElement.classList.toggle("is-window-fullscreen", shouldOpen);
  const toggle = shellElement.querySelector("[data-toggle-window-media]");
  if (toggle instanceof HTMLButtonElement) {
    toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    toggle.textContent = shouldOpen ? "Reducir ventana" : "Expandir ventana";
  }
}

function closeWindowMediaShells() {
  document.querySelectorAll("[data-window-media-shell].is-window-fullscreen").forEach((node) => {
    node.classList.remove("is-window-fullscreen");
    const toggle = node.querySelector("[data-toggle-window-media]");
    if (toggle instanceof HTMLButtonElement) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Expandir ventana";
    }
  });
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
  }, 250);
}

function schedulePrimaryTextAutosave(tutorialId, value) {
  if (!tutorialId) {
    return;
  }
  if (primaryTextAutosaveTimer) {
    window.clearTimeout(primaryTextAutosaveTimer);
  }
  primaryTextAutosaveTimer = window.setTimeout(() => {
    void savePrimaryTextAutosave(tutorialId, value);
  }, 180);
}

async function savePrimaryTextAutosave(tutorialId, value) {
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const nextText = coerceRichFieldValue(value, { migrateLegacy: true });
  if (nextText === String(tutorial.textContent || "")) {
    return;
  }
  const updatedAt = new Date().toISOString();
  const payload = {
    ...tutorial,
    textContent: nextText,
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.textContent = nextText;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) {
    showOperationError(error, "No se pudo guardar el texto principal.");
  }
}

async function saveDetailNotesAutosave(tutorialId, value) {
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const nextNotes = coerceRichFieldValue(value, { migrateLegacy: true });
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
  }, 180);
  extraBlockAutosaveTimers.set(timerKey, timer);
}

function clearExtraBlockAutosaveTimer(tutorialId, blockId, field) {
  if (!tutorialId || !blockId || !field) {
    return;
  }
  const timerKey = `${tutorialId}:${blockId}:${field}`;
  const existingTimer = extraBlockAutosaveTimers.get(timerKey);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
    extraBlockAutosaveTimers.delete(timerKey);
  }
}

async function saveExtraBlockField(tutorialId, blockId, field, value) {
  if (!tutorialId || !blockId || !field) {
    return;
  }
  if (!["note", "text", "caption"].includes(field)) {
    return;
  }
  const tutorial = state.tutorials.find((item) => item.id === tutorialId);
  if (!tutorial) {
    return;
  }
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index < 0) {
    return;
  }
  const current = blocks[index];
  const nextValue =
    field === "note" || field === "text"
      ? coerceRichFieldValue(value, { migrateLegacy: true })
      : String(value || "");
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
    extraContent: normalizeExtraContentBlocks(nextBlocks, resolveTutorialNotesSide(tutorial)),
    updatedAt,
  };
  try {
    await apiUpdateTutorial(tutorialId, payload);
    tutorial.extraContent = payload.extraContent;
    tutorial.updatedAt = updatedAt;
    setSyncStatus(`Guardado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) {
    showOperationError(error, "No se pudo guardar el bloque.");
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
  }, 220);
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
  }, 220);
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
      const nextStored = coerceRichFieldValue(nextValue);
      if (nextStored === tutorial.textContent) {
        return;
      }
      tutorial.textContent = nextStored;
      changed = true;
      break;
    }
    case "notes": {
      const nextStored = coerceRichFieldValue(nextValue);
      if (nextStored === tutorial.notes) {
        return;
      }
      tutorial.notes = nextStored;
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
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
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
      {
        const nextStored = coerceRichFieldValue(nextValue);
        if (nextStored === (current.text || "")) {
          return;
        }
        nextBlock.text = nextStored;
      }
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
      {
        const nextStored = coerceRichFieldValue(nextValue);
        if (nextStored === (current.note || "")) {
          return;
        }
        nextBlock.note = nextStored;
      }
      break;
    default:
      return;
  }

  const nextBlocks = [...blocks];
  nextBlocks[index] = nextBlock;
  const updatedAt = new Date().toISOString();
  tutorial.extraContent = normalizeExtraContentBlocks(nextBlocks, resolveTutorialNotesSide(tutorial));
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

  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
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
  }, 150);
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
  const tutorialNotesSide = resolveTutorialNotesSide(tutorial);
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, tutorialNotesSide);
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
    const previousBlock = nextBlocks.find((block) => block.id === blockId) || null;
    const nextBlock = {
      id: blockId,
      type: "text",
      text,
      caption,
      note: previousBlock?.note || "",
      noteSide: resolveBlockNotesSide(previousBlock, tutorialNotesSide),
      createdAt: previousBlock?.createdAt || new Date().toISOString(),
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
    extraContent: normalizeExtraContentBlocks(nextBlocks, tutorialNotesSide),
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
      note: "",
      noteSide: resolveTutorialNotesSide(tutorial),
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
      note: "",
      noteSide: resolveTutorialNotesSide(tutorial),
      createdAt: new Date().toISOString(),
    };
  }

  const nextBlocks = normalizeExtraContentBlocks([...(tutorial.extraContent || []), block], resolveTutorialNotesSide(tutorial));
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
  setExtraMediaDialogStatus(
    normalizedType === "image"
      ? "Puedes pegar una o varias URLs (una por linea) o subir imagenes desde tu dispositivo."
      : "Puedes pegar una URL de video o subir un archivo de video local."
  );
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
  setExtraMediaDialogStatus(
    next === "url"
      ? isVideo
        ? "Pega la URL del video que quieres agregar."
        : "Pega una o varias URLs de imagen (una por linea)."
      : isVideo
        ? "Selecciona un video desde tu dispositivo."
        : "Selecciona una o varias imagenes desde tu dispositivo."
  );
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
          noteSide: resolveTutorialNotesSide(tutorial),
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
        }, { tutorialId: context.tutorialId });
        blocksToAdd.push({
          id: createId(),
          type: context.type,
          url: uploaded.url,
          caption,
          note: "",
          noteSide: resolveTutorialNotesSide(tutorial),
          timestamps: context.type === "video" ? timestamps : [],
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (!blocksToAdd.length) {
      setExtraMediaDialogStatus("No se pudo crear el adjunto.", true);
      return;
    }

    const nextBlocks = normalizeExtraContentBlocks([...(tutorial.extraContent || []), ...blocksToAdd], resolveTutorialNotesSide(tutorial));
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
  const blocks = normalizeExtraContentBlocks(tutorial.extraContent, resolveTutorialNotesSide(tutorial));
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
      noteSide: resolveTutorialNotesSide(tutorial),
      createdAt: new Date().toISOString(),
    },
  ], resolveTutorialNotesSide(tutorial));
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
  closeEmojiPickerPanel();
  hideDialogMiniEditor();
  refs.dialogTitle.textContent = "Nuevo tutorial";
  refs.deleteButton.classList.add("hidden");
  refs.tutorialForm.reset();
  refs.typeInput.value = "video";
  refs.tutorialForm.elements.emoji.value = "";
  refs.tutorialForm.elements.emojiColor.value = "default";
  syncEmojiPickerToggleIcon();
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
  closeEmojiPickerPanel();
  state.editingId = id;
  if (state.page === "tutorial" && state.tutorialEditMode) {
    state.tutorialEditMode = false;
    render();
  }
  renderDialogMiniEditor(id);
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
  refs.tutorialForm.elements.emoji.value = normalizeEmoji(t.emoji || "");
  refs.tutorialForm.elements.emojiColor.value = normalizeEmojiColor(t.emojiColor || "default", "default");
  syncEmojiPickerToggleIcon();
  refs.tutorialForm.elements.imageUrl.value = t.imageUrl || "";
  refs.tutorialForm.elements.textContent.value = richStoredValueToPlainText(t.textContent || "");
  if (refs.tutorialForm.elements.notes) {
    refs.tutorialForm.elements.notes.value = richStoredValueToPlainText(t.notes || "");
  }
  if (refs.tutorialForm.elements.timestamps) {
    refs.tutorialForm.elements.timestamps.value = t.timestamps.join("\n");
  }
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
    textContent: coerceRichFieldValue(f.textContent.value),
    category: f.category.value.trim(),
    collection: f.collection.value.trim(),
    status: f.status.value,
    priority: f.priority.value,
    isFavorite: current ? Boolean(current.isFavorite) : false,
    reviewDate: f.reviewDate.value,
    tags: parseTags(f.tags.value),
    emoji: normalizeEmoji(f.emoji.value),
    emojiColor: normalizeEmojiColor(f.emojiColor.value, "default"),
    notes: f.notes ? coerceRichFieldValue(f.notes.value) : current?.notes || "",
    timestamps: f.timestamps
      ? f.timestamps.value.split("\n").map((line) => line.trim()).filter(Boolean)
      : Array.isArray(current?.timestamps)
        ? [...current.timestamps]
        : [],
    notesSide: current ? resolveTutorialNotesSide(current) : state.notesSide,
    extraContent: current ? normalizeExtraContentBlocks(current.extraContent, resolveTutorialNotesSide(current)) : [],
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
    }, { tutorialId: state.editingId || state.selectedId || "" });
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
  const maxUploadBytes = getEffectiveMaxUploadBytes();
  if (file.size > maxUploadBytes) {
    return `El archivo supera el maximo de ${formatBytesForUi(maxUploadBytes)}.`;
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

function formatBytesForUi(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) {
    return "0B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const rounded = size >= 100 || unitIndex === 0 ? Math.round(size) : Math.round(size * 10) / 10;
  return `${rounded}${units[unitIndex]}`;
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

function normalizeEmojiColor(value, fallback = "default") {
  if (EMOJI_COLOR_KEYS.includes(value)) {
    return value;
  }
  return EMOJI_COLOR_KEYS.includes(fallback) ? fallback : "default";
}

function normalizeEmoji(value) {
  return String(value || "").trim().slice(0, 8);
}

function normalizeEmojiPickerCategory(value) {
  const next = String(value || "").trim().toLowerCase();
  return EMOJI_PICKER_TABS.some((tab) => tab.id === next) ? next : "recent";
}

function normalizeSearchToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function loadRecentEmojiSymbols() {
  try {
    const raw = localStorage.getItem(EMOJI_PICKER_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((value) => normalizeEmoji(value))
      .filter((symbol) => symbol && EMOJI_PICKER_ENTRY_MAP.has(symbol))
      .slice(0, EMOJI_PICKER_MAX_RECENT);
  } catch {
    return [];
  }
}

function saveRecentEmojiSymbols(symbols) {
  try {
    localStorage.setItem(EMOJI_PICKER_STORAGE_KEY, JSON.stringify(symbols.slice(0, EMOJI_PICKER_MAX_RECENT)));
  } catch {}
}

function registerRecentEmojiSymbol(symbol) {
  const next = normalizeEmoji(symbol);
  if (!next || !EMOJI_PICKER_ENTRY_MAP.has(next)) {
    return;
  }
  recentEmojiSymbols = [next, ...recentEmojiSymbols.filter((item) => item !== next)].slice(0, EMOJI_PICKER_MAX_RECENT);
  saveRecentEmojiSymbols(recentEmojiSymbols);
}

function getEmojiEntriesForCategory(category) {
  if (category === "recent") {
    return EMOJI_PICKER_ALL_ENTRIES;
  }
  return EMOJI_PICKER_LIBRARY[category] || EMOJI_PICKER_ALL_ENTRIES;
}

function matchesEmojiQuery(entry, query) {
  if (!query) {
    return true;
  }
  const haystack = normalizeSearchToken(`${entry.symbol} ${entry.label} ${entry.keywords || ""}`);
  return haystack.includes(query);
}

function renderEmojiPickerButtons(entries) {
  return entries
    .map(
      (entry) => `
        <button
          type="button"
          class="emoji-picker-item"
          data-emoji-pick="${escapeAttribute(entry.symbol)}"
          title="${escapeAttribute(entry.label)}"
          aria-label="${escapeAttribute(entry.label)}"
        >
          ${escapeHtml(entry.symbol)}
        </button>
      `
    )
    .join("");
}

function renderEmojiPickerPanel() {
  if (!refs.emojiPickerPanel || !refs.emojiPickerGrid || !refs.emojiPickerRecentGrid || !refs.emojiPickerCategoryTitle) {
    return;
  }
  const category = normalizeEmojiPickerCategory(state.emojiPickerCategory);
  state.emojiPickerCategory = category;
  const query = normalizeSearchToken(refs.emojiPickerSearch?.value || "");
  const currentTab = EMOJI_PICKER_TABS.find((tab) => tab.id === category) || EMOJI_PICKER_TABS[0];

  refs.emojiPickerCategoryButtons.forEach((button) => {
    button.classList.toggle("is-active", normalizeEmojiPickerCategory(button.dataset.emojiCategory) === category);
  });

  const recentEntries = recentEmojiSymbols
    .map((symbol) => EMOJI_PICKER_ENTRY_MAP.get(symbol))
    .filter((entry) => entry && matchesEmojiQuery(entry, query));
  refs.emojiPickerRecentGrid.innerHTML = recentEntries.length
    ? renderEmojiPickerButtons(recentEntries)
    : `<p class="meta">Sin recientes.</p>`;

  const categoryEntries = getEmojiEntriesForCategory(category).filter((entry) => matchesEmojiQuery(entry, query));
  refs.emojiPickerCategoryTitle.textContent = category === "recent" ? "Todos" : currentTab.label;
  refs.emojiPickerGrid.innerHTML = categoryEntries.length ? renderEmojiPickerButtons(categoryEntries) : "";
  refs.emojiPickerEmpty?.classList.toggle("hidden", categoryEntries.length > 0);
}

function syncEmojiPickerToggleIcon() {
  if (!(refs.emojiPickerToggle instanceof HTMLElement)) {
    return;
  }
  const emojiInput = refs.tutorialForm?.elements?.emoji;
  const symbol = emojiInput instanceof HTMLInputElement ? normalizeEmoji(emojiInput.value) : "";
  refs.emojiPickerToggle.textContent = symbol || "☺";
}

function isEmojiPickerOpen() {
  return refs.emojiPickerPanel instanceof HTMLElement && !refs.emojiPickerPanel.classList.contains("hidden");
}

function openEmojiPickerPanel() {
  if (!refs.emojiPickerPanel) {
    return;
  }
  refs.emojiPickerPanel.classList.remove("hidden");
  refs.emojiPickerToggle?.setAttribute("aria-expanded", "true");
  renderEmojiPickerPanel();
  window.setTimeout(() => refs.emojiPickerSearch?.focus(), 0);
}

function closeEmojiPickerPanel() {
  if (!refs.emojiPickerPanel) {
    return;
  }
  refs.emojiPickerPanel.classList.add("hidden");
  refs.emojiPickerToggle?.setAttribute("aria-expanded", "false");
  if (refs.emojiPickerSearch instanceof HTMLInputElement) {
    refs.emojiPickerSearch.value = "";
  }
}

function toggleEmojiPickerPanel() {
  if (isEmojiPickerOpen()) {
    closeEmojiPickerPanel();
    return;
  }
  openEmojiPickerPanel();
}

function applyPickedEmojiSymbol(symbol) {
  const next = normalizeEmoji(symbol);
  if (!next) {
    return;
  }
  const emojiInput = refs.tutorialForm?.elements?.emoji;
  if (emojiInput instanceof HTMLInputElement) {
    emojiInput.value = next;
    emojiInput.dispatchEvent(new Event("input", { bubbles: true }));
  }
  registerRecentEmojiSymbol(next);
  syncEmojiPickerToggleIcon();
  renderEmojiPickerPanel();
  closeEmojiPickerPanel();
}

function renderSidebarTutorialToken(tutorial) {
  const emoji = normalizeEmoji(tutorial?.emoji);
  const emojiColor = normalizeEmojiColor(tutorial?.emojiColor, "default");
  if (emoji) {
    return `<span class="sidebar-tutorial-token is-emoji emoji-color-${emojiColor}">${escapeHtml(emoji)}</span>`;
  }
  return `<span class="sidebar-tutorial-token">${tutorialTypeToken(tutorial?.type)}</span>`;
}

function renderTutorialTitleToken(tutorial) {
  const emoji = normalizeEmoji(tutorial?.emoji);
  const emojiColor = normalizeEmojiColor(tutorial?.emojiColor, "default");
  if (emoji) {
    return `<span class="tutorial-title-token is-emoji emoji-color-${emojiColor}" aria-hidden="true">${escapeHtml(emoji)}</span>`;
  }
  return `<span class="tutorial-title-token" aria-hidden="true">${tutorialTypeToken(tutorial?.type)}</span>`;
}

function renderTutorialDisplayTitle(tutorial) {
  return `${renderTutorialTitleToken(tutorial)}${escapeHtml(tutorial?.title || "Sin titulo")}`;
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

function isLikelyPortraitEmbedUrl(url) {
  const lower = String(url || "").toLowerCase();
  if (!lower) {
    return false;
  }
  return (
    lower.includes("/shorts/") ||
    lower.includes("instagram.com/reel") ||
    lower.includes("tiktok.com/") ||
    lower.includes("facebook.com/reel")
  );
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

function sanitizeCssColor(raw, fallback = "") {
  const value = String(raw || "").trim();
  if (!value) {
    return fallback;
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
    return value;
  }
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value)) {
    return value.replace(/\s+/g, " ");
  }
  if (/^rgba?\([^)]+\)$/i.test(value)) {
    return value;
  }
  if (/^(?:currentColor|transparent)$/i.test(value)) {
    return value;
  }
  if (/^[a-z]{3,20}$/i.test(value)) {
    return value.toLowerCase();
  }
  return fallback;
}

function parseColorTokenToRgbTriplet(raw) {
  const value = String(raw || "").trim();
  if (!value) {
    return null;
  }
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const token = hex[1];
    if (token.length === 3) {
      const r = Number.parseInt(token[0] + token[0], 16);
      const g = Number.parseInt(token[1] + token[1], 16);
      const b = Number.parseInt(token[2] + token[2], 16);
      return [r, g, b];
    }
    const r = Number.parseInt(token.slice(0, 2), 16);
    const g = Number.parseInt(token.slice(2, 4), 16);
    const b = Number.parseInt(token.slice(4, 6), 16);
    return [r, g, b];
  }
  const rgb = value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i);
  if (rgb) {
    const clamp = (n) => Math.max(0, Math.min(255, Number.parseInt(n, 10) || 0));
    return [clamp(rgb[1]), clamp(rgb[2]), clamp(rgb[3])];
  }
  return null;
}

function isRichHtmlStoredValue(raw) {
  return String(raw || "").startsWith(RICH_HTML_STORAGE_PREFIX);
}

function decodeStoredRichHtml(raw) {
  const value = String(raw || "");
  if (!isRichHtmlStoredValue(value)) {
    return "";
  }
  return value.slice(RICH_HTML_STORAGE_PREFIX.length);
}

function normalizeRichEditableHtml(rawHtml) {
  const root = document.createElement("div");
  root.innerHTML = String(rawHtml || "");

  root.querySelectorAll("script,style,iframe,object,embed,meta,link").forEach((node) => node.remove());

  const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "code", "a", "blockquote", "ul", "ol", "li", "h3", "h4", "h5", "span", "mark"]);

  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "div") {
      const p = document.createElement("p");
      while (node.firstChild) {
        p.appendChild(node.firstChild);
      }
      node.replaceWith(p);
    }
  });

  const unwrapElement = (element) => {
    if (!(element instanceof Element) || !element.parentNode) {
      return;
    }
    while (element.firstChild) {
      element.parentNode.insertBefore(element.firstChild, element);
    }
    element.parentNode.removeChild(element);
  };

  root.querySelectorAll("b").forEach((node) => {
    const strong = document.createElement("strong");
    while (node.firstChild) {
      strong.appendChild(node.firstChild);
    }
    node.replaceWith(strong);
  });
  root.querySelectorAll("i").forEach((node) => {
    const em = document.createElement("em");
    while (node.firstChild) {
      em.appendChild(node.firstChild);
    }
    node.replaceWith(em);
  });

  Array.from(root.querySelectorAll("*")).forEach((element) => {
    const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      unwrapElement(element);
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }
      if (name === "style" || name.startsWith("data-md-")) {
        return;
      }
      if (tag === "a" && ["href", "target", "rel"].includes(name)) {
        return;
      }
      element.removeAttribute(attribute.name);
    });

    if (tag === "a") {
      const href = String(element.getAttribute("href") || "").trim();
      if (!/^https?:\/\//i.test(href)) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("href", href);
      }
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noreferrer");
    }

    if (tag === "mark") {
      const highlight = getInlineHighlightColorToken(element);
      if (highlight) {
        element.setAttribute("data-md-highlight", highlight);
        element.style.backgroundColor = highlight;
      } else {
        element.removeAttribute("data-md-highlight");
        element.style.removeProperty("background");
        element.style.removeProperty("background-color");
      }
    }

    if (tag === "span") {
      const color = getInlineTextColorToken(element);
      const underline = elementHasUnderlineDecoration(element) ? getInlineUnderlineColorToken(element) : "";
      element.removeAttribute("data-md-color");
      element.removeAttribute("data-md-underline");
      element.style.removeProperty("color");
      element.style.removeProperty("text-decoration");
      element.style.removeProperty("text-decoration-line");
      element.style.removeProperty("text-decoration-color");
      if (color) {
        element.setAttribute("data-md-color", color);
        element.style.color = color;
      }
      if (underline) {
        element.setAttribute("data-md-underline", underline);
        element.style.textDecorationLine = "underline";
        element.style.textDecorationColor = underline;
      }
      if (!color && !underline) {
        unwrapElement(element);
      }
    }
  });

  const getSemanticStyleKey = (element) => {
    if (!(element instanceof Element)) {
      return "";
    }
    const tag = element.tagName.toLowerCase();
    if (tag === "mark") {
      const highlight = normalizeColorTokenKey(getInlineHighlightColorToken(element));
      return highlight ? `mark:${highlight}` : "";
    }
    if (tag === "span") {
      const color = normalizeColorTokenKey(getInlineTextColorToken(element));
      const underline = elementHasUnderlineDecoration(element)
        ? normalizeColorTokenKey(getInlineUnderlineColorToken(element))
        : "";
      if (!color && !underline) {
        return "";
      }
      return `span:c=${color};u=${underline}`;
    }
    if (tag === "strong" || tag === "em" || tag === "u" || tag === "code" || tag === "blockquote" || tag === "a") {
      if (tag === "a") {
        return `a:${String(element.getAttribute("href") || "").trim().toLowerCase()}`;
      }
      return tag;
    }
    return "";
  };

  const isWrapperVisuallyEmpty = (element) => {
    if (!(element instanceof Element)) {
      return true;
    }
    if (element.querySelector("br")) {
      return false;
    }
    const text = String(element.textContent || "").replace(/\u00a0/g, " ").trim();
    return !text;
  };

  let changed = true;
  while (changed) {
    changed = false;

    root.querySelectorAll("mark mark").forEach((node) => {
      unwrapElement(node);
      changed = true;
    });

    root.querySelectorAll("span span").forEach((node) => {
      const parent = node.parentElement;
      if (!(parent instanceof Element)) {
        return;
      }
      const parentKey = getSemanticStyleKey(parent);
      const childKey = getSemanticStyleKey(node);
      if (parentKey && childKey && parentKey === childKey) {
        unwrapElement(node);
        changed = true;
      }
    });

    root.querySelectorAll("span,mark,strong,em,u,code,a").forEach((node) => {
      if (isWrapperVisuallyEmpty(node)) {
        node.remove();
        changed = true;
      }
    });

    root.querySelectorAll("*").forEach((parent) => {
      if (!(parent instanceof Element)) {
        return;
      }
      let child = parent.firstChild;
      while (child) {
        const next = child.nextSibling;
        if (
          child instanceof Element &&
          next instanceof Element &&
          getSemanticStyleKey(child) &&
          getSemanticStyleKey(child) === getSemanticStyleKey(next)
        ) {
          while (next.firstChild) {
            child.appendChild(next.firstChild);
          }
          next.remove();
          changed = true;
          continue;
        }
        child = next;
      }
    });
  }

  root.normalize();

  const normalized = root.innerHTML.trim();
  return normalized;
}

function serializeRichEditableContent(rawHtml) {
  const normalized = normalizeRichEditableHtml(rawHtml);
  return normalized ? `${RICH_HTML_STORAGE_PREFIX}${normalized}` : "";
}

function nl2br(value) {
  return String(value).replaceAll("\n", "<br>");
}

function renderMarkdown(value) {
  const lines = String(value || "").split(/\r?\n/);
  if (!lines.length) {
    return "<p>Sin contenido.</p>";
  }
  const html = [];
  let inList = false;
  const flushList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderMarkdownInline(listMatch[1])}</li>`);
      return;
    }
    flushList();
    if (/^###\s+/.test(trimmed)) {
      html.push(`<h5>${renderMarkdownInline(trimmed.replace(/^###\s+/, ""))}</h5>`);
      return;
    }
    if (/^##\s+/.test(trimmed)) {
      html.push(`<h4>${renderMarkdownInline(trimmed.replace(/^##\s+/, ""))}</h4>`);
      return;
    }
    if (/^#\s+/.test(trimmed)) {
      html.push(`<h3>${renderMarkdownInline(trimmed.replace(/^#\s+/, ""))}</h3>`);
      return;
    }
    if (/^>\s+/.test(trimmed)) {
      html.push(`<blockquote>${renderMarkdownInline(trimmed.replace(/^>\s+/, ""))}</blockquote>`);
      return;
    }
    html.push(`<p>${renderMarkdownInline(trimmed)}</p>`);
  });
  flushList();
  return html.join("") || "<p>Sin contenido.</p>";
}

function extractStylePropertyValue(styleRaw, property) {
  const source = String(styleRaw || "");
  if (!source) {
    return "";
  }
  const pattern = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, "i");
  const match = source.match(pattern);
  return match ? String(match[1] || "").trim() : "";
}

function extractColorTokenFromCssValue(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }
  const direct = sanitizeCssColor(value, "");
  if (direct) {
    return direct;
  }
  const rgbMatch = value.match(/rgba?\([^)]+\)/i);
  if (rgbMatch) {
    const rgbColor = sanitizeCssColor(rgbMatch[0], "");
    if (rgbColor) {
      return rgbColor;
    }
  }
  const hexMatch = value.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})/i);
  if (hexMatch) {
    const hexColor = sanitizeCssColor(hexMatch[0], "");
    if (hexColor) {
      return hexColor;
    }
  }
  const namedMatch = value.match(/\b[a-z]{3,20}\b/i);
  if (namedMatch) {
    const namedColor = sanitizeCssColor(namedMatch[0], "");
    if (namedColor) {
      return namedColor;
    }
  }
  return "";
}

function normalizeColorTokenKey(color) {
  const token = sanitizeCssColor(color, "");
  if (!token) {
    return "";
  }
  const rgb = parseColorTokenToRgbTriplet(token);
  if (rgb) {
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  }
  return token.toLowerCase().replace(/\s+/g, "");
}

function plainTextToParagraphsHtml(raw) {
  const source = String(raw || "").replace(/\r\n/g, "\n");
  if (!source.trim()) {
    return "";
  }
  const blocks = source
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const htmlBlocks = blocks.map((chunk) => `<p>${escapeHtml(chunk).replace(/\n/g, "<br>")}</p>`);
  return htmlBlocks.join("");
}

function richStoredValueToPlainText(raw) {
  const value = String(raw || "");
  if (!value) {
    return "";
  }
  if (!isRichHtmlStoredValue(value)) {
    return value;
  }
  const root = document.createElement("div");
  root.innerHTML = normalizeRichEditableHtml(decodeStoredRichHtml(value));
  const text = typeof root.innerText === "string" ? root.innerText : String(root.textContent || "");
  return text.replace(/\r\n/g, "\n").trim();
}

function containsLegacyInlineSyntax(raw) {
  const text = String(raw || "");
  if (!text) {
    return false;
  }
  return /(\{\{(?:bg|c|u):|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*|(^|[^*])\*[^*]+\*(?!\*)|(^|[^_])_[^_]+_(?!_))/m.test(text);
}

function expandLegacyInlineSyntaxInElement(root) {
  if (!(root instanceof HTMLElement)) {
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets = [];
  let current = walker.nextNode();
  while (current) {
    const node = current;
    const text = String(node.textContent || "");
    if (text.trim() && containsLegacyInlineSyntax(text)) {
      const parentTag = node.parentElement?.tagName?.toLowerCase() || "";
      if (!["script", "style", "code"].includes(parentTag)) {
        targets.push(node);
      }
    }
    current = walker.nextNode();
  }
  targets.forEach((node) => {
    if (!node.parentNode) {
      return;
    }
    const holder = document.createElement("span");
    holder.innerHTML = renderMarkdownInline(String(node.textContent || ""));
    const fragment = document.createDocumentFragment();
    while (holder.firstChild) {
      fragment.appendChild(holder.firstChild);
    }
    node.parentNode.replaceChild(fragment, node);
  });
}

function coerceRichFieldValue(raw, options = {}) {
  const migrateLegacy = options.migrateLegacy !== false;
  const value = String(raw || "");
  if (!value.trim()) {
    return "";
  }
  if (isRichHtmlStoredValue(value)) {
    const decoded = decodeStoredRichHtml(value);
    if (!migrateLegacy) {
      return serializeRichEditableContent(decoded);
    }
    const root = document.createElement("div");
    root.innerHTML = normalizeRichEditableHtml(decoded);
    expandLegacyInlineSyntaxInElement(root);
    return serializeRichEditableContent(root.innerHTML);
  }
  if (migrateLegacy && (containsLegacyInlineSyntax(value) || hasMarkdownSyntax(value))) {
    return serializeRichEditableContent(renderMarkdown(value));
  }
  return serializeRichEditableContent(plainTextToParagraphsHtml(value));
}

function getInlineTextColorToken(element) {
  if (!(element instanceof Element)) {
    return "";
  }
  const dataColor = sanitizeCssColor(element.getAttribute("data-md-color"), "");
  if (dataColor) {
    return dataColor;
  }
  const inlineStyle = element.getAttribute("style") || "";
  const styleColor = extractStylePropertyValue(inlineStyle, "color");
  const attrColor = element.getAttribute("color") || "";
  const color = extractColorTokenFromCssValue(styleColor || attrColor);
  return color || "";
}

function elementHasUnderlineDecoration(element) {
  if (!(element instanceof Element)) {
    return false;
  }
  const tag = element.tagName.toLowerCase();
  if (tag === "u") {
    return true;
  }
  const inlineStyle = element.getAttribute("style") || "";
  const textDecoration = extractStylePropertyValue(inlineStyle, "text-decoration");
  const textDecorationLine = extractStylePropertyValue(inlineStyle, "text-decoration-line");
  const source = `${textDecoration} ${textDecorationLine}`.toLowerCase();
  return source.includes("underline");
}

function getInlineUnderlineColorToken(element) {
  if (!(element instanceof Element)) {
    return "";
  }
  const dataColor = sanitizeCssColor(element.getAttribute("data-md-underline"), "");
  if (dataColor) {
    return dataColor;
  }
  const inlineStyle = element.getAttribute("style") || "";
  const decorationColor = extractStylePropertyValue(inlineStyle, "text-decoration-color");
  const decorationShorthand = extractStylePropertyValue(inlineStyle, "text-decoration");
  const fallbackColor = extractStylePropertyValue(inlineStyle, "color");
  const parsedDecorationColor = extractColorTokenFromCssValue(decorationColor || decorationShorthand);
  const color = sanitizeCssColor(parsedDecorationColor || fallbackColor, "currentColor");
  return color || "currentColor";
}

function getInlineHighlightColorToken(element) {
  if (!(element instanceof Element)) {
    return "";
  }
  const dataColor = sanitizeCssColor(element.getAttribute("data-md-highlight"), "");
  if (dataColor) {
    return dataColor;
  }
  const inlineStyle = element.getAttribute("style") || "";
  const styleBackgroundColor = extractStylePropertyValue(inlineStyle, "background-color");
  const styleBackground = extractStylePropertyValue(inlineStyle, "background");
  const attrBackground = element.getAttribute("bgcolor") || "";
  const parsedBackgroundColor = extractColorTokenFromCssValue(styleBackgroundColor || styleBackground || attrBackground);
  const color = sanitizeCssColor(parsedBackgroundColor, "");
  return color || "";
}

function rangeMatchesElementContent(range, element) {
  if (!(range instanceof Range) || !(element instanceof Element)) {
    return false;
  }
  const selectedText = String(range.toString() || "").trim();
  const elementText = String(element.textContent || "").trim();
  if (selectedText && elementText && selectedText === elementText) {
    return true;
  }
  const elementRange = document.createRange();
  elementRange.selectNodeContents(element);
  const startsEqual = range.compareBoundaryPoints(Range.START_TO_START, elementRange) === 0;
  const endsEqual = range.compareBoundaryPoints(Range.END_TO_END, elementRange) === 0;
  elementRange.detach?.();
  return startsEqual && endsEqual;
}

function findStyledAncestorForSelection(target, predicate) {
  const range = getActiveSelectionRangeForRichTarget(target);
  if (!range || range.collapsed) {
    return null;
  }
  let node = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }
  let current = node instanceof Element ? node : null;
  while (current && current !== target) {
    if (predicate(current) && rangeMatchesElementContent(range, current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function unwrapElementKeepChildren(element) {
  if (!(element instanceof Element) || !element.parentNode) {
    return;
  }
  const parent = element.parentNode;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function richInlineNodeToMarkdown(node, inheritedStyles = { color: "", underline: "", highlight: "" }) {
  if (node.nodeType === Node.TEXT_NODE) {
    return String(node.textContent || "").replace(/\u00a0/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }
  const element = node;
  const tag = element.tagName.toLowerCase();
  const ownColor = getInlineTextColorToken(element);
  const hasOwnUnderline = elementHasUnderlineDecoration(element);
  const ownUnderline = hasOwnUnderline ? getInlineUnderlineColorToken(element) : "";
  const ownHighlight = getInlineHighlightColorToken(element);
  const nextInherited = {
    color: ownColor || inheritedStyles.color || "",
    underline: ownUnderline || inheritedStyles.underline || "",
    highlight: ownHighlight || inheritedStyles.highlight || "",
  };
  const inner = Array.from(element.childNodes)
    .map((child) => richInlineNodeToMarkdown(child, nextInherited))
    .join("");
  if (tag === "br") {
    return "\n";
  }
  let value = inner;
  if (tag === "strong" || tag === "b") {
    value = `**${value}**`;
  }
  if (tag === "em" || tag === "i") {
    value = `*${value}*`;
  }
  if (tag === "code") {
    value = `\`${value}\``;
  }
  if (tag === "a") {
    const href = element.getAttribute("href") || "";
    const label = value || href;
    value = href ? `[${label}](${href})` : label;
  }

  const hasHighlightChange = Boolean(ownHighlight) && normalizeColorTokenKey(ownHighlight) !== normalizeColorTokenKey(inheritedStyles.highlight);
  const ownUnderlineToken = ownUnderline || "currentColor";
  const hasUnderlineChange =
    Boolean(hasOwnUnderline) && normalizeColorTokenKey(ownUnderlineToken) !== normalizeColorTokenKey(inheritedStyles.underline || "");
  const hasColorChange = Boolean(ownColor) && normalizeColorTokenKey(ownColor) !== normalizeColorTokenKey(inheritedStyles.color);

  if (hasHighlightChange) {
    value = `{{bg:${ownHighlight}|${value}}}`;
  }
  if (hasColorChange) {
    value = `{{c:${ownColor}|${value}}}`;
  }
  if (hasUnderlineChange) {
    value = `{{u:${ownUnderlineToken}|${value}}}`;
  }
  return value;
}

function richBlockNodeToMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return String(node.textContent || "").replace(/\u00a0/g, " ").trim();
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }
  const element = node;
  const tag = element.tagName.toLowerCase();
  if (tag === "ul") {
    const items = Array.from(element.children)
      .filter((child) => child.tagName && child.tagName.toLowerCase() === "li")
      .map((li) => `- ${Array.from(li.childNodes).map((child) => richInlineNodeToMarkdown(child)).join("").trim()}`)
      .filter(Boolean);
    return items.join("\n");
  }
  if (tag === "ol") {
    const items = Array.from(element.children)
      .filter((child) => child.tagName && child.tagName.toLowerCase() === "li")
      .map((li, index) => `${index + 1}. ${Array.from(li.childNodes).map((child) => richInlineNodeToMarkdown(child)).join("").trim()}`)
      .filter(Boolean);
    return items.join("\n");
  }
  if (tag === "blockquote") {
    const quoteText = Array.from(element.childNodes).map((child) => richInlineNodeToMarkdown(child)).join("").trim();
    if (!quoteText) {
      return "";
    }
    return quoteText
      .split(/\r?\n/)
      .map((line) => `> ${line}`)
      .join("\n");
  }
  if (tag === "h1") {
    return `# ${Array.from(element.childNodes).map((child) => richInlineNodeToMarkdown(child)).join("").trim()}`;
  }
  if (tag === "h2") {
    return `## ${Array.from(element.childNodes).map((child) => richInlineNodeToMarkdown(child)).join("").trim()}`;
  }
  if (tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
    return `### ${Array.from(element.childNodes).map((child) => richInlineNodeToMarkdown(child)).join("").trim()}`;
  }
  return Array.from(element.childNodes).map((child) => richInlineNodeToMarkdown(child)).join("").trim();
}

function richHtmlToMarkdown(html) {
  const root = document.createElement("div");
  root.innerHTML = String(html || "");
  const blocks = Array.from(root.childNodes)
    .map((node) => richBlockNodeToMarkdown(node))
    .map((value) => String(value || "").trimEnd())
    .filter(Boolean);
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function getCaretOffsetWithin(element) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer)) {
    return null;
  }
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length;
}

function setCaretOffsetWithin(element, offset) {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  let remaining = Math.max(0, Number(offset) || 0);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();
  while (textNode) {
    const length = String(textNode.textContent || "").length;
    if (remaining <= length) {
      const range = document.createRange();
      range.setStart(textNode, remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= length;
    textNode = walker.nextNode();
  }
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function renderMarkdownInlineBasic(raw) {
  let text = escapeHtml(raw);
  const codeTokens = [];
  text = text.replace(/`([^`]+)`/g, (_match, code) => {
    const token = `%%CODETOKEN${codeTokens.length}%%`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );
  text = text.replace(/(\*\*|__)([\s\S]+?)\1/g, (_match, _marker, content) => `<strong>${content}</strong>`);
  text = text.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, (_match, prefix, content) => `${prefix}<em>${content}</em>`);
  text = text.replace(/(^|[^_])_([^_]+?)_(?!_)/g, (_match, prefix, content) => `${prefix}<em>${content}</em>`);
  text = text.replace(/%%CODETOKEN(\d+)%%/g, (_match, index) => codeTokens[Number(index)] || "");
  return text;
}

function parseCustomInlineToken(source, startIndex) {
  if (!String(source).startsWith("{{", startIndex)) {
    return null;
  }
  const colonIndex = source.indexOf(":", startIndex + 2);
  if (colonIndex === -1) {
    return null;
  }
  const type = source.slice(startIndex + 2, colonIndex).trim().toLowerCase();
  if (!["bg", "c", "u"].includes(type)) {
    return null;
  }
  const pipeIndex = source.indexOf("|", colonIndex + 1);
  if (pipeIndex === -1) {
    return null;
  }
  const colorRaw = source.slice(colonIndex + 1, pipeIndex).trim();
  let depth = 1;
  let cursor = pipeIndex + 1;
  while (cursor < source.length) {
    if (source.startsWith("{{", cursor)) {
      depth += 1;
      cursor += 2;
      continue;
    }
    if (source.startsWith("}}", cursor)) {
      depth -= 1;
      if (depth === 0) {
        return {
          type,
          colorRaw,
          contentRaw: source.slice(pipeIndex + 1, cursor),
          endIndex: cursor + 2,
        };
      }
      cursor += 2;
      continue;
    }
    cursor += 1;
  }
  return null;
}

function renderCustomInlineToken(token) {
  const innerHtml = renderMarkdownInline(token.contentRaw);
  if (token.type === "bg") {
    const color = sanitizeCssColor(token.colorRaw, "");
    if (!color) {
      return innerHtml;
    }
    return `<mark data-md-highlight="${escapeAttribute(color)}" style="background-color: ${escapeAttribute(color)};">${innerHtml}</mark>`;
  }
  if (token.type === "c") {
    const color = sanitizeCssColor(token.colorRaw, "");
    if (!color) {
      return innerHtml;
    }
    return `<span data-md-color="${escapeAttribute(color)}" style="color: ${escapeAttribute(color)};">${innerHtml}</span>`;
  }
  if (token.type === "u") {
    const color = sanitizeCssColor(token.colorRaw, "currentColor");
    return `<span data-md-underline="${escapeAttribute(color)}" style="text-decoration-line: underline; text-decoration-color: ${escapeAttribute(color)};">${innerHtml}</span>`;
  }
  return innerHtml;
}

function renderMarkdownInline(raw) {
  const source = String(raw || "");
  if (!source) {
    return "";
  }
  let html = "";
  let plainBuffer = "";
  const flushPlain = () => {
    if (!plainBuffer) {
      return;
    }
    html += renderMarkdownInlineBasic(plainBuffer);
    plainBuffer = "";
  };
  let cursor = 0;
  while (cursor < source.length) {
    const token = parseCustomInlineToken(source, cursor);
    if (token) {
      flushPlain();
      html += renderCustomInlineToken(token);
      cursor = token.endIndex;
      continue;
    }
    plainBuffer += source[cursor];
    cursor += 1;
  }
  flushPlain();
  return html;
}

function hasMarkdownSyntax(raw) {
  const text = String(raw || "");
  if (!text.trim()) {
    return false;
  }
  return /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|(^|\n)\s{0,3}(#{1,3}|> |- ))/.test(text);
}

function buildMarkdownPreviewHtml(raw) {
  const text = String(raw || "");
  if (!text.trim()) {
    return "";
  }
  if (isRichHtmlStoredValue(text)) {
    return normalizeRichEditableHtml(decodeStoredRichHtml(text));
  }
  return plainTextToParagraphsHtml(text);
}

function setMarkdownPreviewContent(element, raw, emptyLabel = "Sin notas") {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  const html = buildMarkdownPreviewHtml(raw);
  if (isRichMarkdownEditableTarget(element)) {
    element.innerHTML = html || "";
  } else {
    element.innerHTML = html || `<p class="empty-side">${escapeHtml(emptyLabel)}.</p>`;
  }
  element.classList.remove("hidden");
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
      const selector =
        `[data-extra-block-field="${field}"][data-extra-block-tutorial-id="${tutorialId}"][data-extra-block-id="${blockId}"], ` +
        `[data-extra-block-field="${field}"][data-extra-block-tutorial-id="${tutorialId}"][data-extra-block-note-id="${blockId}"]`;
      const editor = refs.detailPanel.querySelector(selector);
      if (editor instanceof HTMLInputElement || editor instanceof HTMLTextAreaElement || editor instanceof HTMLSelectElement) {
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

function buildTutorialsSignature(list) {
  if (!Array.isArray(list) || !list.length) {
    return "";
  }
  return list
    .map((item) => {
      const id = String(item?.id || "").trim();
      const updatedAt = String(item?.updatedAt || item?.updated_at || "").trim();
      return `${id}:${updatedAt}`;
    })
    .sort()
    .join("|");
}

async function applyTutorialListFromServer(apiTutorials) {
  const normalizedPairs = (Array.isArray(apiTutorials) ? apiTutorials : []).map((rawTutorial) => ({
    rawTutorial,
    normalized: normalizeTutorial(rawTutorial),
  }));
  const nextTutorials = normalizedPairs.map((pair) => pair.normalized);
  const nextSignature = buildTutorialsSignature(nextTutorials);
  if (nextSignature === state.tutorialsSignature) {
    return false;
  }
  state.tutorials = nextTutorials;
  state.tutorialsSignature = nextSignature;
  await persistRichContentMigrationIfNeeded(normalizedPairs);
  pruneSelection();
  if (!state.selectedId || !state.tutorials.some((t) => t.id === state.selectedId)) {
    state.selectedId = state.tutorials[0]?.id || null;
  }
  if (state.page === "tutorial" && !state.selectedId) {
    state.page = "library";
  }
  syncRouteToLocation(true);
  checkAndNotifyReminders();
  return true;
}

async function refreshTutorials(options = {}) {
  if (!state.currentUser) {
    return;
  }
  const silent = Boolean(options?.silent);
  if (!silent) {
    setSyncStatus("Sincronizando con el servidor...");
  }
  try {
    const apiTutorials = await apiListTutorials();
    await applyTutorialListFromServer(apiTutorials);
    if (!silent) {
      setSyncStatus(`Sincronizado · ${new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`);
    }
  } catch (error) {
    if (!silent) {
      setSyncStatus(resolveError(error, "No se pudo conectar con el backend."), true);
    }
  } finally {
    syncStorageSettingsUi();
    render();
  }
}

async function persistRichContentMigrationIfNeeded(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) {
    return;
  }
  const updates = pairs.filter(({ rawTutorial, normalized }) => {
    if (!rawTutorial || !normalized) {
      return false;
    }
    const rawNotes = typeof rawTutorial.notes === "string" ? rawTutorial.notes : "";
    const rawTextContent = typeof rawTutorial.textContent === "string" ? rawTutorial.textContent : "";
    const rawExtra = normalizeExtraContentBlocks(rawTutorial.extraContent, resolveTutorialNotesSide(normalized));
    if (String(rawNotes) !== String(normalized.notes || "")) {
      return true;
    }
    if (String(rawTextContent) !== String(normalized.textContent || "")) {
      return true;
    }
    if (JSON.stringify(rawExtra) !== JSON.stringify(normalized.extraContent || [])) {
      return true;
    }
    return false;
  });

  if (!updates.length) {
    return;
  }

  for (const { normalized } of updates) {
    try {
      const payload = {
        ...normalized,
        updatedAt: new Date().toISOString(),
      };
      await apiUpdateTutorial(normalized.id, payload);
      const local = state.tutorials.find((item) => item.id === normalized.id);
      if (local) {
        local.notes = payload.notes;
        local.textContent = payload.textContent;
        local.extraContent = payload.extraContent;
        local.updatedAt = payload.updatedAt;
      }
    } catch (error) {
      console.warn("No se pudo persistir migracion rich para", normalized.id, error);
    }
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

function normalizeExtraContentBlocks(value, noteSideFallback = state.notesSide) {
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
      const note = coerceRichFieldValue(typeof item.note === "string" ? item.note : "");
      const noteSide = normalizeNoteSide(item.noteSide, noteSideFallback);
      const createdAt = typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString();
      if (type === "text") {
        const text = coerceRichFieldValue(typeof item.text === "string" ? item.text : "");
        if (!text.trim()) {
          return null;
        }
        return { id, type, text, caption, note, noteSide, createdAt };
      }
      const url = typeof item.url === "string" ? item.url : "";
      if (!url.trim()) {
        return null;
      }
      const timestamps = type === "video" ? normalizeTimestampEntries(item.timestamps) : [];
      return { id, type, url, caption, note, noteSide, timestamps, createdAt };
    })
    .filter(Boolean)
    .slice(0, 60);
}

function normalizeTutorial(item) {
  const now = new Date().toISOString();
  const notesSide = normalizeNoteSide(item.notesSide, state.notesSide);
  return {
    id: typeof item.id === "string" ? item.id : createId(),
    title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Sin titulo",
    type: item.type === "video" || item.type === "image" || item.type === "text" ? item.type : "text",
    source: typeof item.source === "string" ? item.source : "manual",
    url: typeof item.url === "string" ? item.url : "",
    normalizedUrl: normalizeUrl(typeof item.url === "string" ? item.url : ""),
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
    textContent: coerceRichFieldValue(typeof item.textContent === "string" ? item.textContent : ""),
    category: typeof item.category === "string" ? item.category : "",
    collection: typeof item.collection === "string" ? item.collection : "",
    status: STATUS_ORDER.includes(item.status) ? item.status : "Por ver",
    priority: ["Alta", "Media", "Baja"].includes(item.priority) ? item.priority : "Media",
    isFavorite: Boolean(item.isFavorite),
    reviewDate: typeof item.reviewDate === "string" ? item.reviewDate : "",
    tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === "string") : [],
    notes: coerceRichFieldValue(typeof item.notes === "string" ? item.notes : ""),
    timestamps: Array.isArray(item.timestamps) ? item.timestamps.filter((entry) => typeof entry === "string") : [],
    emoji: normalizeEmoji(item.emoji),
    emojiColor: normalizeEmojiColor(item.emojiColor, "default"),
    notesSide,
    extraContent: normalizeExtraContentBlocks(item.extraContent, notesSide),
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

async function apiClientConfig() {
  return requestJson(`${API_BASE}/client-config`);
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

async function apiGetSettings() {
  return requestJson(`${API_BASE}/settings`);
}

async function apiUpdateSettings(payload) {
  return requestJson(`${API_BASE}/settings`, { method: "PUT", body: payload });
}

async function apiCreateLocalFolder(pathValue) {
  return requestJson(`${API_BASE}/settings/local-folder`, { method: "POST", body: { path: pathValue } });
}

async function apiPickFolder(description = "") {
  return requestJson(`${API_BASE}/settings/pick-folder`, { method: "POST", body: { description } });
}

async function apiConnectCloudProvider(provider, accountName) {
  return requestJson(`${API_BASE}/settings/cloud/connect`, {
    method: "POST",
    body: {
      provider,
      accountName,
    },
  });
}

async function apiDisconnectCloudProvider() {
  return requestJson(`${API_BASE}/settings/cloud/disconnect`, { method: "POST" });
}

async function apiRunStorageSync() {
  return requestJson(`${API_BASE}/sync/run`, { method: "POST" });
}

function apiUploadFile(file, onProgress, options = {}) {
  return new Promise((resolve, reject) => {
    const payload = new FormData();
    payload.append("file", file);
    if (options && typeof options === "object" && typeof options.tutorialId === "string" && options.tutorialId.trim()) {
      payload.append("tutorialId", options.tutorialId.trim());
    }

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
  const method = String(options.method || "GET").toUpperCase();
  const init = { method, headers: {}, credentials: "include" };
  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const isAuthMeEndpoint = /\/auth\/me$/i.test(url);
  const isAuthMutationEndpoint = /\/auth\/(login|register|logout)$/i.test(url);
  const shouldRetryByMethod = method === "GET";
  const maxAttempts = isAuthMeEndpoint ? 6 : shouldRetryByMethod || isAuthMutationEndpoint ? 2 : 1;
  let lastNetworkError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const body = await readResponseBody(response);

      if (!response.ok) {
        const isRetryableStatus =
          response.status === 408 ||
          response.status === 425 ||
          response.status === 429 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;
        if (isRetryableStatus && attempt < maxAttempts) {
          await waitMs(getRetryDelayMs(attempt, isAuthMeEndpoint, response));
          continue;
        }

        if (response.status === 401 && !url.includes("/auth/")) {
          setAuthenticated(null);
          setAuthMessage("Sesion expirada. Vuelve a iniciar sesion.", true);
        }
        const retryAfterHeader = Number(response.headers.get("Retry-After") || 0);
        const message =
          body && typeof body === "object" && "error" in body && body.error
            ? body.error
            : response.status === 429 && retryAfterHeader > 0
              ? `Demasiados intentos. Espera ${retryAfterHeader}s e intenta nuevamente.`
              : `Error de red (${response.status})`;
        throw createRequestError(String(message), {
          status: response.status,
          retryable: isRetryableStatus,
        });
      }
      return body;
    } catch (error) {
      lastNetworkError = error;
      if (attempt < maxAttempts && shouldRetryRequestError(error)) {
        await waitMs(getRetryDelayMs(attempt, isAuthMeEndpoint));
        continue;
      }
      throw error;
    }
  }

  throw lastNetworkError || new Error("No se pudo completar la solicitud.");
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

function waitMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
  });
}

function getRetryDelayMs(attempt, isAuthEndpoint = false, response = null) {
  if (response && Number(response.status) === 429) {
    const retryAfter = Number(response.headers.get("Retry-After") || 0);
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      return retryAfter * 1000;
    }
  }
  if (isAuthEndpoint) {
    const schedule = [1000, 2000, 4000, 6000, 8000];
    return schedule[Math.max(0, attempt - 1)] || 9000;
  }
  return 900 * Math.max(1, attempt);
}

function createRequestError(message, details = {}) {
  const error = new Error(String(message || "Solicitud fallida."));
  if (details && typeof details === "object") {
    if ("status" in details) {
      error.status = Number(details.status) || 0;
    }
    error.retryable = Boolean(details.retryable);
  }
  return error;
}

function shouldRetryRequestError(error) {
  if (!error) {
    return false;
  }
  if (error.retryable === true) {
    return true;
  }
  if (typeof error.status === "number") {
    return false;
  }
  return error instanceof TypeError;
}
