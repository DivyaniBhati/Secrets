const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const encrypt = require("mongoose-encryption");
const ejs = require("ejs");
var app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: false,
  })
);

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/secrets");
const trySchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String,
});
const secret = "thisislittlesecret.";
trySchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
const item = mongoose.model("second", trySchema);

const secretSchema = new mongoose.Schema({
  secret: String,
  username: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Secret = mongoose.model("Secret", secretSchema);

app.get("/", function (req, res) {
  res.render("home");
});
app.post("/register", function (req, res) {
  const newUser = new item({
    email: req.body.username,
    password: req.body.password,
  });
  newUser
    .save()
    .then(() => {
      res.render("secrets");
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("An error occurred while saving the user.");
    });
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  item
    .findOne({ email: username })
    .then((foundUser) => {
      if (foundUser && foundUser.password === password) {
        req.session.username = username;
        res.render("secrets");
      } else {
        res.status(401).send("Incorrect username or password");
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/last", function (req, res) {
  const secretMsg = req.body.secret;

  const newSecret = new Secret({
    secret: secretMsg,
    username: req.session.username,
  });

  newSecret
    .save()
    .then(() => {
      console.log("Secret saved successsfully!");
      res.redirect("/last");
    })
    .catch((error) => {
      console.error("Error saving secret:", error);
      res.status(500).send("Error saving secret");
    });
});

app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/submit", function (req, res) {
  res.render("submit");
});
app.get("/logout", function (req, res) {
  res.render("home");
});
app.get("/last", function (req, res) {
  Secret.find()
    .then((secrets) => {
      res.render("last", { secrets: secrets });
    })
    .catch((err) => {
      console.error("Error fetching secrets:", err);
      res.status(500).send("Error fetching secrets");
    });
});
app.listen(5000, function () {
  console.log("Server started");
});
