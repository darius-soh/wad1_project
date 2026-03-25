const express = require("express");

const genreController = require("../controllers/genreController");

const authMiddleware = require("../middleware/auth-middleware");

// Create a router for all /genres routes.
// This keeps genre URLs grouped together instead of mixing them into server.js.
const router = express.Router();

// Protect every genre route with the login middleware.
// If the user is not logged in, Express will redirect them before the controller runs.
router.use(authMiddleware.isLoggedIn);

// GET /genres
// Open the page that lists all genres for the current user.
router.get("/", genreController.listGenres);

// GET /genres/add
// Open the form where the user can type a new genre.
router.get("/add", genreController.showAddGenreForm);

// POST /genres/add
// Receive the submitted form and ask the controller to save the new genre.
router.post("/add", genreController.createGenre);

// GET /genres/edit?genreId=...
// Load one saved genre and show its values inside the edit form.
router.get("/edit", genreController.showEditGenreForm);

// POST /genres/edit
// Receive the edited values and update the existing genre in MongoDB.
router.post("/edit", genreController.editGenre);

// POST /genres/delete
// Receive the selected genre ID and remove that genre from the database.
router.post("/delete", genreController.deleteGenre);

// Export the router so server.js can use it.
module.exports = router;
