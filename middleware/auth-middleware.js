// Route Protection Middleware.
// Middleware functions run before the controller and can allow or block access.

// Checks if there's a user stored in session else display an error and redirect to /login.
exports.isLoggedIn = (req, res, next) => {
    // req.session.user is created after a successful login.
    // If it does not exist, the current request should not continue to protected pages.
    if (!req.session.user){
        console.error('Error: User access denied')
        return res.redirect("/login");
    } 

    next();
}

// Stops logged-in users from opening login/register pages again.
exports.isLoggedOut = (req, res, next) => {
    // If a session already exists, there is no need to show login/register again.
    if (req.session.user) {
        return res.redirect("/playlists");
    }

    // If there is no logged-in user, allow the request to continue.
    next();
}
