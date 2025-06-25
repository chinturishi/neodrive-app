import express from "express";
import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import { getFileExtension } from "../utils.js";
import mime from "mime-types";
import validateFileId from "../middleware/validationMiddleware.js";
import { ObjectId } from "mongodb";

const router = express.Router();

/**
 * Check if user has access to the file
 */
const checkFileAccess = async (req, res, next) => {
  try {
    const file = req.file;
    const directoryId = file.directoryId;
    const directories = req.db.collection("directories");

    const directory = await directories.findOne({ _id: directoryId });

    if (!directory) {
      return res.status(404).json({ message: "Directory not found" });
    }

    if (directory.userId.toString() !== res.user._id.toString()) {
      return res.status(403).json({ message: "This file is not accessible" });
    }

    req.directory = directory;
    next();
  } catch (err) {
    res.status(500).json({ message: "Error checking file access" });
  }
};

/**
 * @route   GET /file/:id
 * @desc    Download or open a file
 * @access  Private
 */
router.get("/:id", checkFileAccess, async (req, res) => {
  try {
    const file = req.file;
    const id = file._id;
    const fileName = `${id}${file.extension}`;
    const filePath = path.join(process.cwd(), "storage", fileName);

    // Detect MIME type
    const mimeType = mime.lookup(file.name);
    res.contentType(mimeType);

    if (req.query.action === "download") {
      return res.download(filePath, file.name);
    }

    res.sendFile(filePath, (err) => {
      if (err) res.status(404).json({ message: "File not found" });
    });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving file" });
  }
});

/**
 * @route   POST /file/:filename
 * @desc    Upload a file
 * @access  Private
 */
router.post("/:filename", async (req, res) => {
  try {
    const db = req.db;
    const directories = db.collection("directories");
    const files = db.collection("files");

    const { filename } = req.params;
    const { directoryid: directoryId } = req.headers;

    if (!directoryId) {
      return res.status(400).json({ message: "Directory ID is required" });
    }

    const directory = await directories.findOne({
      _id: new ObjectId(directoryId),
    });

    if (!directory) {
      return res.status(404).json({ message: "Directory not found" });
    }

    // Check if user owns the directory
    if (directory.userId.toString() !== res.user._id.toString()) {
      return res.status(403).json({
        message: "You don't have permission to upload to this directory",
      });
    }

    const fileExtension = getFileExtension(filename);
    const file = await files.insertOne({
      name: filename,
      extension: fileExtension,
      directoryId: directory._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fileId = file.insertedId.toString();
    const fullFilename = `${fileId}${fileExtension}`;
    const writeStream = createWriteStream(`./storage/${fullFilename}`);

    req.pipe(writeStream);

    req.on("end", async () => {
      writeStream.end();
      try {
        await directories.updateOne(
          { _id: directory._id },
          { $push: { files: fileId } }
        );
        res.json({
          message: "File created",
          fileId,
          fileName: filename,
        });
      } catch (err) {
        res.status(500).json({ message: "Error saving file reference" });
      }
    });

    req.on("error", () => {
      res.status(500).json({ message: "Error uploading file" });
    });
  } catch (err) {
    res.status(500).json({ message: "Error uploading file" });
  }
});

/**
 * @route   DELETE /file/:id
 * @desc    Delete a file
 * @access  Private
 */
router.delete("/:id", checkFileAccess, async (req, res) => {
  try {
    const filesDb = req.db.collection("files");
    const directoriesDb = req.db.collection("directories");
    const file = req.file;
    const id = file._id;
    const directoryId = file.directoryId;

    // Delete file from storage
    const fileName = `${id.toString()}${file.extension}`;
    const filePath = path.join(process.cwd(), "storage", fileName);

    // Delete file from database
    const result = await filesDb.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "File not found in database" });
    }

    // Remove file reference from directory
    await directoriesDb.updateOne(
      { _id: directoryId },
      { $pull: { files: id.toString() } }
    );

    // Delete physical file
    await rm(filePath, { recursive: true, force: true });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting file" });
  }
});

/**
 * @route   PATCH /file/:id
 * @desc    Rename a file
 * @access  Private
 */
router.patch("/:id", checkFileAccess, async (req, res) => {
  try {
    const filesDb = req.db.collection("files");
    const file = req.file;
    const id = file._id;

    if (!req.body.newFileName) {
      return res.status(400).json({ message: "New file name is required" });
    }

    const result = await filesDb.updateOne(
      { _id: id },
      {
        $set: {
          name: req.body.newFileName,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json({
      message: "File renamed successfully",
      newName: req.body.newFileName,
    });
  } catch (err) {
    res.status(500).json({ message: "Error renaming file" });
  }
});

// Register param middleware
router.param("id", validateFileId);

export default router;
