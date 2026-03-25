const express = require("express");

const reviewController = require("../controllers/reviewController");

const authMiddleware = require("../middleware/auth-middleware");

// Create a router to handle all review-related routes.
// This groups all /reviews URLs in one place.
const router = express.Router();

// All review routes are protected. Only can access when logged in.
// The login middleware runs before any review controller logic.
router.use(authMiddleware.isLoggedIn);

// Show all reviews.
// GET /reviews loads the reviews list page.
router.get("/", reviewController.listReviews);

// Show the add review form.
// GET /reviews/add only opens the form page.
router.get("/add", reviewController.showAddReviewForm);

// Save a new review.
// POST /reviews/add receives the submitted form and creates a review.
router.post("/add", reviewController.createReview);

// Show the edit review page.
// GET /reviews/edit?reviewId=... loads the selected review into the edit form.
router.get("/edit", reviewController.showEditReviewForm);

// Process review changes.
// POST /reviews/edit updates the review document.
router.post("/edit", reviewController.editReview);

// Delete one review.
// POST /reviews/delete removes the selected review document.
router.post("/delete", reviewController.deleteReview);

// Export the router so server.js can use it.
module.exports = router;
