import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PRODUCTS = [
  { id: "starter", name: "Starter Plan", category: "plan", price: 19 },
  { id: "growth", name: "Growth Plan", category: "plan", price: 49 },
  { id: "insights", name: "Insights Pack", category: "addon", price: 15 },
  { id: "priority", name: "Priority Support", category: "addon", price: 25 }
];

function maybeDelay() {
  const delayMs = Number(process.env.APP_DELAY_MS || "0");
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function shouldFailCheckout() {
  const failRate = Number(process.env.APP_CHECKOUT_FAIL_RATE || "0");
  if (failRate <= 0) return false;
  if (failRate >= 1) return true;
  return Math.random() < failRate;
}

export function createApp() {
  const app = express();
  const users = new Map([
    [
      "demo@example.com",
      {
        name: "Demo User",
        email: "demo@example.com",
        password: "DemoPass123!",
        role: "manager",
        createdAt: Date.now()
      }
    ]
  ]);
  const sessions = new Map();
  const supportTickets = [];

  app.use(express.json());

  app.get("/api/health", async (_req, res) => {
    await maybeDelay();
    res.json({ ok: true, time: new Date().toISOString() });
  });

  app.post("/api/auth/register", async (req, res) => {
    await maybeDelay();
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    if (users.has(email)) {
      return res.status(409).json({ error: "user already exists" });
    }
    users.set(email, { name, email, password, role: role || "member", createdAt: Date.now() });
    return res.status(201).json({ ok: true });
  });

  app.post("/api/auth/login", async (req, res) => {
    await maybeDelay();
    const { email, password } = req.body || {};
    const user = users.get(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "invalid credentials" });
    }
    const token = crypto.randomUUID();
    sessions.set(token, email);
    return res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  });

  app.get("/api/products", async (req, res) => {
    await maybeDelay();
    const query = String(req.query.q || "").toLowerCase();
    const category = String(req.query.category || "all");
    const filtered = DEFAULT_PRODUCTS.filter((product) => {
      const categoryMatch = category === "all" ? true : product.category === category;
      const queryMatch = query ? product.name.toLowerCase().includes(query) : true;
      return categoryMatch && queryMatch;
    });
    return res.json({ items: filtered });
  });

  app.post("/api/checkout", async (req, res) => {
    await maybeDelay();
    const { token, items, couponCode, shippingSpeed } = req.body || {};
    const email = sessions.get(token);
    if (!email) {
      return res.status(401).json({ error: "auth required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items are required" });
    }
    if (shouldFailCheckout()) {
      return res.status(503).json({ error: "checkout service unavailable" });
    }

    const basePrice = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const discount = couponCode === "WELCOME10" ? Math.round(basePrice * 0.1) : 0;
    const shipping = shippingSpeed === "express" ? 12 : 0;
    const total = Math.max(0, basePrice - discount + shipping);

    return res.status(201).json({
      orderId: `ord_${Date.now()}`,
      total,
      discount,
      shipping,
      message: "Order completed"
    });
  });

  app.post("/api/support", async (req, res) => {
    await maybeDelay();
    const { token, topic, detail } = req.body || {};
    const email = sessions.get(token);
    if (!email) {
      return res.status(401).json({ error: "auth required" });
    }
    if (!topic || !detail) {
      return res.status(400).json({ error: "topic and detail are required" });
    }
    const ticket = { id: `tkt_${Date.now()}`, email, topic, detail, createdAt: Date.now() };
    supportTickets.push(ticket);
    return res.status(201).json({ ok: true, ticket });
  });

  app.get("/api/support", async (req, res) => {
    await maybeDelay();
    const token = String(req.query.token || "");
    const email = sessions.get(token);
    if (!email) {
      return res.status(401).json({ error: "auth required" });
    }
    return res.json({ items: supportTickets.filter((t) => t.email === email).slice(-10) });
  });

  const publicDir = path.join(__dirname, "..", "public");
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  return app;
}

export function startServer({ port = Number(process.env.PORT || 3456) } = {}) {
  const app = createApp();
  const server = app.listen(port, () => {
    // Keep line plain for CI logs.
    console.log(`[example-app] listening on http://localhost:${port}`);
  });
  return server;
}

if (process.argv[1] === __filename) {
  startServer();
}
