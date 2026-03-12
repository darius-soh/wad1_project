const express = require("express");

const playlistController = require("../controllers/playlistController");

const router = express.Router();

// Show all playlists.
router.get("/", playlistController.listPlaylists);

// Show the add playlist form.
router.get("/add", playlistController.showAddPlaylistForm);

// Save a new playlist.
router.post("/add", playlistController.createPlaylist);

// Show one playlist and its songs.
router.get("/:id", playlistController.showPlaylist);

// Delete one playlist.
router.post("/:id/delete", playlistController.deletePlaylist);

// Show the add song form.
router.get("/:id/songs/add", playlistController.showAddSongForm);

// Save a new song.
router.post("/:id/songs/add", playlistController.createSong);

// Delete one song.
router.post("/:id/songs/:songId/delete", playlistController.deleteSong);

module.exports = router;
