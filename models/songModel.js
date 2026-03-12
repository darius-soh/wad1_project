const mongoose = require("mongoose");

// Song schema.
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

// Song model.
const Song = mongoose.model("Song", songSchema);

// Get all songs for one playlist.
async function getSongsByPlaylistId(playlistId) {
  // Return every song linked to the selected playlist.
  return await Song.find({ playlistId: playlistId });
}

// Get one song by ID.
async function getSongById(id) {
  // Find one song using its MongoDB ID.
  return await Song.findById(id);
}

// Create one song.
async function createSong(data) {
  // Insert a new song document.
  return await Song.create(data);
}

// Delete one song by ID.
async function deleteSongById(id) {
  // Remove the matching song document.
  return await Song.findByIdAndDelete(id);
}

module.exports = {
  getSongsByPlaylistId: getSongsByPlaylistId,
  getSongById: getSongById,
  createSong: createSong,
  deleteSongById: deleteSongById
};
