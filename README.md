# Mini Spotify Playlist Manager

## Overview

Mini Spotify Playlist Manager is a server-rendered Node.js web application built with Express, MongoDB, Mongoose, EJS, and session-based authentication.

The project is designed to be simple enough for students who are learning backend development, while still showing a clean modular architecture:

- `routes/` decides which controller function should run
- `controllers/` handles request logic and validation
- `models/` handles MongoDB operations through Mongoose
- `views/` renders HTML pages with EJS
- `middleware/` contains reusable route protection logic

This codebase currently includes:

- user registration and login
- session-based authentication
- playlist CRUD
- song CRUD
- genre CRUD
- review CRUD
- tag CRUD

## Learning Goals

This repository is a useful study example for the following topics:

- Express routing
- controller-model-view separation
- session authentication
- route protection with middleware
- MongoDB document design with Mongoose
- linking documents using `ObjectId`
- rendering dynamic pages with EJS
- handling forms with `GET` and `POST`
- validating input before saving to the database

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- EJS
- express-session
- bcrypt
- dotenv

## Application Architecture

The application follows a modular backend structure.

### 1. Entry Point

The application starts in [server.js](/c:/wad1_project/server.js).

`server.js` is responsible for:

- loading environment variables from `config.env`
- creating the Express server
- enabling form parsing with `express.urlencoded()`
- enabling JSON parsing with `express.json()`
- serving static files from `public/`
- setting EJS as the view engine
- creating session support with `express-session`
- mounting route modules
- connecting to MongoDB
- starting the server on `localhost:8000`

### 2. Route Layer

The files in `routes/` define URL endpoints.

Each route file groups related URLs together:

- [userRoutes.js](/c:/wad1_project/routes/userRoutes.js)
- [playlistRoutes.js](/c:/wad1_project/routes/playlistRoutes.js)
- [songRoutes.js](/c:/wad1_project/routes/songRoutes.js)
- [genreRoutes.js](/c:/wad1_project/routes/genreRoutes.js)
- [reviewRoutes.js](/c:/wad1_project/routes/reviewRoutes.js)
- [tagRoutes.js](/c:/wad1_project/routes/tagRoutes.js)

The route layer does not directly talk to the database.
Its job is to receive a URL and pass control to the correct controller function.

### 3. Controller Layer

The files in `controllers/` contain the main application logic.

A controller usually does these steps:

1. read data from `req.query`, `req.body`, or `req.session`
2. validate the input
3. call one or more model functions
4. decide what to send back
5. either render an EJS page or redirect to another route

Controllers used in this project:

- [userController.js](/c:/wad1_project/controllers/userController.js)
- [playlistController.js](/c:/wad1_project/controllers/playlistController.js)
- [songController.js](/c:/wad1_project/controllers/songController.js)
- [genreController.js](/c:/wad1_project/controllers/genreController.js)
- [reviewController.js](/c:/wad1_project/controllers/reviewController.js)
- [tagController.js](/c:/wad1_project/controllers/tagController.js)

### 4. Model Layer

The files in `models/` define MongoDB schemas and reusable data-access functions.

Each model has two responsibilities:

- define the shape of the document using a Mongoose schema
- expose helper functions such as `find`, `create`, `update`, and `delete`

Models used in this project:

- [userModel.js](/c:/wad1_project/models/userModel.js)
- [playlistModel.js](/c:/wad1_project/models/playlistModel.js)
- [songModel.js](/c:/wad1_project/models/songModel.js)
- [genreModel.js](/c:/wad1_project/models/genreModel.js)
- [reviewModel.js](/c:/wad1_project/models/reviewModel.js)
- [tagModel.js](/c:/wad1_project/models/tagModel.js)

### 5. View Layer

The files in `views/` are EJS templates.

They receive data from controllers and turn that data into HTML.

Important view files include:

- [views/common/header.ejs](/c:/wad1_project/views/common/header.ejs)
- playlist pages such as [playlist-list.ejs](/c:/wad1_project/views/playlist-list.ejs) and [playlist-detail.ejs](/c:/wad1_project/views/playlist-detail.ejs)
- add/edit pages for each module
- login and register pages

