const express = require("express");

const playlistController = require("../controllers/playlistController");

const authMiddleware = require('../middleware/auth-middleware');

// Create a router to handle all playlist-related routes.
// This keeps every /playlists URL grouped in one file.
const router = express.Router();

// All playlist routes are protected. Only can access when logged in.
// The middleware runs before every playlist controller function.
router.use(authMiddleware.isLoggedIn);

// Show all playlists.
// GET /playlists loads the main playlist list page.
router.get("/", playlistController.listPlaylists);

// Show the add playlist form.
// GET /playlists/add only opens the form.
router.get("/add", playlistController.showAddPlaylistForm);

// Save a new playlist.
// POST /playlists/add receives the form submission and saves it.
router.post("/add", playlistController.createPlaylist);

// Show one playlist and its songs using req.query.id.
// GET /playlists/view?id=... loads one selected playlist.
router.get("/view", playlistController.showPlaylist);

// Delete one playlist and all its songs using req.body.playlistId.
// POST /playlists/delete removes the selected playlist and its related child data.
router.post("/delete", playlistController.deletePlaylist);

// Show the edit playlist page
// GET /playlists/edit?playlistId=... loads existing values into the form.
router.get("/edit", playlistController.showEditPlaylist);

// Process new playlist details
// POST /playlists/edit updates the existing playlist document.
router.post("/edit", playlistController.editPlaylist);

// Export the router so server.js can use it.
module.exports = router;
