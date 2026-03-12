const mongoose = require("mongoose");

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

const Playlist = mongoose.model("Playlist", playlistSchema);

async function getAllPlaylists() {
  return await Playlist.find();
}

async function getPlaylistById(id) {
  return await Playlist.findById(id);
}

async function createPlaylist(data) {
  return await Playlist.create(data);
}

async function deletePlaylistById(id) {
  return await Playlist.findByIdAndDelete(id);
}

module.exports = {
  getAllPlaylists: getAllPlaylists,
  getPlaylistById: getPlaylistById,
  createPlaylist: createPlaylist,
  deletePlaylistById: deletePlaylistById
};
