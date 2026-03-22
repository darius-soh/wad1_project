const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth-middleware');

// Redirects to login page.
router.get("/", (req,res)=> res.redirect("/login"));

router.get("/login", userController.loginGet);

router.post("/login", userController.loginPost);

router.get("/register", userController.registerGet);

router.post("/register", userController.registerPost);

router.get("/change-password", authMiddleware.isLoggedIn, userController.changePasswordGet);

router.post("/change-password", authMiddleware.isLoggedIn, userController.changePasswordPost);

router.get("/welcome", authMiddleware.isLoggedIn, userController.welcome);

// Logout
router.get('/logout', authMiddleware.isLoggedIn, userController.logout);

// Export the router so server.js can use it.
module.exports = router;



