import express from "express";
import {
  addDirectoryToDirectory,
  createUser,
  getRandomUUID,
  getUserByEmail,
} from "../utils.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const isUserExists = await getUserByEmail(email);
    if (isUserExists) {
      return res.status(409).json({ message: "User already exists" });
    }
    const directoryId = getRandomUUID();
    const userId = getRandomUUID();
    const directory = {
      id: directoryId,
      name: `root-${email}`,
      userId: userId,
      parentDir: null,
      files: [],
      directories: [],
    };
    await addDirectoryToDirectory(directory);
    const user = await createUser(userId, name, email, password, directoryId);
    res.status(201).json({ message: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const isUserExists = await getUserByEmail(email);
    if (!isUserExists || isUserExists.password !== password) {
      return res.status(409).json({ message: "Invalid email or password" });
    }
    res.cookie("userId", isUserExists.id, {
      sameSite: "none",
      secure: true,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    });
    res.status(201).json({ message: "Logged in successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/logout", checkAuth, (req, res) => {
  res.clearCookie("userId");
  res.status(200).json({ message: "Logged out successfully" });
});

router.get("/", checkAuth, (req, res) => {
  res.status(200).json({ name: res.user.name, email: res.user.email });
});

export default router;
