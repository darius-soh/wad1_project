### Architecture Overview (MVC Pattern)

`Browser Request
      |
      v
  server.js  (entry point — loads env, middleware, routes, connects MongoDB)
      |
      v
  routes/    (URL mapping — decides which controller handles the request)
      |
      v
middleware/  (auth guard — blocks unauthenticated users before controller runs)
      |
      v
controllers/ (business logic — reads/writes data, renders the response)
      |
      v
  models/    (database layer — all Mongoose queries live here)
      |
      v
  MongoDB    (actual data storage)
      |
      v
  views/     (EJS templates — rendered by controllers, sent back to browser)`

---

### Routing Diagram

`localhost:8000
│
├── /users
│   ├── GET  /register         → userController.showRegisterForm  → register.ejs
│   ├── POST /register         → userController.register
│   ├── GET  /login            → userController.showLoginForm      → login.ejs
│   ├── POST /login            → userController.login
│   ├── GET  /logout           → userController.logout
│   └── POST /change-password  → [auth] → userController.changePassword → change-password.ejs
│
├── /playlists
│   ├── GET  /                 → playlistController.listPlaylists  → playlist-list.ejs
│   ├── GET  /add              → [auth] → showAddPlaylistForm       → add-playlist.ejs
│   ├── POST /add              → [auth] → createPlaylist
│   ├── GET  /detail           → showPlaylist                      → playlist-detail.ejs
│   ├── GET  /edit             → [auth] → showEditPlaylist          → edit-playlist.ejs
│   ├── POST /edit             → [auth] → editPlaylist
│   └── POST /delete           → [auth] → deletePlaylist (cascades → songs → reviews → liked songs)
│
├── /songs
│   ├── GET  /                 → songController.listSongs          → song-list.ejs
│   ├── GET  /add              → [auth] → showAddSongForm           → add-song.ejs
│   │                                     (calls Spotify API for search)
│   ├── POST /add              → [auth] → createSong
│   ├── GET  /detail           → showSong                          → song-detail.ejs
│   ├── GET  /edit             → [auth] → showEditSong              → edit-song.ejs
│   ├── POST /edit             → [auth] → editSong
│   └── POST /delete           → [auth] → deleteSong (cascades → reviews → liked songs)
│
├── /genres
│   ├── GET  /                 → genreController.listGenres        → genre-list.ejs
│   ├── GET  /add              → [auth] → showAddGenreForm          → add-genre.ejs
│   ├── POST /add              → [auth] → createGenre
│   ├── GET  /edit             → [auth] → showEditGenre             → edit-genre.ejs
│   ├── POST /edit             → [auth] → editGenre
│   └── POST /delete           → [auth] → deleteGenre
│
├── /reviews
│   ├── GET  /                 → [auth] → reviewController.listReviews → review-list.ejs
│   ├── GET  /add              → [auth] → showAddReviewForm             → add-review.ejs
│   ├── POST /add              → [auth] → createReview
│   ├── GET  /edit             → [auth] → showEditReview                → edit-review.ejs
│   ├── POST /edit             → [auth] → editReview
│   └── POST /delete           → [auth] → deleteReview
│
└── /liked-songs
    ├── GET  /                 → [auth] → likedSongController.listLikedSongs → liked-song-list.ejs
    ├── GET  /add              → [auth] → showAddLikedSongForm               → add-liked-song.ejs
    ├── POST /add              → [auth] → createLikedSong (duplicate check)
    ├── GET  /edit             → [auth] → showEditLikedSongForm               → edit-liked-song.ejs
    ├── POST /edit             → [auth] → editLikedSong (duplicate check)
    └── POST /delete           → [auth] → deleteLikedSong

[auth] = login middleware runs first — redirects to /users/login if no session`

---

### AUTH (Users)

**Register**

`POST /users/register
  → req.body: { username, password }
  → User.getUserByUsername(username)        [MongoDB: find by username]
  → if exists → re-render register.ejs with "Username taken"
  → User.isValidPassword(password)          [model validation: 8+ chars, upper/lower/digit/symbol]
  → if invalid → re-render register.ejs with error
  → User.createUser(username, password)     [bcrypt.hash(password, 10) → MongoDB: insert user doc]
  → redirect /login`

