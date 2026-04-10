require('dotenv').config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var expressLayouts = require("express-ejs-layouts");

require('./config/db')(); // Connect to MongoDB

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"), { maxAge: '1d' }));

// ── Role toggle ───────────────────────────────────────────────────────────────
// Sets a cookie 'role' = 'admin' | 'client', then redirects back.
app.get("/toggle-role", function (req, res) {
  var current = req.cookies.role || "client";
  var next = current === "admin" ? "client" : "admin";
  res.cookie("role", next, { httpOnly: false });
  var back = req.headers.referer || "/";
  // If switching away from admin, send to home
  if (next === "client" && back.includes("/admin")) back = "/";
  res.redirect(back);
});

// ── Expose role to all views ──────────────────────────────────────────────────
app.use(function (req, res, next) {
  res.locals.role = req.cookies.role || "client";
  res.locals.currentPath = req.path;
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/chat", require("./routes/api/chat"));
app.use("/cart", require("./routes/cart"));
app.use("/", require("./routes/index"));
app.use("/admin", require("./routes/admin"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.error('SERVER ERROR:', err);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