## Project Structure

```text
.
├── controllers/
│   ├── genreController.js
│   ├── playlistController.js
│   ├── reviewController.js
│   ├── songController.js
│   ├── tagController.js
│   └── userController.js
├── middleware/
│   └── auth-middleware.js
├── models/
│   ├── genreModel.js
│   ├── playlistModel.js
│   ├── reviewModel.js
│   ├── songModel.js
│   ├── tagModel.js
│   └── userModel.js
├── public/
│   └── images/
├── routes/
│   ├── genreRoutes.js
│   ├── playlistRoutes.js
│   ├── reviewRoutes.js
│   ├── songRoutes.js
│   ├── tagRoutes.js
│   └── userRoutes.js
├── views/
│   ├── common/
│   │   └── header.ejs
│   ├── add-genre.ejs
│   ├── add-playlist.ejs
│   ├── add-review.ejs
│   ├── add-song.ejs
│   ├── add-tag.ejs
│   ├── change-password.ejs
│   ├── edit-genre.ejs
│   ├── edit-playlist.ejs
│   ├── edit-review.ejs
│   ├── edit-song.ejs
│   ├── edit-tag.ejs
│   ├── genre-list.ejs
│   ├── login.ejs
│   ├── playlist-detail.ejs
│   ├── playlist-list.ejs
│   ├── register.ejs
│   ├── review-list.ejs
│   ├── song-detail.ejs
│   ├── song-list.ejs
│   └── tag-list.ejs
├── config.env
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Environment Variables

The application expects the following values in `config.env`:

- `DB`
  The MongoDB connection string used by Mongoose in [server.js](/c:/wad1_project/server.js).

- `SECRET`
  The session secret used by `express-session` to sign session cookies.

Example structure:

```env
DB=your_mongodb_connection_string
SECRET=your_session_secret
```

## How the App Starts

The startup order in [server.js](/c:/wad1_project/server.js) is:

1. load environment variables
2. create the Express app
3. register middleware
4. register route modules
5. connect to MongoDB
6. start listening on port `8000`

This order matters.
For example, routes need sessions and body parsing to already be configured before requests start coming in.

## Authentication and Session Flow

Authentication is handled with:

- [userController.js](/c:/wad1_project/controllers/userController.js)
- [userModel.js](/c:/wad1_project/models/userModel.js)
- [userRoutes.js](/c:/wad1_project/routes/userRoutes.js)
- [auth-middleware.js](/c:/wad1_project/middleware/auth-middleware.js)

### Registration

When the user registers:

1. the browser sends `POST /register`
2. the route sends the request to `userController.registerPost`
3. the controller checks whether the username already exists
4. the controller checks password rules using `User.isValidPassword()`
5. `userModel.createUser()` hashes the password with `bcrypt`
6. the new user document is saved in MongoDB
7. the browser is redirected to `/login`

### Login

When the user logs in:

1. the browser sends `POST /login`
2. the controller finds the user by username
3. the controller compares the plaintext password with the saved hash using `bcrypt.compare()`
4. if valid, the controller stores a small user object in `req.session.user`
5. the browser is redirected to `/playlists`

### Route Protection

Most routes are protected by [auth-middleware.js](/c:/wad1_project/middleware/auth-middleware.js).

There are two middleware functions:

- `isLoggedIn`
  Only allows access if `req.session.user` exists.

- `isLoggedOut`
  Prevents logged-in users from opening login/register pages again.

This means:

- protected modules like playlists, songs, genres, reviews, and tags can only be used after login
- login and register are only for users who are not already logged in

## Data Model and Relationships

This project uses six main collections.

### 1. User

Defined in [userModel.js](/c:/wad1_project/models/userModel.js)

Fields:

- `username`
- `passwordHash`
- `createdAt`

Purpose:

- stores account identity
- stores hashed password only, never plaintext password

### 2. Playlist

Defined in [playlistModel.js](/c:/wad1_project/models/playlistModel.js)

Fields:

- `name`
- `description`
- `createdAt`
- `userId`

Purpose:

- stores playlists created by one user
- links each playlist back to its owner through `userId`

### 3. Song

Defined in [songModel.js](/c:/wad1_project/models/songModel.js)

Fields:

- `title`
- `artist`
- `album`
- `genre`
- `playlistId`
- `createdAt`

Purpose:

- stores songs that belong to one playlist
- stores one genre value for each song
- links each song to its parent playlist through `playlistId`

### 4. Genre

Defined in [genreModel.js](/c:/wad1_project/models/genreModel.js)

Fields:

- `name`
- `description`
- `userId`
- `createdAt`

Purpose:

- stores custom genre values for one user
- helps populate song genre dropdowns and song filters

Important note:

- songs store `genre` as a plain string
- the genre module is used to manage the list of possible genre names

### 5. Review

Defined in [reviewModel.js](/c:/wad1_project/models/reviewModel.js)

Fields:

- `title`
- `comment`
- `rating`
- `songId`
- `userId`
- `createdAt`

Purpose:

- stores standalone reviews for songs
- links each review to one song through `songId`

### 6. Tag

Defined in [tagModel.js](/c:/wad1_project/models/tagModel.js)

Fields:

- `name`
- `description`
- `playlistId`
- `userId`
- `createdAt`

Purpose:

- stores labels attached to playlists
- links each tag to one playlist through `playlistId`

### Relationship Summary

```text
User
├── Playlists
│   ├── Songs
│   │   └── Reviews
│   └── Tags
└── Genres
```

In other words:

- one user can own many playlists
- one playlist can contain many songs
- one song can have many reviews
- one playlist can have many tags
- one user can create many genres

## CRUD Modules

This project demonstrates five independent CRUD-style content modules plus user authentication:

- Playlist
- Song
- Genre
- Review
- Tag

Each module has:

- a route file
- a controller file
- a model file
- EJS pages for list/add/edit and sometimes detail pages

## Route Reference

### User Routes

Mounted at `/` in [userRoutes.js](/c:/wad1_project/routes/userRoutes.js)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Redirect to `/playlists` if logged in, otherwise `/login` |
| `GET` | `/login` | Show login page |
| `POST` | `/login` | Process login |
| `GET` | `/register` | Show register page |
| `POST` | `/register` | Process registration |
| `GET` | `/change-password` | Show change password page |
| `POST` | `/change-password` | Process password change |
| `GET` | `/logout` | Destroy session and log out |

### Playlist Routes

Mounted at `/playlists` in [playlistRoutes.js](/c:/wad1_project/routes/playlistRoutes.js)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/playlists` | Show all playlists |
| `GET` | `/playlists/add` | Show add playlist form |
| `POST` | `/playlists/add` | Save new playlist |
| `GET` | `/playlists/view?id=...` | Show one playlist and its songs |
| `GET` | `/playlists/edit?playlistId=...` | Show edit playlist form |
| `POST` | `/playlists/edit` | Update playlist |
| `POST` | `/playlists/delete` | Delete playlist |

