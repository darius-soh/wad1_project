require("dotenv").config({ path: "./config.env" });
const express = require("express");
const mongoose = require("mongoose");
const playlistRoutes = require("./routes/playlistRoutes");

const server = express();
const hostname = "localhost";
const port = 8000;

server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

server.use(express.urlencoded({ extended: false }));
server.use(express.json());

server.get("/", function (req, res) {
  return res.redirect("/playlists");
});

server.use("/playlists", playlistRoutes);

server.use(function (req, res) {
  return res.redirect("/playlists");
});

async function connectDB() {
  try {
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

function startServer() {
  server.listen(port, hostname, function () {
    console.log("Server running at http://" + hostname + ":" + port + "/");
  });
}

connectDB().then(startServer);
