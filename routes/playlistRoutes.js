const express = require("express");

const playlistController = require("../controllers/playlistController");

const authMiddleware = require('../middleware/auth-middleware');

// Create a router to handle all playlist-related routes.
const router = express.Router();

// All playlist routes are protected. Only can access when logged in.
router.use(authMiddleware.isLoggedIn);

// Show all playlists.
router.get("/", playlistController.listPlaylists);

// Show the add playlist form.
router.get("/add", playlistController.showAddPlaylistForm);

// Save a new playlist.
router.post("/add", playlistController.createPlaylist);

// Show one playlist and its songs using req.query.id.
router.get("/view", playlistController.showPlaylist);

// Delete one playlist and all its songs using req.body.playlistId.
router.post("/delete", playlistController.deletePlaylist);

// Show the edit playlist page
router.get("/edit", playlistController.showEditPlaylist);

// Process new playlist details
router.post("/edit", playlistController.editPlaylist);

// Show the add song form using req.query.id.
router.get("/songs/add", playlistController.showAddSongForm);

// Save a new song using req.body.playlistId.
router.post("/songs/add", playlistController.createSong);

// Delete one song using req.body.playlistId and req.body.songId.
router.post("/songs/delete", playlistController.deleteSong);

// Export the router so server.js can use it.
module.exports = router;