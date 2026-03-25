const mongoose = require("mongoose");

// Define the fields that every genre document should store in MongoDB.
// Mongoose uses this schema as a blueprint for validation and document structure.
const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
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

// Create the Genre model from the schema.
// This model gives us functions such as find(), create(), update(), and delete().
const Genre = mongoose.model("Genre", genreSchema);

// Find all genre documents where userId matches the logged-in user.
// The controller uses this when it needs to show the user's full genre list.
function getAllGenres(userId) {
  return Genre.find({ userId: userId });
}

// Find one genre document by its MongoDB _id value.
// This is used before editing or deleting a specific genre.
function getGenreById(id) {
  return Genre.findById(id);
}

// Create and insert one new genre document into MongoDB.
// The data object is prepared in the controller before it is passed here.
function createGenre(data) {
  return Genre.create(data);
}

// Find one genre by ID and replace the fields we pass in data.
// This updates the saved MongoDB document without creating a new one.
function updateGenreById(id, data) {
  return Genre.findByIdAndUpdate(id, data);
}

// Find one genre by ID and remove it from MongoDB.
// After this runs, the document no longer exists in the collection.
function deleteGenreById(id) {
  return Genre.findByIdAndDelete(id);
}

module.exports = {
  getAllGenres: getAllGenres,
  getGenreById: getGenreById,
  createGenre: createGenre,
  updateGenreById: updateGenreById,
  deleteGenreById: deleteGenreById
};
