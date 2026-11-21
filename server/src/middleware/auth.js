import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.og_session;
    if (!token) return res.status(401).json({ message: "Please sign in." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true, role: true } });
    if (!user) return res.status(401).json({ message: "Session is no longer valid." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Authentication required." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to access this resource." });
}
