const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "DucHai@2026";

const db = new Database(path.join(__dirname, "duc-hai.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS quote_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  cargo TEXT NOT NULL,
  quantity TEXT,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  pickup_date TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'Mới',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: process.env.SESSION_SECRET || "duc-hai-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 }
}));

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: "Chưa đăng nhập" });
  next();
}

app.post("/api/quotes", (req, res) => {
  const { customer_name, phone, cargo, quantity, from_location, to_location, pickup_date, note } = req.body;
  if (!customer_name || !phone || !cargo || !from_location || !to_location) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ các trường bắt buộc." });
  }
  const stmt = db.prepare(`
    INSERT INTO quote_requests
    (customer_name, phone, cargo, quantity, from_location, to_location, pickup_date, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(customer_name.trim(), phone.trim(), cargo.trim(), quantity || "",
    from_location.trim(), to_location.trim(), pickup_date || "", note || "");
  res.json({ ok: true, id: result.lastInsertRowid });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu." });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/me", (req, res) => {
  res.json({ authenticated: !!req.session.admin });
});

app.get("/api/admin/quotes", requireAdmin, (req, res) => {
  const q = (req.query.q || "").trim();
  const status = (req.query.status || "").trim();
  let sql = "SELECT * FROM quote_requests WHERE 1=1";
  const params = [];
  if (q) {
    sql += " AND (customer_name LIKE ? OR phone LIKE ? OR cargo LIKE ? OR from_location LIKE ? OR to_location LIKE ?)";
    const x = `%${q}%`;
    params.push(x, x, x, x, x);
  }
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY id DESC";
  res.json(db.prepare(sql).all(...params));
});

app.get("/api/admin/quotes/:id", requireAdmin, (req, res) => {
  const row = db.prepare("SELECT * FROM quote_requests WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Không tìm thấy yêu cầu." });
  res.json(row);
});

app.patch("/api/admin/quotes/:id", requireAdmin, (req, res) => {
  const allowed = ["Mới", "Đã liên hệ", "Đã báo giá", "Hoàn tất"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Trạng thái không hợp lệ." });
  const result = db.prepare(`
    UPDATE quote_requests SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?
  `).run(req.body.status, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Không tìm thấy yêu cầu." });
  res.json({ ok: true });
});

app.delete("/api/admin/quotes/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM quote_requests WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Không tìm thấy yêu cầu." });
  res.json({ ok: true });
});

app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

app.listen(PORT, () => {
  console.log(`Duc Hai Transport running at http://localhost:${PORT}`);
});