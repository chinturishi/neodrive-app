import { ObjectId } from "mongodb";

export default async function validateFileId(req, res, next, id) {
  // const uuidRegex =
  //   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // if (!uuidRegex.test(id)) {
  //   return res.status(404).json({ message: "Not a valid UUID" });
  // }
  const db = req.db;
  const files = db.collection("files");
  const isIdValid = ObjectId.isValid(id);
  if (!isIdValid) return res.status(404).json({ message: "Not a valid id" });
  const file = await files.findOne({ _id: ObjectId.createFromHexString(id) });
  if (!file) return res.status(404).json({ message: "File not found" });
  req.file = file;
  next();
}
