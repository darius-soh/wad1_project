// Load environment variables from config.env
// This lets us keep secrets and database settings outside the code.
require("dotenv").config({ path: "./config.env" });

// Import required packages
// Express handles routing and incoming HTTP requests.
const express = require("express");

// Import express-session library
// This package lets the app remember who is logged in across multiple requests.
const session = require('express-session');

// Import path module
// Path helps us build safe file and folder paths.
const path = require('path');

// Import mongoose
// Mongoose is the layer used to connect to MongoDB and work with schemas/models.
const mongoose = require("mongoose");

// Import playlist routes
const playlistRoutes = require("./routes/playlistRoutes");

// Import song routes
const songRoutes = require("./routes/songRoutes");

// Import genre routes
const genreRoutes = require("./routes/genreRoutes");

// Import review routes
const reviewRoutes = require("./routes/reviewRoutes");

// Import liked song routes
const likedSongRoutes = require("./routes/likedSongRoutes");

// Import user routes
const userRoutes = require("./routes/userRoutes");

// Create the Express server
// This object becomes the main app that receives requests and sends responses.
const server = express();

// Parse form data from POST requests
// Without this, req.body would be empty when HTML forms are submitted.
server.use(express.urlencoded({ extended: true }));

// Parse JSON data from requests
// This is useful if any request sends JSON instead of normal form data.
server.use(express.json());

// Set EJS as the view engine for rendering dynamic HTML pages
// res.render("page-name") will look for EJS files inside the views folder.
server.set("view engine", "ejs");

// Set the folder where EJS view files are stored
// This tells Express exactly where the HTML template files live.
server.set('views', path.join(__dirname, 'views'));

// Set up sessions to track who is logged in.
// The session cookie lets the server recognise the same user across pages.
const secret = process.env.SECRET;
server.use(session({
    secret: secret, // sign the session ID cookie. should be a long, random, and secure string, preferably stored in an environment variable
    resave: false, // Prevents the session from being saved back to the session store if nothing has changed.
    saveUninitialized: false // Prevents a new, empty session from being saved to the store.
}));

// Mount user routes first.
// URLs like /login and /register are handled inside userRoutes.js.
server.use("/", userRoutes);

// Mount playlist routes (protected inside the playlist router).
// Any request that starts with /playlists will be passed to playlistRoutes.js.
server.use("/playlists", playlistRoutes);

// Mount song routes.
// Any request that starts with /songs will be passed to songRoutes.js.
server.use("/songs", songRoutes);

// Mount genre routes.
// Any request that starts with /genres will be passed to genreRoutes.js.
server.use("/genres", genreRoutes);

// Mount review routes.
// Any request that starts with /reviews will be passed to reviewRoutes.js.
server.use("/reviews", reviewRoutes);

// Mount liked song routes.
// Any request that starts with /liked-songs will be passed to likedSongRoutes.js.
server.use("/liked-songs", likedSongRoutes);

server.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Show a 404 page for unknown routes.
server.use(function (req, res) {
  return res.status(404).render("errors/404", {
    title: "404 Not Found",
    user: req.session.user || null
  });
});

// Connect to MongoDB using the connection string from config.env.
// The app should only start serving requests after the database connection succeeds.
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
// Once this runs, the app is ready to receive browser requests.
function startServer() {
  const hostname = "localhost";
  const port = 8000;

  server.listen(port, hostname, function () {
    console.log("Server running at http://" + hostname + ":" + port + "/");
  });
}

// Connect to the database first, then start the server.
// This order avoids opening the website before MongoDB is ready.
connectDB().then(startServer);
