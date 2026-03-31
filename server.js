const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3");
const execFileAsync = promisify(execFile);

loadEnvironmentFromFile();

const PORT = Number(process.env.PORT) || 3000;
const APP_DATA_ROOT = resolveAppDataRoot();
const DB_DIR = path.join(APP_DATA_ROOT, "data");
const DB_PATH = path.join(DB_DIR, "tutorials.db");
const UPLOAD_DIR = path.join(APP_DATA_ROOT, "uploads");
const SESSION_COOKIE_NAME = "tv_session";
const SESSION_DURATION_DAYS = 30;
const MAX_UPLOAD_BYTES = readPositiveBytesEnv(process.env.MAX_UPLOAD_BYTES, 5 * 1024 * 1024 * 1024);
const MAX_UPLOAD_LABEL = formatBytesForHumans(MAX_UPLOAD_BYTES);
const COOKIE_SECURE = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "1";
const APP_ORIGIN = asTrimmedString(process.env.APP_ORIGIN);
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.ALLOWED_ORIGINS, APP_ORIGIN);
const TRUST_PROXY = process.env.TRUST_PROXY === "1" || process.env.NODE_ENV === "production";
const REVIEW_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 20;
const UPLOAD_RATE_LIMIT_WINDOW_MS = Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000;
const UPLOAD_RATE_LIMIT_MAX = Number(process.env.UPLOAD_RATE_LIMIT_MAX) || 30;
const IMPORT_RATE_LIMIT_WINDOW_MS = Number(process.env.IMPORT_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000;
const IMPORT_RATE_LIMIT_MAX = Number(process.env.IMPORT_RATE_LIMIT_MAX) || 8;

const STATUS_ORDER = ["Por ver", "En progreso", "Aplicado", "Archivado"];
const PRIORITY_OPTIONS = ["Alta", "Media", "Baja"];
const TYPE_OPTIONS = ["video", "image", "text"];
const SOURCE_OPTIONS = ["youtube", "instagram", "manual"];
const EMOJI_COLOR_OPTIONS = ["default", "blue", "red", "green", "yellow", "purple", "orange"];
const STORAGE_MODE_OPTIONS = ["device", "cloud", "peer", "hybrid"];
const CLOUD_PROVIDER_OPTIONS = ["none", "google_drive", "one_drive", "dropbox", "supabase"];
const GOOGLE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];
const GOOGLE_DIAGNOSTIC_SCOPES = ["openid", "email", "profile"];
const GOOGLE_CLIENT_ID = asTrimmedString(process.env.GOOGLE_CLIENT_ID);
const GOOGLE_CLIENT_SECRET = asTrimmedString(process.env.GOOGLE_CLIENT_SECRET);
const GOOGLE_REDIRECT_URI = asTrimmedString(process.env.GOOGLE_REDIRECT_URI);
const GOOGLE_OAUTH_SCOPES = normalizeOauthScopes(process.env.GOOGLE_OAUTH_SCOPES, GOOGLE_DEFAULT_SCOPES);
const SUPABASE_URL = asTrimmedString(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = asTrimmedString(process.env.SUPABASE_SERVICE_ROLE_KEY);
const SUPABASE_BUCKET = normalizeSupabaseBucketId(asTrimmedString(process.env.SUPABASE_BUCKET) || "trazo-tutorials");
const SUPABASE_AUTH_SNAPSHOT_OBJECT = asTrimmedString(process.env.SUPABASE_AUTH_SNAPSHOT_OBJECT) || "_system/auth-state-v1.json";
const AUTH_SNAPSHOT_SAVE_DEBOUNCE_MS = Math.max(500, Number(process.env.AUTH_SNAPSHOT_SAVE_DEBOUNCE_MS) || 1500);
const AUTO_CLOUD_SYNC_READ_MS = Number(process.env.AUTO_CLOUD_SYNC_READ_MS) || 1000;
const CLOUD_MEDIA_TRANSFER_MAX_BYTES = readPositiveBytesEnv(
  process.env.CLOUD_MEDIA_TRANSFER_MAX_BYTES,
  100 * 1024 * 1024
);
const CLOUD_MEDIA_TRANSFER_MAX_LABEL = formatBytesForHumans(CLOUD_MEDIA_TRANSFER_MAX_BYTES);

const googleOauthStateStore = new Map();
const autoCloudSyncByUser = new Map();
const autoCloudSyncInFlightByUser = new Set();
const liveSseClientsByUser = new Map();
let authSnapshotSaveTimer = null;
let authSnapshotSaveInFlight = false;
let authSnapshotSavePending = false;
const TEXT_MIME_TYPES = new Set(["text/plain", "text/markdown", "text/x-markdown"]);
const TEXT_EXTENSIONS = new Set([".txt", ".md", ".markdown"]);
const MEDIA_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".mp4", ".webm", ".mov", ".m4v", ".ogg"]);

fs.mkdirSync(DB_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
const app = express();

app.disable("x-powered-by");
if (TRUST_PROXY) {
  app.set("trust proxy", 1);
}
app.use(applySecurityHeaders);
app.use(applyCorsHeaders);
app.use(express.json({ limit: "4mb" }));

const authRateLimiter = createRateLimiter({
  keyPrefix: "auth",
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  maxRequests: AUTH_RATE_LIMIT_MAX,
  buildKey: (req) => buildAuthRateLimitKey(req),
  errorMessage: "Demasiados intentos de autenticacion. Intenta nuevamente en unos minutos.",
});

const uploadRateLimiter = createRateLimiter({
  keyPrefix: "upload",
  windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS,
  maxRequests: UPLOAD_RATE_LIMIT_MAX,
  buildKey: (req) => req.authUser?.id || getClientIp(req),
  errorMessage: "Demasiadas subidas en poco tiempo. Espera un momento.",
});

const importRateLimiter = createRateLimiter({
  keyPrefix: "import",
  windowMs: IMPORT_RATE_LIMIT_WINDOW_MS,
  maxRequests: IMPORT_RATE_LIMIT_MAX,
  buildKey: (req) => req.authUser?.id || getClientIp(req),
  errorMessage: "Demasiadas importaciones en poco tiempo. Espera un momento.",
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, UPLOAD_DIR),
    filename: (_req, file, callback) => {
      const ext = sanitizeExtension(file.originalname);
      const fileName = `${Date.now()}-${crypto.randomBytes(10).toString("hex")}${ext}`;
      callback(null, fileName);
    },
  }),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (isSupportedUploadFile(file)) {
      callback(null, true);
      return;
    }
    callback(new UploadValidationError("Tipo de archivo no soportado. Usa imagen, video o texto."));
  },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "tutorial-vault-api" });
});

app.get("/api/client-config", (_req, res) => {
  res.json({
    maxUploadBytes: MAX_UPLOAD_BYTES,
    maxUploadLabel: MAX_UPLOAD_LABEL,
    cloudMediaTransferMaxBytes: CLOUD_MEDIA_TRANSFER_MAX_BYTES,
    cloudMediaTransferMaxLabel: CLOUD_MEDIA_TRANSFER_MAX_LABEL,
  });
});

app.post(
  "/api/auth/register",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = asTrimmedString(req.body?.password);

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Email invalido." });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "La clave debe tener al menos 8 caracteres." });
      return;
    }

    const exists = await getAsync("SELECT id FROM users WHERE email = ?", [email]);
    if (exists) {
      res.status(409).json({ error: "Ese email ya esta registrado." });
      return;
    }

    const now = new Date().toISOString();
    const userId = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);

    await runAsync(
      "INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)",
      [userId, email, passwordHash, salt, now]
    );
    markAuthStateSnapshotDirty("register_user");

    const token = await createSession(userId);
    setSessionCookie(res, token);
    authRateLimiter.clear?.(req);

    res.status(201).json({ user: { id: userId, email } });
  })
);

app.post(
  "/api/auth/login",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = asTrimmedString(req.body?.password);

    if (!email || !password) {
      res.status(400).json({ error: "Email y clave son obligatorios." });
      return;
    }

    const user = await getAsync("SELECT id, email, password_hash, password_salt FROM users WHERE email = ?", [email]);
    if (!user) {
      res.status(401).json({ error: "Credenciales invalidas." });
      return;
    }

    const expected = hashPassword(password, user.password_salt);
    if (!safeEqual(expected, user.password_hash)) {
      res.status(401).json({ error: "Credenciales invalidas." });
      return;
    }

    const token = await createSession(user.id);
    setSessionCookie(res, token);
    authRateLimiter.clear?.(req);
    res.json({ user: { id: user.id, email: user.email } });
  })
);

app.post(
  "/api/auth/logout",
  asyncHandler(async (req, res) => {
    const token = getSessionToken(req);
    if (token) {
      await runAsync("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
      markAuthStateSnapshotDirty("logout");
    }
    clearSessionCookie(res);
    res.status(204).end();
  })
);

app.get(
  "/api/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.authUser });
  })
);

app.get(
  "/oauth/google/start",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isGoogleOauthConfigured()) {
      res.status(500).send(
        renderOauthInfoHtml(
          "Google OAuth no esta configurado",
          "Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI en el backend."
        )
      );
      return;
    }

    const returnTo = normalizeReturnTo(req.query?.returnTo);
    const stateToken = createGoogleOauthState(req.authUser.id, returnTo, req.authUser.email);
    const authUrl = buildGoogleAuthorizeUrl(stateToken, GOOGLE_OAUTH_SCOPES, req.authUser.email);
    res.redirect(authUrl);
  })
);

app.get(
  "/oauth/google/diagnostic/start",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isGoogleOauthConfigured()) {
      res.status(500).send(
        renderOauthInfoHtml(
          "Google OAuth no esta configurado",
          "Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI en el backend."
        )
      );
      return;
    }

    const returnTo = normalizeReturnTo(req.query?.returnTo);
    const diagnosticMode = asTrimmedString(req.query?.mode).toLowerCase();
    const useDriveScopes = diagnosticMode === "drive";
    const flow = useDriveScopes ? "diagnostic_drive" : "diagnostic_basic";
    const requestedScopes = useDriveScopes ? GOOGLE_OAUTH_SCOPES : GOOGLE_DIAGNOSTIC_SCOPES;
    const stateToken = createGoogleOauthState(req.authUser.id, returnTo, req.authUser.email, flow);
    const authUrl = buildGoogleAuthorizeUrl(stateToken, requestedScopes, req.authUser.email);
    res.redirect(authUrl);
  })
);

app.get(
  "/oauth/google/callback",
  asyncHandler(async (req, res) => {
    const code = asTrimmedString(req.query?.code);
    const errorCode = asTrimmedString(req.query?.error);
    const errorDescription = asTrimmedString(req.query?.error_description);
    const stateToken = asTrimmedString(req.query?.state);
    const state = consumeGoogleOauthState(stateToken);
    const flowName = asTrimmedString(state?.flow);
    const isDiagnosticFlow = flowName.startsWith("diagnostic");

    if (!state) {
      res.status(400).send(
        renderOauthInfoHtml(
          "Sesion OAuth expirada",
          "Vuelve a abrir la conexion con Google desde Configuracion."
        )
      );
      return;
    }

    if (errorCode) {
      const oauthErrorMessage = buildOauthDiagnosticMessage(errorCode, errorDescription);
      if (isDiagnosticFlow) {
        res.status(400).send(renderOauthInfoHtml("Diagnostico OAuth fallido", oauthErrorMessage));
        return;
      }
      res.status(400).send(renderOauthInfoHtml("Google rechazo la autorizacion", oauthErrorMessage));
      return;
    }

    if (!code) {
      if (isDiagnosticFlow) {
        res.status(400).send(
          renderOauthInfoHtml("Diagnostico OAuth incompleto", "Google no devolvio 'code' en el callback.")
        );
        return;
      }
      res.redirect(normalizeReturnTo(state.returnTo));
      return;
    }

    if (!isGoogleOauthConfigured()) {
      if (isDiagnosticFlow) {
        res.status(500).send(
          renderOauthInfoHtml(
            "Google OAuth no esta configurado",
            "Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI en el backend."
          )
        );
        return;
      }
      res.redirect(normalizeReturnTo(state.returnTo));
      return;
    }

    let tokenPayload;
    try {
      tokenPayload = await exchangeGoogleAuthCodeForTokens(code);
    } catch (error) {
      const message = asTrimmedString(error?.message) || "No se pudo obtener token de Google.";
      const title = isDiagnosticFlow ? "Diagnostico OAuth fallido" : "No se pudo conectar con Google Drive";
      res.status(400).send(renderOauthInfoHtml(title, message));
      return;
    }
    if (isDiagnosticFlow) {
      const scopeText = asTrimmedString(tokenPayload.scope) || "(sin scope)";
      const expiresText = computeTokenExpiryIso(tokenPayload.expires_in) || "sin expiracion reportada";
      res.send(
        renderOauthInfoHtml(
          "Diagnostico OAuth OK",
          `Google devolvio token correctamente. Flujo: ${flowName || "diagnostic"}. Scope: ${scopeText}. Expira: ${expiresText}.`
        )
      );
      return;
    }

    const now = new Date().toISOString();
    const expiresAt = computeTokenExpiryIso(tokenPayload.expires_in);
    const accountName = sanitizeCloudAccountName(state.emailAlias);
    const markerPath = "google-drive-api";

    await runAsync(
      `UPDATE user_settings
       SET cloud_provider = ?, cloud_enabled = 1, cloud_connected = 1,
           cloud_account_name = ?, cloud_connected_at = ?, cloud_connection_marker = ?,
           cloud_access_token = ?, cloud_refresh_token = ?, cloud_token_expires_at = ?, cloud_scope = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        "google_drive",
        accountName,
        now,
        markerPath,
        asTrimmedString(tokenPayload.access_token),
        asTrimmedString(tokenPayload.refresh_token),
        expiresAt,
        asTrimmedString(tokenPayload.scope),
        now,
        state.userId,
      ]
    );

    await runAndRecordStorageSync(state.userId).catch((error) => logSyncError("oauth-google-callback", error));
    notifySettingsChanged(state.userId, "cloud_oauth");
    res.redirect(normalizeReturnTo(state.returnTo));
  })
);

app.get(
  "/api/settings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const settings = await getOrCreateUserSettings(req.authUser.id);
    res.json(settings);
  })
);

app.put(
  "/api/settings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const current = await getOrCreateUserSettings(req.authUser.id);
    const next = sanitizeUserSettingsPayload(req.body, current);
    const updatedAt = new Date().toISOString();
    await runAsync(
      `UPDATE user_settings
       SET storage_mode = ?, local_root_path = ?, cloud_root_path = ?, cloud_provider = ?, cloud_enabled = ?, peer_enabled = ?,
           cloud_connected = ?, cloud_account_name = ?, cloud_connected_at = ?, cloud_connection_marker = ?,
           sync_tutorial_ids = ?, setup_completed = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        next.storageMode,
        next.localRootPath,
        next.cloudRootPath,
        next.cloudProvider,
        next.cloudEnabled ? 1 : 0,
        next.peerEnabled ? 1 : 0,
        next.cloudConnected ? 1 : 0,
        next.cloudAccountName,
        next.cloudConnectedAt,
        next.cloudConnectionMarker,
        JSON.stringify(next.syncTutorialIds),
        next.setupCompleted ? 1 : 0,
        updatedAt,
        req.authUser.id,
      ]
    );
    if (next.cloudProvider === "none" || !next.cloudConnected) {
      await runAsync(
        `UPDATE user_settings
         SET cloud_access_token = '', cloud_refresh_token = '', cloud_token_expires_at = '', cloud_scope = ''
         WHERE user_id = ?`,
        [req.authUser.id]
      );
    }
    await runAndRecordStorageSync(req.authUser.id).catch((error) => logSyncError("settings-update", error));
    const settings = await getOrCreateUserSettings(req.authUser.id);
    notifySettingsChanged(req.authUser.id, "settings_update");
    res.json(settings);
  })
);

app.post(
  "/api/sync/run",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await runAndRecordStorageSync(req.authUser.id);
    const settings = await getOrCreateUserSettings(req.authUser.id);
    notifyTutorialsChanged(req.authUser.id, "sync");
    notifySettingsChanged(req.authUser.id, "sync");
    res.json({ ...result, settings });
  })
);

