const express = require("express");
const mongoose = require("mongoose");

const playlistRoutes = require("./routes/playlistRoutes");

const app = express();
const port = process.env.PORT || 3000;
const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/mini-spotify-playlist-manager";

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", function (req, res) {
  return res.redirect("/playlists");
});

app.use("/playlists", playlistRoutes);

app.use(function (req, res) {
  return res.redirect("/playlists");
});

async function startServer() {
  try {
    await mongoose.connect(mongoUri);

    app.listen(port, function () {
      console.log("Server running at http://localhost:" + port);
    });
  } catch (error) {
    console.log("Something went wrong.");
  }
}

startServer();
