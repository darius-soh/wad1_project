const express = require("express");

const playlistController = require("../controllers/playlistController");

const router = express.Router();

router.get("/", playlistController.listPlaylists);
router.get("/add", playlistController.showAddPlaylistForm);
router.post("/add", playlistController.createPlaylist);
router.get("/:id", playlistController.showPlaylist);
router.post("/:id/delete", playlistController.deletePlaylist);
router.get("/:id/songs/add", playlistController.showAddSongForm);
router.post("/:id/songs/add", playlistController.createSong);
router.post("/:id/songs/:songId/delete", playlistController.deleteSong);

module.exports = router;