app.post(
  "/api/settings/cloud/connect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const current = await getOrCreateUserSettings(req.authUser.id);
    const provider = normalizeCloudProvider(req.body?.provider, current.cloudProvider);
    if (provider === "none") {
      res.status(400).json({ error: "Selecciona un proveedor de nube antes de conectar." });
      return;
    }
    if (provider === "supabase" && !isSupabaseConfigured()) {
      res.status(400).json({
        error:
          "Supabase no esta configurado en el backend. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.",
      });
      return;
    }

    const accountName =
      sanitizeCloudAccountName(req.body?.accountName) || sanitizeCloudAccountName(req.authUser.email.split("@")[0]);
    const now = new Date().toISOString();
    let markerPath = provider === "supabase" ? `supabase:${SUPABASE_BUCKET}` : "";
    if (provider !== "supabase" && current.cloudRootPath) {
      markerPath = writeCloudConnectionMarker(current.cloudRootPath, req.authUser.id, {
        provider,
        accountName,
        connectedAt: now,
      });
    }

    await runAsync(
      `UPDATE user_settings
       SET cloud_provider = ?, cloud_enabled = 1, cloud_connected = 1, cloud_account_name = ?, cloud_connected_at = ?, cloud_connection_marker = ?,
           cloud_access_token = '', cloud_refresh_token = '', cloud_token_expires_at = '', cloud_scope = '', updated_at = ?
       WHERE user_id = ?`,
      [provider, accountName, now, markerPath, now, req.authUser.id]
    );
    await runAndRecordStorageSync(req.authUser.id).catch((error) => logSyncError("cloud-connect", error));

    const settings = await getOrCreateUserSettings(req.authUser.id);
    notifySettingsChanged(req.authUser.id, "cloud_connect");
    res.json({ ...settings, simulatedConnection: false, markerPath });
  })
);

app.post(
  "/api/settings/cloud/disconnect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date().toISOString();
    await runAsync(
      `UPDATE user_settings
       SET cloud_connected = 0, cloud_account_name = '', cloud_connected_at = '', cloud_connection_marker = '', cloud_enabled = 0,
           cloud_access_token = '', cloud_refresh_token = '', cloud_token_expires_at = '', cloud_scope = '', updated_at = ?
       WHERE user_id = ?`,
      [now, req.authUser.id]
    );
    await runAndRecordStorageSync(req.authUser.id).catch((error) => logSyncError("cloud-disconnect", error));
    const settings = await getOrCreateUserSettings(req.authUser.id);
    notifySettingsChanged(req.authUser.id, "cloud_disconnect");
    res.json(settings);
  })
);

app.post(
  "/api/settings/local-folder",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawPath = asTrimmedString(req.body?.path);
    if (!rawPath) {
      res.status(400).json({ error: "Debes indicar una carpeta." });
      return;
    }
    const targetPath = resolveStoragePath(rawPath);
    fs.mkdirSync(targetPath, { recursive: true });
    const userPath = path.join(targetPath, safePathSegment(req.authUser.id));
    fs.mkdirSync(userPath, { recursive: true });
    res.json({ path: targetPath, userPath });
  })
);

app.post(
  "/api/settings/pick-folder",
  requireAuth,
  asyncHandler(async (req, res) => {
    const description = asTrimmedString(req.body?.description).slice(0, 120) || "Selecciona una carpeta para TRAZO";
    const pickedPath = await openSystemFolderPicker(description);
    if (!pickedPath) {
      res.status(400).json({ error: "No se selecciono ninguna carpeta." });
      return;
    }
    const targetPath = resolveStoragePath(pickedPath);
    fs.mkdirSync(targetPath, { recursive: true });
    const userPath = path.join(targetPath, safePathSegment(req.authUser.id));
    fs.mkdirSync(userPath, { recursive: true });
    res.json({ path: targetPath, userPath });
  })
);

app.get(
  "/api/tutorials",
  requireAuth,
  asyncHandler(async (req, res) => {
    await claimLegacyRowsForUser(req.authUser.id);
    await maybeAutoCloudSyncOnRead(req.authUser.id);
    const rows = await allAsync(
      `SELECT * FROM tutorials
       WHERE user_id = ?
       ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC`,
      [req.authUser.id]
    );
    res.json(rows.map(fromRow));
  })
);

app.post(
  "/api/tutorials",
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date().toISOString();
    const tutorial = sanitizeTutorial(req.body, now, req.authUser.id);
    await insertTutorial(tutorial);
    await runAndRecordStorageSync(req.authUser.id).catch((error) => logSyncError("tutorial-create", error));
    notifyTutorialsChanged(req.authUser.id, "create");
    res.status(201).json(tutorial);
  })
);

app.put(
  "/api/tutorials/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const current = await getAsync("SELECT * FROM tutorials WHERE id = ? AND user_id = ?", [req.params.id, req.authUser.id]);
    if (!current) {
      res.status(404).json({ error: "Tutorial no encontrado." });
      return;
    }

    const now = new Date().toISOString();
    const input = {
      ...req.body,
      id: req.params.id,
      createdAt: current.created_at,
      updatedAt: now,
    };
    const tutorial = sanitizeTutorial(input, now, req.authUser.id);
    await updateTutorial(tutorial);
    await runAndRecordStorageSync(req.authUser.id).catch((error) => logSyncError("tutorial-update", error));
    notifyTutorialsChanged(req.authUser.id, "update");
    res.json(tutorial);
  })
);

app.delete(
  "/api/tutorials/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await runAsync("DELETE FROM tutorials WHERE id = ? AND user_id = ?", [req.params.id, req.authUser.id]);
    if (result.changes === 0) {
      res.status(404).json({ error: "Tutorial no encontrado." });
      return;
    }
    await runAndRecordStorageSync(req.authUser.id).catch((error) => logSyncError("tutorial-delete", error));
    notifyTutorialsChanged(req.authUser.id, "delete");
    res.status(204).end();
  })
);

app.post(
  "/api/tutorials/import",
  requireAuth,
  importRateLimiter,
  asyncHandler(async (req, res) => {
    const tutorials = req.body?.tutorials;
    if (!Array.isArray(tutorials)) {
      res.status(400).json({ error: "El campo tutorials debe ser un arreglo." });
      return;
    }

    const now = new Date().toISOString();
    const sanitized = tutorials.map((item) => sanitizeTutorial(item, now, req.authUser.id));

    await runAsync("BEGIN IMMEDIATE TRANSACTION");
    try {
      await runAsync("DELETE FROM tutorials WHERE user_id = ?", [req.authUser.id]);
      for (const tutorial of sanitized) {
        await insertTutorial(tutorial);
      }
      await runAsync("COMMIT");
    } catch (error) {
      await runAsync("ROLLBACK").catch(() => {});
      throw error;
    }

    await runAndRecordStorageSync(req.authUser.id).catch((error) => logSyncError("tutorial-import", error));
    notifyTutorialsChanged(req.authUser.id, "import");
    res.json({ count: sanitized.length });
  })
);

app.get(
  "/api/live/stream",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.authUser.id;
    openLiveSseStream(userId, res);
  })
);

app.get(
  "/api/saved-views",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await allAsync(
      `SELECT id, name, filters_json, created_at, updated_at
       FROM saved_views
       WHERE user_id = ?
       ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC`,
      [req.authUser.id]
    );
    res.json(rows.map(fromSavedViewRow));
  })
);

app.post(
  "/api/saved-views",
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date().toISOString();
    let payload = null;
    try {
      payload = sanitizeSavedViewPayload(req.body);
    } catch (error) {
      res.status(400).json({ error: error.message || "Vista guardada invalida." });
      return;
    }
    const view = {
      id: crypto.randomUUID(),
      userId: req.authUser.id,
      name: payload.name,
      filters: payload.filters,
      createdAt: now,
      updatedAt: now,
    };

    await runAsync(
      "INSERT INTO saved_views (id, user_id, name, filters_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [view.id, view.userId, view.name, JSON.stringify(view.filters), view.createdAt, view.updatedAt]
    );

    res.status(201).json({
      id: view.id,
      name: view.name,
      filters: view.filters,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
    });
  })
);

app.put(
  "/api/saved-views/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await getAsync("SELECT id FROM saved_views WHERE id = ? AND user_id = ?", [req.params.id, req.authUser.id]);
    if (!existing) {
      res.status(404).json({ error: "Vista guardada no encontrada." });
      return;
    }

    let payload = null;
    try {
      payload = sanitizeSavedViewPayload(req.body);
    } catch (error) {
      res.status(400).json({ error: error.message || "Vista guardada invalida." });
      return;
    }
    const now = new Date().toISOString();
    await runAsync("UPDATE saved_views SET name = ?, filters_json = ?, updated_at = ? WHERE id = ? AND user_id = ?", [
      payload.name,
      JSON.stringify(payload.filters),
      now,
      req.params.id,
      req.authUser.id,
    ]);

    res.json({
      id: req.params.id,
      name: payload.name,
      filters: payload.filters,
      updatedAt: now,
    });
  })
);

app.delete(
  "/api/saved-views/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await runAsync("DELETE FROM saved_views WHERE id = ? AND user_id = ?", [req.params.id, req.authUser.id]);
    if (result.changes === 0) {
      res.status(404).json({ error: "Vista guardada no encontrada." });
      return;
    }
    res.status(204).end();
  })
);

app.post(
  "/api/uploads",
  requireAuth,
  uploadRateLimiter,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Debes adjuntar un archivo." });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    const tutorialId = asTrimmedString(req.body?.tutorialId);
    const mirroredPath = await mirrorUploadInDeviceStorage(req.authUser.id, tutorialId, req.file);
    res.status(201).json({
      url,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      mirroredPath,
    });
  })
);

app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

app.use((error, _req, res, _next) => {
  if (error instanceof UploadValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: `Archivo demasiado grande. Maximo ${MAX_UPLOAD_LABEL}.` });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: "No se pudo procesar el archivo." });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.use(express.static(__dirname));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

void startServer();

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Tutorial Vault listo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo inicializar la base de datos:", error);
    process.exit(1);
  }
}

