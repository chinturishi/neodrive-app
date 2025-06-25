import express from "express";
import { createWriteStream } from "fs";
import { mkdir, readdir, rename, rmdir, stat, unlink } from "fs/promises";
import path from "path";

const app = express();

app.use(express.json());

//Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

//Get files list
app.get("/directory{/*any}", async (req, res) => {
  const pathArray = req.params.any;
  //const newFilePath = pathArray ? path.join("/", ...pathArray) : undefined;
  const newFilePath = pathArray ? path.join("/", ...pathArray) : "";
  try {
    let filesList = await readdir("./storage" + newFilePath, {
      withFileTypes: true,
    });
    const finalList = filesList.map((item) => {
      return {
        item: item.name,
        isDirectory: item.isDirectory(),
      };
    });
    res.json(finalList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//create folder
app.post("/directory{/*any}", async (req, res) => {
  const pathArray = req.params.any;
  const newFilePath = pathArray ? path.join("/", ...pathArray) : "";
  const filePath = `${import.meta.dirname}/storage/${newFilePath}`;
  try {
    await mkdir(filePath, { recursive: true });
    res.json({ message: "Folder created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Download or open file
app.get("/files{/*any}", (req, res) => {
  const pathArray = req.params.any;
  const newFilePath = path.join("/", ...pathArray);
  const filePath = `${import.meta.dirname}/storage/${newFilePath}`;
  if (req.query.action === "download") {
    const encodedFilename = encodeURIComponent(pathArray[pathArray.length - 1]);
    res.header(
      "Content-Disposition",
      `attachment; filename="${encodedFilename}"`
    );
  }
  res.sendFile(filePath);
  //res.json({ message: "File downloaded" });
});

//upload file
app.post("/files{/*any}", async (req, res) => {
  const pathArray = req.params.any;
  const newFilePath = path.join("/", ...pathArray);
  //const { filename } = req.params;
  const filePath = `${import.meta.dirname}/storage/${newFilePath}`;
  try {
    const writeStream = createWriteStream(filePath);
    req.pipe(writeStream);
    req.on("end", () => {
      writeStream.end();
      res.json({ message: "File created" });
    });
  } catch (err) {
    res.json({ message: err.message });
  }
});

//delete file
app.delete("/files{/*any}", async (req, res) => {
  const pathArray = req.params.any;
  const newFilePath = path.join("/", ...pathArray);
  const filePath = `${import.meta.dirname}/storage/${newFilePath}`;
  const stats = await stat(filePath);
  try {
    if (!stats.isDirectory()) {
      await unlink(filePath);
      res.json({ message: "File deleted" });
    } else {
      await rmdir(filePath);
      res.json({ message: "Folder deleted" });
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ message: "File not found" });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

//rename file
app.patch("/files{/*any}", async (req, res) => {
  const pathArray = req.params.any;
  const tempPath = path.join("/", ...pathArray);
  const oldFilePath = `${import.meta.dirname}/storage/${tempPath}`;
  const newFilePath = `${import.meta.dirname}/storage/${req.body.newFileName}`;
  try {
    await rename(oldFilePath, newFilePath);
    res.json({ message: "File renamed" });
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ message: "File not found" });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

app.listen(4000, () => {
  // Server is running on port 4000
});
