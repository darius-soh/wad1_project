const mongoose = require("mongoose");

// Define the fields that every tag document should store in MongoDB.
// Mongoose uses this schema as the blueprint for tag validation and saved structure.
const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playlist",
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

// Create the Tag model from the schema.
const Tag = mongoose.model("Tag", tagSchema);

// Find all tag documents where userId matches the logged-in user.
// The controller uses this to build the list shown on the tags page.
function getAllTags(userId) {
  return Tag.find({ userId: userId });
}

// Find one tag document by its MongoDB _id value.
// This is used before editing or deleting a specific tag.
function getTagById(id) {
  return Tag.findById(id);
}

// Create and insert one new tag document into MongoDB.
// The controller prepares the data object and passes it into this function.
function createTag(data) {
  return Tag.create(data);
}

// Find one tag by ID and update the fields we pass in the data object.
// This changes the saved document instead of creating a new one.
function updateTagById(id, data) {
  return Tag.findByIdAndUpdate(id, data);
}

// Find one tag by ID and remove it from MongoDB.
// After this runs, the tag document no longer exists in the collection.
function deleteTagById(id) {
  return Tag.findByIdAndDelete(id);
}

// Remove every tag whose playlistId matches the given playlist.
// The playlist controller uses this when a whole playlist is being deleted.
// deleteMany is outside of what we learned in class
// look in the Tag collection, find every tag whose playlistId equals the given playlistId
// and delete all of them in one database operation
// one playlist can have many tags when the playlist is deleted, its tags should also be deleted
// deleteMany() is a quick way to remove all related tags together
function deleteTagsByPlaylistId(playlistId) {
  return Tag.deleteMany({ playlistId: playlistId });
}

module.exports = {
  getAllTags: getAllTags,
  getTagById: getTagById,
  createTag: createTag,
  updateTagById: updateTagById,
  deleteTagById: deleteTagById,
  deleteTagsByPlaylistId: deleteTagsByPlaylistId
};
