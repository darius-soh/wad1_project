const mongoose = require('mongoose');

const bcrypt = require('bcrypt');

// Define the fields that every user document should store in MongoDB.
// Mongoose uses this schema as the blueprint for validation and saved structure.
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

// Create the User model from the schema.
// This model gives us helper methods such as findOne(), create(), and updateOne().
const User = mongoose.model("User", userSchema);

// Find one user document by username.
// The login and registration flow uses this to check whether the user exists.
function getUserByUsername(username) {
  return User.findOne({
    username: username
  });
}

// Hash the submitted password and create one new user document in MongoDB.
// Storing passwordHash is safer than storing the original password itself.
async function createUser(username, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  return User.create({
    username: username,
    passwordHash: passwordHash
  });
}

// Check whether the submitted password follows the project's rules.
// Keeping the validation here makes the same rules reusable in the controller.
function isValidPassword(password) {

  // Ensures password is at least 8 characters long.
  if (password.length < 8) {
    return false;
  }

  // Initialise flags to all false, to check for these conditions.
  let hasLower = false;
  let hasUpper = false;
  let hasDigit = false;
  let hasSymbol = false;

  for (let char of password) {

    // Check if lowercase letter is present using unicode value.
    if (char >= "a" && char <= "z") {
      hasLower = true;
    }

    // Check if uppercase letter is present using unicode value.
    else if (char >= "A" && char <= "Z") {
      hasUpper = true;
    }

    // Check if digit is present using unicode value.
    else if (char >= "0" && char <= "9") {
      hasDigit = true;
    }

    // Check if symbol is present.
    else if ("@!#$%^&*".includes(char)) {
      hasSymbol = true;
    }
  }

  // Return true if password match all conditions.
  return hasLower && hasUpper && hasDigit && hasSymbol;
}

// Update the saved password hash for one user.
// The controller already creates the new hash before calling this function.
function changePassword(username, passwordHash) {
  return User.updateOne(
    {
      username: username
    },
    {
      passwordHash: passwordHash
    }
  );
}

module.exports = {
  User,
  getUserByUsername,
  createUser,
  changePassword,
  isValidPassword
};