### Song Routes

Mounted at `/songs` in [songRoutes.js](/c:/wad1_project/routes/songRoutes.js)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/songs` | Show all songs owned by the user |
| `GET` | `/songs/add` | Show add song form |
| `POST` | `/songs/add` | Save new song |
| `GET` | `/songs/view?id=...` | Show one song |
| `GET` | `/songs/edit?songId=...` | Show edit song form |
| `POST` | `/songs/edit` | Update song |
| `POST` | `/songs/delete` | Delete song |

### Genre Routes

Mounted at `/genres` in [genreRoutes.js](/c:/wad1_project/routes/genreRoutes.js)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/genres` | Show all genres |
| `GET` | `/genres/add` | Show add genre form |
| `POST` | `/genres/add` | Save new genre |
| `GET` | `/genres/edit?genreId=...` | Show edit genre form |
| `POST` | `/genres/edit` | Update genre |
| `POST` | `/genres/delete` | Delete genre |

### Review Routes

Mounted at `/reviews` in [reviewRoutes.js](/c:/wad1_project/routes/reviewRoutes.js)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/reviews` | Show all reviews |
| `GET` | `/reviews/add` | Show add review form |
| `POST` | `/reviews/add` | Save new review |
| `GET` | `/reviews/edit?reviewId=...` | Show edit review form |
| `POST` | `/reviews/edit` | Update review |
| `POST` | `/reviews/delete` | Delete review |

### Tag Routes

Mounted at `/tags` in [tagRoutes.js](/c:/wad1_project/routes/tagRoutes.js)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/tags` | Show all tags |
| `GET` | `/tags/add` | Show add tag form |
| `POST` | `/tags/add` | Save new tag |
| `GET` | `/tags/edit?tagId=...` | Show edit tag form |
| `POST` | `/tags/edit` | Update tag |
| `POST` | `/tags/delete` | Delete tag |

