const express = require("express");

const songController = require("../controllers/songController");

const authMiddleware = require("../middleware/auth-middleware");

// Create a router to handle all song-related routes.
// This keeps every /songs URL in one module.
const router = express.Router();

// All song routes are protected. Only can access when logged in.
// The middleware runs before any song controller function.
router.use(authMiddleware.isLoggedIn);

// Show all songs that belong to the logged-in user.
// GET /songs opens the songs list page.
router.get("/", songController.listSongs);

// Show the add song form.
// GET /songs/add only opens the add form.
router.get("/add", songController.showAddSongForm);

// Save a new song.
// POST /songs/add receives the submitted song form and saves it.
router.post("/add", songController.createSong);

// Show one song.
// GET /songs/view?id=... opens the details page for one song.
router.get("/view", songController.showSong);

// Show the edit song page.
// GET /songs/edit?songId=... loads one song into the edit form.
router.get("/edit", songController.showEditSongForm);

// Process song changes.
// POST /songs/edit updates the saved song document.
router.post("/edit", songController.editSong);

// Delete one song.
// POST /songs/delete removes one selected song.
router.post("/delete", songController.deleteSong);

// Export the router so server.js can use it.
module.exports = router;
