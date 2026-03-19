// Load environment variables from config.env.
require("dotenv").config({ path: "./config.env" });

// Import required packages.
const express = require("express");
const mongoose = require("mongoose");

// Import playlist routes.
const playlistRoutes = require("./routes/playlistRoutes");

// Create the Express server.
const server = express();

// Parse form data from POST requests.
server.use(express.urlencoded({ extended: true }));

// Parse JSON data from requests.
server.use(express.json());

// Set EJS as the view engine for rendering dynamic HTML pages.
server.set("view engine", "ejs");

// Set the folder where EJS view files are stored.
server.set("views", __dirname + "/views");

// Redirect the root page to playlists.
server.get("/", function (req, res) {
  return res.redirect("/playlists");
});

// Use playlist routes for all /playlists paths.
server.use("/playlists", playlistRoutes);

// Redirect any unknown routes back to playlists.
server.use(function (req, res) {
  return res.redirect("/playlists");
});

// Connect to MongoDB using the connection string from config.env.
async function connectDB() {
  try {
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

// Start the web server on localhost port 8000.
function startServer() {
  const hostname = "localhost";
  const port = 8000;

  server.listen(port, hostname, function () {
    console.log("Server running at http://" + hostname + ":" + port + "/");
  });
}

// Connect to the database first, then start the server.
connectDB().then(startServer);