## How a Request Flows Through the App

One of the most important ideas in this codebase is the route-controller-model flow.

### Example 1: Add a Genre

1. The user opens `/genres/add`
2. [genreRoutes.js](/c:/wad1_project/routes/genreRoutes.js) matches `GET /add`
3. Express calls `genreController.showAddGenreForm`
4. The controller renders `add-genre.ejs`
5. The user submits the form
6. The browser sends `POST /genres/add`
7. The route calls `genreController.createGenre`
8. The controller reads `req.body.name` and `req.body.description`
9. The controller validates the data
10. The controller calls `genreModel.createGenre(...)`
11. The model inserts a new document into MongoDB
12. The controller redirects to `/genres`
13. The browser sends a new `GET /genres`
14. The list page reloads with the new genre included

### Example 2: Login

1. The user opens `/login`
2. [userRoutes.js](/c:/wad1_project/routes/userRoutes.js) matches `GET /login`
3. `userController.loginGet` renders `login.ejs`
4. The user submits the form
5. The browser sends `POST /login`
6. `userController.loginPost` reads the username and password
7. `userModel.getUserByUsername()` loads the user document
8. `bcrypt.compare()` checks the password
9. If valid, the controller saves user info in `req.session.user`
10. The controller redirects to `/playlists`

### Example 3: Delete a Playlist

Deleting a playlist is a good example because it involves related data.

1. The user submits the delete form on a playlist page
2. The browser sends `POST /playlists/delete`
3. `playlistController.deletePlaylist` receives `req.body.playlistId`
4. The controller checks that the playlist exists and belongs to the current user
5. The controller loads all songs for that playlist
6. For each song, the controller deletes its reviews
7. The controller deletes the songs
8. The controller deletes all tags linked to the playlist
9. The controller deletes the playlist itself
10. The browser is redirected to `/playlists`

This flow shows how controllers coordinate multiple models when one action affects related collections.

## Controller Responsibilities by Module

### userController.js

Main responsibilities:

- show login page
- process login
- show register page
- process registration
- show change password page
- process password change
- log out user

### playlistController.js

Main responsibilities:

- show all playlists
- sort playlists
- show add playlist page
- create playlist
- show one playlist with its songs
- show edit playlist page
- update playlist
- delete playlist and related child data

Special note:

- this controller now keeps playlists simple and treats them mainly as containers for songs

### songController.js

Main responsibilities:

- show all songs for the user
- filter songs by genre
- show one song
- show add song form
- create song
- show edit song form
- update song
- delete song

Special note:

- this controller checks whether each song belongs to one of the user's playlists before allowing access

### genreController.js

Main responsibilities:

- show all genres
- show add genre page
- create genre
- show edit genre page
- update genre
- delete genre

Special note:

- genres are user-specific
- the song controller reuses genre names as selectable song values

### reviewController.js

Main responsibilities:

- show all reviews
- show add review form
- create review
- show edit review form
- update review
- delete review

Special note:

- reviews belong to songs
- the controller loads both songs and playlists so the list page can display richer information

### tagController.js

Main responsibilities:

- show all tags
- show add tag form
- create tag
- show edit tag form
- update tag
- delete tag

Special note:

