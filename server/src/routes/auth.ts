import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { createUser, getUserByEmail } from "../db/queries";
import { signToken } from "../middleware/auth";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log("[api-in] POST /register", JSON.stringify({ email }));

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (getUserByEmail(email)) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = createUser(email, passwordHash);
  const token = signToken(result.lastInsertRowid as number);

  res.status(201).json({ token });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log("[api-in] POST /login", JSON.stringify({ email }));

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id);
  res.json({ token });
});

export default router;