async function initializeDatabase() {
  await runAsync("PRAGMA foreign_keys = ON");

  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS tutorials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      normalized_url TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      text_content TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      collection TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      review_date TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      notes_side TEXT NOT NULL DEFAULT 'right',
      emoji TEXT NOT NULL DEFAULT '',
      emoji_color TEXT NOT NULL DEFAULT 'default',
      timestamps TEXT NOT NULL DEFAULT '[]',
      extra_content TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await ensureColumn("tutorials", "user_id", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("tutorials", "is_favorite", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("tutorials", "notes_side", "TEXT NOT NULL DEFAULT 'right'");
  await ensureColumn("tutorials", "emoji", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("tutorials", "emoji_color", "TEXT NOT NULL DEFAULT 'default'");
  await ensureColumn("tutorials", "extra_content", "TEXT NOT NULL DEFAULT '[]'");

  await runAsync(`
    CREATE TABLE IF NOT EXISTS saved_views (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      filters_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      storage_mode TEXT NOT NULL DEFAULT 'device',
      local_root_path TEXT NOT NULL DEFAULT '',
      cloud_root_path TEXT NOT NULL DEFAULT '',
      cloud_provider TEXT NOT NULL DEFAULT 'none',
      cloud_enabled INTEGER NOT NULL DEFAULT 0,
      cloud_connected INTEGER NOT NULL DEFAULT 0,
      cloud_account_name TEXT NOT NULL DEFAULT '',
      cloud_connected_at TEXT NOT NULL DEFAULT '',
      cloud_connection_marker TEXT NOT NULL DEFAULT '',
      cloud_access_token TEXT NOT NULL DEFAULT '',
      cloud_refresh_token TEXT NOT NULL DEFAULT '',
      cloud_token_expires_at TEXT NOT NULL DEFAULT '',
      cloud_scope TEXT NOT NULL DEFAULT '',
      device_id TEXT NOT NULL DEFAULT '',
      peer_enabled INTEGER NOT NULL DEFAULT 0,
      sync_tutorial_ids TEXT NOT NULL DEFAULT '[]',
      setup_completed INTEGER NOT NULL DEFAULT 0,
      last_sync_at TEXT NOT NULL DEFAULT '',
      last_sync_status TEXT NOT NULL DEFAULT 'idle',
      last_sync_summary TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn("user_settings", "storage_mode", "TEXT NOT NULL DEFAULT 'device'");
  await ensureColumn("user_settings", "local_root_path", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "cloud_root_path", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "cloud_provider", "TEXT NOT NULL DEFAULT 'none'");
  await ensureColumn("user_settings", "cloud_enabled", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("user_settings", "cloud_connected", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("user_settings", "cloud_account_name", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "cloud_connected_at", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "cloud_connection_marker", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "cloud_access_token", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "cloud_refresh_token", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "cloud_token_expires_at", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "cloud_scope", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "device_id", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "peer_enabled", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("user_settings", "sync_tutorial_ids", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn("user_settings", "setup_completed", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("user_settings", "last_sync_at", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("user_settings", "last_sync_status", "TEXT NOT NULL DEFAULT 'idle'");
  await ensureColumn("user_settings", "last_sync_summary", "TEXT NOT NULL DEFAULT '{}'");
  await ensureColumn("user_settings", "updated_at", "TEXT NOT NULL DEFAULT ''");

  await restoreAuthStateSnapshotFromSupabase();

  await runAsync("CREATE INDEX IF NOT EXISTS idx_tutorials_user_updated ON tutorials (user_id, updated_at)");
  await runAsync("CREATE INDEX IF NOT EXISTS idx_saved_views_user_updated ON saved_views (user_id, updated_at)");
  await runAsync("CREATE INDEX IF NOT EXISTS idx_user_settings_updated ON user_settings (updated_at)");
  await runAsync("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id)");
  await runAsync("CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at)");
  const deletedExpired = await runAsync("DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now')");
  if (deletedExpired.changes > 0) {
    markAuthStateSnapshotDirty("cleanup_expired_sessions");
  }
  const usersCountRow = await getAsync("SELECT COUNT(1) AS count FROM users");
  if (Number(usersCountRow?.count || 0) > 0) {
    markAuthStateSnapshotDirty("startup_seed");
  }
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await allAsync(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await runAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function claimLegacyRowsForUser(userId) {
  const countRow = await getAsync("SELECT COUNT(1) AS count FROM tutorials WHERE user_id = ?", [userId]);
  const count = Number(countRow?.count || 0);
  if (count > 0) {
    return;
  }
  await runAsync("UPDATE tutorials SET user_id = ? WHERE user_id IS NULL OR user_id = ''", [userId]);
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  await runAsync("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)", [
    hashToken(token),
    userId,
    expiresAt.toISOString(),
    now.toISOString(),
  ]);
  markAuthStateSnapshotDirty("session_create");
  return token;
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_DURATION_DAYS * 24 * 60 * 60;
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
    "Priority=High",
  ];
  if (COOKIE_SECURE) {
    cookieParts.push("Secure");
  }
  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

function clearSessionCookie(res) {
  const cookieParts = [`${SESSION_COOKIE_NAME}=`, "HttpOnly", "Path=/", "Max-Age=0", "SameSite=Lax", "Priority=High"];
  if (COOKIE_SECURE) {
    cookieParts.push("Secure");
  }
  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

async function requireAuth(req, res, next) {
  try {
    const token = getSessionToken(req);
    if (!token) {
      res.status(401).json({ error: "No autenticado." });
      return;
    }

    const row = await getAsync(
      `SELECT sessions.user_id AS id, users.email AS email, sessions.expires_at AS expires_at
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`,
      [hashToken(token)]
    );

    if (!row) {
      clearSessionCookie(res);
      res.status(401).json({ error: "Sesion invalida." });
      return;
    }

    if (Date.parse(row.expires_at) <= Date.now()) {
      await runAsync("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
      markAuthStateSnapshotDirty("session_expired");
      clearSessionCookie(res);
      res.status(401).json({ error: "Sesion expirada." });
      return;
    }

    req.authUser = { id: row.id, email: row.email };
    next();
  } catch (error) {
    next(error);
  }
}

function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[SESSION_COOKIE_NAME];
  return typeof token === "string" ? token : "";
}

function parseCookies(raw) {
  const output = {};
  if (!raw) {
    return output;
  }
  const pairs = raw.split(";");
  for (const pair of pairs) {
    const index = pair.indexOf("=");
    if (index <= 0) {
      continue;
    }
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    try {
      output[key] = decodeURIComponent(value);
    } catch {
      output[key] = value;
    }
  }
  return output;
}

function sanitizeTutorial(raw, now, userId) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload invalido.");
  }

  const title = asTrimmedString(raw.title).slice(0, 180);
  if (!title) {
    throw new Error("El titulo es obligatorio.");
  }

  const type = TYPE_OPTIONS.includes(raw.type) ? raw.type : "text";
  const url = asTrimmedString(raw.url).slice(0, 2000);
  const normalizedUrl = normalizeUrl(url);
  const source = pickSource(raw.source, url);
  const id = asTrimmedString(raw.id) || crypto.randomUUID();
  const notesSide = normalizeNoteSide(raw.notesSide, "right");
  const emoji = normalizeEmoji(raw.emoji);
  const emojiColor = normalizeEmojiColor(raw.emojiColor, "default");

  return {
    id,
    userId,
    title,
    type,
    source,
    url,
    normalizedUrl,
    imageUrl: asTrimmedString(raw.imageUrl).slice(0, 2000),
    textContent: asTrimmedString(raw.textContent).slice(0, 120000),
    category: asTrimmedString(raw.category).slice(0, 80),
    collection: asTrimmedString(raw.collection).slice(0, 80),
    status: STATUS_ORDER.includes(raw.status) ? raw.status : "Por ver",
    priority: PRIORITY_OPTIONS.includes(raw.priority) ? raw.priority : "Media",
    isFavorite: asBoolean(raw.isFavorite),
    reviewDate: normalizeReviewDate(raw.reviewDate),
    tags: normalizeStringArray(raw.tags, 60, 40),
    notes: asTrimmedString(raw.notes).slice(0, 20000),
    notesSide,
    emoji,
    emojiColor,
    timestamps: normalizeStringArray(raw.timestamps, 200, 120),
    extraContent: normalizeExtraContent(raw.extraContent),
    createdAt: asTrimmedString(raw.createdAt) || now,
    updatedAt: asTrimmedString(raw.updatedAt) || now,
  };
}

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    source: row.source,
    url: row.url,
    normalizedUrl: row.normalized_url,
    imageUrl: row.image_url,
    textContent: row.text_content,
    category: row.category,
    collection: row.collection,
    status: row.status,
    priority: row.priority,
    isFavorite: Number(row.is_favorite || 0) === 1,
    reviewDate: row.review_date,
    tags: safeJsonArray(row.tags),
    notes: row.notes,
    notesSide: normalizeNoteSide(row.notes_side, "right"),
    emoji: normalizeEmoji(row.emoji),
    emojiColor: normalizeEmojiColor(row.emoji_color, "default"),
    timestamps: safeJsonArray(row.timestamps),
    extraContent: parseExtraContent(row.extra_content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function insertTutorial(tutorial) {
  return runAsync(
    `INSERT INTO tutorials (
      id, user_id, title, type, source, url, normalized_url, image_url, text_content, category,
      collection, status, priority, is_favorite, review_date, tags, notes, notes_side, emoji, emoji_color, timestamps, extra_content, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tutorial.id,
      tutorial.userId,
      tutorial.title,
      tutorial.type,
      tutorial.source,
      tutorial.url,
      tutorial.normalizedUrl,
      tutorial.imageUrl,
      tutorial.textContent,
      tutorial.category,
      tutorial.collection,
      tutorial.status,
      tutorial.priority,
      tutorial.isFavorite ? 1 : 0,
      tutorial.reviewDate,
      JSON.stringify(tutorial.tags),
      tutorial.notes,
      tutorial.notesSide,
      tutorial.emoji,
      tutorial.emojiColor,
      JSON.stringify(tutorial.timestamps),
      JSON.stringify(tutorial.extraContent),
      tutorial.createdAt,
      tutorial.updatedAt,
    ]
  );
}

function updateTutorial(tutorial) {
  return runAsync(
    `UPDATE tutorials
     SET title = ?, type = ?, source = ?, url = ?, normalized_url = ?, image_url = ?,
         text_content = ?, category = ?, collection = ?, status = ?, priority = ?, is_favorite = ?, review_date = ?,
         tags = ?, notes = ?, notes_side = ?, emoji = ?, emoji_color = ?, timestamps = ?, extra_content = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      tutorial.title,
      tutorial.type,
      tutorial.source,
      tutorial.url,
      tutorial.normalizedUrl,
      tutorial.imageUrl,
      tutorial.textContent,
      tutorial.category,
      tutorial.collection,
      tutorial.status,
      tutorial.priority,
      tutorial.isFavorite ? 1 : 0,
      tutorial.reviewDate,
      JSON.stringify(tutorial.tags),
      tutorial.notes,
      tutorial.notesSide,
      tutorial.emoji,
      tutorial.emojiColor,
      JSON.stringify(tutorial.timestamps),
      JSON.stringify(tutorial.extraContent),
      tutorial.updatedAt,
      tutorial.id,
      tutorial.userId,
    ]
  );
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row || null);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows || []);
    });
  });
}

function normalizeStringArray(value, maxItems = 100, maxLength = 120) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .slice(0, maxItems)
    .map((entry) => asTrimmedString(entry).slice(0, maxLength))
    .filter(Boolean);
}

function sanitizeSavedViewPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload invalido.");
  }

  const name = asTrimmedString(raw.name).slice(0, 80);
  if (!name) {
    throw new Error("El nombre de la vista es obligatorio.");
  }

  return {
    name,
    filters: normalizeSavedViewFilters(raw.filters),
  };
}

function normalizeSavedViewFilters(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  const pickOne = (input, options, fallback) => (options.includes(input) ? input : fallback);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const type = pickOne(value.type, ["all", ...TYPE_OPTIONS], "all");
  const status = pickOne(value.status, ["all", ...STATUS_ORDER], "all");
  const priority = pickOne(value.priority, ["all", ...PRIORITY_OPTIONS], "all");
  const view = pickOne(value.view, ["table", "gallery", "board"], "table");
  const sortBy = pickOne(value.sortBy, ["updatedAt", "createdAt", "title", "reviewDate"], "updatedAt");
  const sortDirection = pickOne(value.sortDirection, ["asc", "desc"], "desc");
  const smartCollection = pickOne(value.smartCollection, ["all", "due", "focus", "uncategorized", "duplicates"], "all");

  return {
    search: asTrimmedString(value.search).slice(0, 120),
    view,
    sortBy,
    sortDirection,
    type,
    status,
    category: asTrimmedString(value.category).slice(0, 80) || "all",
    priority,
    tagQuery: asTrimmedString(value.tagQuery).slice(0, 80),
    updatedFrom: dateRegex.test(asTrimmedString(value.updatedFrom)) ? asTrimmedString(value.updatedFrom) : "",
    updatedTo: dateRegex.test(asTrimmedString(value.updatedTo)) ? asTrimmedString(value.updatedTo) : "",
    favoritesOnly: asBoolean(value.favoritesOnly),
    smartCollection,
  };
}

function fromSavedViewRow(row) {
  let filters = {};
  try {
    filters = JSON.parse(row.filters_json || "{}");
  } catch {
    filters = {};
  }

  return {
    id: row.id,
    name: row.name,
    filters: normalizeSavedViewFilters(filters),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeJsonArray(raw) {
  try {
    const parsed = JSON.parse(raw);
    return normalizeStringArray(parsed);
  } catch {
    return [];
  }
}

function safeJsonObject(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

function parseExtraContent(raw) {
  try {
    const parsed = JSON.parse(raw);
    return normalizeExtraContent(parsed);
  } catch {
    return [];
  }
}

function normalizeExtraContent(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(normalizeExtraContentItem)
    .filter(Boolean)
    .slice(0, 60);
}

function normalizeExtraContentItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }
  const type = asTrimmedString(item.type);
  if (!["image", "video", "text"].includes(type)) {
    return null;
  }

  const id = asTrimmedString(item.id) || crypto.randomUUID();
  const caption = asTrimmedString(item.caption).slice(0, 160);
  const note = typeof item.note === "string" ? item.note.slice(0, 20000) : "";
  const noteSide = normalizeNoteSide(item.noteSide, "right");
  const createdAt = asTrimmedString(item.createdAt) || new Date().toISOString();

  if (type === "text") {
    const text = asTrimmedString(item.text).slice(0, 20000);
    if (!text) {
      return null;
    }
    return {
      id,
      type,
      text,
      caption,
      note,
      noteSide,
      createdAt,
    };
  }

  const url = asTrimmedString(item.url).slice(0, 2000);
  if (!url) {
    return null;
  }
  const timestamps = type === "video" ? normalizeStringArray(item.timestamps, 200, 120) : [];
  return {
    id,
    type,
    url,
    caption,
    note,
    noteSide,
    timestamps,
    createdAt,
  };
}

async function getOrCreateUserSettings(userId) {
  const existing = await getAsync("SELECT * FROM user_settings WHERE user_id = ?", [userId]);
  if (existing) {
    const parsed = fromUserSettingsRow(existing);
    if (!parsed.deviceId) {
      parsed.deviceId = await ensureDeviceIdForUser(userId);
    }
    return parsed;
  }
  const defaults = defaultUserSettings(userId);
  await runAsync(
    `INSERT INTO user_settings
      (user_id, storage_mode, local_root_path, cloud_root_path, cloud_provider, cloud_enabled, cloud_connected, cloud_account_name,
       cloud_connected_at, cloud_connection_marker, device_id, peer_enabled, sync_tutorial_ids, setup_completed, last_sync_at, last_sync_status, last_sync_summary, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      defaults.userId,
      defaults.storageMode,
      defaults.localRootPath,
      defaults.cloudRootPath,
      defaults.cloudProvider,
      defaults.cloudEnabled ? 1 : 0,
      defaults.cloudConnected ? 1 : 0,
      defaults.cloudAccountName,
      defaults.cloudConnectedAt,
      defaults.cloudConnectionMarker,
      defaults.deviceId,
      defaults.peerEnabled ? 1 : 0,
      JSON.stringify(defaults.syncTutorialIds),
      defaults.setupCompleted ? 1 : 0,
      defaults.lastSyncAt,
      defaults.lastSyncStatus,
      JSON.stringify(defaults.lastSyncSummary),
      defaults.updatedAt,
    ]
  );
  return {
    storageMode: defaults.storageMode,
    localRootPath: defaults.localRootPath,
    cloudRootPath: defaults.cloudRootPath,
    cloudProvider: defaults.cloudProvider,
    cloudEnabled: defaults.cloudEnabled,
    cloudConnected: defaults.cloudConnected,
    cloudAccountName: defaults.cloudAccountName,
    cloudConnectedAt: defaults.cloudConnectedAt,
    cloudConnectionMarker: defaults.cloudConnectionMarker,
    deviceId: defaults.deviceId,
    peerEnabled: defaults.peerEnabled,
    syncTutorialIds: defaults.syncTutorialIds,
    setupCompleted: defaults.setupCompleted,
    lastSyncAt: defaults.lastSyncAt,
    lastSyncStatus: defaults.lastSyncStatus,
    lastSyncSummary: defaults.lastSyncSummary,
    updatedAt: defaults.updatedAt,
  };
}

function defaultUserSettings(userId) {
  return {
    userId,
    storageMode: "device",
    localRootPath: "",
    cloudRootPath: "",
    cloudProvider: "none",
    cloudEnabled: false,
    cloudConnected: false,
    cloudAccountName: "",
    cloudConnectedAt: "",
    cloudConnectionMarker: "",
    deviceId: createDeviceId(),
    peerEnabled: false,
    syncTutorialIds: [],
    setupCompleted: false,
    lastSyncAt: "",
    lastSyncStatus: "idle",
    lastSyncSummary: {},
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeUserSettingsPayload(raw, current = null) {
  const value = raw && typeof raw === "object" ? raw : {};
  const fallback = current || defaultUserSettings("");
  const storageMode = normalizeStorageMode(value.storageMode, fallback.storageMode);
  const cloudProvider = normalizeCloudProvider(value.cloudProvider, fallback.cloudProvider);
  const localRootPath = asTrimmedString(value.localRootPath).slice(0, 500);
  const cloudRootPath = asTrimmedString(value.cloudRootPath).slice(0, 500);
  const syncTutorialIds = normalizeIdArray(value.syncTutorialIds);
  let cloudAccountName = sanitizeCloudAccountName(value.cloudAccountName || fallback.cloudAccountName);
  let cloudConnected = asBoolean(fallback.cloudConnected);
  let cloudConnectedAt = asTrimmedString(fallback.cloudConnectedAt);
  let cloudConnectionMarker = asTrimmedString(fallback.cloudConnectionMarker).slice(0, 1000);
  if (cloudProvider === "none" || cloudProvider !== fallback.cloudProvider) {
    cloudConnected = false;
    cloudConnectedAt = "";
    cloudConnectionMarker = "";
  }
  if (cloudProvider === "none") {
    cloudAccountName = "";
  }
  return {
    storageMode,
    localRootPath,
    cloudRootPath,
    cloudProvider,
    cloudEnabled: asBoolean(value.cloudEnabled),
    cloudConnected,
    cloudAccountName,
    cloudConnectedAt,
    cloudConnectionMarker,
    peerEnabled: asBoolean(value.peerEnabled),
    syncTutorialIds,
    setupCompleted: asBoolean(value.setupCompleted),
    lastSyncAt: asTrimmedString(fallback.lastSyncAt),
    lastSyncStatus: normalizeSyncStatus(fallback.lastSyncStatus),
    lastSyncSummary:
      fallback.lastSyncSummary && typeof fallback.lastSyncSummary === "object" ? fallback.lastSyncSummary : {},
  };
}

function fromUserSettingsRow(row) {
  return {
    storageMode: normalizeStorageMode(row.storage_mode, "device"),
    localRootPath: asTrimmedString(row.local_root_path),
    cloudRootPath: asTrimmedString(row.cloud_root_path),
    cloudProvider: normalizeCloudProvider(row.cloud_provider, "none"),
    cloudEnabled: Number(row.cloud_enabled || 0) === 1,
    cloudConnected: Number(row.cloud_connected || 0) === 1,
    cloudAccountName: sanitizeCloudAccountName(row.cloud_account_name),
    cloudConnectedAt: asTrimmedString(row.cloud_connected_at),
    cloudConnectionMarker: asTrimmedString(row.cloud_connection_marker).slice(0, 1000),
    deviceId: normalizeDeviceId(row.device_id),
    peerEnabled: Number(row.peer_enabled || 0) === 1,
    syncTutorialIds: normalizeIdArray(safeJsonArray(row.sync_tutorial_ids)),
    setupCompleted: Number(row.setup_completed || 0) === 1,
    lastSyncAt: asTrimmedString(row.last_sync_at),
    lastSyncStatus: normalizeSyncStatus(row.last_sync_status),
    lastSyncSummary: safeJsonObject(row.last_sync_summary),
    updatedAt: row.updated_at || "",
  };
}

function fromUserSettingsInternalRow(row) {
  const base = fromUserSettingsRow(row);
  return {
    ...base,
    cloudAccessToken: asTrimmedString(row.cloud_access_token),
    cloudRefreshToken: asTrimmedString(row.cloud_refresh_token),
    cloudTokenExpiresAt: asTrimmedString(row.cloud_token_expires_at),
    cloudScope: asTrimmedString(row.cloud_scope),
  };
}

async function getOrCreateUserSettingsForSync(userId) {
  const existing = await getAsync("SELECT * FROM user_settings WHERE user_id = ?", [userId]);
  if (existing) {
    const parsed = fromUserSettingsInternalRow(existing);
    if (!parsed.deviceId) {
      parsed.deviceId = await ensureDeviceIdForUser(userId);
    }
    return parsed;
  }
  await getOrCreateUserSettings(userId);
  const created = await getAsync("SELECT * FROM user_settings WHERE user_id = ?", [userId]);
  if (created) {
    const parsed = fromUserSettingsInternalRow(created);
    if (!parsed.deviceId) {
      parsed.deviceId = await ensureDeviceIdForUser(userId);
    }
    return parsed;
  }
  return {
    ...defaultUserSettings(userId),
    cloudAccessToken: "",
    cloudRefreshToken: "",
    cloudTokenExpiresAt: "",
    cloudScope: "",
  };
}

function normalizeStorageMode(value, fallback = "device") {
  if (STORAGE_MODE_OPTIONS.includes(value)) {
    return value;
  }
  return STORAGE_MODE_OPTIONS.includes(fallback) ? fallback : "device";
}

function normalizeCloudProvider(value, fallback = "none") {
  if (CLOUD_PROVIDER_OPTIONS.includes(value)) {
    return value;
  }
  return CLOUD_PROVIDER_OPTIONS.includes(fallback) ? fallback : "none";
}

function normalizeOauthScopes(rawValue, fallback) {
  if (typeof rawValue !== "string") {
    return Array.isArray(fallback) ? fallback : [];
  }
  const values = rawValue
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length ? values : Array.isArray(fallback) ? fallback : [];
}

function isGoogleOauthConfigured() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
}

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function isSupabaseAuthSnapshotEnabled() {
  return isSupabaseConfigured() && Boolean(SUPABASE_AUTH_SNAPSHOT_OBJECT);
}

function normalizeIsoTimestamp(value, fallback = "") {
  const text = asTrimmedString(value);
  if (!text) {
    return fallback;
  }
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return new Date(parsed).toISOString();
}

function normalizeAuthSnapshotUser(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const id = asTrimmedString(value.id).slice(0, 120);
  const email = normalizeEmail(value.email).slice(0, 320);
  const passwordHash = asTrimmedString(value.passwordHash || value.password_hash).slice(0, 256);
  const passwordSalt = asTrimmedString(value.passwordSalt || value.password_salt).slice(0, 256);
  const createdAt = normalizeIsoTimestamp(value.createdAt || value.created_at, new Date().toISOString());
  if (!id || !isValidEmail(email) || !passwordHash || !passwordSalt) {
    return null;
  }
  return {
    id,
    email,
    passwordHash,
    passwordSalt,
    createdAt,
  };
}

function normalizeAuthSnapshotSession(value, validUserIds) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const tokenHash = asTrimmedString(value.tokenHash || value.token_hash).toLowerCase();
  const userId = asTrimmedString(value.userId || value.user_id).slice(0, 120);
  const expiresAt = normalizeIsoTimestamp(value.expiresAt || value.expires_at);
  const createdAt = normalizeIsoTimestamp(value.createdAt || value.created_at, new Date().toISOString());
  if (!/^[a-f0-9]{64}$/.test(tokenHash) || !userId || !expiresAt) {
    return null;
  }
  if (Date.parse(expiresAt) <= Date.now()) {
    return null;
  }
  if (validUserIds && !validUserIds.has(userId)) {
    return null;
  }
  return {
    tokenHash,
    userId,
    expiresAt,
    createdAt,
  };
}

function parseAuthSnapshotPayload(rawText) {
  let payload = null;
  try {
    payload = JSON.parse(String(rawText || "{}"));
  } catch {
    return { users: [], sessions: [] };
  }
  const users = Array.isArray(payload?.users) ? payload.users.map((item) => normalizeAuthSnapshotUser(item)).filter(Boolean) : [];
  const validUserIds = new Set(users.map((item) => item.id));
  const sessions = Array.isArray(payload?.sessions)
    ? payload.sessions.map((item) => normalizeAuthSnapshotSession(item, validUserIds)).filter(Boolean)
    : [];
  return { users, sessions };
}

async function collectAuthSnapshotPayload() {
  const users = await allAsync(
    "SELECT id, email, password_hash, password_salt, created_at FROM users ORDER BY datetime(created_at) ASC, id ASC"
  );
  const sessions = await allAsync(
    "SELECT token_hash, user_id, expires_at, created_at FROM sessions ORDER BY datetime(created_at) ASC, token_hash ASC"
  );
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    users: users.map((row) => ({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      createdAt: row.created_at,
    })),
    sessions: sessions.map((row) => ({
      tokenHash: row.token_hash,
      userId: row.user_id,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })),
  };
}

async function flushAuthStateSnapshotToSupabase(reason = "update") {
  if (!isSupabaseAuthSnapshotEnabled()) {
    return;
  }
  if (authSnapshotSaveInFlight) {
    authSnapshotSavePending = true;
    return;
  }
  authSnapshotSaveInFlight = true;
  try {
    await ensureSupabaseBucket();
    const payload = await collectAuthSnapshotPayload();
    await uploadSupabaseObjectBuffer(
      SUPABASE_AUTH_SNAPSHOT_OBJECT,
      Buffer.from(JSON.stringify(payload)),
      "application/json; charset=UTF-8"
    );
  } catch (error) {
    console.warn(`[auth-snapshot] No se pudo guardar (${reason}): ${resolveErrorMessage(error)}`);
  } finally {
    authSnapshotSaveInFlight = false;
    if (authSnapshotSavePending) {
      authSnapshotSavePending = false;
      markAuthStateSnapshotDirty("pending_retry");
    }
  }
}

function markAuthStateSnapshotDirty(reason = "update") {
  if (!isSupabaseAuthSnapshotEnabled()) {
    return;
  }
  if (authSnapshotSaveTimer) {
    clearTimeout(authSnapshotSaveTimer);
  }
  authSnapshotSaveTimer = setTimeout(() => {
    authSnapshotSaveTimer = null;
    void flushAuthStateSnapshotToSupabase(reason);
  }, AUTH_SNAPSHOT_SAVE_DEBOUNCE_MS);
}

async function restoreAuthStateSnapshotFromSupabase() {
  if (!isSupabaseAuthSnapshotEnabled()) {
    return;
  }
  const row = await getAsync("SELECT COUNT(1) AS count FROM users");
  const usersCount = Number(row?.count || 0);
  if (usersCount > 0) {
    return;
  }
  try {
    await ensureSupabaseBucket();
    const buffer = await downloadSupabaseObjectBuffer(SUPABASE_AUTH_SNAPSHOT_OBJECT);
    if (!buffer) {
      return;
    }
    const payload = parseAuthSnapshotPayload(buffer.toString("utf8"));
    if (!payload.users.length) {
      return;
    }
    await runAsync("BEGIN IMMEDIATE TRANSACTION");
    try {
      await runAsync("DELETE FROM sessions");
      await runAsync("DELETE FROM users");
      for (const user of payload.users) {
        await runAsync(
          "INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)",
          [user.id, user.email, user.passwordHash, user.passwordSalt, user.createdAt]
        );
      }
      for (const session of payload.sessions) {
        await runAsync("INSERT OR REPLACE INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)", [
          session.tokenHash,
          session.userId,
          session.expiresAt,
          session.createdAt,
        ]);
      }
      await runAsync("COMMIT");
      console.log(
        `[auth-snapshot] Restaurado desde Supabase: ${payload.users.length} usuario(s), ${payload.sessions.length} sesion(es).`
      );
    } catch (error) {
      await runAsync("ROLLBACK").catch(() => {});
      throw error;
    }
  } catch (error) {
    console.warn(`[auth-snapshot] No se pudo restaurar: ${resolveErrorMessage(error)}`);
  }
}

function normalizeReturnTo(rawValue) {
  if (typeof rawValue !== "string") {
    return "/#/settings";
  }
  const value = rawValue.trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/#/settings";
  }
  return value.slice(0, 300);
}

function createGoogleOauthState(userId, returnTo, email, flow = "cloud_sync") {
  pruneExpiredGoogleOauthStates();
  const emailValue = asTrimmedString(email).toLowerCase();
  const nonce = crypto.randomBytes(24).toString("hex");
  const record = {
    userId,
    returnTo: normalizeReturnTo(returnTo),
    emailAlias: emailValue.split("@")[0] || "google",
    email: emailValue,
    flow: asTrimmedString(flow) || "cloud_sync",
    expiresAt: Date.now() + GOOGLE_OAUTH_STATE_TTL_MS,
  };
  googleOauthStateStore.set(nonce, record);
  return nonce;
}

function consumeGoogleOauthState(nonce) {
  pruneExpiredGoogleOauthStates();
  const key = asTrimmedString(nonce);
  if (!key) {
    return null;
  }
  const record = googleOauthStateStore.get(key);
  googleOauthStateStore.delete(key);
  if (!record) {
    return null;
  }
  if (Date.now() > Number(record.expiresAt || 0)) {
    return null;
  }
  return record;
}

function pruneExpiredGoogleOauthStates() {
  const now = Date.now();
  for (const [key, record] of googleOauthStateStore.entries()) {
    if (now > Number(record?.expiresAt || 0)) {
      googleOauthStateStore.delete(key);
    }
  }
}

function buildGoogleAuthorizeUrl(stateToken, scopes = GOOGLE_OAUTH_SCOPES, loginHint = "") {
  const requestedScopes = Array.isArray(scopes) && scopes.length ? scopes : GOOGLE_OAUTH_SCOPES;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", requestedScopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent select_account");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", stateToken);
  const hint = asTrimmedString(loginHint).toLowerCase();
  if (hint && hint.includes("@")) {
    url.searchParams.set("login_hint", hint);
  }
  return url.toString();
}

