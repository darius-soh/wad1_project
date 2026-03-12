const express = require("express");

const playlistController = require("../controllers/playlistController");

const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.user) {
    req.session.flash = {
      type: "error",
      text: "Please log in to continue."
    };
    return res.redirect("/login");
  }

  return next();
});

router.get("/", playlistController.listPlaylists);
router.get("/new", playlistController.showCreateForm);
router.post("/", playlistController.createPlaylist);
router.get("/:playlistId", playlistController.showPlaylist);
router.post("/:playlistId/songs", playlistController.addSong);
router.post("/:playlistId/songs/:songId/reviews", playlistController.addReview);
router.post("/:playlistId/songs/:songId/delete", playlistController.deleteSong);
router.post("/:playlistId/delete", playlistController.deletePlaylist);

module.exports = router;
