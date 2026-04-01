const mongoose = require("mongoose");

// Define the fields that every liked song document should store in MongoDB.
// Mongoose uses this schema as the blueprint for validation and saved structure.
const likedSongSchema = new mongoose.Schema({
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
    required: true
  },
  note: {
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

// Create the LikedSong model from the schema.
// This model gives us helper methods such as find(), create(), update(), and delete().
const LikedSong = mongoose.model("LikedSong", likedSongSchema);

// Find all liked song documents where userId matches the logged-in user.
// The controller uses this to build the liked songs list page.
function getAllLikedSongs(userId) {
  return LikedSong.find({ userId: userId });
}

// Find one liked song document by its MongoDB _id value.
// This is used before editing or deleting one selected liked song.
function getLikedSongById(id) {
  return LikedSong.findById(id);
}

// Find one liked song using both the userId and songId values.
// The controller uses this to stop duplicate likes for the same song and user.
function getLikedSongByUserAndSong(userId, songId) {
  return LikedSong.findOne({
    userId: userId,
    songId: songId
  });
}

// Create and insert one new liked song document into MongoDB.
// The controller prepares the data object and passes it into this function.
function createLikedSong(data) {
  return LikedSong.create(data);
}

// Find one liked song by ID and update the fields we pass in the data object.
// This changes the saved document instead of creating a new one.
function updateLikedSongById(id, data) {
  return LikedSong.findByIdAndUpdate(id, data);
}

// Find one liked song by ID and remove it from MongoDB.
// After this runs, the liked song document no longer exists in the collection.
function deleteLikedSongById(id) {
  return LikedSong.findByIdAndDelete(id);
}

// Delete every liked song entry that points to one song.
// Controllers use this when a song is deleted from the system.
function deleteLikedSongsBySongId(songId) {
  return LikedSong.deleteMany({ songId: songId });
}

module.exports = {
  getAllLikedSongs: getAllLikedSongs,
  getLikedSongById: getLikedSongById,
  getLikedSongByUserAndSong: getLikedSongByUserAndSong,
  createLikedSong: createLikedSong,
  updateLikedSongById: updateLikedSongById,
  deleteLikedSongById: deleteLikedSongById,
  deleteLikedSongsBySongId: deleteLikedSongsBySongId
};