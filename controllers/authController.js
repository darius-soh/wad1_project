const bcrypt = require("bcryptjs");

const userModel = require("../models/userModel");

function renderRegister(res, options = {}) {
  res.render("auth/register", {
    title: "Register",
    error: options.error || null,
    formData: {
      username: options.formData?.username || ""
    }
  });
}

function renderLogin(res, options = {}) {
  res.render("auth/login", {
    title: "Login",
    error: options.error || null,
    formData: {
      username: options.formData?.username || ""
    }
  });
}

function showRegister(req, res) {
  if (req.session.user) {
    return res.redirect("/playlists");
  }

  return renderRegister(res);
}

async function register(req, res, next) {
  try {
    if (req.session.user) {
      return res.redirect("/playlists");
    }

    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (!username || !password.trim()) {
      return renderRegister(res, {
        error: "Username and password are required.",
        formData: { username }
      });
    }

    const existingUser = await userModel.findUserByUsername(username);

    if (existingUser) {
      return renderRegister(res, {
        error: "That username is already taken.",
        formData: { username }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await userModel.createUser({ username, passwordHash });

    req.session.user = {
      id: newUser.id,
      username: newUser.username
    };
    req.session.flash = {
      type: "success",
      text: "Account created successfully."
    };

    return res.redirect("/playlists");
  } catch (error) {
    return next(error);
  }
}

function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect("/playlists");
  }

  return renderLogin(res);
}

async function login(req, res, next) {
  try {
    if (req.session.user) {
      return res.redirect("/playlists");
    }

    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (!username || !password.trim()) {
      return renderLogin(res, {
        error: "Username and password are required.",
        formData: { username }
      });
    }

    const user = await userModel.findUserByUsername(username);

    if (!user) {
      return renderLogin(res, {
        error: "Invalid username or password.",
        formData: { username }
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return renderLogin(res, {
        error: "Invalid username or password.",
        formData: { username }
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username
    };
    req.session.flash = {
      type: "success",
      text: "Logged in successfully."
    };

    return res.redirect("/playlists");
  } catch (error) {
    return next(error);
  }
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    return res.redirect("/login");
  });
}

module.exports = {
  showRegister,
  register,
  showLogin,
  login,
  logout
};
