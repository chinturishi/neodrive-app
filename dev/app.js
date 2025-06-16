import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: "http://127.0.0.1:5501",
    credentials: true,
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).json({ message: "Internal Server Error" });
});

app.get("/", (req, res) => {
  console.log(req.cookies);

  res.cookie("name", "Rishikanta Mohanty", {
    sameSite: "none",
    secure: true,
  });
  //res.set("Set-Cookie", "name=John; HttpOnly; SameSite=None; Secure");
  // res.set("Set-Cookie", [
  //   "name=John; HttpOnly; SameSite=None; Secure",
  //   "name2=John2; HttpOnly; SameSite=None; Secure",
  //   "name3=John3; HttpOnly; SameSite=None; Secure",
  // // ]);
  // res.cookie("name", "Rishikanta Mohanty", {
  //   httpOnly: true,
  //   sameSite: "none",
  //   secure: true,
  //   maxAge: 1000 * 60,
  //   expires: new Date(Date.now() + 1000 * 60),
  // });
  // res.cookie("age", 35, {
  //   httpOnly: true,
  //   sameSite: "none",
  //   secure: true,
  //   maxAge: 1000 * 60 * 60,
  //   expires: new Date(Date.now() + 1000 * 60 * 60),
  // });
  res.json({ message: "Hello World" });
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
