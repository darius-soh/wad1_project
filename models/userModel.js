const mongoose = require('mongoose');

const bcrypt = require('bcrypt');

// Define the structure of a user document.
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  // Store the hashed password, never the original.
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);

// Return a single user by their username.
function getUserByUsername(username) {
  return User.findOne({ username: username });
}

// Insert a new user document.
async function createUser (username, password){
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    return User.create({username, passwordHash});
}

// Change password. 
function changePassword(username, passwordHash){
    return User.updateOne({username:username}, {passwordHash:passwordHash})
}

module.exports = {
  User,
  getUserByUsername: getUserByUsername,
  createUser: createUser,
  changePassword: changePassword
};

