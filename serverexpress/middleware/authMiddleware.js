import { ObjectId } from "mongodb";

export default async function checkAuth(req, res, next) {
  try {
    const db = req.db;
    const users = db.collection("users");
    const { userId } = req.cookies;
    const isUserIdValid = ObjectId.isValid(userId);
    if (!userId || !isUserIdValid) {
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
