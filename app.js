require("dotenv").config();
const express = require("express");
const app = express();
// const cookieParser = require("cookie-parser");
const session = require("express-session");
// const flash = require("connect-flash");
const mongoose = require("mongoose");
const Student = require("./models/student");
const bcrypt = require("bcrypt");

mongoose
  .set("strictQuery", false)
  .connect("mongodb://127.0.0.1:27017/exampleDB")
  .then(() => {
    console.log("成功連結mongoDB...");
  })
  .catch((e) => {
    console.log(e);
  });

app.use(
  session({
    secret: process.env.MY_SESSION_SECRET_KEY,
    resave: false,
    saveUninitialize: false,
    cookie: { secure: false }, // 測試時使用 localhost，沒有 HTTPs
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const verifyUser = (req, res, next) => {
  if (req.session.isVerified) {
    return next(); // next()前要加return，否則會進入 錯誤處理 
  }
  return res.send("請先登入系統");
};

app.get("/students", async (req, res) => {
  try {
    let foundStudent = await Student.find({}).exec();
    return res.send(foundStudent);
  } catch (e) {
    console.log(e);
  }
});

app.post("/students", async (req, res) => {
  try {
    let { username, password } = req.body;
    let hashValue = await bcrypt.hash(password, 12);
    let newStudent = new Student({
      username,
      password: hashValue,
    });
    let savedStudent = await newStudent.save();
    return res.send({ message: "成功新增學生", savedStudent });
  } catch (e) {
    return res.status(400).send(e);
  }
});

app.post("/students/login", async (req, res) => {
  try {
    let { username, password } = req.body;
    let foundStudent = await Student.findOne({ username }).exec();
    if (!foundStudent) {
      return res.send("信箱錯誤，查無使用者");
    }
    let result = await bcrypt.compare(password, foundStudent.password);
    if (!result) return res.send("密碼錯誤，請再嘗試");
    req.session.isVerified = true;
    return res.send("登入成功...");
  } catch (e) {
    return res.status(400).send(e);
  }
});

app.post("/students/logout", (req, res) => {
  req.session.isVerified = false;
  return res.send("已登出系統");
});

app.get("/students/secret", verifyUser, (req, res) => {
  return res.send("我的秘密是 我長得像GD");
});

// app.delete('/students/:_id',async (req,res)=>{
//   try{
//     const {_id} = req.params
//     let deleteCount = await Student.deleteOne({_id})
//     return res.send(deleteCount)
//   } catch(e) {
//     return res.status(500).send(e.message)
//   }
// })

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
