const express = require("express");

const likedSongController = require("../controllers/likedSongController");

const authMiddleware = require("../middleware/auth-middleware");

// Create a router for all /liked-songs routes.
// This keeps liked songs URLs grouped in one module instead of placing everything inside server.js.
const router = express.Router();

// Protect every liked songs route with the login middleware.
// If the user is not logged in, Express redirects them before any controller code runs.
router.use(authMiddleware.isLoggedIn);

// GET /liked-songs
// Open the page that lists all liked songs owned by the current user.
router.get("/", likedSongController.listLikedSongs);

// GET /liked-songs/add
// Open the form where the user can create a new liked song entry.
router.get("/add", likedSongController.showAddLikedSongForm);

// POST /liked-songs/add
// Receive the submitted form and ask the controller to save the new liked song entry.
router.post("/add", likedSongController.createLikedSong);

// GET /liked-songs/edit?likedSongId=...
// Load one saved liked song entry and show its values inside the edit form.
router.get("/edit", likedSongController.showEditLikedSongForm);

// POST /liked-songs/edit
// Receive the edited values and update the existing liked song entry in MongoDB.
router.post("/edit", likedSongController.editLikedSong);

// POST /liked-songs/delete
// Receive the selected liked song ID and remove that entry from the database.
router.post("/delete", likedSongController.deleteLikedSong);

// Export the router so server.js can use it.
module.exports = router;
