import path from "path";
import crypto from "crypto";
import filesDB from "./db/filesDB.json" assert { type: "json" };
import directoriesDB from "./db/directoriesDB.json" assert { type: "json" };
import usersDB from "./db/usersDB.json" assert { type: "json" };
import { writeFile } from "fs/promises";

function getStoragePath(any) {
  const newFilePath = any ? path.join("/", ...any) : "";
  const filePath = `${import.meta.dirname}/storage/${newFilePath}`;
  return filePath;
}

function getRandomUUID() {
  return crypto.randomUUID();
}

function getFileExtension(filename) {
  return path.extname(filename);
}

async function addDataToFileDBJSON(data) {
  filesDB.push(data);
  await writeFile("./db/filesDB.json", JSON.stringify(filesDB));
}

function getFileById(id) {
  return filesDB.find((file) => file.id === id);
}

async function renameFile(id, newFileName) {
  const file = getFileById(id);
  file.name = newFileName;
  await writeFile("./db/filesDB.json", JSON.stringify(filesDB));
}

async function deleteFile(id) {
  const file = getFileById(id);
  const updateFilesDB = filesDB.filter((file) => file.id !== id);
  await writeFile("./db/filesDB.json", JSON.stringify(updateFilesDB));
}

function getRootDirectory() {
  return directoriesDB.find(
    (directory) => directory.id === "a965303d-2899-48f9-902b-bd1992d06778"
  );
}

function getDirectoryById(id) {
  return directoriesDB.find((directory) => directory.id === id);
}
function getFilesList(id) {
  const directory = getDirectoryById(id);
  return directory.files;
}

function getDirectoriesList(id) {
  const directory = getDirectoryById(id);
  return directory.directories;
}
async function removeFileFromDirectory(id, fileId) {
  const directory = getDirectoryById(id);
  directory.files = directory.files.filter((file) => file !== fileId);
  await writeFile("./db/directoriesDB.json", JSON.stringify(directoriesDB));
}

async function updateFileIdInDirectory(id, fileId) {
  const directory = getDirectoryById(id);
  directory.files.push(fileId);
  await writeFile("./db/directoriesDB.json", JSON.stringify(directoriesDB));
}

async function addDirectoryToDirectory(newDirectory) {
  directoriesDB.push(newDirectory);
  await writeFile("./db/directoriesDB.json", JSON.stringify(directoriesDB));
}

async function updateDirectoryIdInDirectory(id, directoryId) {
  const directory = getDirectoryById(id);
  directory.directories.push(directoryId);
  await writeFile("./db/directoriesDB.json", JSON.stringify(directoriesDB));
}

async function deleteDirectory(id) {
  const updateDirectoriesDB = directoriesDB.filter(
    (directory) => directory.id !== id
  );
  await writeFile(
    "./db/directoriesDB.json",
    JSON.stringify(updateDirectoriesDB)
  );
}

async function removeDirectoryFromParentDirectory(id, parentDir) {
  // const directory = getDirectoryById(id);
  // const parentDir = directory.parentDir;
  const parentDirectory = getDirectoryById(parentDir);
  parentDirectory.directories = parentDirectory.directories.filter(
    (directory) => directory !== id
  );
  await writeFile("./db/directoriesDB.json", JSON.stringify(directoriesDB));
}

async function renameDirectory(id, newDirectoryName) {
  const directory = getDirectoryById(id);
  directory.name = newDirectoryName;
  await writeFile("./db/directoriesDB.json", JSON.stringify(directoriesDB));
}

async function createUser(id, name, email, password, rootDirId) {
  const user = { id, name, email, password, rootDirId };
  usersDB.push(user);
  await writeFile("./db/usersDB.json", JSON.stringify(usersDB));
}

async function getUserByEmail(email) {
  return usersDB.find((user) => user.email === email);
}

async function getUserById(id) {
  return usersDB.find((user) => user.id === id);
}

export {
  getFileExtension,
  getRandomUUID,
  getStoragePath,
  addDataToFileDBJSON,
  getFileById,
  renameFile,
  deleteFile,
  getRootDirectory,
  getDirectoryById,
  getFilesList,
  getDirectoriesList,
  removeFileFromDirectory,
  updateFileIdInDirectory,
  addDirectoryToDirectory,
  updateDirectoryIdInDirectory,
  deleteDirectory,
  removeDirectoryFromParentDirectory,
  renameDirectory,
  createUser,
  getUserByEmail,
  getUserById,
};
