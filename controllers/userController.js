const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// Show the login page with empty fields.
// This only opens the page and does not check any password yet.
exports.loginGet = (req,res) => {
    res.render("login", {
      username: "",
      password: "",
      user: null,
      error: null
    });
};

// Read the submitted login form, find the user, and compare the password hash.
// If the login is valid, store a small user object inside the session.
exports.loginPost = async (req,res) => {
    // Read the username and password from the submitted form.
    const {username,password} = req.body;

    // Find the user document in MongoDB by username.
    // If no document is found, the login cannot continue.
    const user = await User.getUserByUsername(username);
    if (!user){
        return res.render("login", {
          username, 
          password:"", 
          user: null, 
          error:"User not found."
        });
    }

    // Compare the plain password from the form with the saved password hash.
    // bcrypt.compare() is used because the app stores hashed passwords, not plain passwords.
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        // Password mismatch means the username exists but the password is wrong.
        // Show the login page again with an error message.
        return res.render("login", {
          username, 
          password:"", 
          user: null, 
          error: "Incorrect Password."
        });
    }

    // Save a small user object in the session after a successful login.
    // Protected routes will later check req.session.user to see if the user is authenticated.
    req.session.user = {
        id: user._id,
        username: user.username,
    }

    // Redirect to the playlists page after login.
    // The session now exists, so protected routes will allow access.
    res.redirect("/playlists")
};

// Show the registration page with empty fields.
// This only opens the form and does not save anything yet.
exports.registerGet = (req,res) => {
    res.render("register", {
      username:"", 
      user: null, 
      password:"", 
      error:null
    });
};

// Read the submitted registration form, validate it, and create a new user account.
// If something is invalid, show the same page again with an error message.
exports.registerPost = async (req,res) => {
    const {username, password} = req.body;

    // Check if the username already exists.
    // This prevents two different users from sharing the same username.
    const existingUser = await User.getUserByUsername(username);
    if (existingUser) {
        return res.render("register", {
          username: "",
          password: "",
          user: null,
          error: "Username taken"
        })
    } 

    // Check password validity using the rules inside the user model.
    // Keeping the rules in one place makes them easier to reuse.
    if (!User.isValidPassword(password)){
      return res.render("register", {
        username: username,
        password: "",
        user: null,
        error: "Password must be at least 8 characters and include uppercase, lowercase, digit and symbol."
      })
    }

    // Create the new user document in MongoDB.
    // The model hashes the password before it is saved.
    await User.createUser(username, password);

    // Redirect to the login page after successful registration.
    res.redirect("/login");
};

// Show the change password page.
// This page is only available after the user is already logged in.
exports.changePasswordGet = (req, res) => {
  res.render("change-password", {
    title: "Change Password",
    user: req.session.user,
    error: ""
  });
};

// Read the submitted password form, validate it, and update the stored password hash.
// This route is protected, so only a logged-in user can reach it.
exports.changePasswordPost = async (req, res) => {
  // Read the three password fields from the submitted form.
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Check if the new password matches the confirmation field.
  // This avoids saving a password different from what the user typed the second time.
  if (newPassword !== confirmPassword) {
    return res.render("change-password", {
      title: "Change Password",
      user: req.session.user,
      error: "Passwords do not match"
    });
  }

  // Check the validity of the new password.
  // The user model contains the password rules for length and character types.
  if (!User.isValidPassword(newPassword)){
    return res.render("change-password", {
      title: "Change Password",
      user: req.session.user,
      error: "Password must be at least 8 characters and include uppercase, lowercase, digit and symbol."
    }); 
  }

  // Prevent the new password from being exactly the same as the old password.
  // This keeps the password change meaningful.
  if (oldPassword === newPassword) {
    return res.render("change-password", {
      title: "Change Password",
      user: req.session.user,
      error: "New password cannot be the same as the old password"
    });
  }

  // Load the current user document from MongoDB.
  // We need the saved password hash to verify the old password.
  const user = await User.getUserByUsername(req.session.user.username);
  
  // Check if the old password is correct.
  // The user must prove they know the current password before it can be changed.
  const match = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!match) {
    return res.render("change-password", {
      title: "Change Password",
      user: req.session.user,
      error: "Old password is incorrect"
    });
  }

  // Hash the new password before saving it.
  // The original plain password is never stored in the database.
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Save the new password hash to MongoDB.
  // The model updates the passwordHash field for this user.
  await User.changePassword(req.session.user.username, passwordHash);

  // Destroy the session after the password is changed.
  // Once the session is cleared, send the user back to the login page.
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

// Destroy the current session and send the user back to the login page.
// After this, protected routes will treat the user as logged out.
exports.logout = (req,res) =>{
    req.session.destroy(()=>{
        res.redirect("/login");
    });
};
