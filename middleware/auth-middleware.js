// Route Proection Middleware.

// Checks if there's a user stored in session else display an error and redirect to /login.
exports.isLoggedIn = (req, res, next) => {
    if (!req.session.user){
        console.error('Error: User access denied')
        return res.redirect("/login");
    } 
    next();
}

// Stops logged-in users from opening login/register pages again.
exports.isLoggedOut = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/playlists");
    }
    next();
}
