import express from "express";

import {
  deleteDirectory,
  getDirectoriesList,
  getFilesList,
  removeDirectoryFromParentDirectory,
  renameDirectory,
} from "../utils.js";
import { ObjectId } from "mongodb";

const router = express.Router();

//get folder details
router.get("{/:id}", async (req, res) => {
  try {
    console.log("inside the directory routes");
    const db = req.db;
    const directories = db.collection("directories");
    const files = db.collection("files");
    const { id } = req.params;
    const user = res.user;
    const userId = user._id.toString();
    let directory = null;
    if (!id) {
      directory = await directories.findOne({
        _id: ObjectId.createFromHexString(user.directoryId.toString()),
      });
    } else {
      directory = await directories.findOne({
        _id: ObjectId.createFromHexString(id),
      });
    }
    if (!directory) {
      res.status(404).json({ message: "Directory not found" });
      return;
    }
    //console.log("directory", directory);

    if (directory.userId.toString() !== userId.toString()) {
      res.status(403).json({ message: "This directory is not accessible" });
      return;
    }

    const filesList = directory.files;
    const directoriesList = directory.directories;
    const finalList = await Promise.all(
      filesList.map(async (fileId) => {
        const file = await files.findOne({
          _id: ObjectId.createFromHexString(fileId.toString()),
        });

        return {
          id: file._id.toString(),
          fileName: file.name,
          directoryId: file.directoryId.toString(),
        };
      })
    );
    const finalDirectoriesList = await Promise.all(
      directoriesList.map(async (directoryId) => {
        const directory = await directories.findOne({
          _id: ObjectId.createFromHexString(directoryId.toString()),
        });
        return {
          id: directory._id.toString(),
          name: directory.name,
        };
      })
    );
    const finalData = {
      id: directory._id.toString(),
      files: finalList,
      directories: finalDirectoriesList,
    };

    res.json(finalData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//create folder
router.post("/:directoryId", async (req, res) => {
  try {
    const db = req.db;
    const directories = db.collection("directories");
    const user = res.user;
    const directoryId = req.params.directoryId || user.rootDirId;
    const { directoryname: directoryName } = req.headers;
    const tempDirectory = {
      name: directoryName,
      parentDir: ObjectId.createFromHexString(directoryId),
      files: [],
      directories: [],
      userId: user._id,
    };
    const { insertedId: childDirectoryId } = await directories.insertOne(
      tempDirectory
    );
    await directories.updateOne(
      { _id: ObjectId.createFromHexString(directoryId) },
      { $push: { directories: childDirectoryId } }
    );
    res.status(201).json({ message: "Folder created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//delete folder
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const directory = getDirectoryById(id);
    if (!directory) {
      throw new Error("Folder not found");
    }
    const filesList = getFilesList(id);
    const directoriesList = getDirectoriesList(id);
    if (filesList.length !== 0 || directoriesList.length !== 0) {
      res.status(500).json({ message: "Non Empty Folder can't be deleted" });
    } else {
      await removeDirectoryFromParentDirectory(id, directory.parentDir);
      await deleteDirectory(id);
      res.json({ message: "Folder deleted" });
    }
  } catch (error) {
    res.status(500).json({ message: "Folder not found" });
  }
});

//rename folder
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db;
    const directories = db.collection("directories");
    const result = await directories.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: { name: req.body.NewDirectoryName } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Folder not found" });
    }
    res.json({ message: "Folder renamed" });
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ message: "Folder not found" });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

export default router;
