const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3");

const PORT = Number(process.env.PORT) || 3000;
const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "tutorials.db");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const SESSION_COOKIE_NAME = "tv_session";
const SESSION_DURATION_DAYS = 30;
const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
const COOKIE_SECURE = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "1";
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
const TEXT_MIME_TYPES = new Set(["text/plain", "text/markdown", "text/x-markdown"]);
const TEXT_EXTENSIONS = new Set([".txt", ".md", ".markdown"]);
const MEDIA_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".mp4", ".webm", ".mov", ".m4v", ".ogg"]);

fs.mkdirSync(DB_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "4mb" }));
app.use(applySecurityHeaders);

const authRateLimiter = createRateLimiter({
  keyPrefix: "auth",
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  maxRequests: AUTH_RATE_LIMIT_MAX,
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

    const token = await createSession(userId);
    setSessionCookie(res, token);

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
    res.json({ user: { id: user.id, email: user.email } });
  })
);

app.post(
  "/api/auth/logout",
  asyncHandler(async (req, res) => {
    const token = getSessionToken(req);
    if (token) {
      await runAsync("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
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
  "/api/tutorials",
  requireAuth,
  asyncHandler(async (req, res) => {
    await claimLegacyRowsForUser(req.authUser.id);
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

    res.json({ count: sanitized.length });
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
    res.status(201).json({
      url,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
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
    res.status(400).json({ error: "Archivo demasiado grande. Maximo 250MB." });
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
      timestamps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await ensureColumn("tutorials", "user_id", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("tutorials", "is_favorite", "INTEGER NOT NULL DEFAULT 0");

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

  await runAsync("CREATE INDEX IF NOT EXISTS idx_tutorials_user_updated ON tutorials (user_id, updated_at)");
  await runAsync("CREATE INDEX IF NOT EXISTS idx_saved_views_user_updated ON saved_views (user_id, updated_at)");
  await runAsync("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id)");
  await runAsync("CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at)");
  await runAsync("DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now')");
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
    timestamps: normalizeStringArray(raw.timestamps, 200, 120),
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
    timestamps: safeJsonArray(row.timestamps),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function insertTutorial(tutorial) {
  return runAsync(
    `INSERT INTO tutorials (
      id, user_id, title, type, source, url, normalized_url, image_url, text_content, category,
      collection, status, priority, is_favorite, review_date, tags, notes, timestamps, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      JSON.stringify(tutorial.timestamps),
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
         tags = ?, notes = ?, timestamps = ?, updated_at = ?
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
      JSON.stringify(tutorial.timestamps),
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

function asTrimmedString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
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
    "style-src 'self' https://fonts.googleapis.com",
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

function createRateLimiter({ keyPrefix, windowMs, maxRequests, errorMessage, buildKey }) {
  const store = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const rawKey = typeof buildKey === "function" ? asTrimmedString(buildKey(req)) : getClientIp(req);
    const key = `${keyPrefix}:${rawKey || "unknown"}`;

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
