const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const playlistModel = require("../models/playlistModel");

exports.loginGet = (req,res) => {
    res.render("login", {username:"", password: "", user: null, error:null});
};

exports.loginPost = async (req,res) => {
    const {username,password} = req.body;
    const user = await User.getUserByUsername(username);
    if (!user){
        return res.render("login", {username, password:"", user: null, error:"User not found."});
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match){
        return res.render("login", {username, password:"", user: null, error: "Incorrect Password."});
    }

    // Set user session upon logging-in. 
    req.session.user = {
        id: user._id,
        username: user.username,
    }
    res.redirect("/welcome")
};

exports.registerGet = (req,res) => {
    res.render("register", {username:"", user: null, password:"", error:null})
};

exports.registerPost = async (req,res) => {
    const {username, password} = req.body;
    const existingUser = await User.getUserByUsername(username);
    if (existingUser){
        return res.render("register", {username:"", password:"", user: null, error:"Username taken"})
    } 
    await User.createUser(username, password);
    res.redirect("/login");
};

// Show change password page
exports.changePasswordGet = (req, res) => {
  res.render("change-password", {title: "Change Password", user: req.session.user, error: "", success: "" });
};

// Handle password change but ONLY if user is logged-in
exports.changePasswordPost = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.render("change-password", {title: "Change Password", user: req.session.user, error: "Passwords do not match", success: "" });
  }

  if (oldPassword === newPassword) {
  return res.render("change-password", {
    title: "Change Password",
    user: req.session.user,
    error: "New password cannot be the same as the old password",
    success: ""
  });
}

  const user = await User.getUserByUsername(req.session.user.username);
  const match = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!match) {
    return res.render("change-password", {title: "Change Password", user: req.session.user, error: "Old password is incorrect", success: "" });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await User.changePassword(req.session.user.username, passwordHash);

  // Instead of immediately redirecting, destroy the session first
  req.session.destroy(() => {
    // Render success message and let browser handle redirect
    res.render("change-password", {
      title: "Change Password",
      user: null, // user is gone since session destroyed
      error: "",
      success: "Password changed successfully! Redirecting to login..."
    });
  });
};

exports.welcome = async (req, res) => {
  try {
    // Get playlists of the logged-in user
    const playlists = await playlistModel.getAllPlaylists(req.session.user.id);

    // Render the welcome page with user info and their playlists
    res.render("welcome", {
      title: "Welcome " + req.session.user.username,
      user: req.session.user,
      playlists: playlists,
      error: ""
    });
  } catch (error) {
    console.error(error);
    res.render("welcome", {
      title: "Welcome",
      user: req.session.user,
      playlists: [],
      error: "Could not load playlists."
    });
  }
};

// Clears session when user logs out.
exports.logout = (req,res) =>{
    req.session.destroy(()=>{
        res.redirect("/login");
    });
};