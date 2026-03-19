const mongoose = require("mongoose");

// Define the structure of a playlist document 
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

// Create the Playlist model from the schema 
const Playlist = mongoose.model("Playlist", playlistSchema);

// Moving onto our Model functions

// Return all playlist documents 
// The find() method in Mongoose is used to query documents from a collection. 
// It returns a Mongoose Query object, which 
// supports chaining additional operations like sorting, limiting, and filtering.
function getAllPlaylists() {
    return Playlist.find(); 
}

// Return a single playlist by its MongoDB ID.
function getPlaylistById(id) {
    return Playlist.findById(id);
}

// Insert a new playlist document 
// We use it to create a document in 
// the database using the Model.create()
function createPlaylist(data) {
    return Playlist.create(data); 
}

// Delete a playlist by its MongoDB ID
// findByIdAndDelete() method is used to find and remove 
// a single document from a MongoDB collection by its _id field.
function deletePlaylistById(id) {
    return Playlist.findByIdAndDelete(id); 
}

module.exports = {
  getAllPlaylists: getAllPlaylists,
  getPlaylistById: getPlaylistById,
  createPlaylist: createPlaylist,
  deletePlaylistById: deletePlaylistById
};