import express from "express";

import {
  addDirectoryToDirectory,
  deleteDirectory,
  getDirectoriesList,
  getDirectoryById,
  getFileById,
  getFilesList,
  getRandomUUID,
  getUserById,
  removeDirectoryFromParentDirectory,
  renameDirectory,
  updateDirectoryIdInDirectory,
} from "../utils.js";

const router = express.Router();

//Get files list
router.get("{/:id}", async (req, res) => {
  try {
    console.log("inside the directory routes");
    const { id } = req.params;
    console.log(id);
    // const { userId } = req.cookies;
    // const user = await getUserById(userId);
    const user = res.user;
    const userId = user.id;
    let directory = null;
    if (!id) {
      directory = getDirectoryById(user.rootDirId);
    } else {
      directory = getDirectoryById(id);
    }
    //console.log(directory);
    if (!directory) {
      res.status(404).json({ message: "Directory not found" });
      return;
    }
    if (directory.userId !== userId) {
      res.status(403).json({ message: "This directory is not accessible" });
      return;
    }
    const filesList = getFilesList(directory.id);
    console.log(filesList);
    const directoriesList = getDirectoriesList(directory.id);
    console.log(directoriesList);
    const finalList = filesList.map((fileId) => {
      const file = getFileById(fileId);
      return {
        id: file.id,
        fileName: file.name,
        directoryId: file.directoryId,
      };
    });
    const finalDirectoriesList = directoriesList.map((directoryId) => {
      const directory = getDirectoryById(directoryId);
      return {
        id: directory.id,
        name: directory.name,
      };
    });
    const finalData = {
      id: directory.id,
      files: finalList,
      directories: finalDirectoriesList,
    };
    console.log(finalData);

    res.json(finalData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

//create folder
router.post("{/:directoryId}", async (req, res) => {
  try {
    console.log("inside the create folder route");
    //const { userId } = req.cookies;
    //const user = await getUserById(userId);
    const user = res.user;
    const userId = user.id;
    const directoryId = req.params.directoryId || user.rootDirId;
    console.log(directoryId);
    const { directoryname: directoryName } = req.headers;
    const randomUUID = getRandomUUID();
    const newDirectory = {
      id: randomUUID,
      name: directoryName,
      parentDir: directoryId,
      userId,
      files: [],
      directories: [],
    };
    await addDirectoryToDirectory(newDirectory);
    await updateDirectoryIdInDirectory(directoryId, randomUUID);
    res.status(201).json({ message: "Folder created" });
  } catch (err) {
    console.log(err);
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
    console.log("directory", directory);
    const filesList = getFilesList(id);
    console.log(filesList);
    const directoriesList = getDirectoriesList(id);
    if (filesList.length !== 0 || directoriesList.length !== 0) {
      res.status(500).json({ message: "Non Empty Folder can't be deleted" });
    } else {
      await removeDirectoryFromParentDirectory(id, directory.parentDir);
      await deleteDirectory(id);
      res.json({ message: "Folder deleted" });
    }
  } catch (error) {
    //console.log(error);
    res.status(500).json({ message: "Folder not found" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await renameDirectory(id, req.body.NewDirectoryName);
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
