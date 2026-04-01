## Architecture Overview (MVC Pattern)

```text
Browser Request
      |
      v
  server.js   (entry point: loads env, middleware, routes, connects MongoDB)
      |
      v
  routes/     (URL mapping: decides which controller handles the request)
      |
      v
middleware/   (auth guard: blocks unauthenticated users before controller runs)
      |
      v
controllers/  (business logic: validates input, checks ownership, renders responses)
      |
      v
  models/     (database layer: all Mongoose queries live here)
      |
      v
  MongoDB     (actual data storage)
      |
      v
  views/      (EJS templates rendered by controllers and sent back to the browser)
```

---

## Startup And Route Mounting

```text
server.js
  -> load config.env with dotenv
  -> configure express.urlencoded(), express.json(), express.static()
  -> configure EJS view engine
  -> configure express-session
  -> mount "/" -> userRoutes
  -> mount "/playlists" -> playlistRoutes
  -> mount "/songs" -> songRoutes
  -> mount "/genres" -> genreRoutes
  -> mount "/reviews" -> reviewRoutes
  -> mount "/liked-songs" -> likedSongRoutes
  -> redirect any unknown route to /login
  -> connect to MongoDB
  -> start server at http://localhost:8000
```

---

## Run The Project

```text
1. Copy config.env.example to config.env
2. Fill in:
   DB=your MongoDB connection string
   SECRET=your session secret
3. npm install
4. npm start
```

---

## Routing Diagram

```text
localhost:8000
|
|-- /
|   |-- GET /                  -> redirect to /playlists if logged in, otherwise /login
|   |-- GET /login             -> [logged-out only] userController.loginGet -> views/auth/login.ejs
|   |-- POST /login            -> [logged-out only] userController.loginPost
|   |-- GET /register          -> [logged-out only] userController.registerGet -> views/auth/register.ejs
|   |-- POST /register         -> [logged-out only] userController.registerPost
|   |-- GET /change-password   -> [auth] userController.changePasswordGet -> views/auth/change-password.ejs
|   |-- POST /change-password  -> [auth] userController.changePasswordPost
|   `-- GET /logout            -> [auth] userController.logout
|
|-- /playlists                 -> [auth on every route in playlistRoutes.js]
|   |-- GET  /                 -> playlistController.listPlaylists -> views/playlists/playlist-list.ejs
|   |-- GET  /add              -> playlistController.showAddPlaylistForm -> views/playlists/add-playlist.ejs
|   |-- POST /add              -> playlistController.createPlaylist
|   |-- GET  /view?id=...      -> playlistController.showPlaylist -> views/playlists/playlist-detail.ejs
|   |-- GET  /edit?playlistId=... -> playlistController.showEditPlaylist -> views/playlists/edit-playlist.ejs
|   |-- POST /edit             -> playlistController.editPlaylist
|   `-- POST /delete           -> playlistController.deletePlaylist
|
|-- /songs                     -> [auth on every route in songRoutes.js]
|   |-- GET  /                 -> songController.listSongs -> views/songs/song-list.ejs
|   |-- GET  /add?playlistId=... -> songController.showAddSongForm -> views/songs/add-song.ejs
|   |-- POST /add              -> songController.createSong
|   |-- GET  /edit?songId=...  -> songController.showEditSongForm -> views/songs/edit-song.ejs
|   |-- POST /edit             -> songController.editSong
|   `-- POST /delete           -> songController.deleteSong
|
|-- /genres                    -> [auth on every route in genreRoutes.js]
|   |-- GET  /                 -> genreController.listGenres -> views/genres/genre-list.ejs
|   |-- GET  /add              -> genreController.showAddGenreForm -> views/genres/add-genre.ejs
|   |-- POST /add              -> genreController.createGenre
|   |-- GET  /edit?genreId=... -> genreController.showEditGenreForm -> views/genres/edit-genre.ejs
|   |-- POST /edit             -> genreController.editGenre
|   `-- POST /delete           -> genreController.deleteGenre
|
|-- /reviews                   -> [auth on every route in reviewRoutes.js]
|   |-- GET  /                 -> reviewController.listReviews -> views/reviews/review-list.ejs
|   |-- GET  /add?songId=...   -> reviewController.showAddReviewForm -> views/reviews/add-review.ejs
|   |-- POST /add              -> reviewController.createReview
|   |-- GET  /edit?reviewId=... -> reviewController.showEditReviewForm -> views/reviews/edit-review.ejs
|   |-- POST /edit             -> reviewController.editReview
|   `-- POST /delete           -> reviewController.deleteReview
|
`-- /liked-songs               -> [auth on every route in likedSongRoutes.js]
    |-- GET  /                 -> likedSongController.listLikedSongs -> views/liked-songs/liked-song-list.ejs
    |-- GET  /add?songId=...   -> likedSongController.showAddLikedSongForm -> views/liked-songs/add-liked-song.ejs
    |-- POST /add              -> likedSongController.createLikedSong
    |-- GET  /edit?likedSongId=... -> likedSongController.showEditLikedSongForm -> views/liked-songs/edit-liked-song.ejs
    |-- POST /edit             -> likedSongController.editLikedSong
    `-- POST /delete           -> likedSongController.deleteLikedSong

