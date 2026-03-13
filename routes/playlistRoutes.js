const express = require("express");

const playlistController = require("../controllers/playlistController");

// Create a router to handle all playlist-related routes.
const router = express.Router();

// Show all playlists.
router.get("/", playlistController.listPlaylists);

// Show the add playlist form.
router.get("/add", playlistController.showAddPlaylistForm);

// Save a new playlist.
router.post("/add", playlistController.createPlaylist);

// Show one playlist and its songs.
// :id is the MongoDB-generated ID of the playlist, passed through the URL.
router.get("/:id", playlistController.showPlaylist);

// Delete one playlist and all its songs.
// :id tells the server which playlist to delete.
router.post("/:id/delete", playlistController.deletePlaylist);

// Show the add song form for a specific playlist.
// :id tells the server which playlist the song will be added to.
router.get("/:id/songs/add", playlistController.showAddSongForm);

// Save a new song to a specific playlist.
// :id links the new song to the correct playlist in MongoDB.
router.post("/:id/songs/add", playlistController.createSong);

// Delete one song from a specific playlist.
// :id identifies the playlist and :songId identifies the song to delete.
router.post("/:id/songs/:songId/delete", playlistController.deleteSong);

// Export the router so server.js can use it.
module.exports = router;