**Login**

`POST /users/login
  → req.body: { username, password }
  → User.getUserByUsername(username)        [MongoDB: find by username]
  → if not found → re-render login.ejs with "User not found"
  → bcrypt.compare(password, user.passwordHash)
  → if no match → re-render login.ejs with "Incorrect Password"
  → req.session.user = { id, username }     [session stored server-side]
  → redirect /playlists`

**Logout**

`GET /users/logout
  → req.session.destroy()
  → redirect /login`

**Change Password**

`POST /users/change-password   [auth middleware: checks req.session.user]
  → req.body: { oldPassword, newPassword, confirmPassword }
  → if newPassword !== confirmPassword → re-render with "Passwords do not match"
  → User.isValidPassword(newPassword)       [same rules as register]
  → if oldPassword === newPassword → re-render with "cannot be same"
  → User.getUserByUsername(req.session.user.username)   [MongoDB: find user]
  → bcrypt.compare(oldPassword, user.passwordHash)
  → if no match → re-render with "Old password is incorrect"
  → bcrypt.hash(newPassword, 10)
  → User.changePassword(username, newHash)  [MongoDB: update passwordHash]
  → req.session.destroy()
  → redirect /login`

---

### PLAYLISTS

**Read (List)**

`GET /playlists   [public — no auth required]
  → req.query: { sortType? }
  → playlistModel.getAllPlaylists(req.session.user.id)   [MongoDB: find { userId }]
  → sortPlaylists(playlists, sortType)                   [in-memory sort: A-Z / Z-A]
  → render playlist-list.ejs`

**Read (Detail)**

`GET /playlists/view?id=...
  → req.query: { id, search? }
  → playlistModel.getPlaylistById(id)       [MongoDB: findById]
  → check playlist.userId === session user  [ownership guard]
  → songModel.getSongsByPlaylistId(id)      [MongoDB: find { playlistId }]
  → if search → filter songs in-memory by title
  → render playlist-detail.ejs`

**Create**

`GET /playlists/add   [auth] → render add-playlist.ejs (empty form)

POST /playlists/add  [auth]
  → req.body: { name, description }
  → if missing fields → re-render with error + user's typed values
  → playlistModel.createPlaylist({ name, description, userId })   [MongoDB: insert]
  → redirect /playlists/view?id=<new _id>`

**Update**

`GET /playlists/edit?playlistId=...   [auth]
  → playlistModel.getPlaylistById(id)       [MongoDB: findById]
  → check ownership
  → render edit-playlist.ejs with current values

POST /playlists/edit   [auth]
  → req.body: { playlistId, name, description }
  → playlistModel.getPlaylistById(id)       [MongoDB: findById — ownership check]
  → if missing fields → re-render with error
  → playlistModel.updatePlaylistById(id, { name, description })   [MongoDB: findByIdAndUpdate]
  → redirect /playlists/view?id=<playlistId>`

**Delete**

`POST /playlists/delete   [auth]
  → req.body: { playlistId }
  → playlistModel.getPlaylistById(id)       [MongoDB: ownership check]
  → songModel.getSongsByPlaylistId(id)      [MongoDB: find all songs in playlist]
  → for each song:
      reviewModel.deleteReviewsBySongId(song._id)         [MongoDB: deleteMany]
      likedSongModel.deleteLikedSongsBySongId(song._id)   [MongoDB: deleteMany]
      songModel.deleteSongById(song._id)                  [MongoDB: findByIdAndDelete]
  → playlistModel.deletePlaylistById(id)    [MongoDB: findByIdAndDelete]
  → redirect /playlists`

---

### SONGS

**Read (List)**