[auth] = authMiddleware.isLoggedIn runs first and redirects to /login if req.session.user does not exist
[logged-out only] = authMiddleware.isLoggedOut runs first and redirects logged-in users to /playlists
```

---

## Data Relationships

```text
User
  -> owns many Playlists
  -> owns many Genres
  -> owns many Reviews
  -> owns many LikedSongs

Playlist
  -> belongs to one User
  -> has many Songs

Song
  -> belongs to one Playlist
  -> can have many Reviews
  -> can have many LikedSongs

Review
  -> belongs to one User
  -> belongs to one Song

LikedSong
  -> belongs to one User
  -> points to one Song
```

---

## Auth (Users)

### Register

```text
GET /register
  -> render views/auth/register.ejs with empty values

POST /register
  -> req.body: { username, password }
  -> if username or password missing -> re-render register.ejs with "Username and password are required."
  -> User.getUserByUsername(username)          [MongoDB: findOne]
  -> if username already exists -> re-render register.ejs with "Username taken"
  -> User.isValidPassword(password)            [must be 8+ chars with upper, lower, digit, symbol from @!#$%^&*]
  -> if invalid -> re-render register.ejs with validation error
  -> User.createUser(username, password)       [bcrypt.hash -> MongoDB insert]
  -> redirect /login
```

### Login

```text
GET /login
  -> render views/auth/login.ejs with empty values

POST /login
  -> req.body: { username, password }
  -> if username or password missing -> re-render login.ejs with "Username and password are required."
  -> User.getUserByUsername(username)          [MongoDB: findOne]
  -> if not found -> re-render login.ejs with "User not found."
  -> bcrypt.compare(password, user.passwordHash)
  -> if password mismatch -> re-render login.ejs with "Incorrect Password."
  -> req.session.user = { id, username }
  -> redirect /playlists
```

### Change Password

```text
GET /change-password   [auth]
  -> render views/auth/change-password.ejs

POST /change-password  [auth]
  -> req.body: { oldPassword, newPassword, confirmPassword }
  -> if any field is missing -> re-render with "All password fields are required."
  -> if newPassword !== confirmPassword -> re-render with "Passwords do not match"
  -> User.isValidPassword(newPassword)
  -> if invalid -> re-render with password rule error
  -> if oldPassword === newPassword -> re-render with "New password cannot be the same as the old password"
  -> User.getUserByUsername(req.session.user.username)   [MongoDB: findOne]
  -> if user not found -> re-render with "User not found."
  -> bcrypt.compare(oldPassword, user.passwordHash)
  -> if old password mismatch -> re-render with "Old password is incorrect"
  -> bcrypt.hash(newPassword, 10)
  -> User.changePassword(req.session.user.username, passwordHash)   [MongoDB: updateOne]
  -> req.session.destroy()
  -> redirect /login
```

### Logout

```text
GET /logout   [auth]
  -> req.session.destroy()
  -> redirect /login
```

---

## Playlists

### Read (List)

```text
GET /playlists   [auth]
  -> req.query: { sortType? }
  -> playlistModel.getAllPlaylists(req.session.user.id)  [MongoDB: find { userId }]
  -> if sortType is "A-Z" or "Z-A" -> sort in memory by playlist name
  -> render views/playlists/playlist-list.ejs
```

### Read (Detail)

```text
GET /playlists/view?id=...&search=...   [auth]
  -> req.query.id identifies the playlist
  -> playlistModel.getPlaylistById(playlistId)         [MongoDB: findById]
  -> confirm playlist.userId matches req.session.user.id
  -> songModel.getSongsByPlaylistId(playlistId)        [MongoDB: find { playlistId }]
  -> if search exists -> filter songs in memory by song.title
  -> render views/playlists/playlist-detail.ejs
```

### Create

```text
GET /playlists/add   [auth]
  -> render views/playlists/add-playlist.ejs with empty formData

POST /playlists/add  [auth]
  -> req.body: { name, description }
  -> if either field is missing -> re-render with "All fields are required."
  -> playlistModel.createPlaylist({ name, description, userId })   [MongoDB: insert]
  -> redirect /playlists/view?id=<new playlist id>
```

### Update

```text
GET /playlists/edit?playlistId=...   [auth]
  -> playlistModel.getPlaylistById(playlistId)         [MongoDB: findById]
  -> confirm ownership
  -> render views/playlists/edit-playlist.ejs with current values

POST /playlists/edit   [auth]
  -> req.body: { playlistId, name, description }
  -> playlistModel.getPlaylistById(playlistId)         [MongoDB: findById]
  -> confirm ownership
  -> if either field is missing -> re-render with "All fields are required."
  -> playlistModel.updatePlaylistById(playlistId, { name, description })   [MongoDB: findByIdAndUpdate]
  -> redirect /playlists/view?id=<playlistId>
```

### Delete

```text
POST /playlists/delete   [auth]
  -> req.body: { playlistId }
  -> playlistModel.getPlaylistById(playlistId)         [MongoDB: findById]
  -> confirm ownership
  -> songModel.getSongsByPlaylistId(playlistId)        [MongoDB: find songs in playlist]
  -> for each song:
       reviewModel.deleteReviewsBySongId(song._id)     [MongoDB: deleteMany]
       likedSongModel.deleteLikedSongsBySongId(song._id) [MongoDB: deleteMany]
       songModel.deleteSongById(song._id)              [MongoDB: findByIdAndDelete]
  -> playlistModel.deletePlaylistById(playlistId)      [MongoDB: findByIdAndDelete]
  -> redirect /playlists
```

---

## Songs

### Read (List)

```text
GET /songs?genre=...   [auth]
  -> playlistModel.getAllPlaylists(userId)             [MongoDB: find user's playlists]
  -> for each playlist -> songModel.getSongsByPlaylistId(playlist._id)
  -> genreModel.getAllGenres(userId)                   [MongoDB: find custom genres]
  -> merge default genres + custom genres
     default genres = Pop, Rock, Hip-Hop, Jazz, Classical, Lo-fi, R&B
  -> if genre query exists -> filter songs in memory by exact genre match
  -> render views/songs/song-list.ejs
```

### Create

```text
GET /songs/add?playlistId=...   [auth]
  -> loadUserPlaylists(userId)                         [MongoDB]
  -> loadGenreNames(userId, "")                        [default genres + custom genres]
  -> render views/songs/add-song.ejs with empty formData or a pre-selected playlist

POST /songs/add   [auth]
  -> req.body: { playlistId, title, artist, album, genre }
  -> loadUserPlaylists(userId)
  -> findPlaylistById(playlists, playlistId)           [ownership check]
  -> if playlist missing -> re-render with "Playlist not found."
  -> if title, artist, album, or genre missing -> re-render with validation error
  -> songModel.createSong({ playlistId, title, artist, album, genre })   [MongoDB: insert]
  -> redirect /playlists/view?id=<playlistId>
```

### Update

```text
GET /songs/edit?songId=...   [auth]
  -> loadUserPlaylists(userId)                         [MongoDB]
  -> loadGenreNames(userId, "")                        [default genres + custom genres]
  -> songModel.getSongById(songId)                     [MongoDB: findById]
  -> findPlaylistForSong(song, playlists)              [ownership check]
  -> render views/songs/edit-song.ejs with current values

POST /songs/edit   [auth]
  -> req.body: { songId, playlistId, title, artist, album, genre }
  -> loadUserPlaylists(userId)
  -> loadGenreNames(userId, genre)
  -> songModel.getSongById(songId)                     [MongoDB: findById]
  -> findPlaylistForSong(existingSong, playlists)      [current ownership check]
  -> findPlaylistById(playlists, playlistId)           [new playlist ownership check]
  -> if playlist or song invalid -> re-render with error
  -> if title, artist, album, or genre missing -> re-render with validation error
  -> songModel.updateSongById(songId, { playlistId, title, artist, album, genre })   [MongoDB: findByIdAndUpdate]
  -> redirect /playlists/view?id=<playlistId>
```

### Delete

```text
POST /songs/delete   [auth]
  -> req.body: { songId }
  -> songModel.getSongById(songId)                     [MongoDB: findById]
  -> loadUserPlaylists(userId)
  -> findPlaylistForSong(song, playlists)              [ownership check]
  -> reviewModel.deleteReviewsBySongId(songId)         [MongoDB: deleteMany]
  -> likedSongModel.deleteLikedSongsBySongId(songId)   [MongoDB: deleteMany]
  -> songModel.deleteSongById(songId)                  [MongoDB: findByIdAndDelete]
  -> redirect /songs
```

---

## Genres

### Read (List)

```text
GET /genres   [auth]
  -> genreModel.getAllGenres(userId)                  [MongoDB: find { userId }]
  -> render views/genres/genre-list.ejs
```

### Create

```text
GET /genres/add   [auth]
  -> buildEmptyGenreFormData()
  -> render views/genres/add-genre.ejs

POST /genres/add   [auth]
  -> req.body: { name, description }
  -> if either field is missing -> re-render with "All fields are required."
  -> genreModel.createGenre({ name, description, userId })   [MongoDB: insert]
  -> redirect /genres
```

### Update

```text
GET /genres/edit?genreId=...   [auth]
  -> genreModel.getGenreById(genreId)                  [MongoDB: findById]
  -> confirm ownership with req.session.user.id
  -> render views/genres/edit-genre.ejs with current values

POST /genres/edit   [auth]
  -> req.body: { genreId, name, description }
  -> genreModel.getGenreById(genreId)                  [MongoDB: findById]
  -> confirm ownership
  -> if either field is missing -> re-render with "All fields are required."
  -> genreModel.updateGenreById(genreId, { name, description })   [MongoDB: findByIdAndUpdate]
  -> redirect /genres
```

### Delete

```text
POST /genres/delete   [auth]
  -> req.body: { genreId }
  -> genreModel.getGenreById(genreId)                  [MongoDB: findById]
  -> confirm ownership
  -> genreModel.deleteGenreById(genreId)               [MongoDB: findByIdAndDelete]
  -> redirect /genres
```

---

## Reviews

### Read (List)

```text
GET /reviews   [auth]
  -> reviewModel.getAllReviews(userId)                [MongoDB: find { userId }]
  -> loadUserPlaylists(userId)                        [MongoDB]
  -> loadUserSongs(playlists)                         [MongoDB]
  -> attachSongDetailsToReviews(reviews, songs)       [adds songTitle and playlistName for display]
  -> render views/reviews/review-list.ejs
```

### Create

```text
GET /reviews/add?songId=...   [auth]
  -> loadUserPlaylists(userId)
  -> loadUserSongs(playlists)
  -> buildEmptyReviewFormData(songId)
  -> render views/reviews/add-review.ejs

POST /reviews/add   [auth]
  -> req.body: { songId, title, comment, rating }
  -> loadUserPlaylists(userId)
  -> loadUserSongs(playlists)
  -> findSongById(songs, songId)                      [ownership check]
  -> if song missing -> re-render with "Song not found."
  -> if any field is missing -> re-render with "All fields are required."
  -> convert rating to Number
  -> if rating is NaN or outside 1 to 5 -> re-render with "Rating must be a number from 1 to 5."
  -> reviewModel.createReview({ songId, title, comment, rating, userId })   [MongoDB: insert]
  -> redirect /reviews
```

### Update

```text
GET /reviews/edit?reviewId=...   [auth]
  -> loadUserPlaylists(userId)
  -> loadUserSongs(playlists)
  -> reviewModel.getReviewById(reviewId)              [MongoDB: findById]
  -> confirm review ownership
  -> confirm the linked song is still one of the user's songs
  -> render views/reviews/edit-review.ejs with current values

POST /reviews/edit   [auth]
  -> req.body: { reviewId, songId, title, comment, rating }
  -> loadUserPlaylists(userId)
  -> loadUserSongs(playlists)
  -> reviewModel.getReviewById(reviewId)              [MongoDB: findById]
  -> confirm review ownership
  -> findSongById(songs, songId)                      [new song ownership check]
  -> if any field is missing -> re-render with "All fields are required."
  -> convert rating to Number
  -> if rating is NaN or outside 1 to 5 -> re-render with validation error
  -> reviewModel.updateReviewById(reviewId, { songId, title, comment, rating })   [MongoDB: findByIdAndUpdate]
  -> redirect /reviews
```

### Delete

```text
POST /reviews/delete   [auth]
  -> req.body: { reviewId }
  -> reviewModel.getReviewById(reviewId)              [MongoDB: findById]
  -> confirm ownership
  -> reviewModel.deleteReviewById(reviewId)           [MongoDB: findByIdAndDelete]
  -> redirect /reviews
```

---

## Liked Songs

### Read (List)

```text
GET /liked-songs   [auth]
  -> likedSongModel.getAllLikedSongs(userId)          [MongoDB: find { userId }]
  -> loadUserPlaylists(userId)                        [MongoDB]
  -> loadUserSongs(playlists)                         [MongoDB]
  -> attachSongDetailsToLikedSongs(likedSongs, songs) [adds song title, artist, album, genre, playlist name]
  -> render views/liked-songs/liked-song-list.ejs
```

### Create

```text
GET /liked-songs/add?songId=...   [auth]
  -> loadUserPlaylists(userId)
  -> loadUserSongs(playlists)
  -> buildEmptyLikedSongFormData(songId)
  -> render views/liked-songs/add-liked-song.ejs

POST /liked-songs/add   [auth]
  -> req.body: { songId, note }
  -> loadUserPlaylists(userId)
  -> loadUserSongs(playlists)
  -> findSongById(songs, songId)                      [ownership check]
  -> if song missing -> re-render with "Song not found."
  -> if note missing -> re-render with "All fields are required."
  -> likedSongModel.getLikedSongByUserAndSong(userId, songId)   [MongoDB: duplicate check]
  -> if duplicate exists -> re-render with "This song is already in your liked songs list."
  -> likedSongModel.createLikedSong({ songId, note, userId })   [MongoDB: insert]
  -> redirect /liked-songs
```

### Update

```text
GET /liked-songs/edit?likedSongId=...   [auth]
  -> loadUserPlaylists(userId)
  -> loadUserSongs(playlists)
  -> likedSongModel.getLikedSongById(likedSongId)      [MongoDB: findById]
  -> confirm liked song ownership
  -> confirm linked song is still one of the user's songs
  -> render views/liked-songs/edit-liked-song.ejs with current values

POST /liked-songs/edit   [auth]
  -> req.body: { likedSongId, songId, note }
  -> loadUserPlaylists(userId)
  -> loadUserSongs(playlists)
  -> likedSongModel.getLikedSongById(likedSongId)      [MongoDB: findById]
  -> confirm liked song ownership
  -> findSongById(songs, songId)                       [song ownership check]
  -> if note missing -> re-render with "All fields are required."
  -> likedSongModel.getLikedSongByUserAndSong(userId, songId)   [duplicate check]
  -> allow duplicate only when it is the same liked song record
  -> likedSongModel.updateLikedSongById(likedSongId, { songId, note })   [MongoDB: findByIdAndUpdate]
  -> redirect /liked-songs
```

### Delete

```text
POST /liked-songs/delete   [auth]
  -> req.body: { likedSongId }
  -> likedSongModel.getLikedSongById(likedSongId)      [MongoDB: findById]
  -> confirm ownership
  -> likedSongModel.deleteLikedSongById(likedSongId)   [MongoDB: findByIdAndDelete]
  -> redirect /liked-songs
```