function buildOauthDiagnosticMessage(errorCode, errorDescription) {
  const parts = [`Error: ${asTrimmedString(errorCode) || "desconocido"}.`];
  if (errorDescription) {
    parts.push(`Detalle: ${errorDescription}.`);
  }
  parts.push("Revisa usuarios de prueba, redirect URI exacto y que Google Drive API este habilitada.");
  return parts.join(" ");
}

async function exchangeGoogleAuthCodeForTokens(code) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage =
      asTrimmedString(payload.error_description) || asTrimmedString(payload.error) || "No se pudo obtener token de Google.";
    throw new Error(errorMessage);
  }
  return payload;
}

function computeTokenExpiryIso(expiresInSeconds) {
  const seconds = Number(expiresInSeconds || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function renderOauthInfoHtml(title, message) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Segoe UI, sans-serif; background:#111; color:#eee; margin:0; padding:40px; }
      .card { max-width:680px; margin:0 auto; border:1px solid #2a2a2a; border-radius:10px; padding:18px; background:#181818; }
      h1 { margin-top:0; font-size:1.3rem; }
      p { color:#c4c4c4; }
      a { color:#7ab8ff; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="/#/settings">Volver a configuracion</a></p>
    </div>
  </body>
</html>`;
}

function sanitizeCloudAccountName(value) {
  return asTrimmedString(value).slice(0, 120);
}

function normalizeSyncStatus(value) {
  const raw = asTrimmedString(value).toLowerCase();
  if (["idle", "ok", "warning", "error"].includes(raw)) {
    return raw;
  }
  return "idle";
}

function normalizeIdArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => asTrimmedString(item).slice(0, 120))
    .filter(Boolean)
    .slice(0, 400);
}

function normalizeDeviceId(value) {
  return asTrimmedString(value).replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 80);
}

function createDeviceId() {
  return `dev-${crypto.randomUUID()}`;
}

async function ensureDeviceIdForUser(userId) {
  if (!userId) {
    return createDeviceId();
  }
  const nextDeviceId = createDeviceId();
  await runAsync("UPDATE user_settings SET device_id = ?, updated_at = ? WHERE user_id = ?", [
    nextDeviceId,
    new Date().toISOString(),
    userId,
  ]);
  return nextDeviceId;
}

function normalizeEmoji(value) {
  return asTrimmedString(value).slice(0, 8);
}

function resolveAppDataRoot() {
  const customRoot = asTrimmedString(process.env.APP_DATA_ROOT);
  if (customRoot) {
    return path.resolve(customRoot);
  }
  if (process.env.RENDER === "true" || asTrimmedString(process.env.RENDER_SERVICE_ID)) {
    const persistentRoot = "/var/data/trazo";
    if (ensureWritableDirectory(persistentRoot)) {
      return persistentRoot;
    }
    return "/tmp/trazo";
  }
  return __dirname;
}

function ensureWritableDirectory(targetPath) {
  const normalized = asTrimmedString(targetPath);
  if (!normalized) {
    return false;
  }
  try {
    fs.mkdirSync(normalized, { recursive: true });
    fs.accessSync(normalized, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function normalizeEmojiColor(value, fallback = "default") {
  if (EMOJI_COLOR_OPTIONS.includes(value)) {
    return value;
  }
  return EMOJI_COLOR_OPTIONS.includes(fallback) ? fallback : "default";
}

function resolveStoragePath(rawPath) {
  if (!rawPath) {
    return "";
  }
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(__dirname, rawPath);
}

async function openSystemFolderPicker(description = "Selecciona una carpeta") {
  if (process.platform !== "win32") {
    return "";
  }
  const escapedDescription = String(description || "")
    .replace(/`/g, "")
    .replace(/"/g, "'");
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "${escapedDescription}"
$dialog.ShowNewFolderButton = $true
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($dialog.SelectedPath)
}
`;
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-STA", "-Command", script],
    {
      windowsHide: false,
      timeout: 5 * 60 * 1000,
      maxBuffer: 1024 * 1024,
    }
  );
  return asTrimmedString(stdout);
}

function safePathSegment(value) {
  const normalized = String(value || "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || "item";
}

function normalizeSupabaseBucketId(value) {
  const source = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
  return source || "trazo-tutorials";
}

function writeCloudConnectionMarker(rootPath, userId, payload) {
  const resolvedRoot = resolveStoragePath(rootPath);
  if (!resolvedRoot) {
    return "";
  }
  const userDir = path.join(resolvedRoot, safePathSegment(userId));
  fs.mkdirSync(userDir, { recursive: true });
  const markerPath = path.join(userDir, ".trazo-cloud-connection.json");
  fs.writeFileSync(
    markerPath,
    JSON.stringify(
      {
        app: "TRAZO",
        ...payload,
      },
      null,
      2
    ),
    "utf8"
  );
  return markerPath;
}

async function mirrorUploadInDeviceStorage(userId, tutorialId, file) {
  if (!file || !userId) {
    return "";
  }
  const settings = await getOrCreateUserSettings(userId);
  const destinations = [];

  if (canSyncToLocalStorage(settings) && settings.localRootPath) {
    destinations.push(resolveStoragePath(settings.localRootPath));
  }
  if (
    canSyncToCloudStorage(settings) &&
    settings.cloudProvider !== "google_drive" &&
    settings.cloudProvider !== "supabase" &&
    settings.cloudRootPath &&
    shouldSyncTutorialToCloud(settings, tutorialId)
  ) {
    destinations.push(resolveStoragePath(settings.cloudRootPath));
  }

  if (!destinations.length) {
    return "";
  }

  const copiedPaths = [];
  destinations.forEach((rootPath) => {
    if (!rootPath) {
      return;
    }
    const tutorialDir = path.join(rootPath, safePathSegment(userId), safePathSegment(tutorialId || "sin-asignar"), "assets");
    fs.mkdirSync(tutorialDir, { recursive: true });
    const destination = path.join(tutorialDir, safePathSegment(file.filename));
    fs.copyFileSync(file.path, destination);
    copiedPaths.push(destination);
  });

  return copiedPaths[0] || "";
}

function canSyncToLocalStorage(settings) {
  return settings.storageMode === "device" || settings.storageMode === "hybrid";
}

function canSyncToCloudStorage(settings) {
  return (
    (settings.storageMode === "cloud" || settings.storageMode === "hybrid") &&
    settings.cloudEnabled &&
    settings.cloudConnected &&
    settings.cloudProvider !== "none"
  );
}

function shouldSyncTutorialToCloud(settings, tutorialId) {
  const ids = Array.isArray(settings.syncTutorialIds) ? settings.syncTutorialIds : [];
  if (!tutorialId) {
    return false;
  }
  if (!ids.length) {
    return true;
  }
  return ids.includes(tutorialId);
}

function bumpSyncCountMap(map, key, amount = 1) {
  if (!map || typeof map.set !== "function") {
    return;
  }
  const id = asTrimmedString(key);
  if (!id) {
    return;
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return;
  }
  const previous = Number(map.get(id) || 0);
  map.set(id, previous + numericAmount);
}

function tutorialFolderName(tutorial) {
  const title = safePathSegment(tutorial?.title || "tutorial").slice(0, 60);
  const id = safePathSegment(tutorial?.id || "").slice(0, 12);
  return id ? `${title}-${id}` : title;
}

function collectTutorialAssetUrls(tutorial) {
  const urls = [];
  if (tutorial?.url) {
    urls.push(tutorial.url);
  }
  if (tutorial?.imageUrl) {
    urls.push(tutorial.imageUrl);
  }
  const extra = Array.isArray(tutorial?.extraContent) ? tutorial.extraContent : [];
  extra.forEach((item) => {
    if (item && typeof item === "object" && typeof item.url === "string") {
      urls.push(item.url);
    }
  });
  return Array.from(new Set(urls.filter(Boolean)));
}

function sourceUploadFilePathFromUrl(rawUrl) {
  const value = asTrimmedString(rawUrl);
  if (!value.startsWith("/uploads/")) {
    return "";
  }
  const relative = value.replace(/^\/+/, "");
  const resolved = path.resolve(__dirname, relative);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
    return "";
  }
  return resolved;
}

function syncTutorialToRoot(rootPath, userId, tutorial) {
  if (!rootPath || !tutorial || !tutorial.id) {
    return false;
  }
  const tutorialDir = path.join(rootPath, safePathSegment(userId), tutorialFolderName(tutorial));
  const assetsDir = path.join(tutorialDir, "assets");
  fs.mkdirSync(assetsDir, { recursive: true });

  const mirroredAssets = [];
  collectTutorialAssetUrls(tutorial).forEach((assetUrl) => {
    const sourcePath = sourceUploadFilePathFromUrl(assetUrl);
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return;
    }
    const fileName = safePathSegment(path.basename(sourcePath));
    const destination = path.join(assetsDir, fileName);
    fs.copyFileSync(sourcePath, destination);
    mirroredAssets.push({
      sourceUrl: assetUrl,
      fileName,
      path: destination,
    });
  });

  const tutorialExport = {
    ...tutorial,
    mirroredAt: new Date().toISOString(),
    mirroredAssets,
  };
  fs.writeFileSync(path.join(tutorialDir, "tutorial.json"), JSON.stringify(tutorialExport, null, 2), "utf8");
  return true;
}

async function maybeAutoCloudSyncOnRead(userId) {
  if (!userId) {
    return;
  }
  if (autoCloudSyncInFlightByUser.has(userId)) {
    return;
  }
  const now = Date.now();
  const lastRun = Number(autoCloudSyncByUser.get(userId) || 0);
  if (now - lastRun < AUTO_CLOUD_SYNC_READ_MS) {
    return;
  }
  const settings = await getOrCreateUserSettingsForSync(userId);
  if (!canSyncToCloudStorage(settings)) {
    return;
  }
  if (settings.cloudProvider === "supabase" && !isSupabaseConfigured()) {
    return;
  }
  autoCloudSyncByUser.set(userId, now);
  autoCloudSyncInFlightByUser.add(userId);
  try {
    await runAndRecordStorageSync(userId).catch((error) => logSyncError("auto-cloud-read", error));
  } finally {
    autoCloudSyncInFlightByUser.delete(userId);
  }
}

async function runStorageSyncForUser(userId) {
  if (!userId) {
    return {
      syncedTutorials: 0,
      totalTutorials: 0,
      mode: "none",
      local: { enabled: false, synced: 0, errors: 0 },
      cloud: {
        enabled: false,
        provider: "none",
        synced: 0,
        skipped: 0,
        downloaded: 0,
        deleted: 0,
        cleaned: 0,
        pendingPeer: 0,
        errors: 0,
      },
      errors: [],
      tutorialCloud: {},
    };
  }
  const settings = await getOrCreateUserSettingsForSync(userId);
  let rows = await allAsync("SELECT * FROM tutorials WHERE user_id = ?", [userId]);
  let tutorials = rows.map(fromRow);
  const syncedIds = new Set();
  const cloudViaGoogleApi = shouldUseGoogleDriveApiSync(settings);
  const cloudViaSupabaseApi = shouldUseSupabaseApiSync(settings);
  const result = {
    syncedTutorials: 0,
    totalTutorials: tutorials.length,
    mode: settings.storageMode,
    local: {
      enabled: canSyncToLocalStorage(settings) && Boolean(settings.localRootPath),
      synced: 0,
      errors: 0,
    },
    cloud: {
      enabled:
        canSyncToCloudStorage(settings) &&
        (cloudViaGoogleApi || cloudViaSupabaseApi || Boolean(settings.cloudRootPath)),
      provider: settings.cloudProvider,
      transport: cloudViaSupabaseApi ? "supabase_api" : cloudViaGoogleApi ? "google_api" : "folder_mirror",
      synced: 0,
      skipped: 0,
      downloaded: 0,
      deleted: 0,
      cleaned: 0,
      pendingPeer: 0,
      errors: 0,
    },
    errors: [],
    tutorialCloud: {},
  };
  const cloudPendingPeerById = new Map();
  const cloudErrorsById = new Map();
  const cloudSyncedIds = new Set();
  const mergeSyncCountMap = (targetMap, sourceMap) => {
    if (!targetMap || !sourceMap || typeof sourceMap.forEach !== "function") {
      return;
    }
    sourceMap.forEach((count, id) => {
      bumpSyncCountMap(targetMap, id, count);
    });
  };
  const mergeSyncIdSet = (targetSet, sourceSet) => {
    if (!targetSet || !sourceSet || typeof sourceSet.forEach !== "function") {
      return;
    }
    sourceSet.forEach((id) => {
      const cleanId = asTrimmedString(id);
      if (cleanId) {
        targetSet.add(cleanId);
      }
    });
  };

  if (result.local.enabled) {
    const rootPath = resolveStoragePath(settings.localRootPath);
    tutorials.forEach((tutorial) => {
      try {
        if (syncTutorialToRoot(rootPath, userId, tutorial)) {
          syncedIds.add(tutorial.id);
          result.local.synced += 1;
        }
      } catch (error) {
        result.local.errors += 1;
        result.errors.push(`[local] ${tutorial.id}: ${resolveErrorMessage(error)}`);
      }
    });
  }

  if (result.cloud.enabled) {
    if (cloudViaSupabaseApi) {
      const supabasePullResult = await pullTutorialsFromSupabase(settings, userId, tutorials);
      result.cloud.downloaded = supabasePullResult.downloaded;
      result.cloud.deleted = supabasePullResult.deleted;
      result.cloud.cleaned = supabasePullResult.cleaned;
      result.cloud.pendingPeer += supabasePullResult.pendingPeer;
      result.cloud.errors += supabasePullResult.errors;
      mergeSyncCountMap(cloudPendingPeerById, supabasePullResult.pendingPeerById);
      mergeSyncCountMap(cloudErrorsById, supabasePullResult.errorById);
      mergeSyncIdSet(cloudSyncedIds, supabasePullResult.downloadedIds);
      if (supabasePullResult.messages.length) {
        supabasePullResult.messages.forEach((message) => result.errors.push(message));
      }
      if (supabasePullResult.downloaded || supabasePullResult.deleted) {
        rows = await allAsync("SELECT * FROM tutorials WHERE user_id = ?", [userId]);
        tutorials = rows.map(fromRow);
        result.totalTutorials = tutorials.length;
      }

      const supabasePushResult = await syncTutorialsToSupabase(settings, userId, tutorials);
      result.cloud.synced += supabasePushResult.synced;
      result.cloud.skipped += supabasePushResult.skipped;
      result.cloud.pendingPeer += supabasePushResult.pendingPeer;
      result.cloud.errors += supabasePushResult.errors;
      supabasePushResult.syncedIds.forEach((id) => syncedIds.add(id));
      mergeSyncCountMap(cloudPendingPeerById, supabasePushResult.pendingPeerById);
      mergeSyncCountMap(cloudErrorsById, supabasePushResult.errorById);
      mergeSyncIdSet(cloudSyncedIds, supabasePushResult.syncedIds);
      if (supabasePushResult.messages.length) {
        supabasePushResult.messages.forEach((message) => result.errors.push(message));
      }
    } else if (cloudViaGoogleApi) {
      const googleResult = await syncTutorialsToGoogleDrive(settings, userId, tutorials);
      result.cloud.synced += googleResult.synced;
      result.cloud.skipped += googleResult.skipped;
      result.cloud.errors += googleResult.errors;
      googleResult.syncedIds.forEach((id) => syncedIds.add(id));
      mergeSyncCountMap(cloudErrorsById, googleResult.errorById);
      mergeSyncIdSet(cloudSyncedIds, googleResult.syncedIds);
      if (googleResult.messages.length) {
        googleResult.messages.forEach((message) => result.errors.push(message));
      }
    } else {
      const cloudRoot = resolveStoragePath(settings.cloudRootPath);
      tutorials.forEach((tutorial) => {
        if (!shouldSyncTutorialToCloud(settings, tutorial.id)) {
          result.cloud.skipped += 1;
          return;
        }
        try {
          if (syncTutorialToRoot(cloudRoot, userId, tutorial)) {
            syncedIds.add(tutorial.id);
            cloudSyncedIds.add(tutorial.id);
            result.cloud.synced += 1;
          }
        } catch (error) {
          result.cloud.errors += 1;
          bumpSyncCountMap(cloudErrorsById, tutorial.id, 1);
          result.errors.push(`[cloud] ${tutorial.id}: ${resolveErrorMessage(error)}`);
        }
      });
    }
  }

  tutorials.forEach((tutorial) => {
    const id = asTrimmedString(tutorial.id);
    if (!id) {
      return;
    }
    const selectedForCloud = result.cloud.enabled ? shouldSyncTutorialToCloud(settings, id) : false;
    const pendingPeer = Number(cloudPendingPeerById.get(id) || 0);
    const errorCount = Number(cloudErrorsById.get(id) || 0);
    const wasSyncedThisRun = cloudSyncedIds.has(id);
    let stateLabel = "disabled";
    if (result.cloud.enabled) {
      stateLabel = selectedForCloud ? "synced" : "excluded";
      if (selectedForCloud && !wasSyncedThisRun && !pendingPeer && !errorCount) {
        stateLabel = "idle";
      }
      if (pendingPeer > 0) {
        stateLabel = "pending_peer";
      }
      if (errorCount > 0) {
        stateLabel = "error";
      }
    } else if (result.local.enabled) {
      stateLabel = "local_only";
    }
    result.tutorialCloud[id] = {
      state: stateLabel,
      selectedForCloud,
      pendingPeer,
      errors: errorCount,
      updatedAt: asTrimmedString(tutorial.updatedAt || tutorial.createdAt),
    };
  });

  result.syncedTutorials = syncedIds.size;
  return result;
}

function shouldUseGoogleDriveApiSync(settings) {
  return (
    settings.cloudProvider === "google_drive" &&
    Boolean(asTrimmedString(settings.cloudAccessToken) || asTrimmedString(settings.cloudRefreshToken))
  );
}

function shouldUseSupabaseApiSync(settings) {
  return settings.cloudProvider === "supabase" && isSupabaseConfigured();
}

function resolveGoogleDriveRootFolderName(rawValue) {
  const raw = asTrimmedString(rawValue);
  if (!raw) {
    return "TRAZO";
  }
  const parts = raw.split(/[\\/]+/).filter(Boolean);
  const candidate = parts.length ? parts[parts.length - 1] : raw;
  const clean = safePathSegment(candidate).slice(0, 80);
  return clean || "TRAZO";
}

function detectMimeTypeFromFileName(fileName) {
  const ext = path.extname(String(fileName || "")).toLowerCase();
  const map = {
    ".json": "application/json",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".m4v": "video/x-m4v",
    ".ogg": "video/ogg",
  };
  return map[ext] || "application/octet-stream";
}

function escapeGoogleDriveQueryValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function buildMultipartRelatedPayload(metadata, contentBuffer, contentType) {
  const boundary = `trazo-${crypto.randomBytes(12).toString("hex")}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata || {}
    )}\r\n--${boundary}\r\nContent-Type: ${contentType || "application/octet-stream"}\r\n\r\n`,
    "utf8"
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, "utf8");
  const fileBuffer = Buffer.isBuffer(contentBuffer) ? contentBuffer : Buffer.from(contentBuffer || "");
  return {
    body: Buffer.concat([head, fileBuffer, tail]),
    contentTypeHeader: `multipart/related; boundary=${boundary}`,
  };
}

function hasGoogleAccessTokenExpired(tokenExpiresAt) {
  const raw = asTrimmedString(tokenExpiresAt);
  if (!raw) {
    return false;
  }
  const at = Date.parse(raw);
  if (!Number.isFinite(at)) {
    return false;
  }
  return at - Date.now() <= 60 * 1000;
}

async function refreshGoogleDriveAccessToken(userId, settings) {
  const refreshToken = asTrimmedString(settings.cloudRefreshToken);
  if (!refreshToken) {
    throw new Error("Google Drive requiere refresh token. Vuelve a conectar tu cuenta.");
  }
  if (!isGoogleOauthConfigured()) {
    throw new Error("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI son obligatorios.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      asTrimmedString(payload.error_description) || asTrimmedString(payload.error) || "No se pudo refrescar token.";
    throw new Error(`Google Drive: ${message}`);
  }
  const accessToken = asTrimmedString(payload.access_token);
  if (!accessToken) {
    throw new Error("Google Drive no devolvio access_token al refrescar.");
  }
  const nextRefreshToken = asTrimmedString(payload.refresh_token) || refreshToken;
  const expiresAt = computeTokenExpiryIso(payload.expires_in);
  const scope = asTrimmedString(payload.scope) || asTrimmedString(settings.cloudScope);
  const now = new Date().toISOString();

  await runAsync(
    `UPDATE user_settings
     SET cloud_access_token = ?, cloud_refresh_token = ?, cloud_token_expires_at = ?, cloud_scope = ?, updated_at = ?
     WHERE user_id = ?`,
    [accessToken, nextRefreshToken, expiresAt, scope, now, userId]
  );

  settings.cloudAccessToken = accessToken;
  settings.cloudRefreshToken = nextRefreshToken;
  settings.cloudTokenExpiresAt = expiresAt;
  settings.cloudScope = scope;
  return accessToken;
}

async function ensureGoogleDriveAccessToken(userId, settings) {
  const current = asTrimmedString(settings.cloudAccessToken);
  if (current && !hasGoogleAccessTokenExpired(settings.cloudTokenExpiresAt)) {
    return current;
  }
  if (asTrimmedString(settings.cloudRefreshToken)) {
    return refreshGoogleDriveAccessToken(userId, settings);
  }
  if (current) {
    return current;
  }
  throw new Error("No hay token de acceso de Google Drive. Conecta nuevamente la cuenta.");
}

async function parseGoogleApiPayload(response) {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  const text = await response.text().catch(() => "");
  return text ? { message: text } : {};
}

function resolveGoogleApiError(payload, fallback = "Error de Google Drive API.") {
  if (payload && typeof payload === "object") {
    if (typeof payload.error === "string" && payload.error) {
      return payload.error;
    }
    if (payload.error && typeof payload.error === "object") {
      if (asTrimmedString(payload.error.message)) {
        return asTrimmedString(payload.error.message);
      }
      if (Array.isArray(payload.error.errors) && payload.error.errors.length) {
        const first = payload.error.errors[0];
        const detail = asTrimmedString(first?.message || first?.reason);
        if (detail) {
          return detail;
        }
      }
    }
    if (asTrimmedString(payload.message)) {
      return asTrimmedString(payload.message);
    }
  }
  return fallback;
}

async function googleDriveRequest(settings, userId, options) {
  const method = asTrimmedString(options?.method).toUpperCase() || "GET";
  const endpoint = asTrimmedString(options?.endpoint);
  const query = options?.query && typeof options.query === "object" ? options.query : {};
  const headers = options?.headers && typeof options.headers === "object" ? options.headers : {};
  const retryOnAuth = options?.retryOnAuth !== false;
  const body = options?.body;
  if (!endpoint) {
    throw new Error("Falta endpoint para llamada a Google Drive.");
  }

  const url = new URL(`https://www.googleapis.com${endpoint}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    url.searchParams.set(String(key), String(value));
  });

  const accessToken = await ensureGoogleDriveAccessToken(userId, settings);
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    body,
  });

  if (response.status === 401 && retryOnAuth && asTrimmedString(settings.cloudRefreshToken)) {
    await refreshGoogleDriveAccessToken(userId, settings);
    return googleDriveRequest(settings, userId, { ...options, retryOnAuth: false });
  }

  return response;
}

