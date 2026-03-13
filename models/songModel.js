const mongoose = require("mongoose");

// Define the structure of a song document.
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
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String
  },
  playlistId: {
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
const Song = mongoose.model("Song", songSchema);

// Return all songs belonging to a specific playlist.
function getSongsByPlaylistId(playlistId) {
  return Song.find({ playlistId: playlistId });
}

// Return a single song by its MongoDB ID.
function getSongById(id) {
  return Song.findById(id);
}

// Insert a new song document.
function createSong(data) {
  return Song.create(data);
}

// Delete a song by its MongoDB ID.
function deleteSongById(id) {
  return Song.findByIdAndDelete(id);
}

module.exports = {
  getSongsByPlaylistId: getSongsByPlaylistId,
  getSongById: getSongById,
  createSong: createSong,
  deleteSongById: deleteSongById
};