- tags belong to playlists
- the controller attaches playlist names to tag objects before rendering the list page

## How EJS Pages Work in This Project

EJS allows controllers to send JavaScript values into HTML templates.

For example, a controller might do:

```js
return res.render("genre-list", {
  title: "All Genres",
  user: req.session.user,
  genres: genres,
  error: ""
});
```

That means:

- Express looks for `views/genre-list.ejs`
- EJS receives the values `title`, `user`, `genres`, and `error`
- the page can use `<%= %>` and `<% %>` to show content conditionally

This project uses one shared include:

- [header.ejs](/c:/wad1_project/views/common/header.ejs)

That file is included at the top of many pages to avoid repeating the same heading and links.

## Validation Patterns Used in the Project

Across the controllers, the code follows the same basic pattern:

1. read the submitted input
2. trim whitespace
3. check for missing required fields
4. check ownership where needed
5. check numeric ranges where needed
6. re-render the form if there is an error
7. save to the database if all checks pass
8. redirect after success

Examples:

- password rules in [userModel.js](/c:/wad1_project/models/userModel.js)
- rating validation in review controllers
- ownership checks using `userId`
- playlist ownership checks before creating tags or songs

## Why Redirects Are Used After Successful POST Requests

Many controllers use:

```js
return res.redirect("/some-route");
```

instead of rendering directly after a successful create, update, or delete.

This is useful because:

- it avoids duplicate form submission if the user refreshes the page
- it creates a clean request cycle
- it reloads data from the database again
- it keeps the URL meaningful

This is a common pattern sometimes called Post/Redirect/Get.

## Beginner-Friendly Reading Order

If you are opening this repository for the first time, this is a good reading order:

1. [server.js](/c:/wad1_project/server.js)
2. [routes/userRoutes.js](/c:/wad1_project/routes/userRoutes.js)
3. [controllers/userController.js](/c:/wad1_project/controllers/userController.js)
4. [models/userModel.js](/c:/wad1_project/models/userModel.js)
5. [routes/playlistRoutes.js](/c:/wad1_project/routes/playlistRoutes.js)
6. [controllers/playlistController.js](/c:/wad1_project/controllers/playlistController.js)
7. [models/playlistModel.js](/c:/wad1_project/models/playlistModel.js)
8. [models/songModel.js](/c:/wad1_project/models/songModel.js)
9. one full EJS page, such as [playlist-list.ejs](/c:/wad1_project/views/playlist-list.ejs)
10. then continue with songs, genres, reviews, and tags

This order helps you understand:

- how a request enters the app
- how it reaches a controller
- how the controller reaches the model
- how the result is finally rendered in EJS

## Setup Instructions

### Prerequisites

Make sure you have:

- Node.js installed
- npm installed
- MongoDB available locally or through a cloud connection string

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create or update `config.env` with:

```env
DB=your_mongodb_connection_string
SECRET=your_session_secret
```

3. Start the application:

```bash
npm start
```

4. Open the browser at:

```text
http://localhost:8000
```

## Scripts

Defined in [package.json](/c:/wad1_project/package.json):

- `npm start`
  Starts the application with `node server.js`

## Notes for Students

- This project intentionally keeps the backend logic explicit rather than overly compact.
- Many helper functions are written in a straightforward style so beginners can follow the flow.
- EJS pages are intentionally simple and server-rendered.
- The project uses sessions rather than JWT or frontend frameworks.
- Relationships are handled manually in controllers, which is educational because it shows clearly what happens when linked data is created or deleted.

## Possible Future Improvements

If this project were extended further, some possible improvements would be:

- add automated tests
- add stronger duplicate checks for genre/tag names
- add search or filter support for songs, tags, or reviews
- add pagination for larger datasets
- add better error pages
- add stronger delete confirmations or cascade helper services

## Summary

This project demonstrates:

- modular routing
- controller-based request handling
- model-based database access
- EJS rendering
- session authentication
- CRUD across several related modules

Implenting a MVC format:
**browser -> route -> controller -> model -> database -> controller -> EJS page or redirect**
