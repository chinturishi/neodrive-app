import express from "express";
import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import {
  addDataToFileDBJSON,
  deleteFile,
  getDirectoryById,
  getFileById,
  getFileExtension,
  getRandomUUID,
  removeFileFromDirectory,
  renameFile,
  updateFileIdInDirectory,
} from "../utils.js";
import mime from "mime-types";
import validateFileId from "../middleware/validationMiddleware.js";

const router = express.Router();

//Download or open file
router.get("/:id", async (req, res) => {
  try {
    // const { id } = req;
    // const file = getFileById(id);
    // if (!file) return res.status(404).json({ message: "File not found" });
    const file = req.file;
    const id = file.id;

    const directoryId = file.directoryId;
    const directory = getDirectoryById(directoryId);
    const userId = directory.userId;

    if (userId !== res.user.id) {
      return res.status(403).json({ message: "This file is not accessible" });
    }

    const fileName = `${id}${file.extension}`;
    const filePath = path.join(process.cwd(), "storage", fileName);

    // Detect MIME type
    const mimeType = mime.lookup(file.name);
    res.contentType(mimeType);
    console.log("mimeType", mimeType);

    if (req.query.action === "download") {
      return res.download(filePath, file.name);
    }
    console.log("res", res);
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).json({ message: "File not found" });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//upload file
router.post("/:filename", async (req, res) => {
  console.log("upload file");
  console.log(req.headers);
  try {
    const { filename } = req.params;
    const { directoryid: directoryId } = req.headers;
    const randomUUID = getRandomUUID();
    const fileExtension = getFileExtension(filename);
    const fullFilename = `${randomUUID}${fileExtension}`;
    const writeStream = createWriteStream(`./storage/${fullFilename}`);
    req.pipe(writeStream);
    req.on("end", async () => {
      writeStream.end();
      await addDataToFileDBJSON({
        id: randomUUID,
        extension: fileExtension,
        name: filename,
        directoryId,
      });
      await updateFileIdInDirectory(directoryId, randomUUID);
      res.json({ message: "File created" });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log(err);
  }
});

//delete file
router.delete("/:id", async (req, res) => {
  try {
    // const { id } = req.params;
    // const file = getFileById(id);
    const file = req.file;
    const id = file.id;
    const directoryId = file.directoryId;
    const directory = getDirectoryById(directoryId);
    const userId = directory.userId;
    if (userId !== res.user.id) {
      return res.status(403).json({ message: "This file is not accessible" });
    }
    console.log(file);
    const fileName = `${id}${file.extension}`;
    console.log(fileName);
    const filePath = path.join(process.cwd(), "storage", fileName);
    await rm(filePath, { recursive: true, force: true });
    await removeFileFromDirectory(file.directoryId, id);
    await deleteFile(id);
    res.json({ message: "File/folder deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "File not found" });
  }
});

//rename file
router.patch("/:id", async (req, res) => {
  try {
    // const { id } = req.params;
    // const file = getFileById(id);
    const file = req.file;
    const id = file.id;
    const directoryId = file.directoryId;
    const directory = getDirectoryById(directoryId);
    const userId = directory.userId;
    if (userId !== res.user.id) {
      return res.status(403).json({ message: "This file is not accessible" });
    }
    renameFile(id, req.body.newFileName);
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
