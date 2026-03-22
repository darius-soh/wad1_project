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
    },
    // userId: stores the MongoDB ObjectId of the user who owns this playlist
    // type: mongoose.Schema.Types.ObjectId
    //   This means the value must be a MongoDB ObjectId, not a normal string or number.
    // ref: "User"
    //   This tells Mongoose that this ObjectId points to the User model.
    //   In other words, userId should contain the _id of a user document.
    // required: true
    //   Ensures that every playlist must be linked to a user.  
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

// Create the Playlist model from the schema 
const Playlist = mongoose.model("Playlist", playlistSchema);

// Moving onto our Model functions

// getAllPlaylists: returns all playlist documents that belong to a specific user
// Playlist.find({ userId: userId })
// The find() method in Mongoose queries the Playlist collection for all documents
// where the userId field matches the given userId.
// It returns a Mongoose Query object, which 
// supports chaining additional operations like sorting, limiting, and filtering.
function getAllPlaylists(userId) {
    return Playlist.find({userId: userId}); 
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