import express from "express";
import checkAuth from "../middleware/authMiddleware.js";

const router = express.Router();

//Register user
router.post("/register", async (req, res) => {
  try {
    //const db: Db = req.db;
    const db = req.db;
    const directories = db.collection("directories");
    const users = db.collection("users");
    const { name, email, password } = req.body;
    const isUserExists = await users.findOne({ email });
    if (isUserExists) {
      return res.status(409).json({ message: "User already exists" });
    }
    const directory = {
      name: `root-${email}`,
      parentDir: null,
      files: [],
      directories: [],
    };
    const { insertedId: directoryId } = await directories.insertOne(directory);
    const { insertedId: userId } = await users.insertOne({
      name,
      email,
      password,
      directoryId,
    });
    await directories.updateOne({ _id: directoryId }, { $set: { userId } });
    res.status(201).json({ message: "Logged in successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Login user
router.post("/login", async (req, res) => {
  try {
    const db = req.db;
    const users = db.collection("users");
    const { email, password } = req.body;
    const isUserExists = await users.findOne({ email, password });
    if (!isUserExists) {
      return res.status(409).json({ message: "Invalid email or password" });
    }
    res.cookie("userId", isUserExists._id.toString(), {
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

//Logout user
router.post("/logout", checkAuth, (req, res) => {
  res.clearCookie("userId");
  res.status(200).json({ message: "Logged out successfully" });
});

//Get user details
router.get("/", checkAuth, (req, res) => {
  res.status(200).json({ name: res.user.name, email: res.user.email });
});

export default router;
