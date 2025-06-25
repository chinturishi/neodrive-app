import { ObjectId } from "mongodb";
import { getUserById } from "../utils.js";

export default async function checkAuth(req, res, next) {
  try {
    const db = req.db;
    const users = db.collection("users");
    const { userId } = req.cookies;
    console.log("userId", userId);
    if (!userId) {
      res.status(401).json({ message: "Session expired" });
      return;
    }
    const user = await users.findOne({
      _id: ObjectId.createFromHexString(userId),
    });
    //const user = await getUserById(userId);
    if (!userId || !user) {
      res.status(401).json({ message: "Session expired" });
      return;
    }
    res.user = user;
    next();
  } catch (error) {}
}
