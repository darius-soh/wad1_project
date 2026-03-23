const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// Show the login page with empty fields
exports.loginGet = (req,res) => {
    res.render("login", {username:"", password: "", user: null, error:null});
};

// Find user in the database by username
exports.loginPost = async (req,res) => {
    const {username,password} = req.body;
    // Find user in the database by username
    const user = await User.getUserByUsername(username);
    if (!user){
        return res.render("login", {username, password:"", user: null, error:"User not found."});
    }
    // Compare entered password with hashed password in DB
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match){
      // Password mismatch → render login page with error
        return res.render("login", {username, password:"", user: null, error: "Incorrect Password."});
    }

    // Login successful → save user info in session
    req.session.user = {
        id: user._id,
        username: user.username,
    }
    // Redirect to playlists page after login
    res.redirect("/playlists")
};

// Show empty registration form
exports.registerGet = (req,res) => {
    res.render("register", {username:"", user: null, password:"", error:null})
};

exports.registerPost = async (req,res) => {
    const {username, password} = req.body;
    // Check if username already exists
    const existingUser = await User.getUserByUsername(username);
    if (existingUser){
        return res.render("register", {username:"", password:"", user: null, error:"Username taken"})
    } 

    // Check password validity
    if (!User.isValidPassword(password)){
      return res.render("register", {username, password:"", user:null, error:"Password must be at least 8 characters and include uppercase, lowercase, digit and symbol."})
    }

    // Create new user in DB
    await User.createUser(username, password);
    // Redirect to login page after successful registration
    res.redirect("/login");
};

// Show change password page
exports.changePasswordGet = (req, res) => {
  res.render("change-password", {title: "Change Password", user: req.session.user, error: "", success: "" });
};

// Handle password change but ONLY if user is logged-in
exports.changePasswordPost = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;


  // Check if new password matches confirmation
  if (newPassword !== confirmPassword) {
    return res.render("change-password", {title: "Change Password", user: req.session.user, error: "Passwords do not match", success: "" });
  }

  // Check validity of new password 
    if (!User.isValidPassword(newPassword)){
      return res.render("change-password", 
        {title: "Change Password", user: req.session.user, error: "Password must be at least 8 characters and include uppercase, lowercase, digit and symbol.", success: "" }); 
    }


  // Prevent user from changing to the same password
  if (oldPassword === newPassword) {
  return res.render("change-password", {
    title: "Change Password",
    user: req.session.user,
    error: "New password cannot be the same as the old password",
    success: ""
  });
}
  // Get user data from DB
  const user = await User.getUserByUsername(req.session.user.username);
  
  // Check if old password is correct
  const match = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!match) {
    return res.render("change-password", {title: "Change Password", user: req.session.user, error: "Old password is incorrect", success: "" });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Save new password to DB
  await User.changePassword(req.session.user.username, passwordHash);

  // Destroy session after password change (log user out)
  req.session.destroy(() => {
    // Render success message and let browser handle redirect
    // user is null because session destroyed
    res.render("change-password", {
      title: "Change Password",
      user: null, 
      error: "",
      success: "Password changed successfully! Redirecting to login..."
    });
  });
};

// Clears session when user logs out.
exports.logout = (req,res) =>{
    req.session.destroy(()=>{
        res.redirect("/login");
    });
};