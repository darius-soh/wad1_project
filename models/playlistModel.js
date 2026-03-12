const mongoose = require("mongoose");

// Playlist schema.
const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Playlist model.
const Playlist = mongoose.model("Playlist", playlistSchema);

// Get all playlists.
async function getAllPlaylists() {
  // Return every playlist document.
  return await Playlist.find();
}

// Get one playlist by ID.
async function getPlaylistById(id) {
  // Find a single playlist using its MongoDB ID.
  return await Playlist.findById(id);
}

// Create one playlist.
async function createPlaylist(data) {
  // Insert a new playlist document.
  return await Playlist.create(data);
}

// Delete one playlist by ID.
async function deletePlaylistById(id) {
  // Remove the matching playlist document.
  return await Playlist.findByIdAndDelete(id);
}

module.exports = {
  getAllPlaylists: getAllPlaylists,
  getPlaylistById: getPlaylistById,
  createPlaylist: createPlaylist,
  deletePlaylistById: deletePlaylistById
};
