const express = require("express");

const tagController = require("../controllers/tagController");

const authMiddleware = require("../middleware/auth-middleware");

// Create a router for all /tags routes.
// This keeps tag URLs grouped in one module instead of placing everything inside server.js.
const router = express.Router();

// Protect every tag route with the login middleware.
// If the user is not logged in, Express redirects them before any controller code runs.
router.use(authMiddleware.isLoggedIn);

// GET /tags
// Open the page that lists all tags owned by the current user.
router.get("/", tagController.listTags);

// GET /tags/add
// Open the form where the user can create a new tag.
router.get("/add", tagController.showAddTagForm);

// POST /tags/add
// Receive the submitted form and ask the controller to save the new tag.
router.post("/add", tagController.createTag);

// GET /tags/edit?tagId=...
// Load one saved tag and show its values inside the edit form.
router.get("/edit", tagController.showEditTagForm);

// POST /tags/edit
// Receive the edited values and update the existing tag in MongoDB.
router.post("/edit", tagController.editTag);

// POST /tags/delete
// Receive the selected tag ID and remove that tag from the database.
router.post("/delete", tagController.deleteTag);

// Export the router so server.js can use it.
module.exports = router;
