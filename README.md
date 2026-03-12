# Mini Spotify Playlist Manager

A simple playlist web app built with Node.js, Express.js, MongoDB, Mongoose, and EJS.

## Features

- View all playlists
- Add a playlist
- Open one playlist and view its songs
- Add a song to a playlist
- Delete a song
- Delete a playlist

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- EJS

## Project Structure

```text
controllers/
  playlistController.js
models/
  playlistModel.js
  songModel.js
routes/
  playlistRoutes.js
views/
  common/
    header.ejs
  add-playlist.ejs
  add-song.ejs
  home.ejs
  playlist-detail.ejs
  playlist-list.ejs
server.js
package.json
```

## Routes

- `GET /` redirects to `/playlists`
- `GET /playlists` shows all playlists
- `GET /playlists/add` shows the add playlist form
- `POST /playlists/add` saves a playlist
- `GET /playlists/:id` shows one playlist and its songs
- `POST /playlists/:id/delete` deletes a playlist
- `GET /playlists/:id/songs/add` shows the add song form
- `POST /playlists/:id/songs/add` saves a song
- `POST /playlists/:id/songs/:songId/delete` deletes a song

## Setup

1. Make sure MongoDB is running.
2. Install dependencies with `npm install`.
3. Set `MONGODB_URI` if you do not want to use the default local database.
4. Run `npm start`.
5. Open `http://localhost:3000`.
