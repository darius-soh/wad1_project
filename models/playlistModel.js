const mongoose = require("mongoose");

// Define the fields that every playlist document should store in MongoDB.
// Mongoose uses this schema as the blueprint for validation and saved structure.
const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true 
    },
    description: {
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

// Create the Playlist model from the schema.
// This model gives us helper methods such as find(), create(), update(), and delete().
const Playlist = mongoose.model("Playlist", playlistSchema);

// Moving onto our Model functions

// getAllPlaylists: returns all playlist documents that belong to a specific user
// Playlist.find({ userId: userId })
// The find() method in Mongoose queries the Playlist collection for all documents
// where the userId field matches the given userId.
function getAllPlaylists(userId) {
    return Playlist.find({userId: userId}); 
}

// Find one playlist document by its MongoDB _id value.
// The controller uses this before showing, editing, or deleting one playlist.
function getPlaylistById(id) {
    return Playlist.findById(id);
}

// Create and insert one new playlist document into MongoDB.
// The controller prepares the data object and passes it into this function.
function createPlaylist(data) {
    return Playlist.create(data); 
}

// Delete a playlist by its MongoDB ID
// findByIdAndDelete() method is used to find and remove 
// a single document from a MongoDB collection by its _id field.
// findByIdAndDelete(id): Fetches the document and deletes it in one operation, 
// returning the original document. Ideal when you need to confirm what was deleted 
// or act on its data afterward.
// deleteOne(filter), on the other hand, simply deletes the first document matching 
// the criteria and returns a success status (count).
function deletePlaylistById(id) {
    return Playlist.findByIdAndDelete(id); 
}

// Find one playlist by ID and update the fields we pass in the data object.
// This changes the saved document instead of creating a new one.
function updatePlaylistById(id, data) {
    return Playlist.findByIdAndUpdate(id, data)
}

module.exports = {
  getAllPlaylists: getAllPlaylists,
  getPlaylistById: getPlaylistById,
  createPlaylist: createPlaylist,
  deletePlaylistById: deletePlaylistById,
  updatePlaylistById: updatePlaylistById
};