async function googleDriveRequestWithPayload(settings, userId, options) {
  const response = await googleDriveRequest(settings, userId, options);
  const payload = await parseGoogleApiPayload(response);
  return { response, payload };
}

async function findGoogleDriveFileByName(settings, userId, params) {
  const name = asTrimmedString(params?.name);
  const parentId = asTrimmedString(params?.parentId) || "root";
  const mimeType = asTrimmedString(params?.mimeType);
  if (!name) {
    return null;
  }
  const queryParts = [
    `name = '${escapeGoogleDriveQueryValue(name)}'`,
    `'${escapeGoogleDriveQueryValue(parentId)}' in parents`,
    "trashed = false",
  ];
  if (mimeType) {
    queryParts.push(`mimeType = '${escapeGoogleDriveQueryValue(mimeType)}'`);
  }
  const { response, payload } = await googleDriveRequestWithPayload(settings, userId, {
    method: "GET",
    endpoint: "/drive/v3/files",
    query: {
      q: queryParts.join(" and "),
      spaces: "drive",
      fields: "files(id,name,mimeType,webViewLink)",
      pageSize: 1,
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    },
  });
  if (!response.ok) {
    throw new Error(resolveGoogleApiError(payload, `No se pudo buscar '${name}' en Google Drive.`));
  }
  return Array.isArray(payload.files) && payload.files.length ? payload.files[0] : null;
}