`GET /songs   [public]
  → req.query: { genre? }
  → playlistModel.getAllPlaylists(userId)    [MongoDB: find user's playlists]
  → for each playlist → songModel.getSongsByPlaylistId(id)   [MongoDB: find songs]
  → genreModel.getAllGenres(userId)          [MongoDB: find custom genres]
  → merge defaultGenres + custom genres
  → if genre filter → filter songs in-memory
  → render song-list.ejs`

**Read (Detail)**

`GET /songs/view?id=...
  → songModel.getSongById(id)               [MongoDB: findById]
  → loadUserPlaylists(userId)               [MongoDB: find playlists]
  → findPlaylistForSong(song, playlists)    [in-memory — ownership check]
  → render song-detail.ejs`

**Create**

`GET /songs/add?playlistId=...&spotifyQuery=...   [auth]
  → loadUserPlaylists(userId)               [MongoDB]
  → loadGenreNames(userId)                  [MongoDB + defaultGenres]
  → if spotifyQuery → getSpotifyAccessToken() → searchSpotifyTracks()   [Spotify API]
  → if selectedArtistId → getSpotifyArtistDetails()                     [Spotify API]
  → render add-song.ejs with pre-filled form values + Spotify results

POST /songs/add   [auth]
  → req.body: { playlistId, title, artist, album, genre }
  → loadUserPlaylists(userId) + findPlaylistById()   [ownership check]
  → if missing fields → re-render with error
  → songModel.createSong({ playlistId, title, artist, album, genre })   [MongoDB: insert]
  → redirect /songs/view?id=<new _id>`

**Update**

`GET /songs/edit?songId=...   [auth]
  → loadUserPlaylists(userId)               [MongoDB]
  → songModel.getSongById(id)               [MongoDB: findById]
  → findPlaylistForSong(song, playlists)    [ownership check]
  → render edit-song.ejs with current values

POST /songs/edit   [auth]
  → req.body: { songId, playlistId, title, artist, album, genre }
  → songModel.getSongById(id)               [MongoDB: check song exists]
  → findPlaylistForSong (old playlist) + findPlaylistById (new playlist)   [both ownership checks]
  → if missing fields → re-render with error
  → songModel.updateSongById(id, { playlistId, title, artist, album, genre })   [MongoDB: findByIdAndUpdate]
  → redirect /songs/view?id=<songId>`

**Delete**

`POST /songs/delete   [auth]
  → req.body: { songId }
  → songModel.getSongById(id) + findPlaylistForSong()   [ownership check]
  → reviewModel.deleteReviewsBySongId(id)               [MongoDB: deleteMany]
  → likedSongModel.deleteLikedSongsBySongId(id)         [MongoDB: deleteMany]
  → songModel.deleteSongById(id)                        [MongoDB: findByIdAndDelete]
  → redirect /songs`

---

### GENRES

**Read (List)**

`GET /genres   [auth]
  → genreModel.getAllGenres(userId)   [MongoDB: find { userId }]
  → render genre-list.ejs`

**Create**

`GET /genres/add   [auth] → render add-genre.ejs (empty form)

POST /genres/add   [auth]
  → req.body: { name, description }
  → if missing fields → re-render with error
  → genreModel.createGenre({ name, description, userId })   [MongoDB: insert]
  → redirect /genres`

**Update**

`GET /genres/edit?genreId=...   [auth]
  → genreModel.getGenreById(id)       [MongoDB: findById + ownership check]
  → render edit-genre.ejs with current values

POST /genres/edit   [auth]
  → req.body: { genreId, name, description }
  → genreModel.getGenreById(id)       [MongoDB: ownership check]
  → if missing fields → re-render with error
  → genreModel.updateGenreById(id, { name, description })   [MongoDB: findByIdAndUpdate]
  → redirect /genres`

**Delete**

`POST /genres/delete   [auth]
  → req.body: { genreId }
  → genreModel.getGenreById(id)       [MongoDB: ownership check]
  → genreModel.deleteGenreById(id)    [MongoDB: findByIdAndDelete]
  → redirect /genres`

---

### REVIEWS

**Read (List)**

