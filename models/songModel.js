const mongoose = require("mongoose");

// Define the fields that every song document should store in MongoDB.
// Mongoose uses this schema as the blueprint for validation and saved structure.
const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  album: {
    type: String,
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  playlistId: {
// type: mongoose.Schema.Types.ObjectId
// This means the value must be a MongoDB ObjectId, not a normal string or number.
// MongoDB automatically gives every document an _id, and that _id is usually an ObjectId.

// ref: "Playlist"
// This tells Mongoose that this ObjectId points to the Playlist model.
// In other words, playlistId should contain the _id of a playlist document.
    type: mongoose.Schema.Types.ObjectId,
    ref: "Playlist",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the Song model from the schema.
// This model gives us helper methods such as find(), create(), update(), and delete().
const Song = mongoose.model("Song", songSchema);

// Find all songs whose playlistId matches one playlist.
// Controllers use this when they need songs linked to a selected playlist.
function getSongsByPlaylistId(playlistId) {
  return Song.find({ playlistId: playlistId });
}

// Find one song document by its MongoDB _id value.
// This is used before showing, editing, or deleting a specific song.
function getSongById(id) {
  return Song.findById(id);
}

// Create and insert one new song document into MongoDB.
// The controller builds the data object and passes it into this function.
function createSong(data) {
  return Song.create(data);
}

// Find one song by ID and update the fields we pass in the data object.
// This updates the saved document instead of creating a new one.
function updateSongById(id, data) {
  return Song.findByIdAndUpdate(id, data);
}

// Find one song by ID and remove it from MongoDB.
// After this runs, the song document no longer exists in the collection.
function deleteSongById(id) {
  return Song.findByIdAndDelete(id);
}

module.exports = {
  getSongsByPlaylistId: getSongsByPlaylistId,
  getSongById: getSongById,
  createSong: createSong,
  updateSongById: updateSongById,
  deleteSongById: deleteSongById
};
