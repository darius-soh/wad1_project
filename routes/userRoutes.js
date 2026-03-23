const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth-middleware');

// Send logged-in users to playlists, otherwise show login page.
router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/playlists");
  }
  return res.redirect("/login");
});

// Calls the controller function that renders the login form
router.get("/login", authMiddleware.isLoggedOut, userController.loginGet);

// Processes login credentials, sets session if valid
router.post("/login", authMiddleware.isLoggedOut, userController.loginPost);

// Calls the controller function that renders the login form
router.get("/register", authMiddleware.isLoggedOut, userController.registerGet);

// Creates a new user in the database if username is not taken
router.post("/register", authMiddleware.isLoggedOut, userController.registerPost);

// Show change password page
// Only accessible if the user is logged in (authMiddleware.isLoggedIn)
// Renders the change password form
router.get("/change-password", authMiddleware.isLoggedIn, userController.changePasswordGet);

// Handle change password form submission
// Only accessible if the user is logged in
// Updates password after validating old password and confirmation
router.post("/change-password", authMiddleware.isLoggedIn, userController.changePasswordPost);

// Logout the user
// Only accessible if the user is logged in
// Destroys the session and redirects to login page
router.get('/logout', authMiddleware.isLoggedIn, userController.logout);

// Export the router so server.js can use it.
module.exports = router;
