# Playlist App MVP

A beginner-friendly music playlist web app built with Node.js, Express, EJS, and file-based JSON storage.

## Features

- Register and log in with session-based authentication
- View all playlists
- Create playlists
- Open a playlist page
- Add songs to a playlist
- Leave ratings and reviews on songs
- Delete songs from playlists you created
- Delete playlists you created

## Tech Stack

- Node.js
- Express
- EJS
- express-session
- bcryptjs
- uuid
- fs/promises

## Project Structure

```text
controllers/
  authController.js
  playlistController.js
data/
  playlists.json
  users.json
models/
  playlistModel.js
  userModel.js
routes/
  authRoutes.js
  playlistRoutes.js
utils/
  jsonStorage.js
views/
  auth/
    login.ejs
    register.ejs
  partials/
    footer.ejs
    header.ejs
  playlists/
    create.ejs
    index.ejs
    show.ejs
package.json
server.js
```

## Setup

1. Run `npm install`
2. Run `node server.js`
3. Open `http://localhost:3000`
4. Register a new account and start testing the app

## Notes

- The app starts with one seeded demo playlist in `data/playlists.json`
- User data and playlist data are stored in JSON files inside the `data/` folder
- No CSS or frontend framework is used
