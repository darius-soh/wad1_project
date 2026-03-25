const mongoose = require("mongoose");

// Define the fields that every review document should store in MongoDB.
// Mongoose uses this schema as the blueprint for validation and saved structure.
const reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the Review model from the schema.
// This model gives us helper methods such as find(), create(), update(), and delete().
const Review = mongoose.model("Review", reviewSchema);

// Find all review documents where userId matches the logged-in user.
// The controller uses this to build the reviews list page.
function getAllReviews(userId) {
  return Review.find({ userId: userId });
}

// Find one review document by its MongoDB _id value.
// This is used before editing or deleting one selected review.
function getReviewById(id) {
  return Review.findById(id);
}

// Create and insert one new review document into MongoDB.
// The controller prepares the data object and passes it into this function.
function createReview(data) {
  return Review.create(data);
}

// Find one review by ID and update the fields we pass in the data object.
// This changes the saved document instead of creating a new one.
function updateReviewById(id, data) {
  return Review.findByIdAndUpdate(id, data);
}

// Find one review by ID and remove it from MongoDB.
// After this runs, the review document no longer exists in the collection.
function deleteReviewById(id) {
  return Review.findByIdAndDelete(id);
}

// Delete all reviews that belong to one song.
function deleteReviewsBySongId(songId) {
  return Review.deleteMany({ songId: songId });
}

module.exports = {
  getAllReviews: getAllReviews,
  getReviewById: getReviewById,
  createReview: createReview,
  updateReviewById: updateReviewById,
  deleteReviewById: deleteReviewById,
  deleteReviewsBySongId: deleteReviewsBySongId
};
