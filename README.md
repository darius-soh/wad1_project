# Mini Spotify Playlist Manager

A full-stack web application that lets users create and manage playlists, songs, reviews, liked songs, and custom genres in one place.

It includes user registration, login, session-based authentication, and CRUD features built with Express, EJS, and MongoDB.

## 📁 Project Structure

```text
wad_proj/
├── controllers/
│   ├── genreController.js
│   ├── likedSongController.js
│   ├── playlistController.js
│   ├── reviewController.js
│   ├── songController.js
│   └── userController.js
├── middleware/
│   └── auth-middleware.js
├── models/
│   ├── genreModel.js
│   ├── likedSongModel.js
│   ├── playlistModel.js
│   ├── reviewModel.js
│   ├── songModel.js
│   └── userModel.js
├── routes/
│   ├── genreRoutes.js
│   ├── likedSongRoutes.js
│   ├── playlistRoutes.js
│   ├── reviewRoutes.js
│   ├── songRoutes.js
│   └── userRoutes.js
├── views/
│   ├── auth/
│   │   ├── change-password.ejs
│   │   ├── login.ejs
│   │   └── register.ejs
│   ├── common/
│   │   └── header.ejs
│   ├── errors/
│   │   └── 404.ejs
│   ├── genres/
│   │   ├── add-genre.ejs
│   │   ├── edit-genre.ejs
│   │   └── genre-list.ejs
│   ├── liked-songs/
│   │   ├── add-liked-song.ejs
│   │   ├── edit-liked-song.ejs
│   │   └── liked-song-list.ejs
│   ├── playlists/
│   │   ├── add-playlist.ejs
│   │   ├── edit-playlist.ejs
│   │   ├── playlist-detail.ejs
│   │   └── playlist-list.ejs
│   ├── reviews/
│   │   ├── add-review.ejs
│   │   ├── edit-review.ejs
│   │   └── review-list.ejs
│   └── songs/
│       ├── add-song.ejs
│       ├── edit-song.ejs
│       └── song-list.ejs
├── config.env.example
├── index.html
├── package-lock.json
├── package.json
├── README.md
└── server.js
```

## How to set up the application

1. Download or extract the submitted project files into one folder.
2. Open a terminal in the project root folder.
3. Install the required Node.js packages:

```bash
npm install
```

4. Create a `config.env` file in the project root.
5. Add the following environment variables to `config.env`:

```env
DB=your_mongodb_connection_string
SECRET=your_session_secret
```

## How to run the application

1. Start the server from the project root:

```bash
npm start
```

2. Once the server starts, open the application in your browser:

```text
http://localhost:8000/index.html
```

3. You can also access the login page directly at:

```text
http://localhost:8000/login
```

## Username/password details

- There is no default username or password included in this project.
- Create your own account through the registration page:

```text
http://localhost:8000/register
```

- Password requirements:
  At least 8 characters, with at least one uppercase letter, one lowercase letter, one digit, and one symbol.


## Team Contributions

| Member   | Feature      | Files |
|----------|-------------|-------|
| Jonathan | Playlist    | `models/playlistModel.js`, `controllers/playlistController.js`, `routes/playlistRoutes.js`, `views/playlists/` |
| Uyen     | Songs       | `models/songModel.js`, `controllers/songController.js`, `routes/songRoutes.js`, `views/songs/` |
| Darius   | Reviews     | `models/reviewModel.js`, `controllers/reviewController.js`, `routes/reviewRoutes.js`, `views/reviews/` |
| Faith    | User, Liked Songs | `models/userModel.js`, `controllers/userController.js`, `routes/userRoutes.js`, `views/auth/`, `models/likedSongModel.js`, `controllers/likedSongController.js`, `routes/likedSongRoutes.js`, `views/liked-songs/` |
| Shannon  | Genre       | `models/genreModel.js`, `controllers/genreController.js`, `routes/genreRoutes.js`, `views/genres/` |