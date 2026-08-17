import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl };
}

// POST /api/auth/google - exchange a Google ID token (from the frontend Sign in with
// Google button) for our own app session token. Verifying the token server-side (rather
// than trusting whatever the client sends) is what actually proves the user's identity.
authRouter.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "credential is required" });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Invalid Google credential" });
  }

  const user = await prisma.user.upsert({
    where: { googleId: payload.sub },
    update: { name: payload.name, avatarUrl: payload.picture, email: payload.email },
    create: {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      avatarUrl: payload.picture,
    },
  });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: toPublicUser(user) });
});

// GET /api/auth/me - restores the session on page reload from a token already in hand
authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(toPublicUser(user));
});
