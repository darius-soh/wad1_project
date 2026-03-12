const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const playlistRoutes = require("./routes/playlistRoutes");

const envPathCandidates = [
  path.join(__dirname, "config.env"),
  path.join(__dirname, "views", "config.env"),
];

const envPath = envPathCandidates.find(function (candidate) {
  return fs.existsSync(candidate);
});

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

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
    const dbUri = process.env.DB || process.env.MONGODB_URI;

    if (!dbUri) {
      throw new Error(
        "Missing MongoDB connection string. Set DB or MONGODB_URI in config.env."
      );
    }

    await mongoose.connect(dbUri);
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
