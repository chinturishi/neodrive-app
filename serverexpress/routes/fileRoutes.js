import express from "express";
import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import {
  deleteFile,
  getFileExtension,
  removeFileFromDirectory,
} from "../utils.js";
import mime from "mime-types";
import validateFileId from "../middleware/validationMiddleware.js";
import { ObjectId } from "mongodb";

const router = express.Router();

//Download or open file
router.get("/:id", async (req, res) => {
  try {
    const db = req.db;
    const file = req.file;
    const id = file._id;

    const directoryId = file.directoryId;
    const directories = db.collection("directories");
    const directory = await directories.findOne({
      _id: directoryId,
    });
    const userId = directory.userId.toString();
    if (userId !== res.user._id.toString()) {
      return res.status(403).json({ message: "This file is not accessible" });
    }
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
    res.status(500).json({ message: err.message });
  }
});

//upload file
router.post("/:filename", async (req, res) => {
  const db = req.db;
  const directories = db.collection("directories");
  const files = db.collection("files");
  try {
    const { filename } = req.params;
    const { directoryid: directoryId } = req.headers;
    const directory = await directories.findOne({
      _id: new ObjectId(directoryId),
    });
    if (!directory) {
      return res.status(404).json({ message: "Directory not found" });
    }
    const fileExtension = getFileExtension(filename);
    const file = await files.insertOne({
      name: filename,
      extension: getFileExtension(filename),
      directoryId: directory._id,
    });
    const fileId = file.insertedId.toString();
    const fullFilename = `${fileId}${fileExtension}`;
    const writeStream = createWriteStream(`./storage/${fullFilename}`);
    req.pipe(writeStream);
    req.on("end", async () => {
      writeStream.end();
      await directories.updateOne(
        { _id: directory._id },
        { $push: { files: fileId } }
      );
      res.json({ message: "File created" });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//delete file
router.delete("/:id", async (req, res) => {
  try {
    console.log("inside the delete file route");
    const filesDb = req.db.collection("files");
    const directoriesDb = req.db.collection("directories");
    const file = req.file;
    console.log("file", file);
    const id = file._id;
    const directoryId = file.directoryId;
    const directory = await directoriesDb.findOne({
      _id: directoryId,
    });
    console.log("directory", directory);

    const userId = directory.userId;
    if (userId.toString() !== res.user._id.toString()) {
      return res.status(403).json({ message: "This file is not accessible" });
    }
    const fileName = `${id.toString()}${file.extension}`;
    console.log("fileName", fileName);
    const filePath = path.join(process.cwd(), "storage", fileName);
    console.log("filePath", filePath);
    const result = await filesDb.deleteOne({ _id: id });
    const result2 = await directoriesDb.updateOne(
      { _id: directoryId },
      { $pull: { files: id.toString() } }
    );
    console.log("result", result);
    console.log("result2", result2);
    await rm(filePath, { recursive: true, force: true });
    res.json({ message: "File/folder deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

//rename file
router.patch("/:id", async (req, res) => {
  try {
    const filesDb = req.db.collection("files");
    const directoriesDb = req.db.collection("directories");
    const file = req.file;
    const id = file._id;
    const directoryId = file.directoryId;
    const directory = await directoriesDb.findOne({
      _id: directoryId,
    });
    const userId = directory.userId;
    if (userId.toString() !== res.user._id.toString()) {
      return res.status(403).json({ message: "This file is not accessible" });
    }
    const result = await filesDb.updateOne(
      { _id: id },
      { $set: { name: req.body.newFileName } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "File/folder not found" });
    }
    res.json({ message: "File/folder renamed" });
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ message: "File/folder not found" });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

router.param("id", validateFileId);

export default router;
