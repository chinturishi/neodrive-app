import { ObjectId } from "mongodb";
import { getFileById } from "../utils.js";

export default async function validateFileId(req, res, next, id) {
  // const uuidRegex =
  //   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // if (!uuidRegex.test(id)) {
  //   return res.status(404).json({ message: "Not a valid UUID" });
  // }
  console.log("inside the validateFileId middleware");
  console.log("id", id);
  const db = req.db;
  const files = db.collection("files");
  const file = await files.findOne({ _id: ObjectId.createFromHexString(id) });
  console.log("file", file);
  if (!file) return res.status(404).json({ message: "File not found" });
  req.file = file;
  next();
}
