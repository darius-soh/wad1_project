const express = require("express");
const path = require("path");
const session = require("express-session");

const authRoutes = require("./routes/authRoutes");
const playlistRoutes = require("./routes/playlistRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "simple-playlist-app-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/playlists");
  }

  return res.redirect("/login");
});

app.use("/", authRoutes);
app.use("/playlists", playlistRoutes);

app.use((req, res) => {
  res.status(404).send("Page not found.");
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send("Something went wrong.");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
