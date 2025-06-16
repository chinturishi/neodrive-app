import { getUserById } from "../utils.js";

export default async function checkAuth(req, res, next) {
  const { userId } = req.cookies;
  const user = await getUserById(userId);
  console.log("user logged in", user);
  if (!userId || !user) {
    res.status(401).json({ message: "Session expired" });
    return;
  }
  res.user = user;
  next();
}