async function ensureGoogleDriveFolder(settings, userId, folderName, parentId = "root") {
  const existing = await findGoogleDriveFileByName(settings, userId, {
    name: folderName,
    parentId,
    mimeType: "application/vnd.google-apps.folder",
  });
  if (existing?.id) {
    return existing.id;
  }
  const { response, payload } = await googleDriveRequestWithPayload(settings, userId, {
    method: "POST",
    endpoint: "/drive/v3/files",
    query: {
      fields: "id,name,mimeType",
      supportsAllDrives: "true",
    },
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  if (!response.ok) {
    throw new Error(resolveGoogleApiError(payload, `No se pudo crear carpeta '${folderName}' en Google Drive.`));
  }
  return asTrimmedString(payload.id);
}

async function upsertGoogleDriveFile(settings, userId, params) {
  const parentId = asTrimmedString(params?.parentId) || "root";
  const name = safePathSegment(params?.name || "archivo");
  const mimeType = asTrimmedString(params?.mimeType) || "application/octet-stream";
  const contentBuffer = Buffer.isBuffer(params?.contentBuffer) ? params.contentBuffer : Buffer.from(params?.contentBuffer || "");

  const existing = await findGoogleDriveFileByName(settings, userId, { name, parentId });
  const metadata = existing?.id ? { name } : { name, parents: [parentId] };
  const { body, contentTypeHeader } = buildMultipartRelatedPayload(metadata, contentBuffer, mimeType);
  const endpoint = existing?.id
    ? `/upload/drive/v3/files/${encodeURIComponent(existing.id)}`
    : "/upload/drive/v3/files";
  const method = existing?.id ? "PATCH" : "POST";
  const { response, payload } = await googleDriveRequestWithPayload(settings, userId, {
    method,
    endpoint,
    query: {
      uploadType: "multipart",
      fields: "id,name,mimeType,webViewLink",
      supportsAllDrives: "true",
    },
    headers: {
      "Content-Type": contentTypeHeader,
    },
    body,
  });
  if (!response.ok) {
    throw new Error(resolveGoogleApiError(payload, `No se pudo subir '${name}' a Google Drive.`));
  }
  return payload;
}

async function syncTutorialToGoogleDrive(settings, userId, tutorial, rootFolderId) {
  const tutorialFolderId = await ensureGoogleDriveFolder(
    settings,
    userId,
    `tutorial-${safePathSegment(tutorial.id).slice(0, 48)}`,
    rootFolderId
  );

  const mirroredAssets = [];
  for (const assetUrl of collectTutorialAssetUrls(tutorial)) {
    const sourcePath = sourceUploadFilePathFromUrl(assetUrl);
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      continue;
    }
    const fileName = safePathSegment(path.basename(sourcePath));
    const mimeType = detectMimeTypeFromFileName(fileName);
    const uploaded = await upsertGoogleDriveFile(settings, userId, {
      parentId: tutorialFolderId,
      name: fileName,
      mimeType,
      contentBuffer: fs.readFileSync(sourcePath),
    });
    mirroredAssets.push({
      sourceUrl: assetUrl,
      fileName,
      driveFileId: asTrimmedString(uploaded.id),
      webViewLink: asTrimmedString(uploaded.webViewLink),
    });
  }

  const tutorialExport = {
    ...tutorial,
    mirroredAt: new Date().toISOString(),
    storage: "google-drive-api",
    mirroredAssets,
  };
  await upsertGoogleDriveFile(settings, userId, {
    parentId: tutorialFolderId,
    name: "tutorial.json",
    mimeType: "application/json",
    contentBuffer: Buffer.from(JSON.stringify(tutorialExport, null, 2), "utf8"),
  });
  return true;
}

async function syncTutorialsToGoogleDrive(settings, userId, tutorials) {
  const rootName = resolveGoogleDriveRootFolderName(settings.cloudRootPath);
  const appRootId = await ensureGoogleDriveFolder(settings, userId, rootName, "root");
  const userRootId = await ensureGoogleDriveFolder(settings, userId, `user-${safePathSegment(userId).slice(0, 30)}`, appRootId);

  const result = {
    synced: 0,
    skipped: 0,
    errors: 0,
    syncedIds: new Set(),
    errorById: new Map(),
    messages: [],
  };

  for (const tutorial of tutorials) {
    if (!shouldSyncTutorialToCloud(settings, tutorial.id)) {
      result.skipped += 1;
      continue;
    }
    try {
      const synced = await syncTutorialToGoogleDrive(settings, userId, tutorial, userRootId);
      if (synced) {
        result.synced += 1;
        result.syncedIds.add(tutorial.id);
      }
    } catch (error) {
      result.errors += 1;
      bumpSyncCountMap(result.errorById, tutorial.id, 1);
      result.messages.push(`[cloud-google] ${tutorial.id}: ${resolveErrorMessage(error)}`);
    }
  }

  return result;
}

function resolveSupabaseRootPrefix(rawValue) {
  const raw = asTrimmedString(rawValue).replace(/\\/g, "/");
  const parts = raw
    .split("/")
    .map((item) => safePathSegment(item))
    .filter(Boolean);
  const clean = parts.join("/").replace(/^\/+|\/+$/g, "");
  return clean || "trazo";
}

function buildSupabaseUserPrefix(settings, userId) {
  const root = resolveSupabaseRootPrefix(settings.cloudRootPath);
  return `${root}/users/${safePathSegment(userId).slice(0, 64) || "user"}`;
}

function encodeSupabaseObjectPath(objectPath) {
  return String(objectPath || "")
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function resolveSupabaseApiUrl(endpoint) {
  const base = SUPABASE_URL.replace(/\/+$/g, "");
  const suffix = String(endpoint || "").startsWith("/") ? String(endpoint || "") : `/${String(endpoint || "")}`;
  return `${base}${suffix}`;
}

async function parseSupabaseApiPayload(response) {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  const text = await response.text().catch(() => "");
  return text ? { message: text } : {};
}

function resolveSupabaseApiError(payload, fallback = "Error de Supabase.") {
  if (payload && typeof payload === "object") {
    const messageCandidates = [
      payload.message,
      payload.error_description,
      payload.error,
      payload.msg,
      payload.details,
      payload.hint,
    ];
    for (const candidate of messageCandidates) {
      const text = asTrimmedString(candidate);
      if (text) {
        return text;
      }
    }
  }
  return fallback;
}

async function supabaseApiRequest(options) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no configurado. Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  }
  const endpoint = asTrimmedString(options?.endpoint);
  if (!endpoint) {
    throw new Error("Falta endpoint para Supabase.");
  }
  const response = await fetch(resolveSupabaseApiUrl(endpoint), {
    method: asTrimmedString(options?.method).toUpperCase() || "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options?.headers && typeof options.headers === "object" ? options.headers : {}),
    },
    body: options?.body,
  });
  return response;
}

async function ensureSupabaseBucket() {
  const check = await supabaseApiRequest({
    method: "GET",
    endpoint: `/storage/v1/bucket/${encodeURIComponent(SUPABASE_BUCKET)}`,
  });
  if (check.ok) {
    return;
  }
  const checkPayload = await parseSupabaseApiPayload(check);
  const checkMessage = resolveSupabaseApiError(checkPayload, "").toLowerCase();
  const missingBucket =
    check.status === 404 ||
    checkMessage.includes("bucket not found") ||
    checkMessage.includes("not found");
  if (!missingBucket) {
    throw new Error(resolveSupabaseApiError(checkPayload, "No se pudo validar bucket de Supabase."));
  }
  const create = await supabaseApiRequest({
    method: "POST",
    endpoint: "/storage/v1/bucket",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      id: SUPABASE_BUCKET,
      name: SUPABASE_BUCKET,
      public: false,
    }),
  });
  if (!create.ok && create.status !== 409) {
    const payload = await parseSupabaseApiPayload(create);
    throw new Error(resolveSupabaseApiError(payload, "No se pudo crear bucket de Supabase."));
  }
}

async function uploadSupabaseObjectBuffer(objectPath, buffer, contentType = "application/octet-stream") {
  const response = await supabaseApiRequest({
    method: "POST",
    endpoint: `/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${encodeSupabaseObjectPath(objectPath)}`,
    headers: {
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || ""),
  });
  const payload = await parseSupabaseApiPayload(response);
  if (!response.ok) {
    throw new Error(resolveSupabaseApiError(payload, `No se pudo subir '${objectPath}' a Supabase.`));
  }
  return payload;
}

async function downloadSupabaseObjectBuffer(objectPath) {
  const response = await supabaseApiRequest({
    method: "GET",
    endpoint: `/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${encodeSupabaseObjectPath(objectPath)}`,
  });
  const payload = response.ok ? null : await parseSupabaseApiPayload(response);
  if (!response.ok) {
    const message = resolveSupabaseApiError(payload, "").toLowerCase();
    const notFound =
      response.status === 404 ||
      message.includes("object not found") ||
      message.includes("not found");
    if (notFound) {
      return null;
    }
    throw new Error(resolveSupabaseApiError(payload, `No se pudo descargar '${objectPath}' de Supabase.`));
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function listSupabaseObjects(prefix) {
  const response = await supabaseApiRequest({
    method: "POST",
    endpoint: `/storage/v1/object/list/${encodeURIComponent(SUPABASE_BUCKET)}`,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      prefix,
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    }),
  });
  const payload = await parseSupabaseApiPayload(response);
  if (!response.ok) {
    throw new Error(resolveSupabaseApiError(payload, `No se pudo listar objetos '${prefix}' en Supabase.`));
  }
  return Array.isArray(payload) ? payload : [];
}

async function deleteSupabaseObject(objectPath) {
  const response = await supabaseApiRequest({
    method: "DELETE",
    endpoint: `/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${encodeSupabaseObjectPath(objectPath)}`,
  });
  if (response.ok || response.status === 404) {
    return;
  }
  const payload = await parseSupabaseApiPayload(response);
  throw new Error(resolveSupabaseApiError(payload, `No se pudo eliminar '${objectPath}' de Supabase.`));
}

function normalizeSupabaseMediaAsset(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const sourceUrl = asTrimmedString(value.sourceUrl).slice(0, 2000);
  const objectPath = asTrimmedString(value.objectPath).slice(0, 1000);
  const fileName = safePathSegment(value.fileName || path.basename(objectPath || "archivo"));
  if (!sourceUrl || !objectPath || !fileName) {
    return null;
  }
  return {
    sourceUrl,
    fileName,
    objectPath,
    sizeBytes: Math.max(0, Number(value.sizeBytes) || 0),
    mimeType: asTrimmedString(value.mimeType).slice(0, 180),
  };
}

function normalizeSupabasePeerAsset(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const sourceUrl = asTrimmedString(value.sourceUrl).slice(0, 2000);
  const fileName = safePathSegment(value.fileName || path.basename(sourceUrl || "archivo"));
  if (!sourceUrl || !fileName) {
    return null;
  }
  return {
    sourceUrl,
    fileName,
    sizeBytes: Math.max(0, Number(value.sizeBytes) || 0),
    reason: asTrimmedString(value.reason).slice(0, 120) || "peer_required",
  };
}

function normalizeSupabaseMediaReceipts(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const deviceId = normalizeDeviceId(item?.deviceId);
      if (!deviceId) {
        return null;
      }
      return {
        deviceId,
        receivedAt: asTrimmedString(item?.receivedAt) || new Date().toISOString(),
      };
    })
    .filter(Boolean)
    .slice(-30);
}

function normalizeSupabaseMediaRequests(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const deviceId = normalizeDeviceId(item?.deviceId);
      if (!deviceId) {
        return null;
      }
      return {
        deviceId,
        requestedAt: asTrimmedString(item?.requestedAt) || new Date().toISOString(),
      };
    })
    .filter(Boolean)
    .slice(-30);
}

function normalizeSupabaseTutorialMedia(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const assets = Array.isArray(value.assets) ? value.assets.map(normalizeSupabaseMediaAsset).filter(Boolean) : [];
  const pendingPeerAssets = Array.isArray(value.pendingPeerAssets)
    ? value.pendingPeerAssets.map(normalizeSupabasePeerAsset).filter(Boolean)
    : [];
  const ownerDeviceId = normalizeDeviceId(value.ownerDeviceId);
  const cleanupPolicy = asTrimmedString(value.cleanupPolicy) || "delete_after_first_remote_pull";
  return {
    ownerDeviceId,
    cleanupPolicy,
    transferMaxBytes: Math.max(0, Number(value.transferMaxBytes) || CLOUD_MEDIA_TRANSFER_MAX_BYTES),
    assets,
    pendingPeerAssets,
    requests: normalizeSupabaseMediaRequests(value.requests),
    receipts: normalizeSupabaseMediaReceipts(value.receipts),
    cleanedAt: asTrimmedString(value.cleanedAt),
    uploadedAt: asTrimmedString(value.uploadedAt),
  };
}

function normalizeSupabaseManifest(value, rootPrefix, userId) {
  const fallback = {
    version: 1,
    rootPrefix,
    userId,
    syncedAt: "",
    tutorials: [],
    deleted: [],
  };
  if (!value || typeof value !== "object") {
    return fallback;
  }
  const tutorials = Array.isArray(value.tutorials)
    ? value.tutorials
        .map((entry) => {
          const id = asTrimmedString(entry?.id);
          if (!id) {
            return null;
          }
          const pathValue =
            asTrimmedString(entry?.path) ||
            `${rootPrefix}/users/${safePathSegment(userId).slice(0, 64) || "user"}/tutorials/${safePathSegment(id).slice(0, 80)}/tutorial.json`;
          return {
            id,
            updatedAt: asTrimmedString(entry?.updatedAt),
            path: pathValue,
            media: normalizeSupabaseTutorialMedia(entry?.media),
          };
        })
        .filter(Boolean)
    : [];
  const deleted = Array.isArray(value.deleted)
    ? value.deleted
        .map((entry) => {
          const id = asTrimmedString(entry?.id);
          if (!id) {
            return null;
          }
          return {
            id,
            deletedAt: asTrimmedString(entry?.deletedAt) || new Date().toISOString(),
          };
        })
        .filter(Boolean)
    : [];
  return {
    version: Number(value.version || 1),
    rootPrefix: asTrimmedString(value.rootPrefix) || rootPrefix,
    userId: asTrimmedString(value.userId) || userId,
    syncedAt: asTrimmedString(value.syncedAt),
    tutorials,
    deleted,
  };
}

async function getSupabaseManifest(userPrefix, userId, rootPrefix = "trazo") {
  const manifestPath = `${userPrefix}/manifest.json`;
  const buffer = await downloadSupabaseObjectBuffer(manifestPath);
  if (!buffer) {
    return normalizeSupabaseManifest(null, rootPrefix, userId);
  }
  try {
    const parsed = JSON.parse(buffer.toString("utf8"));
    return normalizeSupabaseManifest(parsed, rootPrefix, userId);
  } catch {
    return normalizeSupabaseManifest(null, rootPrefix, userId);
  }
}

async function writeSupabaseManifest(userPrefix, payload) {
  const manifestPath = `${userPrefix}/manifest.json`;
  await uploadSupabaseObjectBuffer(
    manifestPath,
    Buffer.from(JSON.stringify(payload, null, 2), "utf8"),
    "application/json"
  );
}

