import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./prisma.js";
import { requireAuth, requireRole } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 5000;
app.set("trust proxy", 1);
app.use(helmet());
// CLIENT_URL can list several addresses separated by commas.
// Trailing slashes are stripped, since browsers send origins without one.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map(url => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const isProd = process.env.NODE_ENV === "production";
const cookieOptions = { httpOnly: true, sameSite: isProd ? "none" : "lax", secure: isProd, maxAge: 8 * 60 * 60 * 1000, path: "/" };
// Express 4 doesn't catch errors from async handlers; pass them to the error handler.
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "OilGuard Training Lab" }));

app.post("/api/auth/login", loginLimiter, wrap(async (req, res) => {
  const schema = z.object({ email: z.string().email().max(180), password: z.string().min(8).max(100) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Enter a valid email and password." });
  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "8h" });
  await prisma.auditLog.create({ data: { userId: user.id, action: "LOGIN", detail: "User signed in to the training environment.", ipAddress: req.ip } });
  res.cookie("og_session", token, cookieOptions).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

app.post("/api/auth/logout", (_req, res) => res.clearCookie("og_session", { ...cookieOptions, maxAge: undefined }).json({ ok: true }));
app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));

app.get("/api/investor/overview", requireAuth, requireRole("INVESTOR"), wrap(async (req, res) => {
  const [account, events] = await Promise.all([
    prisma.investmentAccount.findUnique({ where: { userId: req.user.id } }),
    prisma.activityEvent.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" }, take: 10 })
  ]);
  if (!account) return res.status(404).json({ message: "Training account not found." });
  res.json({
    account: { investmentCapital: Number(account.investmentCapital), projectedReturns: Number(account.projectedReturns), currency: account.currency },
    events
  });
}));

app.post("/api/investor/withdrawal-simulation", requireAuth, requireRole("INVESTOR"), wrap(async (req, res) => {
  const schema = z.object({ acknowledge: z.literal(true) });
  if (!schema.safeParse(req.body).success) return res.status(400).json({ message: "Acknowledge the training scenario first." });
  const event = await prisma.activityEvent.create({
    data: {
      userId: req.user.id,
      type: "WITHDRAWAL_SIMULATION",
      title: "Simulated advance-fee demand reviewed",
      description: "The scenario's $25,000 upfront demand was recorded as a fraud indicator. No payment was initiated or collected.",
      amount: 25000,
      status: "OPEN",
      riskScore: 99
    }
  });
  await prisma.auditLog.create({ data: { userId: req.user.id, action: "WITHDRAWAL_SIMULATION", detail: "Investor reviewed the simulated advance-fee scenario.", ipAddress: req.ip } });
  res.status(201).json({ message: "Simulation recorded. No payment was made.", event });
}));

app.get("/api/analyst/overview", requireAuth, requireRole("ANALYST"), wrap(async (_req, res) => {
  const [users, events, logs] = await Promise.all([
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.activityEvent.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: [{ riskScore: "desc" }, { createdAt: "desc" }] }),
    prisma.auditLog.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 12 })
  ]);
  const open = events.filter(e => e.status === "OPEN");
  res.json({
    metrics: { investors: users, events: events.length, highRisk: events.filter(e => e.riskScore >= 80).length, openCases: open.length },
    events, logs
  });
}));

app.patch("/api/analyst/events/:id", requireAuth, requireRole("ANALYST"), wrap(async (req, res) => {
  const schema = z.object({ status: z.enum(["OPEN", "REVIEWED", "CLOSED"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid event status." });
  const existing = await prisma.activityEvent.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Event not found." });
  const event = await prisma.activityEvent.update({ where: { id: existing.id }, data: { status: parsed.data.status } });
  await prisma.auditLog.create({ data: { userId: req.user.id, action: "CASE_STATUS_UPDATED", detail: `Event ${event.id} marked ${event.status}.`, ipAddress: req.ip } });
  res.json({ event });
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required. Copy server/.env.example to server/.env.");
app.listen(port, () => console.log(`OilGuard API listening on http://localhost:${port}`));
