const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const sqlite3 = require("sqlite3");

const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "tutorials.db");
const STATUS_ORDER = ["Por ver", "En progreso", "Aplicado", "Archivado"];
const PRIORITY_OPTIONS = ["Alta", "Media", "Baja"];
const TYPE_OPTIONS = ["video", "image", "text"];

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
const app = express();

app.use(express.json({ limit: "2mb" }));

initializeDatabase().catch((error) => {
  console.error("No se pudo inicializar la base de datos:", error);
  process.exit(1);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "tutorial-vault-api" });
});

app.get("/api/tutorials", async (_req, res) => {
  try {
    const rows = await allAsync(
      `SELECT * FROM tutorials
       ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC`
    );
    res.json(rows.map(fromRow));
  } catch (error) {
    res.status(500).json({ error: "No se pudieron listar los tutoriales." });
  }
});

app.post("/api/tutorials", async (req, res) => {
  try {
    const now = new Date().toISOString();
    const tutorial = sanitizeTutorial(req.body, now);
    await insertTutorial(tutorial);
    res.status(201).json(tutorial);
  } catch (error) {
    res.status(400).json({ error: error.message || "No se pudo crear el tutorial." });
  }
});

app.put("/api/tutorials/:id", async (req, res) => {
  try {
    const current = await getAsync("SELECT * FROM tutorials WHERE id = ?", [req.params.id]);
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
    const tutorial = sanitizeTutorial(input, now);
    await updateTutorial(tutorial);
    res.json(tutorial);
  } catch (error) {
    res.status(400).json({ error: error.message || "No se pudo actualizar el tutorial." });
  }
});

app.delete("/api/tutorials/:id", async (req, res) => {
  try {
    const result = await runAsync("DELETE FROM tutorials WHERE id = ?", [req.params.id]);
    if (result.changes === 0) {
      res.status(404).json({ error: "Tutorial no encontrado." });
      return;
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el tutorial." });
  }
});

app.post("/api/tutorials/import", async (req, res) => {
  const tutorials = req.body?.tutorials;
  if (!Array.isArray(tutorials)) {
    res.status(400).json({ error: "El campo tutorials debe ser un arreglo." });
    return;
  }

  const now = new Date().toISOString();
  const sanitized = tutorials.map((item) => sanitizeTutorial(item, now));

  try {
    await runAsync("BEGIN IMMEDIATE TRANSACTION");
    await runAsync("DELETE FROM tutorials");
    for (const tutorial of sanitized) {
      await insertTutorial(tutorial);
    }
    await runAsync("COMMIT");
    res.json({ count: sanitized.length });
  } catch (error) {
    await runAsync("ROLLBACK").catch(() => {});
    res.status(500).json({ error: "No se pudieron importar los tutoriales." });
  }
});

app.use(express.static(__dirname));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Tutorial Vault listo en http://localhost:${PORT}`);
});

function initializeDatabase() {
  return runAsync(`
    CREATE TABLE IF NOT EXISTS tutorials (
      id TEXT PRIMARY KEY,
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
      review_date TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      timestamps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

function sanitizeTutorial(raw, now) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Payload invalido.");
  }

  const title = asTrimmedString(raw.title);
  if (!title) {
    throw new Error("El titulo es obligatorio.");
  }

  const type = TYPE_OPTIONS.includes(raw.type) ? raw.type : "text";
  const url = asTrimmedString(raw.url);
  const normalizedUrl = normalizeUrl(url);
  const source = pickSource(raw.source, url);
  const id = asTrimmedString(raw.id) || crypto.randomUUID();

  return {
    id,
    title,
    type,
    source,
    url,
    normalizedUrl,
    imageUrl: asTrimmedString(raw.imageUrl),
    textContent: asTrimmedString(raw.textContent),
    category: asTrimmedString(raw.category),
    collection: asTrimmedString(raw.collection),
    status: STATUS_ORDER.includes(raw.status) ? raw.status : "Por ver",
    priority: PRIORITY_OPTIONS.includes(raw.priority) ? raw.priority : "Media",
    reviewDate: asTrimmedString(raw.reviewDate),
    tags: normalizeStringArray(raw.tags),
    notes: asTrimmedString(raw.notes),
    timestamps: normalizeStringArray(raw.timestamps),
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
      id, title, type, source, url, normalized_url, image_url, text_content, category,
      collection, status, priority, review_date, tags, notes, timestamps, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tutorial.id,
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
         text_content = ?, category = ?, collection = ?, status = ?, priority = ?, review_date = ?,
         tags = ?, notes = ?, timestamps = ?, updated_at = ?
     WHERE id = ?`,
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
      tutorial.reviewDate,
      JSON.stringify(tutorial.tags),
      tutorial.notes,
      JSON.stringify(tutorial.timestamps),
      tutorial.updatedAt,
      tutorial.id,
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

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => asTrimmedString(entry)).filter(Boolean);
}

function safeJsonArray(raw) {
  try {
    const parsed = JSON.parse(raw);
    return normalizeStringArray(parsed);
  } catch {
    return [];
  }
}

function asTrimmedString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
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
  return source || "manual";
}
