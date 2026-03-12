const mongoose = require("mongoose");

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

const Song = mongoose.models.Song || mongoose.model("Song", songSchema);

async function getSongsByPlaylistId(playlistId) {
  return await Song.find({ playlistId: playlistId });
}

async function getSongById(id) {
  return await Song.findById(id);
}

async function createSong(data) {
  return await Song.create(data);
}

async function deleteSongById(id) {
  return await Song.findByIdAndDelete(id);
}

module.exports = {
  getSongsByPlaylistId: getSongsByPlaylistId,
  getSongById: getSongById,
  createSong: createSong,
  deleteSongById: deleteSongById
};