async function deleteSupabaseTutorialFolder(userPrefix, tutorialId) {
  const prefix = `${userPrefix}/tutorials/${safePathSegment(tutorialId).slice(0, 80)}`;
  const folderPath = `${prefix}/`;
  const files = await listSupabaseObjects(folderPath);
  if (!files.length) {
    return;
  }
  for (const file of files) {
    const name = asTrimmedString(file?.name);
    if (!name) {
      continue;
    }
    await deleteSupabaseObject(`${folderPath}${name}`);
  }
}

function resolveDateMs(value) {
  const ms = Date.parse(asTrimmedString(value));
  return Number.isFinite(ms) ? ms : 0;
}

async function syncTutorialToSupabase(settings, userId, tutorial, userPrefix, deviceId) {
  const tutorialPrefix = `${userPrefix}/tutorials/${safePathSegment(tutorial.id).slice(0, 80)}`;
  const mirroredAssets = [];
  const uploadedAssets = [];
  const pendingPeerAssets = [];
  const warnings = [];
  for (const assetUrl of collectTutorialAssetUrls(tutorial)) {
    const sourcePath = sourceUploadFilePathFromUrl(assetUrl);
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      continue;
    }
    const fileName = safePathSegment(path.basename(sourcePath));
    if (!fileName) {
      continue;
    }
    const stat = fs.statSync(sourcePath);
    const sizeBytes = Math.max(0, Number(stat.size) || 0);
    const mimeType = detectMimeTypeFromFileName(fileName);
    if (sizeBytes > CLOUD_MEDIA_TRANSFER_MAX_BYTES) {
      pendingPeerAssets.push({
        sourceUrl: assetUrl,
        fileName,
        sizeBytes,
        reason: "peer_required_size_limit",
      });
      mirroredAssets.push({
        sourceUrl: assetUrl,
        fileName,
        objectPath: "",
        sizeBytes,
        mimeType,
        syncMode: "peer_required",
      });
      warnings.push(
        `[cloud-supabase-peer] ${tutorial.id}: '${fileName}' supera el limite (${Math.round(
          CLOUD_MEDIA_TRANSFER_MAX_BYTES / (1024 * 1024)
        )}MB). Queda pendiente para transferencia entre dispositivos.`
      );
      continue;
    }
    const objectPath = `${tutorialPrefix}/assets/${fileName}`;
    await uploadSupabaseObjectBuffer(objectPath, fs.readFileSync(sourcePath), mimeType);
    const uploadedAsset = {
      sourceUrl: assetUrl,
      fileName,
      objectPath,
      sizeBytes,
      mimeType,
    };
    mirroredAssets.push({
      ...uploadedAsset,
      syncMode: "cloud_temp",
    });
    uploadedAssets.push(uploadedAsset);
  }

  const media = normalizeSupabaseTutorialMedia({
    ownerDeviceId: normalizeDeviceId(deviceId),
    cleanupPolicy: "delete_after_first_remote_pull",
    transferMaxBytes: CLOUD_MEDIA_TRANSFER_MAX_BYTES,
    assets: uploadedAssets,
    pendingPeerAssets,
    receipts: [],
    cleanedAt: "",
    uploadedAt: new Date().toISOString(),
  });

  const tutorialExport = {
    ...tutorial,
    mirroredAt: new Date().toISOString(),
    storage: "supabase-storage",
    mirroredAssets,
    cloudMediaPlan: media,
  };
  const tutorialJsonPath = `${tutorialPrefix}/tutorial.json`;
  await uploadSupabaseObjectBuffer(
    tutorialJsonPath,
    Buffer.from(JSON.stringify(tutorialExport, null, 2), "utf8"),
    "application/json"
  );
  return {
    tutorialJsonPath,
    media,
    pendingPeerCount: pendingPeerAssets.length,
    warnings,
  };
}

function remapTutorialMediaUrls(rawTutorial, mapper) {
  const source = rawTutorial && typeof rawTutorial === "object" ? rawTutorial : {};
  const mapValue = (value, meta) => {
    const original = asTrimmedString(value);
    if (!original) {
      return "";
    }
    const mapped = mapper(original, meta);
    return typeof mapped === "string" ? mapped : original;
  };
  const next = {
    ...source,
    url: mapValue(source.url, { location: "url", type: source.type || "" }),
    imageUrl: mapValue(source.imageUrl, { location: "imageUrl", type: "image" }),
  };
  if (Array.isArray(source.extraContent)) {
    next.extraContent = source.extraContent.map((block) => {
      if (!block || typeof block !== "object") {
        return block;
      }
      if (!["image", "video"].includes(asTrimmedString(block.type))) {
        return block;
      }
      return {
        ...block,
        url: mapValue(block.url, {
          location: "extra",
          type: asTrimmedString(block.type),
          blockId: asTrimmedString(block.id),
        }),
      };
    });
  }
  return next;
}

function hasForeignMediaReceipt(media, ownerDeviceId) {
  if (!media || !Array.isArray(media.receipts)) {
    return false;
  }
  const owner = normalizeDeviceId(ownerDeviceId);
  return media.receipts.some((receipt) => {
    const id = normalizeDeviceId(receipt?.deviceId);
    return id && id !== owner;
  });
}

function upsertMediaReceipt(media, deviceId, at) {
  const normalized = normalizeSupabaseTutorialMedia(media);
  const targetDeviceId = normalizeDeviceId(deviceId);
  if (!normalized || !targetDeviceId) {
    return normalized;
  }
  const nextReceipts = Array.isArray(normalized.receipts) ? [...normalized.receipts] : [];
  const index = nextReceipts.findIndex((item) => normalizeDeviceId(item.deviceId) === targetDeviceId);
  const nextReceipt = {
    deviceId: targetDeviceId,
    receivedAt: asTrimmedString(at) || new Date().toISOString(),
  };
  if (index >= 0) {
    nextReceipts[index] = nextReceipt;
  } else {
    nextReceipts.push(nextReceipt);
  }
  normalized.receipts = normalizeSupabaseMediaReceipts(nextReceipts);
  return normalized;
}

function upsertMediaRequest(media, deviceId, at) {
  const normalized = normalizeSupabaseTutorialMedia(media);
  const targetDeviceId = normalizeDeviceId(deviceId);
  if (!normalized || !targetDeviceId) {
    return normalized;
  }
  if (targetDeviceId === normalizeDeviceId(normalized.ownerDeviceId)) {
    return normalized;
  }
  const requests = Array.isArray(normalized.requests) ? [...normalized.requests] : [];
  const index = requests.findIndex((item) => normalizeDeviceId(item.deviceId) === targetDeviceId);
  const nextRequest = {
    deviceId: targetDeviceId,
    requestedAt: asTrimmedString(at) || new Date().toISOString(),
  };
  if (index >= 0) {
    requests[index] = nextRequest;
  } else {
    requests.push(nextRequest);
  }
  normalized.requests = requests
    .map((item) => ({
      deviceId: normalizeDeviceId(item.deviceId),
      requestedAt: asTrimmedString(item.requestedAt) || new Date().toISOString(),
    }))
    .filter((item) => item.deviceId)
    .slice(-30);
  return normalized;
}

function hasForeignPendingRequests(media, ownerDeviceId) {
  if (!media || !Array.isArray(media.requests)) {
    return false;
  }
  const owner = normalizeDeviceId(ownerDeviceId);
  return media.requests.some((request) => {
    const id = normalizeDeviceId(request?.deviceId);
    return id && id !== owner;
  });
}

function pruneSatisfiedMediaRequests(media) {
  const normalized = normalizeSupabaseTutorialMedia(media);
  if (!normalized || !Array.isArray(normalized.requests) || !normalized.requests.length) {
    return normalized;
  }
  const deliveredTo = new Set(
    (Array.isArray(normalized.receipts) ? normalized.receipts : [])
      .map((item) => normalizeDeviceId(item?.deviceId))
      .filter(Boolean)
  );
  normalized.requests = normalized.requests.filter((request) => !deliveredTo.has(normalizeDeviceId(request.deviceId)));
  return normalized;
}

async function cleanupDeliveredMediaFromSupabase(entry) {
  const media = normalizeSupabaseTutorialMedia(entry?.media);
  if (!media || !media.assets.length) {
    return { cleaned: 0, errors: [] };
  }
  let cleaned = 0;
  const errors = [];
  const remainingAssets = [];
  for (const asset of media.assets) {
    try {
      await deleteSupabaseObject(asset.objectPath);
      cleaned += 1;
    } catch (error) {
      errors.push(resolveErrorMessage(error));
      remainingAssets.push(asset);
    }
  }
  entry.media = {
    ...media,
    assets: remainingAssets,
    cleanedAt: remainingAssets.length ? "" : new Date().toISOString(),
  };
  return { cleaned, errors };
}

async function stagePendingPeerAssetsInSupabase(userPrefix, tutorialId, media, messages) {
  const normalized = normalizeSupabaseTutorialMedia(media);
  if (!normalized) {
    return { media: normalized, staged: 0 };
  }
  const tutorialPrefix = `${userPrefix}/tutorials/${safePathSegment(tutorialId).slice(0, 80)}`;
  const existingBySource = new Map(
    (Array.isArray(normalized.assets) ? normalized.assets : []).map((item) => [asTrimmedString(item.sourceUrl), item])
  );
  let staged = 0;
  for (const pending of normalized.pendingPeerAssets) {
    const sourceUrl = asTrimmedString(pending.sourceUrl);
    if (!sourceUrl || existingBySource.has(sourceUrl)) {
      continue;
    }
    const sourcePath = sourceUploadFilePathFromUrl(sourceUrl);
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      messages.push(
        `[cloud-supabase-peer] ${tutorialId}: no se encontro localmente '${pending.fileName}'. Sigue pendiente en P2P.`
      );
      continue;
    }
    const stat = fs.statSync(sourcePath);
    const sizeBytes = Math.max(0, Number(stat.size) || 0);
    if (sizeBytes > MAX_UPLOAD_BYTES) {
      messages.push(
        `[cloud-supabase-peer] ${tutorialId}: '${pending.fileName}' excede limite local de relay (${Math.round(
          MAX_UPLOAD_BYTES / (1024 * 1024)
        )}MB).`
      );
      continue;
    }
    const fileName = safePathSegment(pending.fileName || path.basename(sourcePath));
    const objectPath = `${tutorialPrefix}/assets/${fileName}`;
    const mimeType = detectMimeTypeFromFileName(fileName);
    await uploadSupabaseObjectBuffer(objectPath, fs.readFileSync(sourcePath), mimeType);
    const asset = {
      sourceUrl,
      fileName,
      objectPath,
      sizeBytes,
      mimeType,
    };
    existingBySource.set(sourceUrl, asset);
    staged += 1;
  }
  normalized.assets = Array.from(existingBySource.values());
  normalized.uploadedAt = new Date().toISOString();
  return { media: normalized, staged };
}

async function syncTutorialsToSupabase(settings, userId, tutorials) {
  await ensureSupabaseBucket();
  const userPrefix = buildSupabaseUserPrefix(settings, userId);
  const rootPrefix = resolveSupabaseRootPrefix(settings.cloudRootPath);
  const previousManifest = await getSupabaseManifest(userPrefix, userId, rootPrefix);
  const selected = tutorials.filter((tutorial) => shouldSyncTutorialToCloud(settings, tutorial.id));
  const selectedIds = new Set(selected.map((tutorial) => tutorial.id));
  const previousById = new Map(previousManifest.tutorials.map((entry) => [entry.id, entry]));
  const previousIds = new Set(previousManifest.tutorials.map((entry) => entry.id));
  const deletedMap = new Map(
    previousManifest.deleted.map((entry) => [entry.id, asTrimmedString(entry.deletedAt) || new Date().toISOString()])
  );
  const result = {
    synced: 0,
    skipped: Math.max(0, tutorials.length - selected.length),
    errors: 0,
    pendingPeer: 0,
    syncedIds: new Set(),
    pendingPeerById: new Map(),
    errorById: new Map(),
    messages: [],
  };

  for (const tutorialId of previousIds) {
    if (!selectedIds.has(tutorialId)) {
      deletedMap.set(tutorialId, new Date().toISOString());
      try {
        await deleteSupabaseTutorialFolder(userPrefix, tutorialId);
      } catch (error) {
        result.errors += 1;
        bumpSyncCountMap(result.errorById, tutorialId, 1);
        result.messages.push(`[cloud-supabase-delete] ${tutorialId}: ${resolveErrorMessage(error)}`);
      }
    }
  }

  const nextTutorialEntries = [];
  for (const tutorial of selected) {
    deletedMap.delete(tutorial.id);
    const previousEntry = previousById.get(tutorial.id);
    if (previousEntry && asTrimmedString(previousEntry.updatedAt) === asTrimmedString(tutorial.updatedAt)) {
      const normalizedPrevious = {
        ...previousEntry,
        media: pruneSatisfiedMediaRequests(normalizeSupabaseTutorialMedia(previousEntry.media)),
      };
      if (
        normalizedPrevious.media &&
        normalizeDeviceId(settings.deviceId) === normalizeDeviceId(normalizedPrevious.media.ownerDeviceId) &&
        hasForeignPendingRequests(normalizedPrevious.media, normalizedPrevious.media.ownerDeviceId) &&
        normalizedPrevious.media.pendingPeerAssets.length
      ) {
        try {
          const staged = await stagePendingPeerAssetsInSupabase(
            userPrefix,
            tutorial.id,
            normalizedPrevious.media,
            result.messages
          );
          normalizedPrevious.media = staged.media;
          if (staged.staged > 0) {
            result.synced += 1;
          }
        } catch (error) {
          result.errors += 1;
          bumpSyncCountMap(result.errorById, tutorial.id, 1);
          result.messages.push(`[cloud-supabase-peer-stage] ${tutorial.id}: ${resolveErrorMessage(error)}`);
        }
      }
      nextTutorialEntries.push(normalizedPrevious);
      result.skipped += 1;
      result.syncedIds.add(tutorial.id);
      if (normalizedPrevious.media?.pendingPeerAssets?.length) {
        const pendingCount = normalizedPrevious.media.pendingPeerAssets.length;
        result.pendingPeer += pendingCount;
        bumpSyncCountMap(result.pendingPeerById, tutorial.id, pendingCount);
      }
      continue;
    }
    try {
      const synced = await syncTutorialToSupabase(settings, userId, tutorial, userPrefix, settings.deviceId);
      let media = synced.media;
      const previousMedia = normalizeSupabaseTutorialMedia(previousEntry?.media);
      if (previousMedia) {
        media = normalizeSupabaseTutorialMedia({
          ...media,
          requests: previousMedia.requests,
          receipts: previousMedia.receipts,
        });
      }
      media = pruneSatisfiedMediaRequests(media);
      if (
        media &&
        normalizeDeviceId(settings.deviceId) === normalizeDeviceId(media.ownerDeviceId) &&
        hasForeignPendingRequests(media, media.ownerDeviceId) &&
        media.pendingPeerAssets.length
      ) {
        try {
          const staged = await stagePendingPeerAssetsInSupabase(userPrefix, tutorial.id, media, result.messages);
          media = staged.media;
        } catch (error) {
          result.errors += 1;
          bumpSyncCountMap(result.errorById, tutorial.id, 1);
          result.messages.push(`[cloud-supabase-peer-stage] ${tutorial.id}: ${resolveErrorMessage(error)}`);
        }
      }
      nextTutorialEntries.push({
        id: tutorial.id,
        updatedAt: tutorial.updatedAt,
        path: synced.tutorialJsonPath,
        media,
      });
      result.synced += 1;
      result.pendingPeer += synced.pendingPeerCount;
      bumpSyncCountMap(result.pendingPeerById, tutorial.id, synced.pendingPeerCount);
      result.syncedIds.add(tutorial.id);
      if (synced.warnings.length) {
        synced.warnings.forEach((warning) => result.messages.push(warning));
      }
    } catch (error) {
      result.errors += 1;
      bumpSyncCountMap(result.errorById, tutorial.id, 1);
      result.messages.push(`[cloud-supabase] ${tutorial.id}: ${resolveErrorMessage(error)}`);
    }
  }

  const manifest = {
    version: 2,
    rootPrefix,
    userId,
    syncedAt: new Date().toISOString(),
    tutorials: nextTutorialEntries,
    deleted: Array.from(deletedMap.entries())
      .map(([id, deletedAt]) => ({ id, deletedAt }))
      .slice(-300),
  };
  await writeSupabaseManifest(userPrefix, manifest);
  return result;
}

