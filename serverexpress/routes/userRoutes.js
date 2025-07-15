import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import { ObjectId } from "mongodb";

const router = express.Router();

/**
 * Validate user input for registration
 */
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Password strength validation
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  next();
};

/**
 * Validate user input for login
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  next();
};

/**
 * @route   POST /user/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const db = req.db;
    const directories = db.collection("directories");
    const users = db.collection("users");
    const { name, email, password } = req.body;

    // Check if user already exists
    const isUserExists = await users.findOne({ email });
    if (isUserExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const directoryId = new ObjectId();
    const userId = new ObjectId();

    // Create root directory for user
    const directory = {
      _id: directoryId,
      name: `root-${email}`,
      parentDir: null,
      files: [],
      directories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId,
    };

    const directoryResult = await directories.insertOne(directory);
    if (!directoryResult.acknowledged) {
      return res.status(500).json({ message: "Error creating directory" });
    }
    // Create user
    const userResult = await users.insertOne({
      _id: userId,
      name,
      email,
      password, // In a real app, this should be hashed
      directoryId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (!userResult.acknowledged) {
      return res.status(500).json({ message: "Error creating user" });
    }

    res.status(201).json({
      message: "User registered successfully",
      userId: userId.toString(),
    });
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

/**
 * @route   POST /user/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", validateLogin, async (req, res) => {
  try {
    const db = req.db;
    const users = db.collection("users");
    const { email, password } = req.body;

    // Find user
    const user = await users.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set cookie
    res.cookie("userId", user._id.toString(), {
      sameSite: "none",
      secure: true,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error during login" });
  }
});

/**
 * @route   POST /user/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", checkAuth, (req, res) => {
  try {
    res.clearCookie("userId", {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error during logout" });
  }
});

/**
 * @route   GET /user
 * @desc    Get current user details
 * @access  Private
 */
router.get("/", checkAuth, (req, res) => {
  try {
    if (!res.user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: res.user._id.toString(),
      name: res.user.name,
      email: res.user.email,
      directoryId: res.user.directoryId?.toString(),
    });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving user details" });
  }
});

export default router;
