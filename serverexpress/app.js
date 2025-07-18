import express from "express";
import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import checkAuth from "./middleware/authMiddleware.js";
import { connectDB } from "./db/db.js";

let db;
try {
  db = await connectDB();
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  //Enable CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, directoryname, directoryid"
    );

    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  });

  app.use("/directory", checkAuth, directoryRoutes);
  app.use("/file", checkAuth, fileRoutes);
  app.use("/user", userRoutes);
  app.use((error, req, res, next) => {
    res.status(500).json({ message: "Internal Server Error" });
  });

  app.listen(5000, () => {
    // Server is running on port 5000
  });
} catch (error) {
  console.error("Failed to connect to database:", error);
  process.exit(1);
}
