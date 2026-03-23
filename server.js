// Load environment variables from config.env
require("dotenv").config({ path: "./config.env" });

// Import required packages
const express = require("express");

// Import express-session library
const session = require('express-session');

// Import path module
const path = require('path');

// Import mongoose
const mongoose = require("mongoose");

// Import playlist routes
const playlistRoutes = require("./routes/playlistRoutes");

// Import user routes
const userRoutes = require("./routes/userRoutes");

// Create the Express server
const server = express();

// Parse form data from POST requests
server.use(express.urlencoded({ extended: true }));

// Serve statis files from 'public' directory
server.use(express.static(path.join(__dirname, "public")));

// Parse JSON data from requests
server.use(express.json());

// Set EJS as the view engine for rendering dynamic HTML pages
server.set("view engine", "ejs");

// Set the folder where EJS view files are stored
server.set('views', path.join(__dirname, 'views'));

// Set up sessions to track who is logged in.
const secret = process.env.SECRET;
server.use(session({
    secret: secret, // sign the session ID cookie. should be a long, random, and secure string, preferably stored in an environment variable
    resave: false, // Prevents the session from being saved back to the session store if nothing has changed.
    saveUninitialized: false // Prevents a new, empty session from being saved to the store.
}));

// Mount user routes first.
server.use("/", userRoutes);

// Mount playlist routes (protected inside the playlist router).
server.use("/playlists", playlistRoutes);

// Redirect any unknown routes back to login.
server.use(function (req, res) {
  return res.redirect("/login");
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