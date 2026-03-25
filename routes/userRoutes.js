const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth-middleware');

// Send logged-in users to playlists, otherwise show login page.
// This gives the project one simple starting URL: "/".
router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/playlists");
  }
  return res.redirect("/login");
});

// Calls the controller function that renders the login form
// GET /login only shows the page. It does not check the password yet.
router.get("/login", authMiddleware.isLoggedOut, userController.loginGet);

// Processes login credentials, sets session if valid
// POST /login receives the submitted username and password from the form.
router.post("/login", authMiddleware.isLoggedOut, userController.loginPost);

// Calls the controller function that renders the login form
// GET /register only opens the registration page.
router.get("/register", authMiddleware.isLoggedOut, userController.registerGet);

// Creates a new user in the database if username is not taken
// POST /register validates the form and creates a new user document.
router.post("/register", authMiddleware.isLoggedOut, userController.registerPost);

// Show change password page
// Only accessible if the user is logged in (authMiddleware.isLoggedIn)
// Renders the change password form
// GET /change-password only shows the form page.
router.get("/change-password", authMiddleware.isLoggedIn, userController.changePasswordGet);

// Handle change password form submission
// Only accessible if the user is logged in
// Updates password after validating old password and confirmation
// POST /change-password processes the submitted old and new passwords.
router.post("/change-password", authMiddleware.isLoggedIn, userController.changePasswordPost);

// Logout the user
// Only accessible if the user is logged in
// Destroys the session and redirects to login page
// GET /logout removes the session so the user is no longer authenticated.
router.get('/logout', authMiddleware.isLoggedIn, userController.logout);

// Export the router so server.js can use it.
module.exports = router;