async function pullTutorialsFromSupabase(settings, userId, currentTutorials) {
  await ensureSupabaseBucket();
  const userPrefix = buildSupabaseUserPrefix(settings, userId);
  const manifest = await getSupabaseManifest(userPrefix, userId, resolveSupabaseRootPrefix(settings.cloudRootPath));
  const result = {
    downloaded: 0,
    deleted: 0,
    cleaned: 0,
    pendingPeer: 0,
    errors: 0,
    downloadedIds: new Set(),
    deletedIds: new Set(),
    pendingPeerById: new Map(),
    errorById: new Map(),
    messages: [],
  };
  const localMap = new Map((Array.isArray(currentTutorials) ? currentTutorials : []).map((item) => [item.id, item]));
  const currentDeviceId = normalizeDeviceId(settings.deviceId);
  const nowIso = new Date().toISOString();
  let manifestDirty = false;

  for (const deletedEntry of manifest.deleted) {
    const local = localMap.get(deletedEntry.id);
    if (!local) {
      continue;
    }
    const localUpdated = resolveDateMs(local.updatedAt);
    const deletedAt = resolveDateMs(deletedEntry.deletedAt);
    if (localUpdated > deletedAt) {
      continue;
    }
    try {
      await runAsync("DELETE FROM tutorials WHERE id = ? AND user_id = ?", [deletedEntry.id, userId]);
      localMap.delete(deletedEntry.id);
      result.deleted += 1;
      result.deletedIds.add(deletedEntry.id);
    } catch (error) {
      result.errors += 1;
      bumpSyncCountMap(result.errorById, deletedEntry.id, 1);
      result.messages.push(`[cloud-supabase-pull-delete] ${deletedEntry.id}: ${resolveErrorMessage(error)}`);
    }
  }

  for (const remoteEntry of manifest.tutorials) {
    const remoteUpdated = resolveDateMs(remoteEntry.updatedAt);
    const local = localMap.get(remoteEntry.id);
    const remoteMedia =
      normalizeSupabaseTutorialMedia(remoteEntry.media) || normalizeSupabaseTutorialMedia(remoteEntry?.cloudMediaPlan);
    if (remoteMedia?.pendingPeerAssets?.length) {
      const pendingCount = remoteMedia.pendingPeerAssets.length;
      result.pendingPeer += pendingCount;
      bumpSyncCountMap(result.pendingPeerById, remoteEntry.id, pendingCount);
    }
    const localUpdated = local ? resolveDateMs(local.updatedAt) : 0;
    const shouldProcessRemoteTutorial = !local || remoteUpdated > localUpdated;
    const shouldProcessMedia = Boolean(remoteMedia?.assets?.length || remoteMedia?.pendingPeerAssets?.length);
    if (!shouldProcessRemoteTutorial && !shouldProcessMedia) {
      continue;
    }
    try {
      const remoteBuffer = await downloadSupabaseObjectBuffer(remoteEntry.path);
      if (!remoteBuffer) {
        continue;
      }
      let rawRemote = JSON.parse(remoteBuffer.toString("utf8"));
      const mirroredAssets = Array.isArray(rawRemote.mirroredAssets) ? rawRemote.mirroredAssets : [];
      const mediaFromPayload = normalizeSupabaseTutorialMedia(rawRemote.cloudMediaPlan);
      const effectiveMedia = remoteMedia || mediaFromPayload;
      const effectiveMirroredAssets =
        effectiveMedia?.assets?.length
          ? effectiveMedia.assets
          : mirroredAssets.map(normalizeSupabaseMediaAsset).filter(Boolean);
      const assetMap = new Map();
      const downloadedObjectPaths = new Set();

      for (const asset of effectiveMirroredAssets) {
        const objectPath = asTrimmedString(asset?.objectPath);
        const sourceUrl = asTrimmedString(asset?.sourceUrl);
        const fileName = safePathSegment(asset?.fileName || path.basename(objectPath));
        if (!objectPath || !sourceUrl || !fileName) {
          continue;
        }
        const downloaded = await downloadSupabaseObjectBuffer(objectPath);
        if (!downloaded) {
          continue;
        }
        const ext = sanitizeExtension(fileName);
        const localName = `${Date.now()}-${crypto.randomBytes(10).toString("hex")}${ext}`;
        const localPath = path.join(UPLOAD_DIR, localName);
        fs.writeFileSync(localPath, downloaded);
        assetMap.set(sourceUrl, `/uploads/${localName}`);
        downloadedObjectPaths.add(objectPath);
      }

      const unresolvedPending = new Set();
      if (effectiveMedia?.pendingPeerAssets?.length) {
        effectiveMedia.pendingPeerAssets.forEach((pending) => {
          const sourceUrl = asTrimmedString(pending.sourceUrl);
          if (!sourceUrl || assetMap.has(sourceUrl)) {
            return;
          }
          unresolvedPending.add(sourceUrl);
        });
      }
      if (unresolvedPending.size) {
        result.messages.push(
          `[cloud-supabase-pull] ${remoteEntry.id}: ${unresolvedPending.size} archivo(s) grandes siguen pendientes para transferencia entre dispositivos.`
        );
      }

      if (
        effectiveMedia &&
        unresolvedPending.size > 0 &&
        currentDeviceId &&
        currentDeviceId !== normalizeDeviceId(effectiveMedia.ownerDeviceId)
      ) {
        remoteEntry.media = upsertMediaRequest(effectiveMedia, currentDeviceId, nowIso);
        manifestDirty = true;
      }

      if (
        effectiveMedia &&
        downloadedObjectPaths.size > 0 &&
        currentDeviceId &&
        currentDeviceId !== normalizeDeviceId(effectiveMedia.ownerDeviceId)
      ) {
        const receiptBaseMedia = normalizeSupabaseTutorialMedia(remoteEntry.media) || effectiveMedia;
        remoteEntry.media = upsertMediaReceipt(receiptBaseMedia, currentDeviceId, nowIso);
        manifestDirty = true;
      }

      const shouldPersistTutorial = shouldProcessRemoteTutorial || assetMap.size > 0;
      if (!shouldPersistTutorial) {
        continue;
      }

      const tutorialBase = shouldProcessRemoteTutorial ? rawRemote : local;
      const mergedTutorial = remapTutorialMediaUrls(tutorialBase, (sourceUrl) => {
        if (assetMap.has(sourceUrl)) {
          return assetMap.get(sourceUrl);
        }
        return sourceUrl;
      });

      const sanitized = sanitizeTutorial(mergedTutorial, nowIso, userId);
      if (local) {
        await updateTutorial(sanitized);
      } else {
        await insertTutorial(sanitized);
      }
      localMap.set(sanitized.id, sanitized);
      result.downloaded += 1;
      result.downloadedIds.add(sanitized.id);
    } catch (error) {
      result.errors += 1;
      bumpSyncCountMap(result.errorById, remoteEntry.id, 1);
      result.messages.push(`[cloud-supabase-pull] ${remoteEntry.id}: ${resolveErrorMessage(error)}`);
    }
  }

  for (const remoteEntry of manifest.tutorials) {
    const media = normalizeSupabaseTutorialMedia(remoteEntry.media);
    if (!media || !media.assets.length) {
      continue;
    }
    if (media.cleanupPolicy !== "delete_after_first_remote_pull") {
      continue;
    }
    if (!hasForeignMediaReceipt(media, media.ownerDeviceId)) {
      continue;
    }
    const cleanup = await cleanupDeliveredMediaFromSupabase(remoteEntry);
    if (cleanup.cleaned > 0) {
      result.cleaned += cleanup.cleaned;
      manifestDirty = true;
    }
    if (cleanup.errors.length) {
      result.errors += cleanup.errors.length;
      bumpSyncCountMap(result.errorById, remoteEntry.id, cleanup.errors.length);
      cleanup.errors.forEach((errorText) =>
        result.messages.push(`[cloud-supabase-cleanup] ${remoteEntry.id}: ${errorText}`)
      );
    }
  }

  if (manifestDirty) {
    manifest.version = Math.max(2, Number(manifest.version) || 1);
    manifest.syncedAt = new Date().toISOString();
    manifest.tutorials = manifest.tutorials.map((entry) => ({
      ...entry,
      media: normalizeSupabaseTutorialMedia(entry.media),
    }));
    await writeSupabaseManifest(userPrefix, manifest);
  }

  return result;
}

async function runAndRecordStorageSync(userId) {
  await getOrCreateUserSettings(userId);
  const now = new Date().toISOString();
  try {
    const result = await runStorageSyncForUser(userId);
    const status = result.errors.length ? "warning" : "ok";
    await runAsync(
      `UPDATE user_settings
       SET last_sync_at = ?, last_sync_status = ?, last_sync_summary = ?
       WHERE user_id = ?`,
      [now, status, JSON.stringify(result), userId]
    );
    return result;
  } catch (error) {
    const fallback = {
      syncedTutorials: 0,
      totalTutorials: 0,
      mode: "none",
      local: { enabled: false, synced: 0, errors: 0 },
      cloud: {
        enabled: false,
        provider: "none",
        synced: 0,
        skipped: 0,
        downloaded: 0,
        deleted: 0,
        cleaned: 0,
        pendingPeer: 0,
        errors: 1,
      },
      errors: [resolveErrorMessage(error)],
      tutorialCloud: {},
    };
    await runAsync(
      `UPDATE user_settings
       SET last_sync_at = ?, last_sync_status = ?, last_sync_summary = ?
       WHERE user_id = ?`,
      [now, "error", JSON.stringify(fallback), userId]
    ).catch(() => null);
    throw error;
  }
}

function openLiveSseStream(userId, res) {
  if (!userId || !res) {
    return;
  }
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  res.write("retry: 1500\n\n");

  const keepAlive = setInterval(() => {
    emitLiveSseEvent(res, "ping", { at: new Date().toISOString() });
  }, 20000);

  addLiveSseClient(userId, res);
  emitLiveSseEvent(res, "connected", { at: new Date().toISOString() });

  const onClose = () => {
    clearInterval(keepAlive);
    removeLiveSseClient(userId, res);
  };
  res.on("close", onClose);
  res.on("finish", onClose);
}

function addLiveSseClient(userId, res) {
  if (!liveSseClientsByUser.has(userId)) {
    liveSseClientsByUser.set(userId, new Set());
  }
  liveSseClientsByUser.get(userId).add(res);
}

function removeLiveSseClient(userId, res) {
  const clients = liveSseClientsByUser.get(userId);
  if (!clients) {
    return;
  }
  clients.delete(res);
  if (!clients.size) {
    liveSseClientsByUser.delete(userId);
  }
}

function emitLiveSseEvent(res, eventName, payload) {
  if (!res || res.writableEnded || res.destroyed) {
    return false;
  }
  try {
    res.write(`event: ${String(eventName || "message")}\n`);
    res.write(`data: ${JSON.stringify(payload || {})}\n\n`);
    return true;
  } catch {
    return false;
  }
}

function notifyLiveClients(userId, eventName, payload) {
  const clients = liveSseClientsByUser.get(userId);
  if (!clients || !clients.size) {
    return;
  }
  const data = {
    at: new Date().toISOString(),
    ...(payload && typeof payload === "object" ? payload : {}),
  };
  clients.forEach((res) => {
    const ok = emitLiveSseEvent(res, eventName, data);
    if (!ok) {
      removeLiveSseClient(userId, res);
    }
  });
}

function notifyTutorialsChanged(userId, reason = "update") {
  notifyLiveClients(userId, "tutorials_changed", { reason: asTrimmedString(reason) || "update" });
}

function notifySettingsChanged(userId, reason = "update") {
  notifyLiveClients(userId, "settings_changed", { reason: asTrimmedString(reason) || "update" });
}

function normalizeNoteSide(value, fallback = "right") {
  if (value === "left" || value === "right") {
    return value;
  }
  return fallback === "left" ? "left" : "right";
}

function logSyncError(context, error) {
  const message = resolveErrorMessage(error);
  console.error(`[sync:${asTrimmedString(context) || "unknown"}] ${message}`);
}

function normalizeEmail(value) {
  return asTrimmedString(value).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function safeEqual(a, b) {
  try {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) {
      return false;
    }
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function loadEnvironmentFromFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      return;
    }
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

function readPositiveBytesEnv(rawValue, fallback) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Math.max(1, Number(fallback) || 1);
  }
  return Math.max(1, Math.floor(parsed));
}

function formatBytesForHumans(bytes) {
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

function asTrimmedString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function asBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function resolveErrorMessage(error) {
  return error instanceof Error && error.message ? error.message : "Error desconocido";
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
    return String(url).trim().toLowerCase().replace(/\/$/, "");
  }
}

function pickSource(sourceFromInput, url) {
  const lower = String(url || "").toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  }
  if (lower.includes("instagram.com")) {
    return "instagram";
  }
  const source = asTrimmedString(sourceFromInput);
  return SOURCE_OPTIONS.includes(source) ? source : "manual";
}

function sanitizeExtension(fileName) {
  const extension = path.extname(fileName || "").toLowerCase();
  if (!extension || extension.length > 10) {
    return "";
  }
  return extension.replace(/[^a-z0-9.]/g, "");
}

function normalizeReviewDate(value) {
  const raw = asTrimmedString(value);
  if (!raw) {
    return "";
  }
  if (!REVIEW_DATE_REGEX.test(raw)) {
    throw new Error("La fecha de repaso debe usar formato YYYY-MM-DD.");
  }
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    throw new Error("La fecha de repaso no es valida.");
  }
  return raw;
}

function isSupportedUploadFile(file) {
  const mimeType = asTrimmedString(file?.mimetype).toLowerCase();
  const extension = sanitizeExtension(file?.originalname);

  if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
    return true;
  }
  if (TEXT_MIME_TYPES.has(mimeType)) {
    return true;
  }
  if (TEXT_EXTENSIONS.has(extension) || MEDIA_EXTENSIONS.has(extension)) {
    return true;
  }
  return false;
}

function applySecurityHeaders(_req, res, next) {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
}

function applyCorsHeaders(req, res, next) {
  const origin = normalizeOrigin(req.headers.origin);
  if (!origin) {
    next();
    return;
  }

  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const allowByFallback = ALLOWED_ORIGINS.size === 0 && isLocalOrigin;
  const isAllowed = allowByFallback || ALLOWED_ORIGINS.has(origin);

  if (!isAllowed) {
    if (req.method === "OPTIONS") {
      res.status(403).json({ error: "Origen no permitido." });
      return;
    }
    next();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

function parseAllowedOrigins(rawValue, appOrigin = "") {
  const list = new Set();
  const merged = [rawValue, appOrigin]
    .map((value) => String(value || ""))
    .join(",");
  merged
    .split(",")
    .map((item) => normalizeOrigin(item))
    .filter(Boolean)
    .forEach((item) => list.add(item));
  return list;
}

function normalizeOrigin(value) {
  const raw = asTrimmedString(value);
  if (!raw) {
    return "";
  }
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return "";
    }
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return "";
  }
}

function createRateLimiter({ keyPrefix, windowMs, maxRequests, errorMessage, buildKey }) {
  const store = new Map();
  const resolveKey = (req) => {
    const rawKey = typeof buildKey === "function" ? asTrimmedString(buildKey(req)) : getClientIp(req);
    return `${keyPrefix}:${rawKey || "unknown"}`;
  };

  const rateLimiter = function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = resolveKey(req);

    const existing = store.get(key);
    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
    } else if (existing.count >= maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: errorMessage || "Demasiadas solicitudes. Intenta de nuevo mas tarde." });
      return;
    } else {
      existing.count += 1;
    }

    if (store.size > 3000) {
      for (const [entryKey, entry] of store.entries()) {
        if (entry.resetAt <= now) {
          store.delete(entryKey);
        }
      }
    }

    next();
  };

  rateLimiter.clear = (req) => {
    store.delete(resolveKey(req));
  };

  return rateLimiter;
}

function buildAuthRateLimitKey(req) {
  const ip = asTrimmedString(getClientIp(req)) || "unknown";
  const email = normalizeEmail(req.body?.email);
  const userAgent = asTrimmedString(req.headers?.["user-agent"]).toLowerCase().slice(0, 160);
  if (email) {
    return `${ip}|${email}|${userAgent}`;
  }
  return `${ip}|${userAgent}`;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}

class UploadValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UploadValidationError";
  }
}

function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
