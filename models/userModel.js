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
    const passwordHash = await bcrypt.hash(password, 10);
    return User.create({username, passwordHash});
}

// Validate password to fit requirement.
function isValidPassword(password){

  // Ensures password is at least 8 characters long.
  if (password.length<8){
    return false;
  }

  // Initialise flags to all false, to check for these conditions.
  let hasLower = false;
  let hasUpper = false;
  let hasDigit = false;
  let hasSymbol = false;

  for (let char of password){

    // Check if lowercase letter is present using unicode value.
    if (char >= "a" && char <= "z") hasLower = true;

    // Check if uppercase letter is present using unicode value.
    else if (char >= "A" && char <= "Z") hasUpper = true;

    // Check if digit is present using unicode value.
    else if (char >= "0" && char <= "9") hasDigit = true;

    // Check if symbol is present.
    else if ("@!#$%^&*".includes(char)) hasSymbol = true;
  }

  // Return true if password match all conditions.
  return hasLower && hasUpper && hasDigit && hasSymbol;
}

// Change password. 
function changePassword(username, passwordHash){
    return User.updateOne({username:username}, {passwordHash:passwordHash})
}

module.exports = {
  User,
  getUserByUsername,
  createUser,
  changePassword,
  isValidPassword
};

