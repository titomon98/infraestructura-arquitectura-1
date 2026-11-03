// API: Express + Supabase
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGINS = "", PORT = 3000 } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TABLE = "logins";
const startedAt = Date.now();
const origins = ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);

const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(cors({ origin: origins.length ? origins : true }));

app.get("/", (_req, res) => res.json({ name: "registro-accesos-api", endpoints: ["POST /login", "GET /logins", "GET /health"] }));

// Registra un inicio de sesión
app.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Escribe un correo válido." });
  const { data, error } = await supabase.from(TABLE)
    .insert({ email, ip: req.ip, user_agent: req.get("user-agent") || null }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Últimos 20 inicios de sesión
app.get("/logins", async (_req, res) => {
  const { data, error } = await supabase.from(TABLE)
    .select("id, email, ip, created_at").order("created_at", { ascending: false }).limit(20);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Health check: proceso + base de datos
app.get("/health", async (_req, res) => {
  const t0 = Date.now();
  const { error } = await supabase.from(TABLE).select("id", { head: true, count: "exact" }).limit(1);
  const db = error ? { status: "down", error: error.message } : { status: "up", latency_ms: Date.now() - t0 };
  res.status(error ? 503 : 200).json({
    status: error ? "degraded" : "ok",
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    db,
  });
});

app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));
