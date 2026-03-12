// Load environment variables from config.env.
require("dotenv").config({ path: "./config.env" });

// Import required packages.
const express = require("express");
const mongoose = require("mongoose");
const playlistRoutes = require("./routes/playlistRoutes");

// Create the Express server.
const server = express();
const hostname = "localhost";
const port = 8000;

// Set up EJS views.
server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

// Parse form data and JSON data.
server.use(express.urlencoded({ extended: true }));
server.use(express.json());

// Redirect the root page to playlists.
server.get("/", function (req, res) {
  return res.redirect("/playlists");
});

// Use playlist routes.
server.use("/playlists", playlistRoutes);

// Redirect unknown routes back to playlists.
server.use(function (req, res) {
  return res.redirect("/playlists");
});

// Connect to MongoDB.
async function connectDB() {
  try {
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

// Start the web server.
function startServer() {
  server.listen(port, hostname, function () {
    console.log("Server running at http://" + hostname + ":" + port + "/");
  });
}

// Connect to the database first, then start the server.
connectDB().then(startServer);