`GET /reviews   [auth]
  → reviewModel.getAllReviews(userId)         [MongoDB: find { userId }]
  → loadUserPlaylists + loadUserSongs         [MongoDB: fetch songs for display names]
  → attachSongDetailsToReviews()             [in-memory: copy songTitle + playlistName onto each review]
  → render review-list.ejs`

**Create**

`GET /reviews/add?songId=...   [auth]
  → loadUserPlaylists + loadUserSongs         [MongoDB]
  → render add-review.ejs with song dropdown

POST /reviews/add   [auth]
  → req.body: { songId, title, comment, rating }
  → loadUserSongs() + findSongById()          [ownership check — song must belong to user]
  → if missing fields → re-render with error
  → if rating not 1–5 → re-render with error
  → reviewModel.createReview({ songId, title, comment, rating (as Number), userId })   [MongoDB: insert]
  → redirect /reviews`

**Update**

`GET /reviews/edit?reviewId=...   [auth]
  → reviewModel.getReviewById(id)             [MongoDB: findById + ownership check]
  → loadUserSongs() + findSongById()          [check song still belongs to user]
  → render edit-review.ejs with current values

POST /reviews/edit   [auth]
  → req.body: { reviewId, songId, title, comment, rating }
  → reviewModel.getReviewById(id)             [MongoDB: ownership check]
  → findSongById(songs, songId)               [check new song choice belongs to user]
  → if missing fields or invalid rating → re-render with error
  → reviewModel.updateReviewById(id, { songId, title, comment, rating })   [MongoDB: findByIdAndUpdate]
  → redirect /reviews`

**Delete**

`POST /reviews/delete   [auth]
  → req.body: { reviewId }
  → reviewModel.getReviewById(id)             [MongoDB: ownership check]
  → reviewModel.deleteReviewById(id)          [MongoDB: findByIdAndDelete]
  → redirect /reviews`

---

### LIKED SONGS

**Read (List)**

`GET /liked-songs   [auth]
  → likedSongModel.getAllLikedSongs(userId)   [MongoDB: find { userId }]
  → loadUserPlaylists + loadUserSongs         [MongoDB: fetch song details]
  → attachSongDetailsToLikedSongs()          [in-memory: copy title/artist/album/genre/playlistName]
  → render liked-song-list.ejs`

**Create**

`GET /liked-songs/add?songId=...   [auth]
  → loadUserPlaylists + loadUserSongs         [MongoDB]
  → render add-liked-song.ejs with song dropdown

POST /liked-songs/add   [auth]
  → req.body: { songId, note }
  → loadUserSongs() + findSongById()          [ownership check]
  → if note missing → re-render with error
  → likedSongModel.getLikedSongByUserAndSong(userId, songId)   [MongoDB: duplicate check]
  → if duplicate → re-render with "already in your liked songs"
  → likedSongModel.createLikedSong({ songId, note, userId })   [MongoDB: insert]
  → redirect /liked-songs`

**Update**

`GET /liked-songs/edit?likedSongId=...   [auth]
  → likedSongModel.getLikedSongById(id)       [MongoDB: findById + ownership check]
  → loadUserSongs() + findSongById()          [check song still belongs to user]
  → render edit-liked-song.ejs with current values

POST /liked-songs/edit   [auth]
  → req.body: { likedSongId, songId, note }
  → likedSongModel.getLikedSongById(id)       [MongoDB: ownership check]
  → findSongById()                            [song ownership check]
  → if note missing → re-render with error
  → getLikedSongByUserAndSong(userId, songId) [duplicate check — allow if it's the same record]
  → if duplicate._id !== likedSongId → re-render with "already in your liked songs"
  → likedSongModel.updateLikedSongById(id, { songId, note })   [MongoDB: findByIdAndUpdate]
  → redirect /liked-songs`

**Delete**

`POST /liked-songs/delete   [auth]
  → req.body: { likedSongId }
  → likedSongModel.getLikedSongById(id)       [MongoDB: ownership check]
  → likedSongModel.deleteLikedSongById(id)    [MongoDB: findByIdAndDelete]
  → redirect /liked-songs`